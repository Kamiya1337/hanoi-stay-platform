"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, X, Search, ChevronDown, ChevronRight, MapPin, AlertCircle, CheckCircle2, Trash2, Building2, Layers, DoorOpen, Users } from "lucide-react";

export default function TenantsPage() {
  // --- STATE LƯU TRỮ DỮ LIỆU TỪ DB ---
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE QUẢN LÝ ACCORDION (Mở/Đóng các cấp) ---
  const [expandedBuildings, setExpandedBuildings] = useState<string[]>([]);
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]); 
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);

  // --- TRẠNG THÁI MODAL THÊM KHÁCH ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: "", 
    phone: "", 
    startDate: "", 
    endDate: "", 
    vehicleType: "NONE", 
    notes: "",
    hasPet: false // Thêm trường lưu trạng thái thú cưng của khách
  });

  // --- STATES QUẢN LÝ 5 Ô CHỌN LỒNG NHAU (CASCADING DROPDOWNS) ---
  const [selDist, setSelDist] = useState("");
  const [selWard, setSelWard] = useState("");
  const [selBld, setSelBld] = useState("");
  const [selFloor, setSelFloor] = useState("");
  const [selRoom, setSelRoom] = useState("");

  // --- HÀM TẢI DỮ LIỆU ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: bData } = await supabase.from("buildings").select("*").order("name");
      if (bData) setBuildings(bData);

      const { data: rData } = await supabase.from("rooms").select("*").order("name");
      if (rData) setRooms(rData);

      const { data: tData } = await supabase.from("tenants").select("*").eq("is_active", true).order("created_at");
      if (tData) setTenants(tData);

      const { data: iData, error: iErr } = await supabase.from("invoices").select("*");
      if (!iErr && iData) setInvoices(iData);

    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CÁC HÀM TOGGLE ACCORDION ---
  const toggleBuilding = (id: string) => setExpandedBuildings(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleFloor = (id: string) => setExpandedFloors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleRoom = (id: string) => setExpandedRooms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // --- LOGIC TÌM KIẾM THÔNG MINH ---
  const normalizedSearch = searchTerm.toLowerCase();
  
  const isRoomMatch = (roomId: string) => {
    if (!normalizedSearch) return true;
    const room = rooms.find(r => r.id === roomId);
    if (room?.name?.toLowerCase().includes(normalizedSearch)) return true;
    const roomTenants = tenants.filter(t => t.room_id === roomId);
    return roomTenants.some(t => t.full_name?.toLowerCase().includes(normalizedSearch) || t.phone?.includes(normalizedSearch));
  };

  // --- LOGIC GOM NHÓM & TÍNH TOÁN TRẠNG THÁI PHÒNG ---
  const getRoomPriority = (roomId: string) => {
    const roomInvs = invoices.filter(inv => inv.room_id === roomId);
    const hasUnpaid = roomInvs.some(inv => inv.status === 'UNPAID');
    const room = rooms.find(r => r.id === roomId);
    
    if (hasUnpaid) return 1; 
    if (room?.status === 'EMPTY') return 2; 
    return 3; 
  };

  // --- XÓA KHÁCH THUÊ ---
  const handleDeleteTenant = async (tenantId: string, roomId: string) => {
    if (!window.confirm("Kết thúc hợp đồng và xóa khách thuê này?")) return;
    try {
      await supabase.from("tenants").delete().eq("id", tenantId);
      if (roomId) await supabase.from("rooms").update({ status: "EMPTY" }).eq("id", roomId);
      fetchData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  // --- LOGIC MODAL (Cascading Dropdowns) ---
  const listDistricts = Array.from(new Set(buildings.map(b => b.district).filter(Boolean)));
  const listWards = selDist ? Array.from(new Set(buildings.filter(b => b.district === selDist).map(b => b.ward).filter(Boolean))) : [];
  const listBuildingsModal = selWard ? buildings.filter(b => b.district === selDist && b.ward === selWard) : [];
  const selectedBuildingObj = buildings.find(b => b.id === selBld);
  const listFloors = selectedBuildingObj ? Array.from({ length: selectedBuildingObj.total_floors || 1 }, (_, i) => i + 1) : [];
  
  const listAvailableRooms = selFloor ? rooms.filter(r => {
    if (r.building_id !== selBld || (r.floor || 1) !== Number(selFloor)) return false;
    const currentActiveTenants = tenants.filter(t => t.room_id === r.id).length;
    return r.status === 'EMPTY' || currentActiveTenants < (r.max_tenants || 2);
  }) : [];

  const handleBuildingChange = (bId: string) => {
    setSelBld(bId); setSelFloor(""); setSelRoom("");
    const bld = buildings.find(b => b.id === bId);
    
    let updatedVehicle = formData.vehicleType;
    if (bld && !bld.allow_electric_bikes && formData.vehicleType === 'ELECTRIC') {
      updatedVehicle = 'NONE';
    }

    // Nếu tòa nhà không cho nuôi pet -> Tự động ép giá trị hasPet về false
    setFormData(prev => ({
      ...prev,
      vehicleType: updatedVehicle,
      hasPet: bld ? (bld.allow_pets ? prev.hasPet : false) : false
    }));
  };

  const handleAddTenant = async () => {
    if (!formData.fullName || !selRoom || !formData.startDate) return alert("Vui lòng điền Họ tên, Chọn phòng và Ngày bắt đầu!");
    try {
      await supabase.from("tenants").insert([{
        full_name: formData.fullName, 
        phone: formData.phone, 
        room_id: selRoom, 
        start_date: formData.startDate, 
        end_date: formData.endDate || null, 
        vehicle_type: formData.vehicleType, 
        notes: formData.notes, 
        has_pet: formData.hasPet, // Truyền chính xác trạng thái checkbox xuống database
        is_active: true
      }]);
      
      const targetRoom = rooms.find(r => r.id === selRoom);
      if (targetRoom) {
        const currentActive = tenants.filter(t => t.room_id === selRoom).length + 1;
        if (currentActive >= (targetRoom.max_tenants || 2)) await supabase.from("rooms").update({ status: 'RENTED' }).eq('id', selRoom);
      }
      setIsAddModalOpen(false);
      setFormData({ fullName: "", phone: "", startDate: "", endDate: "", vehicleType: "NONE", notes: "", hasPet: false });
      setSelDist(""); setSelWard(""); setSelBld(""); setSelFloor(""); setSelRoom("");
      fetchData();
    } catch (err: any) {
      alert("Lỗi lưu hợp đồng: " + err.message);
    }
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* --- THANH CÔNG CỤ TÌM KIẾM --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4 sticky top-4 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý Khách thuê</h2>
          <p className="text-slate-500 mt-0.5 text-xs font-medium">Hệ thống phân cấp Tòa nhà - Tầng - Phòng</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input type="text" placeholder="Tìm tên, SĐT, số phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition text-sm font-medium" />
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition shadow-md font-bold text-sm whitespace-nowrap">
            <UserPlus size={18} /> Thêm khách
          </button>
        </div>
      </div>

      {/* --- HỆ THỐNG ACCORDION 4 LỚP --- */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Đang tải dữ liệu vận hành...</div>
        ) : buildings.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-medium bg-white rounded-3xl border border-slate-200">Chưa có cơ sở nào.</div>
        ) : (
          buildings.map((bld) => {
            const bldRooms = rooms.filter(r => r.building_id === bld.id);
            const hasMatch = bldRooms.some(r => isRoomMatch(r.id));
            if (!hasMatch && normalizedSearch) return null;

            const isBldExpanded = expandedBuildings.includes(bld.id);
            const floorsArr = Array.from({ length: bld.total_floors || 1 }, (_, i) => i + 1);

            return (
              <div key={bld.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                {/* LỚP 1: TÒA NHÀ */}
                <div onClick={() => toggleBuilding(bld.id)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 select-none group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">{bld.name || bld.address}</h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5"><MapPin size={12}/> {bld.address} <span className="mx-1">|</span> Q. {bld.district} - P. {bld.ward}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 group-hover:text-slate-800 transition">
                    {isBldExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>

                {/* LỚP 2: TẦNG */}
                {isBldExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-3">
                    {floorsArr.map(floorNum => {
                      const floorIdStr = `${bld.id}-${floorNum}`;
                      const isFloorExpanded = expandedFloors.includes(floorIdStr);
                      
                      const floorRooms = bldRooms.filter(r => (r.floor || 1) === floorNum && isRoomMatch(r.id));
                      if (floorRooms.length === 0 && normalizedSearch) return null;

                      return (
                        <div key={floorIdStr} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <div onClick={() => toggleFloor(floorIdStr)} className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-100 select-none group/floor">
                            <div className="flex items-center gap-3">
                              <Layers size={18} className="text-slate-400 group-hover/floor:text-slate-700 transition-colors" />
                              <h4 className="text-sm font-bold text-slate-700">Tầng {floorNum}</h4>
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">{floorRooms.length} phòng</span>
                            </div>
                            {isFloorExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                          </div>

                          {/* LỚP 3: PHÒNG */}
                          {isFloorExpanded && (
                            <div className="p-2 bg-slate-50 grid grid-cols-1 gap-2">
                              {floorRooms.sort((a, b) => getRoomPriority(a.id) - getRoomPriority(b.id)).map(room => {
                                const isRoomExpanded = expandedRooms.includes(room.id);
                                const roomTenants = tenants.filter(t => t.room_id === room.id);
                                const roomInvs = invoices.filter(inv => inv.room_id === room.id);
                                const hasUnpaid = roomInvs.some(inv => inv.status === 'UNPAID');
                                const isEmpty = room.status === 'EMPTY';

                                return (
                                  <div key={room.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                    <div onClick={() => toggleRoom(room.id)} className="flex items-center justify-between p-3 cursor-pointer hover:border-emerald-300 select-none transition-colors border-l-4 border-transparent hover:border-l-emerald-500">
                                      <div className="flex items-center gap-3 w-1/3">
                                        <DoorOpen size={16} className="text-slate-400" />
                                        <span className="font-black text-slate-800">Phòng {room.name}</span>
                                      </div>
                                      <div className="flex items-center justify-center gap-4 w-1/3 text-xs text-slate-500 font-medium">
                                        <span>{formatMoney(room.base_price)}</span>
                                        <span>{room.area} m²</span>
                                      </div>
                                      <div className="flex items-center justify-end gap-3 w-1/3">
                                        {hasUnpaid && <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 animate-pulse"><AlertCircle size={12}/> Đang nợ tiền</span>}
                                        {isEmpty && <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold">Trống</span>}
                                        {!hasUnpaid && !isEmpty && <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-bold">Đang Thuê ({roomTenants.length}/{room.max_tenants})</span>}
                                        
                                        {isRoomExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                      </div>
                                    </div>

                                    {/* LỚP 4: CHI TIẾT KHÁCH THUÊ */}
                                    {isRoomExpanded && (
                                      <div className="p-3 bg-slate-50 border-t border-slate-100">
                                        {roomTenants.length === 0 ? (
                                          <p className="text-xs text-slate-400 italic text-center py-2">Chưa có khách thuê trong phòng này.</p>
                                        ) : (
                                          <div className="space-y-2">
                                            {roomTenants.map(t => (
                                              <div key={t.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-3 w-1/3">
                                                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><Users size={14}/></div>
                                                  <div>
                                                    <p className="text-sm font-bold text-slate-800">{t.full_name} {t.has_pet && <span className="text-xs">🐾</span>}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{t.phone || "Không có SĐT"}</p>
                                                  </div>
                                                </div>
                                                <div className="w-1/3 text-center">
                                                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Thời hạn hợp đồng</p>
                                                  <p className="text-xs font-semibold text-slate-600">{t.start_date} <span className="text-slate-400 font-normal">đến</span> {t.end_date || "---"}</p>
                                                </div>
                                                <div className="w-1/3 flex justify-end items-center gap-4">
                                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                    {t.vehicle_type === 'MOTORBIKE' ? '🏍 Xe Máy' : t.vehicle_type === 'ELECTRIC' ? '🔋Xe Điện' : t.vehicle_type === 'BICYCLE' ? '🚲 Đạp' : '❌ Ko xe'}
                                                  </span>
                                                  <button onClick={() => handleDeleteTenant(t.id, room.id)} className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-md transition-colors" title="Kết thúc hợp đồng">
                                                    <Trash2 size={16} />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                            {roomTenants[0]?.notes && (
                                              <div className="mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                                <p className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">📌 Ghi chú phòng</p>
                                                <p className="text-xs text-amber-900">{roomTenants[0].notes}</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL THÊM KHÁCH (Cascading 5 Cấp + Kiểm soát Pet) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl p-7 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-800">Thêm Khách Thuê Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="bg-slate-100 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"><X size={18} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Họ và Tên *</label><input type="text" placeholder="VD: Vũ Hoàng Long" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition text-sm" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Số điện thoại</label><input type="text" placeholder="VD: 0987654321" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition text-sm" /></div>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                <label className="block text-sm font-black text-slate-800">Xếp vào phòng (Chỉ hiện phòng còn chỗ) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. Quận</label>
                    <select value={selDist} onChange={e => { setSelDist(e.target.value); setSelWard(""); setSelBld(""); setSelFloor(""); setSelRoom(""); }} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium">
                      <option value="">-- Chọn Quận --</option>
                      {listDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. Phường</label>
                    <select value={selWard} onChange={e => { setSelWard(e.target.value); setSelBld(""); setSelFloor(""); setSelRoom(""); }} disabled={!selDist} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium disabled:opacity-50 disabled:bg-slate-100">
                      <option value="">-- Chọn Phường --</option>
                      {listWards.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">3. Tòa nhà</label>
                  <select value={selBld} onChange={e => handleBuildingChange(e.target.value)} disabled={!selWard} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-800 disabled:opacity-50 disabled:bg-slate-100">
                    <option value="">-- Chọn Tòa nhà --</option>
                    {listBuildingsModal.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">4. Tầng</label>
                    <select value={selFloor} onChange={e => { setSelFloor(e.target.value); setSelRoom(""); }} disabled={!selBld} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium disabled:opacity-50 disabled:bg-slate-100">
                      <option value="">-- Chọn Tầng --</option>
                      {listFloors.map(f => <option key={f} value={f}>Tầng {f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">5. Phòng</label>
                    <select value={selRoom} onChange={e => setSelRoom(e.target.value)} disabled={!selFloor} className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl outline-none text-sm font-bold text-emerald-800 disabled:opacity-50 disabled:border-slate-200 disabled:text-slate-500 disabled:bg-slate-100">
                      <option value="">-- Chọn Phòng --</option>
                      {listAvailableRooms.map(r => <option key={r.id} value={r.id}>Phòng {r.name} (Max {r.max_tenants})</option>)}
                    </select>
                  </div>
                </div>

                {/* LOGIC HIỂN THỊ DÒNG THÔNG BÁO QUY ĐỊNH NUÔI PET CỦA TÒA NHÀ */}
                {selectedBuildingObj && (
                  <div className="mt-2 text-xs font-bold animate-in fade-in duration-200">
                    {selectedBuildingObj.allow_pets ? (
                      <span className="text-emerald-600 flex items-center gap-1">🟢 Tòa nhà này cho phép nuôi thú cưng.</span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">🔴 Tòa nhà này NGHIÊM CẤM nuôi thú cưng.</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày bắt đầu *</label><input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Ngày hết hạn HĐ</label><input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium" /></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Phương tiện di chuyển</label>
                <select value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold text-slate-700">
                  <option value="NONE">❌ Không có xe</option>
                  <option value="MOTORBIKE">🏍️ Xe máy</option>
                  <option value="BICYCLE">🚲 Xe đạp</option>
                  {selectedBuildingObj?.allow_electric_bikes && <option value="ELECTRIC">🔋 Xe điện</option>}
                </select>
                {selectedBuildingObj && !selectedBuildingObj.allow_electric_bikes && <p className="text-rose-500 text-xs font-bold mt-2 bg-rose-50 p-2 rounded-lg inline-block">* Tòa nhà KHÔNG tiếp nhận Xe điện</p>}
              </div>

              {/* LOGIC RÀNG BUỘC CHECKBOX NUÔI THÚ CƯNG (HAS_PET) */}
              <div>
                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all ${selectedBuildingObj && !selectedBuildingObj.allow_pets ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                  <input 
                    type="checkbox" 
                    checked={formData.hasPet} 
                    disabled={selectedBuildingObj ? !selectedBuildingObj.allow_pets : false}
                    onChange={e => setFormData({...formData, hasPet: e.target.checked})} 
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed" 
                  />
                  <span className="text-xs font-bold text-slate-700">Khách mang theo thú cưng (Chó/Mèo)?</span>
                </label>
              </div>

              <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Ghi chú phòng trừ rủi ro</label><textarea placeholder="Ví dụ: Làm ca đêm, đóng tiền cọc muộn..." rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm resize-none"></textarea></div>
            </div>

            <div className="mt-8 flex gap-3"><button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition">Hủy bỏ</button><button onClick={handleAddTenant} className="flex-[2] py-3.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">Lưu Hợp Đồng</button></div>
          </div>
        </div>
      )}
    </div>
  );
}