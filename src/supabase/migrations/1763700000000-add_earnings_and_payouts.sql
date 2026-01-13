/* # Add Earnings and Payout Management
1. New Tables
  - `payout_requests`: Tracks withdrawal requests from organizations
    - `id` (uuid, primary key)
    - `organization_id` (uuid, foreign key)
    - `amount_gross` (numeric): Total amount before fees
    - `fee_amount` (numeric): The 3% platform fee
    - `amount_net` (numeric): The final amount sent to the user
    - `status` (text): pending, approved, paid, rejected
    - `payout_method` (text): bank_transfer, mobile_money
    - `payout_details` (jsonb): Account numbers, bank names, etc.
2. Changes
  - Add `balance` column to `organizations` table
3. Security
  - Enable RLS on `payout_requests`
  - Add policy for organizations to manage their own requests
4. Automation
  - Create trigger to update organization balance when a booking/rental is marked as 'paid'
*/

-- 1. Add balance to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS balance NUMERIC(10,2) DEFAULT 0.00;

-- 2. Create payout_requests table
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount_gross NUMERIC(10,2) NOT NULL CHECK (amount_gross > 0),
    fee_rate NUMERIC(4,4) DEFAULT 0.0300,
    fee_amount NUMERIC(10,2) NOT NULL,
    amount_net NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    payout_method TEXT NOT NULL,
    payout_details JSONB NOT NULL,
    notes TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Orgs can view their own payout requests"
    ON public.payout_requests FOR SELECT
    TO authenticated
    USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Orgs can create payout requests"
    ON public.payout_requests FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- 5. Trigger function to update balance on payment
CREATE OR REPLACE FUNCTION public.update_org_balance_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Only trigger when payment_status changes to 'paid'
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        
        -- Determine org_id based on table
        IF TG_TABLE_NAME = 'service_bookings' THEN
            v_org_id := NEW.org_id;
        ELSIF TG_TABLE_NAME = 'equipment_rentals' THEN
            SELECT organization_id INTO v_org_id FROM public.equipment WHERE id = NEW.equipment_id;
        END IF;

        -- Update balance with 100% of the price (fee is deducted at withdrawal)
        IF v_org_id IS NOT NULL THEN
            UPDATE public.organizations
            SET balance = COALESCE(balance, 0) + NEW.total_price,
                updated_at = NOW()
            WHERE id = v_org_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach triggers
DROP TRIGGER IF EXISTS tr_update_balance_booking ON public.service_bookings;
CREATE TRIGGER tr_update_balance_booking
    AFTER UPDATE OF payment_status ON public.service_bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_org_balance_on_payment();

DROP TRIGGER IF EXISTS tr_update_balance_rental ON public.equipment_rentals;
CREATE TRIGGER tr_update_balance_rental
    AFTER UPDATE OF payment_status ON public.equipment_rentals
    FOR EACH ROW EXECUTE FUNCTION public.update_org_balance_on_payment();

-- 7. Function to handle balance deduction on payout request
CREATE OR REPLACE FUNCTION public.process_payout_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct the gross amount from the org balance immediately to "reserve" it
    UPDATE public.organizations
    SET balance = balance - NEW.amount_gross
    WHERE id = NEW.organization_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_process_payout
    BEFORE INSERT ON public.payout_requests
    FOR EACH ROW EXECUTE FUNCTION public.process_payout_request();