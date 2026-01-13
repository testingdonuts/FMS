# Resolving "schema net does not exist"

If the SQL migration still fails, follow these steps in the Supabase Dashboard:

### 1. Enable the Extension via UI (The "Clean" Way)
1. Go to **Database** -> **Extensions**.
2. Search for `pg_net`.
3. Click to **Enable**. This creates the `net` schema automatically.

### 2. Alternative: Use the Webhooks UI (Recommended)
If you prefer not to manage SQL triggers, do this instead:
1. Delete the `trigger_send_invite_email` if it exists.
2. Go to **Database** -> **Webhooks**.
3. Create a new Webhook:
   - **Name**: `send_invite_email`
   - **Table**: `team_invites`
   - **Events**: `INSERT`
   - **Webhook Type**: `Supabase Edge Function`
   - **Edge Function**: `send-invite`
   - **Method**: `POST`
4. This avoids the need for the `net` schema entirely as Supabase handles the queue internally.

### 3. Service Role Key
Ensure you have set the service role key in your Supabase project settings for the Edge Function to authenticate:
`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`