import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

interface Payload {
  submission_type: string;
  submission_id: string;
  channel: 'email' | 'whatsapp';
  recipient: string;
  subject?: string;
  message: string;
}

const digitsOnly = (v: string) => v.replace(/[^\d]/g, '').replace(/^00/, '');

function validate(body: unknown): { ok: true; data: Payload } | { ok: false; error: string } {
  const b = body as Record<string, unknown>;
  if (!b || typeof b !== 'object') return { ok: false, error: 'Invalid body' };
  const type = String(b.submission_type ?? '');
  const id = String(b.submission_id ?? '');
  const channel = String(b.channel ?? '');
  const recipient = String(b.recipient ?? '').trim();
  const message = String(b.message ?? '').trim();
  const subject = b.subject ? String(b.subject).slice(0, 200) : undefined;

  if (!['marketer_application', 'contact_submission', 'quote_request'].includes(type)) {
    return { ok: false, error: 'Unknown submission type' };
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: 'Invalid submission id' };
  if (channel !== 'email' && channel !== 'whatsapp') return { ok: false, error: 'Invalid channel' };
  if (!recipient || recipient.length > 320) return { ok: false, error: 'Missing recipient' };
  if (channel === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) {
    return { ok: false, error: 'Invalid email address' };
  }
  if (channel === 'whatsapp' && digitsOnly(recipient).length < 8) {
    return { ok: false, error: 'Invalid phone number' };
  }
  if (!message || message.length > 4000) return { ok: false, error: 'Message is required' };

  return { ok: true, data: { submission_type: type, submission_id: id, channel, recipient, subject, message } };
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'Not authenticated' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Not authenticated' }, 401);

    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Admins only' }, 403);

    const parsed = validate(await req.json());
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const { submission_type, submission_id, channel, recipient, subject, message } = parsed.data;

    let status = 'sent';
    let errorMessage: string | null = null;
    let providerConfigured = true;

    if (channel === 'email') {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      const lovableKey = Deno.env.get('LOVABLE_API_KEY');
      const fromAddress = Deno.env.get('REPLY_FROM_EMAIL') ?? 'Nama Taiba <onboarding@resend.dev>';

      if (!resendKey || !lovableKey) {
        providerConfigured = false;
        status = 'not_configured';
        errorMessage = 'Email sending service is not connected yet';
      } else {
        const res = await fetch(`${GATEWAY_URL}/emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${lovableKey}`,
            'X-Connection-Api-Key': resendKey,
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [recipient],
            subject: subject || 'Nama Taiba',
            html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;white-space:pre-wrap">${escapeHtml(message)}</div>`,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          console.error(`Resend request failed [${res.status}]: ${body}`);
          status = 'failed';
          errorMessage = `${res.status}: ${body}`;
        }
      }
    } else {
      const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
      const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

      if (!waToken || !waPhoneId) {
        providerConfigured = false;
        status = 'not_configured';
        errorMessage = 'WhatsApp business account is not connected yet';
      } else {
        const res = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${waToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: digitsOnly(recipient),
            type: 'text',
            text: { preview_url: false, body: message },
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          console.error(`WhatsApp request failed [${res.status}]: ${body}`);
          status = 'failed';
          errorMessage = `${res.status}: ${body}`;
        }
      }
    }

    await admin.from('submission_replies').insert({
      submission_type,
      submission_id,
      channel,
      recipient,
      subject: subject ?? null,
      message,
      status,
      error_message: errorMessage,
      sent_by: userData.user.id,
    });

    if (status === 'sent') return json({ status: 'sent' });

    return json(
      {
        status,
        provider_configured: providerConfigured,
        error: errorMessage,
      },
      providerConfigured ? 502 : 409,
    );
  } catch (e) {
    console.error('send-reply error', e);
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
