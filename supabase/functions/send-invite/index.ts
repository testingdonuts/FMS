// Follow Supabase Edge Function documentation to deploy this
// Command: supabase functions deploy send-invite

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { record } = await req.json()

  // 1. Initialize Supabase Client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 2. Fetch Organization Details
  const { data: org } = await supabaseClient
    .from('organizations')
    .select('name')
    .eq('id', record.organization_id)
    .single()

  const orgName = org?.name || 'an organization'
  const inviteLink = `https://fitmyseat.app/#/invite?code=${record.invite_code}`

  // 3. Send Email via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'FitMySeat <invites@fitmyseat.com>',
      to: [record.email],
      subject: `Invite to join ${orgName} on FitMySeat`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <h2 style="color: #0A2540;">Join the Team!</h2>
          <p>You have been invited to join <strong>${orgName}</strong> as a <strong>${record.role}</strong>.</p>
          <div style="margin: 32px 0;">
            <a href="${inviteLink}" style="background-color: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Or copy and paste this link: <br/>
            ${inviteLink}
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">This invite was sent by FitMySeat and expires in 7 days.</p>
        </div>
      `,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status: res.status,
  })
})