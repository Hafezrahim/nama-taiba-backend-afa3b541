import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALL_TABLES = [
  "about_info",
  "blogs",
  "categories",
  "certifications",
  "cities",
  "contact_info",
  "contact_submissions",
  "districts",
  "marketer_applications",
  "offers",
  "order_items",
  "orders",
  "partners",
  "products",
  "profiles",
  "projects",
  "quote_requests",
  "services",
  "slider",
  "team_members",
  "testimonials",
  "user_roles",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const backupSecret = Deno.env.get("BACKUP_SECRET");

    // --- AUTH: require either a valid admin JWT OR a matching shared secret. ---
    const sharedSecret = req.headers.get("x-backup-secret");
    let authorized = false;

    if (backupSecret && sharedSecret && sharedSecret === backupSecret) {
      authorized = true;
    } else {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";
      if (token) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData } = await userClient.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          const adminClient = createClient(supabaseUrl, serviceRoleKey);
          const { data: roleRow } = await adminClient
            .from("user_roles")
            .select("role,is_approved")
            .eq("user_id", uid)
            .eq("role", "admin")
            .eq("is_approved", true)
            .maybeSingle();
          if (roleRow) authorized = true;
        }
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Determine trigger type
    let triggerType = "scheduled";
    try {
      const body = await req.json();
      if (body?.trigger_type) triggerType = body.trigger_type;
    } catch {
      // no body is fine
    }

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${dateStr}.json`;
    const filePath = `backups/${fileName}`;

    // Create backup record
    const { data: backupRecord, error: insertError } = await supabase
      .from("backups")
      .insert({
        file_name: fileName,
        file_path: filePath,
        status: "in_progress",
        trigger_type: triggerType,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};
    let totalRecords = 0;

    for (const table of ALL_TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.error(`Error backing up ${table}:`, error.message);
        continue;
      }
      backupData[table] = data || [];
      recordCounts[table] = (data || []).length;
      totalRecords += (data || []).length;
    }

    const fullBackup = {
      metadata: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        tables: ALL_TABLES,
        recordCounts,
        projectId: "nama-steel",
      },
      data: backupData,
    };

    const jsonStr = JSON.stringify(fullBackup);
    const blob = new Blob([jsonStr], { type: "application/json" });

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(filePath, blob, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Update backup record
    await supabase
      .from("backups")
      .update({
        status: "completed",
        tables: ALL_TABLES,
        record_counts: recordCounts,
        total_records: totalRecords,
        file_size_bytes: jsonStr.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", backupRecord.id);

    // Update settings last_run_at
    await supabase
      .from("backup_settings")
      .update({ last_run_at: new Date().toISOString() })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backupRecord.id,
        file_name: fileName,
        total_records: totalRecords,
        tables_count: ALL_TABLES.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Backup failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
