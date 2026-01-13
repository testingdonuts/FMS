/* # Add Platform Fee Tracking
1. New Columns
- `organizations.subscription_tier`: Stores the current tier ('Free', 'Professional', 'Teams').
- `service_bookings.platform_fee`: Stores the fee amount calculated at the time of booking.
- `equipment_rentals.platform_fee`: Stores the fee amount calculated at the time of rental.

2. Changes
- Sets default tier to 'Free' for all existing and new organizations.
- Adds check constraints to ensure valid tier names.

3. Security
- RLS policies remain unchanged as these columns are managed by service logic.
*/

-- 1. Add subscription_tier to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'Free' 
CHECK (subscription_tier IN ('Free', 'Professional', 'Teams'));

-- 2. Add platform_fee to bookings
ALTER TABLE public.service_bookings 
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0;

-- 3. Add platform_fee to rentals
ALTER TABLE public.equipment_rentals 
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0;

-- 4. Create an index for fee reporting
CREATE INDEX IF NOT EXISTS idx_booking_fees ON public.service_bookings(platform_fee) WHERE platform_fee > 0;
CREATE INDEX IF NOT EXISTS idx_rental_fees ON public.equipment_rentals(platform_fee) WHERE platform_fee > 0;