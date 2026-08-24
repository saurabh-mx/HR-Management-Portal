import { supabase } from "@/lib/supabase/supabaseClient";

export async function logAuditAction(
  actionType: string,
  targetEmployee: string,
  details: string,
  adminOverride?: string
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const adminEmail = adminOverride || session?.user?.email || 'System';

    const { error } = await supabase.from('audit_logs').insert([
      {
        admin_email: adminEmail,
        action_type: actionType,
        target_employee: targetEmployee,
        details: details
      }
    ]);

    if (error) {
      console.error("Failed to log audit action:", error);
    }
  } catch (err) {
    console.error("Error in logAuditAction:", err);
  }
}
