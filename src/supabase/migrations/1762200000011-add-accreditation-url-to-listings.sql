/*
# Add Accreditation Certificate URL to Listings

This migration adds a new column `accreditation_certificate_url` to the `listings` table.

## 1. New Column
- `listings.accreditation_certificate_url` (TEXT): A nullable text field to store the URL of an organization's accreditation certificate.

## 2. Rationale
This field allows organizations to showcase their credentials, which can then be displayed on their public listing profile page, increasing trust with potential customers.
*/

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS accreditation_certificate_url TEXT;