"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calculator, Save, Send, PlusCircle, Trash2 } from "lucide-react";

export default function CreateInvoicePage() {
  // --- 1. STATE QUẢN LÝ DỮ LIỆU TỪ SUPABASE ---
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const currentYear = new Date().getFullYear().toString();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  // --- 2. STATE CÁC LOẠI CHI PHÍ (CHO PHÉP TUỲ CHỈNH) ---
  const [rentPrice, setRentPrice] = useState(0);
  
  // Điện & Nước (Có cả đơn giá)
  const [electricStart, setElectricStart] = useState<number | "">("");
  const [electricEnd, setElectricEnd] = useState<number | "">("");
  const [electricPrice, setElectricPrice] = useState<number>(3800); // Mặc định 3.800
  
  const [waterStart, setWaterStart] = useState<number | "">("");
  const [waterEnd, setWaterEnd] = useState<number | "">("");
  const [waterPrice, setWaterPrice] = useState<number>(25000); // Mặc định 25.000

  // Các dịch vụ cố định
  const [internetFee, setInternetFee] = useState<number>(100000);
  const [serviceFee, setServiceFee] = useState<number>(100000); // Dịch vụ chung (Rác, vệ sinh, thang máy)
  const [parkingFee, setParkingFee] = useState<number>(0); // Gửi xe

  // Mảng động cho "Dịch vụ phát sinh khác" (Ví dụ: Thuê tủ lạnh, máy giặt...)
  const [otherServices, setOtherServices] = useState<{ name: string; amount: number }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 3. LOGIC LẤY DỮ LIỆU ---
  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase.from("buildings").select("*");
      if (data && data.length > 0) {
        setBuildings(data);
        setSelectedBuilding(data[0].id);
      }
    };
    fetchBuildings();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!selectedBuilding) return;
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("building_id", selectedBuilding)
        .eq("status", "RENTED") 
        .order("name", { ascending: true });

      if (data) {
        setRooms(data);
        setSelectedRoom(""); 
        setRentPrice(0);     
      }
    };
    fetchRooms();
  }, [selectedBuilding]);

  useEffect(() => {
    if (!selectedRoom) {
      setRentPrice(0);
      return;
    }
    const room = rooms.find((r) => r.id === selectedRoom);
    if (room) setRentPrice(room.base_price || 0);
  }, [selectedRoom, rooms]);


  // --- 4. CÁC HÀM XỬ LÝ DỊCH VỤ ĐỘNG ---
  const handleAddOtherService = () => {
    setOtherServices([...otherServices, { name: "", amount: 0 }]);
  };

  const handleUpdateOtherService = (index: number, field: "name" | "amount", value: any) => {
    const newServices = [...otherServices];
    
    // Ép kiểu (Type Assertion) để TypeScript hiểu đúng loại dữ liệu
    if (field === "name") {
      newServices[index].name = value as string;
    } else {
      newServices[index].amount = Number(value); // Ép kiểu về số
    }
    
    setOtherServices(newServices);
  };

  const handleRemoveOtherService = (index: number) => {
    const newServices = otherServices.filter((_, i) => i !== index);
    setOtherServices(newServices);
  };


  // --- 5. TÍNH TOÁN TOÁN HỌC ---
  const electricUsed = Math.max(0, Number(electricEnd) - Number(electricStart));
  const electricTotal = electricUsed * Number(electricPrice);

  const waterUsed = Math.max(0, Number(waterEnd) - Number(waterStart));
  const waterTotal = waterUsed * Number(waterPrice);

  // Tính tổng tiền các dịch vụ phát sinh
  const otherServicesTotal = otherServices.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const grandTotal = 
    Number(rentPrice) + 
    electricTotal + 
    waterTotal + 
    Number(internetFee) + 
    Number(serviceFee) + 
    Number(parkingFee) + 
    otherServicesTotal;

  const formatMoney = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";


  // --- 6. LƯU HOÁ ĐƠN ---
  const handlePublishInvoice = async () => {
    if (!selectedRoom) return alert("Vui lòng chọn phòng để lên hoá đơn!");
    
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("invoices").insert([
        {
          room_id: selectedRoom,
          month: month,
          year: year,
          total_amount: grandTotal,
          status: "UNPAID",
        }
      ]);
      if (error) throw error;
      alert("🎉 Phát hành hoá đơn thành công!");
      window.location.href = "/invoice";
    } catch (error: any) {
      console.error("Lỗi:", error);
      alert("Lỗi lưu hoá đơn: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Lập Hoá Đơn Mới</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KHU VỰC NHẬP LIỆU (Chiếm 2/3 màn hình) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Block 1: Thông tin hợp đồng */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 border-b pb-3">Thông tin hợp đồng</h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Toà nhà</label>
                <select className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500 bg-white" value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}>
                  {buildings.length === 0 && <option value="">Đang tải...</option>}
                  {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phòng (Đang thuê)</label>
                <select className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500 bg-white" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name || r.room_number}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kỳ hoá đơn (Tháng)</label>
                <input type="text" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Năm</label>
                <input type="text" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Block 2: Điện & Nước */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 border-b pb-3">Chỉ số Điện / Nước</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <div className="md:col-span-3 flex justify-between items-center mb-[-10px]">
                 <p className="text-sm font-bold text-slate-700 flex items-center gap-1">⚡ Tiền điện</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Đơn giá (VNĐ/số)</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-400 text-blue-700 font-semibold bg-blue-50/50" value={electricPrice} onChange={(e) => setElectricPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Chỉ số cũ</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" placeholder="0" value={electricStart} onChange={(e) => setElectricStart(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Chỉ số mới</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" placeholder="0" value={electricEnd} onChange={(e) => setElectricEnd(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end border-t border-slate-50 pt-5">
              <div className="md:col-span-3 flex justify-between items-center mb-[-10px]">
                 <p className="text-sm font-bold text-slate-700 flex items-center gap-1">💧 Tiền nước</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Đơn giá (VNĐ/khối)</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-cyan-400 text-cyan-700 font-semibold bg-cyan-50/50" value={waterPrice} onChange={(e) => setWaterPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Chỉ số cũ</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" placeholder="0" value={waterStart} onChange={(e) => setWaterStart(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Chỉ số mới</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" placeholder="0" value={waterEnd} onChange={(e) => setWaterEnd(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Block 3: Dịch vụ khác */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 border-b pb-3">Phí dịch vụ & Phụ phí</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Internet (VNĐ)</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" value={internetFee} onChange={(e) => setInternetFee(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dịch vụ chung (VNĐ)</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" placeholder="Rác, vệ sinh..." value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gửi xe (VNĐ)</label>
                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-slate-500" value={parkingFee} onChange={(e) => setParkingFee(Number(e.target.value))} />
              </div>
            </div>

            {/* Danh sách Dịch vụ động */}
            <div className="pt-4 space-y-3">
              {otherServices.map((service, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input 
                    type="text" 
                    placeholder="Tên dịch vụ (VD: Thuê tủ lạnh)" 
                    className="flex-1 bg-transparent border-none outline-none px-2 text-sm"
                    value={service.name}
                    onChange={(e) => handleUpdateOtherService(index, "name", e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Số tiền" 
                    className="w-32 bg-white border border-slate-200 rounded-lg p-2 outline-none text-sm font-semibold text-slate-700"
                    value={service.amount || ""}
                    onChange={(e) => handleUpdateOtherService(index, "amount", Number(e.target.value))}
                  />
                  <button onClick={() => handleRemoveOtherService(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              
              <button onClick={handleAddOtherService} className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition">
                <PlusCircle size={16} /> Thêm dịch vụ khác
              </button>
            </div>

          </div>
        </div>

        {/* KHU VỰC REVIEW BILL (Chiếm 1/3 màn hình) */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl sticky top-6">
            <div className="flex items-center gap-2 mb-6 opacity-80 border-b border-slate-700 pb-4">
              <Calculator size={20} />
              <h3 className="font-semibold text-lg">Chi tiết Hoá Đơn</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tiền phòng:</span>
                <span className="font-medium text-base">{formatMoney(rentPrice)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Điện ({electricUsed} số):</span>
                <span className="font-medium">{formatMoney(electricTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nước ({waterUsed} khối):</span>
                <span className="font-medium">{formatMoney(waterTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
                <span className="text-slate-400">Internet:</span>
                <span className="font-medium">{formatMoney(internetFee)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Dịch vụ chung:</span>
                <span className="font-medium">{formatMoney(serviceFee)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Gửi xe:</span>
                <span className="font-medium">{formatMoney(parkingFee)}</span>
              </div>

              {otherServices.map((s, i) => s.name && (
                <div key={i} className="flex justify-between items-center text-emerald-300">
                  <span>{s.name}:</span>
                  <span className="font-medium">{formatMoney(s.amount)}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col items-end">
              <span className="text-slate-400 text-sm mb-1">Khách cần thanh toán:</span>
              <span className="text-4xl font-bold text-emerald-400">{formatMoney(grandTotal)}</span>
            </div>

            {/* Các nút hành động */}
            <div className="flex gap-3 mt-8">
              <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 border border-slate-700 text-white rounded-xl font-semibold hover:bg-slate-700 transition">
                <Save size={18} /> Nháp
              </button>
              <button 
                onClick={handlePublishInvoice}
                disabled={isSubmitting}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                <Send size={18} /> {isSubmitting ? "Đang xử lý..." : "Phát Hành"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}