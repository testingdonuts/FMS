import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("NOTIFICATIONS_FROM_EMAIL") || "FitMySeat <notifications@fitmyseat.com>";

serve(async (req) => {
  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const record = body?.record || body?.new || body;

    const outboxId = record?.id;
    const toEmail = record?.to_email;
    const subject = record?.subject;
    const html = record?.html;

    if (!outboxId || !toEmail || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Invalid payload: expected outbox record with id/to_email/subject/html" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json().catch(() => ({}));

    if (!resendRes.ok) {
      await supabaseClient
        .from("email_outbox")
        .update({ error: JSON.stringify(resendData) })
        .eq("id", outboxId);

      return new Response(JSON.stringify({ error: "Email send failed", resend: resendData }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    await supabaseClient
      .from("email_outbox")
      .update({ sent_at: new Date().toISOString(), error: null })
      .eq("id", outboxId);

    return new Response(JSON.stringify({ ok: true, resend: resendData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
