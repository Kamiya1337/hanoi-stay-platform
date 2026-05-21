"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Đăng ký tài khoản qua Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, // Lưu metadata phụ nếu cần
          }
        }
      });

      if (error) throw error;

      // 2. Cập nhật thêm tên vào bảng profiles (Vì trigger mặc định chỉ lưu email và id)
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", data.user.id);
      }

      setIsSuccess(true);
      
    } catch (error: any) {
      setErrorMsg(error.message || "Đã có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Đăng ký thành công!</h2>
          <p className="text-slate-500 font-medium text-sm mb-8">
            Chào mừng {fullName} đến với HANOI STAY. Tài khoản của bạn đã được khởi tạo. Hệ thống Multi-tenancy đã sẵn sàng để bạn quản lý chuỗi trọ của riêng mình.
          </p>
          <Link href="/login" className="block w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Cột trái - Form Đăng ký */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="text-emerald-500" size={28} />
              <h1 className="text-2xl font-black tracking-tight text-slate-900">HANOI STAY</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm">Nền tảng quản lý lưu trú thông minh dành cho chủ đầu tư.</p>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2">Tạo tài khoản</h2>
          <p className="text-slate-500 text-sm font-medium mb-8">Bắt đầu số hóa quy trình quản lý của bạn ngay hôm nay.</p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Họ và Tên</label>
              <div className="relative">
                <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="VD: Vũ Hoàng Long" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition" />
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Email đăng nhập</label>
              <div className="relative">
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hanoistay.vn" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition" />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" minLength={6} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition" />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button disabled={isLoading} type="submit" className="w-full py-3.5 mt-4 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-70">
              {isLoading ? "Đang xử lý..." : "Đăng ký miễn phí"} <ArrowRight size={18} />
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 mt-8">
            Đã có tài khoản? <Link href="/login" className="text-emerald-600 font-bold hover:underline">Đăng nhập</Link>
          </p>
        </div>

        {/* Cột phải - Banner (Chỉ hiện trên Desktop) */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-emerald-400 text-xs font-bold tracking-widest uppercase mb-6">
              SaaS Enterprise
            </div>
            <h2 className="text-4xl font-black text-white leading-tight mb-6">
              Quản lý hàng trăm<br/>phòng trọ chỉ với<br/>vài cú click chuột.
            </h2>
            <ul className="space-y-4 text-slate-300 font-medium">
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-400"/> Tự động hóa tính tiền điện nước</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-400"/> Xuất hóa đơn & mã VietQR động</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-400"/> Bảo mật dữ liệu độc lập (Multi-tenant)</li>
            </ul>
          </div>

          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-medium">© 2026 HANOI STAY. All rights reserved.</p>
          </div>
        </div>

      </div>
    </div>
  );
}