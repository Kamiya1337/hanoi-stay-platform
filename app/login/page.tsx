"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Home, Lock, Mail, ArrowRight, User } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true); // State để chuyển đổi Đăng nhập / Đăng ký
  const [fullName, setFullName] = useState(""); // Thêm state cho tên
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" }); // Gộp error và success thành 1 state
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Chỉ định link Google sẽ trả về sau khi đăng nhập thành công
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert("Lỗi đăng nhập Google: " + err.message);
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- LOGIC ĐĂNG NHẬP ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) throw signInError;
        window.location.href = "/"; // Đăng nhập thành công thì vào trang chủ
        
      } else {
        // --- LOGIC ĐĂNG KÝ ---
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (signUpError) throw signUpError;
        
        // Đăng ký xong thì báo thành công và chuyển về form đăng nhập
        setMessage({ type: "success", text: "Đăng ký thành công! Bạn có thể đăng nhập ngay." });
        setIsLogin(true); 
      }
    } catch (err: any) {
      console.error("Lỗi xác thực:", err.message);
      if (err.message.includes("Invalid login credentials")) {
        setMessage({ type: "error", text: "Sai email hoặc mật khẩu. Vui lòng thử lại!" });
      } else if (err.message.includes("User already registered")) {
        setMessage({ type: "error", text: "Email này đã được đăng ký!" });
      } else {
        setMessage({ type: "error", text: "Lỗi: " + err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      
      {/* Khối Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-900/20">
          <Home size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Hanoi Stay</h1>
        <p className="text-slate-500 mt-2 font-medium">Hệ thống Quản lý Căn hộ & Phòng trọ</p>
      </div>

      {/* Khối Form */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        
        {/* Nút chuyển đổi Đăng nhập / Đăng ký */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setMessage({type:"", text:""}); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            Đăng nhập
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setMessage({type:"", text:""}); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            Đăng ký
          </button>
        </div>
        
        {/* Hiển thị thông báo Lỗi hoặc Thành công */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium border text-center ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          
          {/* Form nhập Tên (Chỉ hiện khi Đăng ký) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required={!isLogin}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all font-medium text-slate-700" 
                  placeholder="VD: Vũ Hoàng Long"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tài khoản Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all font-medium text-slate-700" 
                placeholder="admin@hanoistay.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required
                minLength={6}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all font-medium text-slate-700" 
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* THÊM NÚT GOOGLE VÀO ĐÂY */}
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            {/* Google SVG Logo */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.3-4.74 3.3-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? "Đang kết nối..." : "Tiếp tục với Google"}
          </button>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 mt-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang xử lý..." : (isLogin ? "Vào trang quản trị" : "Tạo tài khoản")}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>

      {/* Footer Text */}
      <p className="mt-8 text-sm text-slate-400 font-medium">
        © 2026 Hanoi Stay Admin. Bảo mật bởi Supabase.
      </p>
    </div>
  );
}