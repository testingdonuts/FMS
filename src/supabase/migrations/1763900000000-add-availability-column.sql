/*
# Add Availability Column to Services and Equipment

This migration adds a new `availability` JSONB column to both the `services` and `equipment` tables to support location-based availability features.

## 1. Problem
The frontend application was updated to include UI for setting and displaying location-based availability (Worldwide vs. Country-specific), but the database schema was missing the corresponding column to store this data. This caused save operations to fail and prevented the feature from working.

## 2. Solution
This migration adds a nullable `availability` column of type `JSONB` to both `services` and `equipment` tables. A default value is set to represent "Worldwide" availability for existing records.

## 3. New Columns
- `services.availability` (JSONB): Stores availability data (e.g., `{ "type": "worldwide" }`).
- `equipment.availability` (JSONB): Stores availability data.

*/

-- Add availability column to the services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{"type": "worldwide"}';

-- Add availability column to the equipment table
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{"type": "worldwide"}';