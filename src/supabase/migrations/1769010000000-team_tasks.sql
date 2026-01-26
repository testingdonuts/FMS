-- Team Tasks: allow org owners/managers to assign tasks to team members

-- Ensure UUID generation available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Table
CREATE TABLE IF NOT EXISTS public.team_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_tasks_updated_at ON public.team_tasks;
CREATE TRIGGER trg_team_tasks_updated_at
BEFORE UPDATE ON public.team_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Basic guard: ensure assignee belongs to same org
CREATE OR REPLACE FUNCTION public.enforce_task_assignee_org()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  IF NEW.assignee_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT organization_id INTO v_org_id FROM public.team_members WHERE id = NEW.assignee_id;
  IF v_org_id IS NULL OR v_org_id <> NEW.organization_id THEN
    RAISE EXCEPTION 'Assignee must belong to the same organization';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_tasks_assignee_org ON public.team_tasks;
CREATE TRIGGER trg_team_tasks_assignee_org
BEFORE INSERT OR UPDATE ON public.team_tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_task_assignee_org();

-- 4) RLS
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;

-- Helper predicates
-- is_owner_or_manager: org owner OR team manager in same org
CREATE OR REPLACE FUNCTION public.is_owner_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization'
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role = 'manager'
        AND tm.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- View: Owners/managers can see all tasks in their org
DROP POLICY IF EXISTS team_tasks_org_view ON public.team_tasks;
CREATE POLICY team_tasks_org_view ON public.team_tasks
FOR SELECT USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_owner_or_manager()
);

-- View: Team members can see tasks assigned to them
DROP POLICY IF EXISTS team_tasks_assignee_view ON public.team_tasks;
CREATE POLICY team_tasks_assignee_view ON public.team_tasks
FOR SELECT USING (
  assignee_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid())
);

-- Insert: Owners/managers within org
DROP POLICY IF EXISTS team_tasks_insert ON public.team_tasks;
CREATE POLICY team_tasks_insert ON public.team_tasks
FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_owner_or_manager()
);

-- Update: Owners/managers within org
DROP POLICY IF EXISTS team_tasks_update_manage ON public.team_tasks;
CREATE POLICY team_tasks_update_manage ON public.team_tasks
FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_owner_or_manager()
)
WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Update: Assignee can update their own task (e.g., status)
DROP POLICY IF EXISTS team_tasks_update_assignee ON public.team_tasks;
CREATE POLICY team_tasks_update_assignee ON public.team_tasks
FOR UPDATE USING (
  assignee_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid())
)
WITH CHECK (
  assignee_id IN (SELECT id FROM public.team_members WHERE user_id = auth.uid())
);

-- Delete: Owners/managers within org
DROP POLICY IF EXISTS team_tasks_delete ON public.team_tasks;
CREATE POLICY team_tasks_delete ON public.team_tasks
FOR DELETE USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_owner_or_manager()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_tasks_org ON public.team_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_assignee ON public.team_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_due ON public.team_tasks(due_date);

SELECT 'team_tasks created with RLS and triggers' AS message;
