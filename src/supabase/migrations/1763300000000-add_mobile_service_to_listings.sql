/*
  # Add Mobile Service Support to Listings
  
  1. Changes
    - Add `offers_mobile_service` column to `listings` table.
    - Set default value to `false`.
    
  2. Rationale
    - Allows businesses to indicate if they provide services at the customer's location.
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'offers_mobile_service'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN offers_mobile_service BOOLEAN DEFAULT false;
  END IF;
END $$;