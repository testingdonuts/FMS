/*
    # Add Image URL to Services

    This migration adds an `image_url` column to the `services` table, allowing organizations to attach a visual representation to their service offerings.

    1. New Column
       - `image_url` (text): Stores the URL of the service image.
    */

    ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;