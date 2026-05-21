"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, User, CreditCard, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    bank_name: "",
    bank_account_number: "",
    owner_name: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;

      if (currentUserId) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUserId)
          .maybeSingle();

        if (profData) setProfile(profData);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []); // Đã xóa id ở đây

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Chưa đăng nhập!");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          bank_name: profile.bank_name,
          bank_account_number: profile.bank_account_number,
          owner_name: profile.owner_name,
        });

      if (error) throw error;
      setSuccessMsg("Cập nhật thông tin thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      alert("Lỗi khi lưu: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 font-bold text-slate-500 text-center">Đang tải cấu hình...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cài đặt Hệ thống</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">Cấu hình thông tin chủ trọ và tài khoản nhận tiền</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* THÔNG TIN CÁ NHÂN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <User className="text-emerald-600" size={20}/>
            <h3 className="text-lg font-black text-slate-800">Thông tin cá nhân</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Họ và tên chủ trọ</label>
              <input type="text" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Số điện thoại liên hệ</label>
              <input type="text" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition" />
            </div>
          </div>
        </div>

        {/* THÔNG TIN NGÂN HÀNG */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <CreditCard className="text-blue-600" size={20}/>
            <h3 className="text-lg font-black text-slate-800">Cấu hình VietQR</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Mã Ngân hàng (Viết tắt)</label>
              <input type="text" value={profile.bank_name} onChange={(e) => setProfile({...profile, bank_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Số tài khoản</label>
              <input type="text" value={profile.bank_account_number} onChange={(e) => setProfile({...profile, bank_account_number: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Tên chủ tài khoản (Không dấu)</label>
              <input type="text" value={profile.owner_name} onChange={(e) => setProfile({...profile, owner_name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition uppercase" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 mt-6">
        {successMsg && <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold"><CheckCircle2 size={16}/> {successMsg}</span>}
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition">
          <Save size={18} /> {isSaving ? "Đang lưu..." : "Lưu Cài Đặt"}
        </button>
      </div>
    </div>
  );
}