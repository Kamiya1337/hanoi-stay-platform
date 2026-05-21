"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, MapPin, Phone, Building2, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";

// Cập nhật hàm generateVietQR để nhận tham số động
const generateDynamicVietQR = (bankId: string, accountNo: string, accountName: string, amount: number, content: string) => {
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
};

// Hàm chuẩn hóa chuỗi: Xóa dấu tiếng Việt, loại bỏ ký tự đặc biệt để chống lỗi App Ngân hàng
const removeAccents = (str: string) => {
  if (!str) return "";
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/[^a-zA-Z0-9 ]/g, " "); // Chỉ giữ lại chữ, số và khoảng trắng
};

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [invoice, setInvoice] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log("--- BẮT ĐẦU DEBUG TẠI BROWSER ---");
      
      // 1. Lấy dữ liệu hóa đơn
      const { data: invData, error: invError } = await supabase
        .from("invoices")
        .select(`*, rooms(name, base_price, buildings(name, address), tenants(full_name, phone, is_active))`)
        .eq("id", id)
        .single();
      
      setInvoice(invData);
      console.log("Hóa đơn lấy được:", invData);

      // 2. LẤY TRỰC TIẾP PROFILE CỦA CHỦ TRỌ ĐANG ĐĂNG NHẬP
      // Không cần dựa vào invData.user_id cho an toàn
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      console.log("UserID đang đăng nhập:", currentUserId);

      if (currentUserId) {
        // Query Profile
        const { data: profData, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUserId)
          .maybeSingle();

        console.log("Dữ liệu Profile thô:", profData);
        if (profError) console.error("Lỗi truy vấn Profile:", profError);
        
        setProfile(profData);
      } else {
        console.warn("Không tìm thấy UserID, có thể chưa đăng nhập!");
      }

      setIsLoading(false);
      console.log("--- KẾT THÚC DEBUG ---");
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div className="p-10 text-center font-bold text-slate-500">Đang khởi tạo hóa đơn...</div>;
  if (!invoice) return <div className="p-10 text-center font-bold text-rose-500">Không tìm thấy hóa đơn!</div>;

  const room = invoice.rooms;
  const building = room.buildings;
  const activeTenant = room.tenants?.find((t: any) => t.is_active);
  const formatMoney = (val: number) => new Intl.NumberFormat("vi-VN").format(val || 0) + " đ";
  
  // Tính tiền
  const eUsage = Math.max(0, invoice.electricity_new - invoice.electricity_old);
  const wUsage = Math.max(0, invoice.water_new - invoice.water_old);
  const eTotal = eUsage * 3800; // Có thể thay bằng biến DB
  const wTotal = wUsage * 25000;
  const roomPrice = room.base_price || 0;
  const otherTotal = invoice.amount - (roomPrice + eTotal + wTotal);

  // URL VietQR Động
  // Lấy tên tòa nhà (hoặc địa chỉ nếu tên không có)
  const addressText = building?.name || building?.address || "Nha tro";
  
  // Ghép chuỗi nguyên bản: [Địa chỉ] + [Tên phòng] + tiền phòng tháng [tháng]
  const rawContent = `${addressText} p${room?.name} t${invoice?.month} ${invoice?.year}`;
  
  // Chuyển sang không dấu và cắt bớt nếu quá 50 ký tự (Giới hạn của Napas)
  const transferContent = removeAccents(rawContent).substring(0, 50).trim();

  // URL VietQR Động
  const qrUrl = profile?.bank_name && profile?.bank_account_number 
    ? generateDynamicVietQR(profile.bank_name, profile.bank_account_number, profile.owner_name, invoice.amount, transferContent)
    : "";
    
  // --- TÍNH NĂNG XUẤT ẢNH & SHARE ---
  const handleDownloadImage = async () => {
    const element = document.getElementById("invoice-capture");
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    
    // Tên file chuẩn: [Địa_chỉ]_[Phòng]_[Ngày]_[Giờ].png
    const dateStr = new Date().toLocaleDateString("vi-VN").replace(/\//g, "");
    const timeStr = new Date().toLocaleTimeString("vi-VN").replace(/:/g, "");
    const fileName = `${building?.name}_P${room.name}_${dateStr}_${timeStr}.png`.replace(/\s/g, "_");

    const link = document.createElement("a");
    link.href = imgData;
    link.download = fileName;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Hóa đơn P.${room.name} - Tháng ${invoice.month}`,
        text: `Chi tiết hóa đơn tiền phòng tháng ${invoice.month}/${invoice.year}. Vui lòng kiểm tra và thanh toán.`,
        url: window.location.href,
      });
    } else {
      alert("Trình duyệt của bạn không hỗ trợ tính năng chia sẻ trực tiếp!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-4 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* THANH CÔNG CỤ (Ẩn khi in) - Tối ưu Mobile */}
      <div className="w-full max-w-[800px] mb-4 flex flex-wrap justify-center sm:justify-end gap-2 print:hidden">
        <button onClick={handleShare} className="flex-1 sm:flex-none items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-bold hover:bg-blue-200 transition flex">
          <Share2 size={18} /> Gửi
        </button>
        <button onClick={handleDownloadImage} className="flex-1 sm:flex-none items-center justify-center gap-2 bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-300 transition flex">
          <Download size={18} /> Tải Ảnh
        </button>
        <button onClick={() => window.print()} className="flex-1 sm:flex-none items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition flex">
          <Printer size={18} /> In
        </button>
      </div>

      {/* KHUNG HÓA ĐƠN ĐỂ CHỤP (ID: invoice-capture) */}
      <div id="invoice-capture" className="bg-white w-full max-w-[800px] shadow-xl print:shadow-none rounded-2xl print:rounded-none overflow-hidden">
        
        {/* HEADER BRANDING */}
        <div className="bg-slate-900 text-white p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Building2 className="text-emerald-400" size={28} />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">HANOI STAY</h1>
            </div>
            <p className="text-slate-400 font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1"><MapPin size={14}/> {building?.address}</p>
          </div>
          <div className="sm:text-right">
            <h2 className="text-xl sm:text-2xl font-black text-emerald-400 uppercase tracking-widest">Hóa Đơn Thu Tiền</h2>
            <p className="text-slate-300 font-medium text-sm mt-1">Kỳ: Tháng {invoice.month}/{invoice.year}</p>
            <p className="text-slate-500 font-mono text-[10px] mt-1">ID: {invoice.id.split('-')[0]}</p>
          </div>
        </div>

        <div className="p-4 sm:p-10">
          
          {/* THÔNG TIN KHÁCH & PHÒNG (Responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Khách Hàng</p>
              <h3 className="text-lg sm:text-xl font-black text-slate-800">{activeTenant?.full_name || "Khách thuê"}</h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1.5"><Phone size={14}/> {activeTenant?.phone || "Chưa cập nhật"}</p>
            </div>
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col justify-center sm:text-right">
              <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-wider mb-1">Phòng Thuê</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">P. {room?.name}</h3>
              <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">{building?.name}</p>
            </div>
          </div>

          {/* BẢNG CHI TIẾT */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left min-w-[500px]">
              <thead className="border-b-2 border-slate-800 text-slate-800">
                <tr>
                  <th className="py-3 font-bold text-xs sm:text-sm uppercase tracking-wider">Hạng mục chi tiết</th>
                  <th className="py-3 text-center font-bold text-xs sm:text-sm uppercase tracking-wider">Mức dùng</th>
                  <th className="py-3 text-right font-bold text-xs sm:text-sm uppercase tracking-wider">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                <tr>
                  <td className="py-4 font-bold">1. Tiền thuê phòng (Cố định)</td>
                  <td className="py-4 text-center font-medium">1 Tháng</td>
                  <td className="py-4 text-right font-black">{formatMoney(roomPrice)}</td>
                </tr>
                <tr>
                  <td className="py-4">
                    <span className="font-bold">2. Tiền Điện sinh hoạt</span>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Số cũ: {invoice.electricity_old} - Số mới: {invoice.electricity_new}</p>
                  </td>
                  <td className="py-4 text-center font-medium">{eUsage} Số</td>
                  <td className="py-4 text-right font-black">{formatMoney(eTotal)}</td>
                </tr>
                <tr>
                  <td className="py-4">
                    <span className="font-bold">3. Tiền Nước sinh hoạt</span>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">Khối cũ: {invoice.water_old} - Khối mới: {invoice.water_new}</p>
                  </td>
                  <td className="py-4 text-center font-medium">{wUsage} Khối</td>
                  <td className="py-4 text-right font-black">{formatMoney(wTotal)}</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold">4. Dịch vụ chung & Mạng</td>
                  <td className="py-4 text-center font-medium">Gói dịch vụ</td>
                  <td className="py-4 text-right font-black">{formatMoney(otherTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TỔNG TIỀN VÀ MÃ QR */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 rounded-2xl p-6 border border-slate-200 gap-6">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Tổng Khách Cần Thanh Toán</p>
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-700">{formatMoney(invoice.amount)}</h2>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-2">* Vui lòng thanh toán trước ngày 05 hàng tháng</p>
            </div>

            {qrUrl ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <img src={qrUrl} alt="VietQR" className="w-56 h-56 object-contain rounded-lg" crossOrigin="anonymous" />
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quét mã thanh toán</p>
                  <p className="font-black text-slate-800 uppercase">{profile.bank_name}</p>
                  <p className="text-sm font-bold text-slate-600">{profile.bank_account_number}</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1 uppercase">{profile.owner_name}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 text-center">
                Chủ trọ chưa cài đặt <br/> thông tin ngân hàng.
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-10 text-center text-slate-400 text-[10px] sm:text-xs font-medium border-t border-slate-100 pt-6">
            HANOI STAY - Nền tảng quản lý lưu trú thông minh. Hóa đơn được xuất tự động.
          </div>

        </div>
      </div>
    </div>
  );
}