"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Search, Link as LinkIcon, CheckCircle2, 
  Printer, Undo, Copy, X, Calculator, Building2 
} from "lucide-react";

// Hàm tiện ích ghi log trực tiếp trong file để dễ quản lý
const logActivity = async (action: string, tableName: string, recordId: string, oldValue: any, newValue: any) => {
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

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<"LIST" | "CREATE">("LIST");
  const [isLoading, setIsLoading] = useState(true);

  // --- DATA TỪ DB ---
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  
  // --- STATE TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE MODAL SHARE BILL ---
  const [shareInvoiceId, setShareInvoiceId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // --- STATE TẠO HÓA ĐƠN (5 CẤP DROPDOWN) ---
  const [selDist, setSelDist] = useState("");
  const [selWard, setSelWard] = useState("");
  const [selBld, setSelBld] = useState("");
  const [selFloor, setSelFloor] = useState("");
  const [selRoom, setSelRoom] = useState("");

  // --- STATE THÔNG SỐ HÓA ĐƠN ---
  const d = new Date();
  const [month, setMonth] = useState(d.getMonth() + 1);
  const [year, setYear] = useState(d.getFullYear());
  const [roomPrice, setRoomPrice] = useState(0);
  
  const [eOld, setEOld] = useState(0);
  const [eNew, setENew] = useState(0);
  const [ePrice, setEPrice] = useState(3800);
  const [isEOldLocked, setIsEOldLocked] = useState(false);

  const [wOld, setWOld] = useState(0);
  const [wNew, setWNew] = useState(0);
  const [wPrice, setWPrice] = useState(25000);
  const [isWOldLocked, setIsWOldLocked] = useState(false);

  const [internetFee, setInternetFee] = useState(100000);
  const [internetType, setInternetType] = useState<"PER_ROOM" | "PER_PERSON">("PER_ROOM");

  const [serviceFee, setServiceFee] = useState(100000);
  const [serviceType, setServiceType] = useState<"PER_ROOM" | "PER_PERSON">("PER_ROOM");

  // Hàm load dữ liệu
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ { data: bData }, { data: rData }, { data: iData } ] = await Promise.all([
        supabase.from("buildings").select("*").order("name"),
        supabase.from("rooms").select(`*, tenants(*)`).order("name"),
        supabase.from("invoices").select(`*, rooms(name, buildings(name), tenants(full_name, is_active))`).order("created_at", { ascending: false })
      ]);
      
      if (bData) setBuildings(bData);
      if (rData) setRooms(rData);
      if (iData) setInvoices(iData);
    } catch (err) {
      console.log("Lỗi tải data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 1. LOGIC TÌM KIẾM REAL-TIME ---
  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const roomName = inv.rooms?.name?.toLowerCase() || "";
    const invId = inv.id?.toLowerCase() || "";
    // Lấy tên khách đang active
    const activeTenantName = inv.rooms?.tenants?.find((t: any) => t.is_active)?.full_name?.toLowerCase() || "";
    
    return roomName.includes(term) || invId.includes(term) || activeTenantName.includes(term);
  });

  // --- 2. LOGIC DROPDOWN 5 CẤP ---
  const listDistricts = Array.from(new Set(buildings.map(b => b.district).filter(Boolean)));
  const listWards = selDist ? Array.from(new Set(buildings.filter(b => b.district === selDist).map(b => b.ward).filter(Boolean))) : [];
  const listBuildings = selWard ? buildings.filter(b => b.district === selDist && b.ward === selWard) : [];
  const selectedBuildingObj = buildings.find(b => b.id === selBld);
  const listFloors = selectedBuildingObj ? Array.from({ length: selectedBuildingObj.total_floors || 1 }, (_, i) => i + 1) : [];
  
  // Chỉ lấy phòng có khách (status RENTED hoặc có tenant is_active)
  const listRentedRooms = selFloor ? rooms.filter(r => {
    const isActive = r.tenants?.some((t: any) => t.is_active);
    return r.building_id === selBld && (r.floor || 1) === Number(selFloor) && (r.status === 'RENTED' || isActive);
  }) : [];

  // --- 3. TỰ ĐỘNG ĐIỀN CHỈ SỐ CŨ ---
  useEffect(() => {
    if (selRoom && month && year) {
      const rObj = rooms.find(r => r.id === selRoom);
      if (rObj) setRoomPrice(rObj.base_price || 0);

      // Tính lùi 1 tháng
      let prevM = Number(month) - 1;
      let prevY = Number(year);
      if (prevM === 0) { prevM = 12; prevY -= 1; }

      // Tìm hóa đơn tháng trước
      const prevInv = invoices.find(i => i.room_id === selRoom && i.month === prevM && i.year === prevY);
      
      if (prevInv) {
        setEOld(prevInv.electricity_new || 0);
        setIsEOldLocked(true);
        setWOld(prevInv.water_new || 0);
        setIsWOldLocked(true);
      } else {
        setEOld(0);
        setIsEOldLocked(false);
        setWOld(0);
        setIsWOldLocked(false);
      }
    }
  }, [selRoom, month, year, invoices, rooms]);

  // --- 4. TÍNH TOÁN TIỀN REAL-TIME ---
  const roomObj = rooms.find(r => r.id === selRoom);
  const activeTenantCount = roomObj?.tenants?.filter((t: any) => t.is_active).length || 0;

  const totalE = Math.max(0, eNew - eOld) * ePrice;
  const totalW = Math.max(0, wNew - wOld) * wPrice;
  const totalInternet = internetType === "PER_PERSON" ? internetFee * activeTenantCount : internetFee;
  const totalService = serviceType === "PER_PERSON" ? serviceFee * activeTenantCount : serviceFee;
  
  const finalTotal = Number(roomPrice) + totalE + totalW + totalInternet + totalService;

  // --- HÀM LƯU HÓA ĐƠN MỚI ---
  const handleSaveInvoice = async () => {
    if (!selRoom) return alert("Vui lòng chọn phòng cần lập hóa đơn!");
    if (eNew < eOld) return alert("Chỉ số điện mới không thể nhỏ hơn số cũ!");
    if (wNew < wOld) return alert("Chỉ số nước mới không thể nhỏ hơn số cũ!");

    try {
      const newInvoiceData = {
        room_id: selRoom,
        month: month,
        year: year,
        amount: finalTotal,
        status: "UNPAID",
        electricity_old: eOld,
        electricity_new: eNew,
        water_old: wOld,
        water_new: wNew,
        service_fee_type: serviceType,
        internet_fee_type: internetType
      };

      const { data, error } = await supabase.from("invoices").insert([newInvoiceData]).select();
      if (error) throw error;
      
      // Log thao tác tạo mới
      if (data && data[0]) {
        logActivity("INSERT", "invoices", data[0].id, null, data[0]);
      }
      
      alert("Lập hóa đơn thành công!");
      fetchData();
      setActiveTab("LIST");
      setENew(0); setWNew(0); setSelRoom("");
    } catch (err: any) {
      alert("Lỗi lưu hóa đơn: " + err.message);
    }
  };

  // --- HÀM UPDATE TRẠNG THÁI & GHI LOG ---
  const updateInvoiceStatus = async (id: string, status: "PAID" | "UNPAID") => {
    try {
      const oldInvoice = invoices.find(i => i.id === id);
      const newInvoice = { ...oldInvoice, status };

      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;

      // Ghi log sự thay đổi
      logActivity("UPDATE", "invoices", id, oldInvoice, newInvoice);

      fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  // --- HÀM COPY LINK GỬI KHÁCH ---
  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/invoice/${id}/print`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatMoney = (val: number) => new Intl.NumberFormat("vi-VN").format(val || 0) + " đ";

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* HEADER & MENU */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hóa Đơn & Thu Chi</h2>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {activeTab === "LIST" && (
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Tìm mã, số phòng, tên khách..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          )}
          <button onClick={() => setActiveTab(activeTab === "LIST" ? "CREATE" : "LIST")} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition flex items-center gap-2">
            {activeTab === "LIST" ? <><Plus size={16}/> Lập Hóa Đơn</> : "Quay lại danh sách"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-400 font-bold">Đang tải dữ liệu...</div>
      ) : activeTab === "LIST" ? (
        
        // =====================================
        // TAB 1: BẢNG DANH SÁCH HÓA ĐƠN
        // =====================================
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Phòng - Tòa</th>
                <th className="p-4">Kỳ Hóa Đơn</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Không tìm thấy hóa đơn</td></tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-800 text-base">P. {inv.rooms?.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">{inv.rooms?.buildings?.name}</p>
                    </td>
                    <td className="p-4 font-bold text-slate-600">Tháng {inv.month}/{inv.year}</td>
                    <td className="p-4 font-black text-emerald-600 text-base">{formatMoney(inv.amount)}</td>
                    <td className="p-4">
                      {inv.status === "PAID" 
                        ? <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-xs font-bold">Đã thu</span>
                        : <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-md text-xs font-bold">Chưa thanh toán</span>
                      }
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status === "UNPAID" ? (
                          <>
                            <button onClick={() => setShareInvoiceId(inv.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition">
                              <LinkIcon size={14}/> Gửi Bill
                            </button>
                            <button onClick={() => updateInvoiceStatus(inv.id, "PAID")} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-500 hover:text-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 transition">
                              <CheckCircle2 size={14}/> Xác nhận Thu
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => window.open(`/invoice/${inv.id}/print`, '_blank')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition">
                              <Printer size={14}/> In Phiếu
                            </button>
                            <button onClick={() => updateInvoiceStatus(inv.id, "UNPAID")} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 rounded-lg text-xs font-bold text-amber-700 transition">
                              <Undo size={14}/> Hoàn tác
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      ) : (

        // =====================================
        // TAB 2: TẠO HÓA ĐƠN MỚI
        // =====================================
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* CỘT TRÁI - FORM NHẬP LIỆU */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* 1. KHỐI THÔNG TIN HỢP ĐỒNG (5 CẤP) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                <Building2 className="text-emerald-600" size={20}/>
                <h3 className="text-lg font-black text-slate-800">Thông tin hợp đồng & Kỳ thu</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">1. Quận</label>
                  <select value={selDist} onChange={e => { setSelDist(e.target.value); setSelWard(""); setSelBld(""); setSelFloor(""); setSelRoom(""); }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none">
                    <option value="">-- Chọn Quận --</option>
                    {listDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">2. Phường</label>
                  <select value={selWard} onChange={e => { setSelWard(e.target.value); setSelBld(""); setSelFloor(""); setSelRoom(""); }} disabled={!selDist} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none disabled:opacity-50">
                    <option value="">-- Chọn Phường --</option>
                    {listWards.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">3. Tòa nhà</label>
                  <select value={selBld} onChange={e => { setSelBld(e.target.value); setSelFloor(""); setSelRoom(""); }} disabled={!selWard} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none disabled:opacity-50">
                    <option value="">-- Chọn Tòa nhà --</option>
                    {listBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">4. Tầng</label>
                  <select value={selFloor} onChange={e => { setSelFloor(e.target.value); setSelRoom(""); }} disabled={!selBld} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none disabled:opacity-50">
                    <option value="">-- Chọn Tầng --</option>
                    {listFloors.map(f => <option key={f} value={f}>Tầng {f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-600 mb-1">5. Phòng (Đang thuê)</label>
                  <select value={selRoom} onChange={e => setSelRoom(e.target.value)} disabled={!selFloor} className="w-full p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-black outline-none disabled:bg-slate-50 disabled:border-slate-200 disabled:opacity-50">
                    <option value="">-- Chọn Phòng --</option>
                    {listRentedRooms.map(r => <option key={r.id} value={r.id}>Phòng {r.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Kỳ hóa đơn (Tháng)</label><input type="number" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none text-center" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Năm</label><input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none text-center" /></div>
              </div>
            </div>

            {/* 2. KHỐI ĐIỆN NƯỚC AUTO-FILL */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="text-lg font-black text-slate-800 mb-5 border-b border-slate-100 pb-3">Chỉ số Điện / Nước</h3>
               
               <div className="mb-6">
                 <p className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-1">⚡ Tiền điện</p>
                 <div className="grid grid-cols-3 gap-3">
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 mb-1">Đơn giá (VNĐ/số)</label>
                     <input type="number" value={ePrice} onChange={e=>setEPrice(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none text-blue-600"/>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 mb-1">Chỉ số cũ {isEOldLocked && <span className="text-emerald-500">(Auto)</span>}</label>
                     <input type="number" value={eOld} onChange={e=>setEOld(Number(e.target.value))} disabled={isEOldLocked} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold outline-none disabled:bg-slate-100 disabled:text-slate-400"/>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 mb-1">Chỉ số mới</label>
                     <input type="number" value={eNew} onChange={e=>setENew(Number(e.target.value))} className="w-full p-2.5 bg-white border-2 border-emerald-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500"/>
                   </div>
                 </div>
                 <p className="text-xs font-semibold text-slate-500 mt-2 text-right">Sử dụng: <span className="text-slate-800 font-bold">{Math.max(0, eNew - eOld)}</span> số x {formatMoney(ePrice)} = <span className="text-emerald-600 font-bold">{formatMoney(totalE)}</span></p>
               </div>

               <div>
                 <p className="text-sm font-bold text-blue-500 mb-2 flex items-center gap-1">💧 Tiền nước</p>
                 <div className="grid grid-cols-3 gap-3">
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 mb-1">Đơn giá (VNĐ/khối)</label>
                     <input type="number" value={wPrice} onChange={e=>setWPrice(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none text-blue-600"/>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 mb-1">Chỉ số cũ {isWOldLocked && <span className="text-emerald-500">(Auto)</span>}</label>
                     <input type="number" value={wOld} onChange={e=>setWOld(Number(e.target.value))} disabled={isWOldLocked} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold outline-none disabled:bg-slate-100 disabled:text-slate-400"/>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 mb-1">Chỉ số mới</label>
                     <input type="number" value={wNew} onChange={e=>setWNew(Number(e.target.value))} className="w-full p-2.5 bg-white border-2 border-emerald-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500"/>
                   </div>
                 </div>
                 <p className="text-xs font-semibold text-slate-500 mt-2 text-right">Sử dụng: <span className="text-slate-800 font-bold">{Math.max(0, wNew - wOld)}</span> khối x {formatMoney(wPrice)} = <span className="text-emerald-600 font-bold">{formatMoney(totalW)}</span></p>
               </div>
            </div>

            {/* 3. KHỐI DỊCH VỤ LINH HOẠT */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                 <h3 className="text-lg font-black text-slate-800">Phí Dịch vụ & Internet</h3>
                 {selRoom && <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Phòng có: {activeTenantCount} người ở</p>}
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2">Mạng Internet</label>
                   <div className="flex items-center gap-0 mb-2 bg-slate-100 p-1 rounded-lg">
                     <button onClick={()=>setInternetType("PER_ROOM")} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${internetType === 'PER_ROOM' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Theo Phòng</button>
                     <button onClick={()=>setInternetType("PER_PERSON")} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${internetType === 'PER_PERSON' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Theo Người</button>
                   </div>
                   <input type="number" value={internetFee} onChange={e=>setInternetFee(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"/>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2">Dịch vụ chung</label>
                   <div className="flex items-center gap-0 mb-2 bg-slate-100 p-1 rounded-lg">
                     <button onClick={()=>setServiceType("PER_ROOM")} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${serviceType === 'PER_ROOM' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Theo Phòng</button>
                     <button onClick={()=>setServiceType("PER_PERSON")} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${serviceType === 'PER_PERSON' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Theo Người</button>
                   </div>
                   <input type="number" value={serviceFee} onChange={e=>setServiceFee(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"/>
                 </div>
               </div>
            </div>

          </div>

          {/* CỘT PHẢI - BẢNG TỔNG KẾT */}
          <div className="w-full lg:w-1/3">
            <div className="bg-slate-900 rounded-3xl p-6 text-white sticky top-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-700">
                <Calculator size={20} className="text-emerald-400"/>
                <h3 className="text-lg font-black tracking-tight">Chi tiết Hóa Đơn</h3>
              </div>

              <div className="space-y-4 text-sm font-medium mb-8">
                <div className="flex justify-between text-slate-300"><span>Tiền phòng:</span> <span className="text-white font-bold">{formatMoney(roomPrice)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Điện:</span> <span className="text-white font-bold">{formatMoney(totalE)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Nước:</span> <span className="text-white font-bold">{formatMoney(totalW)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Internet:</span> <span className="text-white font-bold">{formatMoney(totalInternet)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Dịch vụ chung:</span> <span className="text-white font-bold">{formatMoney(totalService)}</span></div>
              </div>

              <div className="border-t border-slate-700 pt-6 mb-6">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right mb-1">Khách cần thanh toán</p>
                <p className="text-4xl font-black text-emerald-400 text-right">{formatMoney(finalTotal)}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setActiveTab("LIST")} className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition">Hủy</button>
                <button onClick={handleSaveInvoice} className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2">
                   Lưu & Phát Hành
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SHARE BILL GỬI KHÁCH --- */}
      {shareInvoiceId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShareInvoiceId(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"><X size={18} /></button>
            <h3 className="text-xl font-black text-slate-800 mb-2">Chia sẻ Hóa Đơn</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">Gửi link này cho khách thuê để xem chi tiết tiền phòng và mã QR thanh toán.</p>
            
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 mb-6">
              <input type="text" readOnly value={`${window.location.origin}/invoice/${shareInvoiceId}/print`} className="w-full bg-transparent text-sm text-slate-600 font-medium outline-none truncate"/>
            </div>

            <div className="flex gap-3">
              <button onClick={() => window.open(`/invoice/${shareInvoiceId}/print`, '_blank')} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50">
                Mở xem thử
              </button>
              <button onClick={() => handleCopyLink(shareInvoiceId)} className={`flex-[2] py-3 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition ${isCopied ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800'}`}>
                {isCopied ? <><CheckCircle2 size={16}/> Đã Copy</> : <><Copy size={16}/> Copy Link</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}