import { supabase } from "@/lib/supabase";

export const logActivity = async (
  action: 'INSERT' | 'UPDATE' | 'DELETE', 
  tableName: string, 
  recordId: string, 
  oldValue: any, 
  newValue: any
) => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  if (!userId) return;

  await supabase.from('audit_logs').insert([{
    user_id: userId,
    action,
    table_name: tableName,
    record_id: recordId,
    old_value: oldValue,
    new_value: newValue
  }]);
};