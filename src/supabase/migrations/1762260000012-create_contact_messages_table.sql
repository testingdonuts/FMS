/*
    # Create Contact Messages Table

    This migration sets up a new table `contact_messages` to store inquiries submitted through the public contact form.

    ## 1. New Table
    - **`contact_messages`**:
      - `id` (uuid, primary key): Unique identifier for each message.
      - `name` (text, not null): The full name of the person submitting the form.
      - `email` (text, not null): The contact email of the submitter.
      - `phone` (text): An optional contact phone number.
      - `subject` (text, not null): The subject of the inquiry (e.g., "Booking Help").
      - `message` (text, not null): The content of the user's message.
      - `attachment_url` (text): An optional URL for any file attachments.
      - `created_at` (timestamptz): Timestamp of when the message was created.

    ## 2. Security
    - **RLS Enabled**: Row Level Security is enabled on the table to ensure data is protected.
    - **Public Insert Policy**: A policy is created to allow any user (both anonymous `anon` and logged-in `authenticated`) to insert new messages. This is necessary for a public-facing contact form. Read, update, and delete access are restricted by default.
    */

    -- Create the table to store contact form submissions
    CREATE TABLE IF NOT EXISTS public.contact_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        attachment_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Enable Row Level Security
    ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

    -- Add a policy to allow public users (anonymous and authenticated) to submit messages.
    -- This policy restricts them from reading, updating, or deleting any messages.
    CREATE POLICY "Allow public to send messages"
    ON public.contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);