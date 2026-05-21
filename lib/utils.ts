import { supabase } from "@/lib/supabase";

// 1. Hàm Ghi vết thao tác (Audit Log)
export const logActivity = async (action: string, tableName: string, recordId: string, oldValue: any, newValue: any) => {
  try {
    await supabase.from('audit_logs').insert([{
      action,
      table_name: tableName,
      record_id: recordId,
      old_value: oldValue,
      new_value: newValue
    }]);
  } catch (error) {
    console.error("Lỗi ghi log:", error);
  }
};

// 2. Hàm tạo URL VietQR
export const generateVietQR = (amount: number, content: string) => {
  const BANK_ID = "MB";             // Mã ngân hàng (Ví dụ MB, VCB, TCB...)
  const ACCOUNT_NO = "0904253319";  // Số tài khoản của chủ trọ
  const TEMPLATE = "compact2";      // Giao diện VietQR (compact, compact2, print)
  const ACCOUNT_NAME = "VU HOANG LONG"; // Tên chủ tài khoản không dấu

  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
};