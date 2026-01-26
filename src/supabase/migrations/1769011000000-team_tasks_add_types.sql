-- Extend team_tasks to support types and contextual links

-- Columns
ALTER TABLE public.team_tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'other' CHECK (task_type IN ('service_booking','equipment_maintenance','pickup','other')),
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rental_id UUID REFERENCES public.equipment_rentals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS context_label TEXT;

-- Drop constraints if they exist (for idempotency)
ALTER TABLE public.team_tasks DROP CONSTRAINT IF EXISTS team_tasks_service_booking_requires_booking;
ALTER TABLE public.team_tasks DROP CONSTRAINT IF EXISTS team_tasks_maintenance_requires_equipment;

-- Optional constraints to ensure minimal linkage by type
ALTER TABLE public.team_tasks
  ADD CONSTRAINT team_tasks_service_booking_requires_booking
  CHECK (task_type <> 'service_booking' OR booking_id IS NOT NULL);

ALTER TABLE public.team_tasks
  ADD CONSTRAINT team_tasks_maintenance_requires_equipment
  CHECK (task_type <> 'equipment_maintenance' OR equipment_id IS NOT NULL);

-- Guard: linked entities must belong to same organization
CREATE OR REPLACE FUNCTION public.enforce_task_context_org()
RETURNS TRIGGER AS $$
DECLARE v_org UUID; v_equip_org UUID; v_booking_org UUID; v_rental_org UUID; BEGIN
  -- booking -> service_bookings.org_id
  IF NEW.booking_id IS NOT NULL THEN
    SELECT org_id INTO v_booking_org FROM public.service_bookings WHERE id = NEW.booking_id;
    IF v_booking_org IS NULL OR v_booking_org <> NEW.organization_id THEN
      RAISE EXCEPTION 'Linked booking does not belong to same organization';
    END IF;
  END IF;

  -- equipment -> equipment.organization_id
  IF NEW.equipment_id IS NOT NULL THEN
    SELECT organization_id INTO v_equip_org FROM public.equipment WHERE id = NEW.equipment_id;
    IF v_equip_org IS NULL OR v_equip_org <> NEW.organization_id THEN
      RAISE EXCEPTION 'Linked equipment does not belong to same organization';
    END IF;
  END IF;

  -- rental -> equipment.organization_id
  IF NEW.rental_id IS NOT NULL THEN
    SELECT e.organization_id INTO v_rental_org
    FROM public.equipment_rentals r
    JOIN public.equipment e ON e.id = r.equipment_id
    WHERE r.id = NEW.rental_id;
    IF v_rental_org IS NULL OR v_rental_org <> NEW.organization_id THEN
      RAISE EXCEPTION 'Linked rental does not belong to same organization';
    END IF;
  END IF;

  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_tasks_context_org ON public.team_tasks;
CREATE TRIGGER trg_team_tasks_context_org
BEFORE INSERT OR UPDATE ON public.team_tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_task_context_org();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_tasks_type ON public.team_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_team_tasks_booking ON public.team_tasks(booking_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_equipment ON public.team_tasks(equipment_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_rental ON public.team_tasks(rental_id);

SELECT 'team_tasks extended with types and links' AS message;
