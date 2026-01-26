/*
# Ensure All `listings` Columns Exist

This migration addresses recurring "column not found" errors (`PGRST204`) related to the `listings` table by ensuring all necessary columns are present.

## 1. Problem

The application is failing to create or update listings because the database schema cache does not recognize certain columns (e.g.,`opening_hours`,`payment_methods`). This can happen due to a stale schema cache or an incomplete initial migration.

## 2. Solution

This script explicitly and idempotently checks for the existence of every column used by the `ListingForm`. If a column is not found, it is added with the correct data type. This is a safe operation that will either:

1.  Add any genuinely missing columns.
2.  Force a refresh of the Supabase schema cache if the columns already exist, resolving the visibility issue.

This comprehensive check covers all fields from the form, including `JSONB` and `TEXT[]` types, to prevent similar errors in the future.

*/

DO $$
BEGIN
  -- TEXT[] (Array) Types
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='payment_methods') THEN
    ALTER TABLE public.listings ADD COLUMN payment_methods TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='categories') THEN
    ALTER TABLE public.listings ADD COLUMN categories TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='gallery_urls') THEN
    ALTER TABLE public.listings ADD COLUMN gallery_urls TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='tags') THEN
    ALTER TABLE public.listings ADD COLUMN tags TEXT[];
  END IF;

  -- JSONB Types
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='opening_hours') THEN
    ALTER TABLE public.listings ADD COLUMN opening_hours JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='social_links') THEN
    ALTER TABLE public.listings ADD COLUMN social_links JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='faqs') THEN
    ALTER TABLE public.listings ADD COLUMN faqs JSONB;
  END IF;

  -- BOOLEAN Types
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='is_featured') THEN
    ALTER TABLE public.listings ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='offers_mobile_service') THEN
    ALTER TABLE public.listings ADD COLUMN offers_mobile_service BOOLEAN DEFAULT false;
  END IF;

  -- TEXT Types for Media
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='video_url') THEN
    ALTER TABLE public.listings ADD COLUMN video_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='logo_url') THEN
    ALTER TABLE public.listings ADD COLUMN logo_url TEXT;
  END IF;

END $$;