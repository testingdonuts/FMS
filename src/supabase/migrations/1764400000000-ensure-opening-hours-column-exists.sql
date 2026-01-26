/*
# Ensure `opening_hours` Column Exists

This migration addresses a "column not found" error related to `opening_hours` on the `listings` table.

## 1. Problem

The application is failing to create or update listings because the database schema cache does not recognize the `opening_hours` column, resulting in a `PGRST204` error. This can happen due to a stale schema cache or an incomplete initial migration.

## 2. Solution

This script explicitly checks for the existence of the `opening_hours` column on the `public.listings` table. If the column is not found, it adds it with the correct `JSONB` data type.

This is an idempotent operation, meaning it is safe to run multiple times. It will either fix the missing column or, if the column already exists, potentially trigger a refresh of the Supabase schema cache, resolving the error in either case.

*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'opening_hours' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN opening_hours JSONB;
  END IF;
END $$;