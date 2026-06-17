import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Map a Supabase DB-webhook payload into a structured security event.
function mapPayload(payload: any) {
  const table = payload?.table as string | undefined;
  const type = payload?.type as string | undefined; // INSERT/UPDATE/DELETE
  const record = payload?.record ?? {};
  const old = payload?.old_record ?? {};

  let event_type = `${table || "unknown"}.${type || "event"}`;
  let severity: "info" | "warning" | "critical" = "info";
  let title = `${type} on ${table}`;
  let description: string | null = null;
  let user_id: string | null = record?.user_id || record?.id || null;

  if (table === "user_roles") {
    if (type === "INSERT") {
      severity = record?.role === "admin" ? "critical" : "warning";
      title = `New role assigned: ${record?.role}`;
      description = `User ${record?.user_id} granted role "${record?.role}" (approved=${record?.is_approved}).`;
    } else if (type === "UPDATE" && old?.role !== record?.role) {
      severity = "critical";
      title = `Role changed: ${old?.role} → ${record?.role}`;
      description = `User ${record?.user_id} role updated.`;
    } else if (type === "UPDATE" && old?.is_approved !== record?.is_approved) {
      severity = "warning";
      title = `Approval status changed`;
      description = `User ${record?.user_id} approved=${record?.is_approved}.`;
    }
  } else if (table === "admin_activity_log" && type === "INSERT") {
    severity = "info";
    title = `Admin action: ${record?.action}`;
    description = JSON.stringify(record?.details || {});
    user_id = record?.admin_id || null;
  } else if (table === "contact_submissions" && type === "INSERT") {
    severity = "info";
    title = "New contact submission";
    description = `From ${record?.name} <${record?.email}>`;
  } else if (table === "marketer_applications" && type === "INSERT") {
    severity = "info";
    title = "New marketer application";
    description = `From ${record?.name} (${record?.phone})`;
  } else if (table === "orders" && type === "INSERT") {
    severity = record?.user_id ? "info" : "warning";
    title = record?.user_id ? "New order" : "New anonymous order";
    description = `${record?.customer_name} — total ${record?.total}`;
  }

  return { event_type, severity, title, description, user_id, source: "webhook" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Shared-secret protection is MANDATORY. If the secret isn't configured the
    // endpoint refuses all traffic so attackers can't flood security_events.
    const expectedSecret = Deno.env.get("SECURITY_WEBHOOK_SECRET");
    if (!expectedSecret) {
      console.error("security-webhook: SECURITY_WEBHOOK_SECRET is not configured; rejecting request.");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const given = req.headers.get("x-webhook-secret");
    if (given !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const evt = mapPayload(payload);
    const ip =
      req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

    const { data: inserted, error: insertErr } = await supabase
      .from("security_events")
      .insert({
        event_type: evt.event_type,
        severity: evt.severity,
        source: evt.source,
        title: evt.title,
        description: evt.description,
        metadata: payload,
        ip_address: ip,
        user_id: evt.user_id,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Notify admins on critical events
    if (evt.severity === "critical") {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .eq("is_approved", true);

      if (admins && admins.length) {
        const rows = admins.map((a: any) => ({
          user_id: a.user_id,
          type: "security_alert",
          title_en: `Security Alert: ${evt.title}`,
          title_ar: `تنبيه أمني: ${evt.title}`,
          message_en: evt.description || evt.event_type,
          message_ar: evt.description || evt.event_type,
          metadata: { security_event_id: inserted.id, severity: evt.severity },
        }));
        await supabase.from("notifications").insert(rows);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, event_id: inserted.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("security-webhook error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
