# Completing the Email Setup

To make the "Invite Member" button actually send emails, follow these steps in your Supabase Dashboard:

### 1. Get a Resend API Key
1. Sign up at [Resend.com](https://resend.com).
2. Create an API Key.

### 2. Set Secrets in Supabase
Run these commands in your local terminal (using Supabase CLI):
```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
```

### 3. Deploy the Edge Function
Ensure you have the Supabase CLI installed, then run:
```bash
supabase functions deploy send-invite
```

### 4. Enable the Webhook
Go to **Database -> Webhooks** in the Supabase Dashboard and create a new webhook:
- **Name:** `send_team_invite`
- **Table:** `team_invites`
- **Events:** `INSERT`
- **Type:** `Service Account (Edge Function)`
- **Edge Function:** `send-invite`

Now, whenever you click **"Invite"** in the Team Management dashboard, an email will be sent automatically.