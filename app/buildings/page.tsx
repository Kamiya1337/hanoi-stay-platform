"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, Plus, DoorOpen, X, Trash2, Users, Bike, ArrowLeft, MapPin, Layers, Map, PenLine } from "lucide-react";

export default function BuildingsPage() {
  const HANOI_DATA: Record<string, string[]> = {
    "Ba Đình": ["Phúc Xá", "Trúc Bạch", "Vĩnh Phúc", "Cống Vị", "Liễu Giai", "Nguyễn Trung Trực", "Quán Thánh", "Ngọc Hà", "Điện Biên", "Đội Cấn", "Ngọc Khánh", "Kim Mã", "Giảng Võ", "Thành Công"],
    "Bắc Từ Liêm": ["Thượng Cát", "Liên Mạc", "Đông Ngạc", "Đức Thắng", "Thụy Phương", "Tây Tựu", "Xuân Đỉnh", "Xuân Tảo", "Minh Khai", "Cổ Nhuế 1", "Cổ Nhuế 2", "Phú Diễn", "Phúc Diễn"],
    "Cầu Giấy": ["Nghĩa Đô", "Nghĩa Tân", "Mai Dịch", "Dịch Vọng", "Dịch Vọng Hậu", "Quan Hoa", "Yên Hòa", "Trung Hòa"],
    "Đống Đa": ["Cát Linh", "Văn Miếu", "Quốc Tử Giám", "Láng Thượng", "Ô Chợ Dừa", "Văn Chương", "Hàng Bột", "Láng Hạ", "Khâm Thiên", "Thổ Quan", "Nam Đồng", "Trung Phụng", "Quang Trung", "Trung Liệt", "Phương Liên", "Thịnh Quang", "Trung Tự", "Kim Liên", "Phương Mai", "Ngã Tư Sở", "Khương Thượng"],
    "Hà Đông": ["Nguyễn Trãi", "Mộ Lao", "Văn Quán", "Vạn Phúc", "Yết Kiêu", "Quang Trung", "La Khê", "Phú La", "Phúc La", "Hà Cầu", "Yên Nghĩa", "Kiến Hưng", "Phú Lãm", "Phú Lương", "Dương Nội", "Đồng Mai", "Biên Giang"],
    "Hai Bà Trưng": ["Nguyễn Du", "Bạch Đằng", "Phạm Đình Hổ", "Lê Đại Hành", "Đồng Nhân", "Phố Huế", "Đống Mác", "Thanh Lương", "Thanh Nhàn", "Cầu Dền", "Bách Khoa", "Đồng Tâm", "Vĩnh Tuy", "Bạch Mai", "Quỳnh Mai", "Quỳnh Lôi", "Minh Khai", "Trương Định"],
    "Hoàn Kiếm": ["Phúc Tân", "Đồng Xuân", "Hàng Mã", "Hàng Buồm", "Hàng Đào", "Hàng Bồ", "Cửa Đông", "Lý Thái Tổ", "Hàng Bạc", "Hàng Gai", "Chương Dương", "Hàng Trống", "Cửa Nam", "Hàng Bông", "Tràng Tiền", "Trần Hưng Đạo", "Phan Chu Trinh", "Hàng Bài"],
    "Hoàng Mai": ["Thanh Trì", "Vĩnh Hưng", "Định Công", "Mai Động", "Tương Mai", "Đại Kim", "Tân Mai", "Hoàng Văn Thụ", "Giáp Bát", "Lĩnh Nam", "Thịnh Liệt", "Trần Phú", "Hoàng Liệt", "Yên Sở"],
    "Long Biên": ["Ngọc Thụy", "Giang Biên", "Đức Giang", "Việt Hưng", "Gia Thụy", "Ngọc Lâm", "Phúc Lợi", "Bồ Đề", "Sài Đồng", "Long Biên", "Thạch Bàn", "Phúc Đồng", "Cự Khối", "Thượng Thanh"],
    "Nam Từ Liêm": ["Cầu Diễn", "Mỹ Đình 1", "Mỹ Đình 2", "Phú Đô", "Mễ Trì", "Trung Văn", "Tây Mỗ", "Đại Mỗ", "Phương Canh", "Xuân Phương"],
    "Tây Hồ": ["Phú Thượng", "Nhật Tân", "Tứ Liên", "Quảng An", "Xuân La", "Yên Phụ", "Bưởi", "Thụy Khuê"],
    "Thanh Xuân": ["Thanh Xuân Bắc", "Thanh Xuân Nam", "Thanh Xuân Trung", "Thượng Đình", "Hạ Đình", "Khương Trung", "Khương Mai", "Khương Đình", "Kim Giang", "Nhân Chính", "Phương Liệt"]
  };

  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const [activeFloor, setActiveFloor] = useState<number>(1);

  // --- STATES MODAL TÒA NHÀ ---
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isEditBuildingMode, setIsEditBuildingMode] = useState(false);
  const [editBuildingId, setEditBuildingId] = useState<string | null>(null);

  // --- STATES MODAL PHÒNG ---
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isEditRoomMode, setIsEditRoomMode] = useState(false);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<any | null>(null);

  // --- STATES FORM DỮ LIỆU ---
  const [newBuilding, setNewBuilding] = useState({ 
    address: "", district: "", ward: "", totalFloors: 1, 
    allowPets: false, allowElectricBikes: true, electricBikeSlots: 0, motorcycleSlots: 0 
  });
  const [newRoom, setNewRoom] = useState({ name: "", floor: 1, price: 0, area: 0, maxTenants: 2, maxVehicles: 2 });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: bData } = await supabase.from("buildings").select("*").order("name");
      if (bData) setBuildings(bData);

      const { data: rData } = await supabase.from("rooms").select(`*, tenants (*)`).order("name");
      if (rData) setRooms(rData);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const listDistricts = Array.from(new Set(buildings.map((b) => b.district).filter(Boolean)));

  const getWardsCountInDistrict = (districtName: string) => {
    const buildingsInDistrict = buildings.filter((b) => b.district === districtName);
    return new Set(buildingsInDistrict.map((b) => b.ward).filter(Boolean)).size;
  };

  const listWardsInSelectedDistrict = selectedDistrict
    ? Array.from(new Set(buildings.filter((b) => b.district === selectedDistrict).map((b) => b.ward).filter(Boolean)))
    : [];

  const listBuildingsInSelectedWard = buildings.filter(
    (b) => b.district === selectedDistrict && b.ward === selectedWard
  );

  // ==========================================
  // XỬ LÝ LOGIC MODAL TÒA NHÀ (THÊM / SỬA / ĐÓNG)
  // ==========================================
  const handleOpenEditBuilding = (e: React.MouseEvent, b: any) => {
    e.stopPropagation(); // Ngăn click nhảy vào danh sách phòng
    setIsEditBuildingMode(true);
    setEditBuildingId(b.id);
    setNewBuilding({
      address: b.address || "",
      district: b.district || "",
      ward: b.ward || "",
      totalFloors: b.total_floors || 1,
      allowPets: b.allow_pets || false,
      allowElectricBikes: b.allow_electric_bikes || false,
      electricBikeSlots: b.electric_bike_slots || 0,
      motorcycleSlots: b.motorcycle_slots || 0,
    });
    setIsAddBuildingModalOpen(true);
  };

  const handleCloseBuildingModal = () => {
    setIsAddBuildingModalOpen(false);
    setIsEditBuildingMode(false);
    setEditBuildingId(null);
    setNewBuilding({ address: "", district: "", ward: "", totalFloors: 1, allowPets: false, allowElectricBikes: true, electricBikeSlots: 0, motorcycleSlots: 0 });
  };

  const handleSaveBuilding = async () => {
    if (!newBuilding.address || !newBuilding.district || !newBuilding.ward) {
      return alert("Vui lòng nhập Địa chỉ chi tiết, chọn Quận và Phường!");
    }
    try {
      const buildingData = {
        name: newBuilding.address, // Dùng địa chỉ làm tên
        address: newBuilding.address,
        district: newBuilding.district,
        ward: newBuilding.ward,
        total_floors: newBuilding.totalFloors,
        total_bike_slots: Number(newBuilding.electricBikeSlots) + Number(newBuilding.motorcycleSlots),
        allow_pets: newBuilding.allowPets,
        allow_electric_bikes: newBuilding.allowElectricBikes,
        electric_bike_slots: newBuilding.electricBikeSlots,
        motorcycle_slots: newBuilding.motorcycleSlots,
      };

      if (isEditBuildingMode && editBuildingId) {
        // LUỒNG CẬP NHẬT
        const { error } = await supabase.from("buildings").update(buildingData).eq("id", editBuildingId);
        if (error) throw error;
        alert("🎉 Cập nhật Tòa nhà thành công!");
      } else {
        // LUỒNG THÊM MỚI
        const { error } = await supabase.from("buildings").insert([buildingData]);
        if (error) throw error;
        alert("🎉 Thêm Tòa nhà mới thành công!");
      }

      handleCloseBuildingModal();
      fetchData();
    } catch (err: any) {
      alert(`Lỗi khi ${isEditBuildingMode ? 'cập nhật' : 'thêm'} tòa nhà: ` + err.message);
    }
  };

  // ==========================================
  // XỬ LÝ LOGIC MODAL PHÒNG (THÊM / SỬA / ĐÓNG)
  // ==========================================
  const handleOpenEditRoom = (e: React.MouseEvent, r: any) => {
    e.stopPropagation();
    setIsEditRoomMode(true);
    setEditRoomId(r.id);
    setNewRoom({
      name: r.name || "",
      floor: r.floor || 1,
      price: r.base_price || 0,
      area: r.area || 0,
      maxTenants: r.max_tenants || 2,
      maxVehicles: r.max_vehicles || 2,
    });
    setIsAddRoomModalOpen(true);
  };

  const handleCloseRoomModal = () => {
    setIsAddRoomModalOpen(false);
    setIsEditRoomMode(false);
    setEditRoomId(null);
    setNewRoom({ name: "", floor: activeFloor, price: 0, area: 0, maxTenants: 2, maxVehicles: 2 });
  };

  const handleSaveRoom = async () => {
    if (!newRoom.name) return alert("Vui lòng nhập tên/số phòng!");
    
    try {
      const roomData = {
        building_id: selectedBuilding.id,
        name: newRoom.name,
        floor: newRoom.floor,
        base_price: newRoom.price,
        area: newRoom.area,
        max_tenants: newRoom.maxTenants,
        max_vehicles: newRoom.maxVehicles,
      };

      if (isEditRoomMode && editRoomId) {
        // LUỒNG CẬP NHẬT (Không ghi đè status để tránh mất dữ liệu phòng đang thuê)
        const { error } = await supabase.from("rooms").update(roomData).eq("id", editRoomId);
        if (error) throw error;
        alert("🎉 Cập nhật thông tin phòng thành công!");
      } else {
        // LUỒNG THÊM MỚI
        const { error } = await supabase.from("rooms").insert([{ ...roomData, status: "EMPTY" }]);
        if (error) throw error;
        alert("🎉 Thêm phòng mới thành công!");
      }
      
      handleCloseRoomModal();
      fetchData(); 
    } catch (err: any) {
      alert(`Lỗi khi ${isEditRoomMode ? 'cập nhật' : 'thêm'} phòng: ` + err.message);
    }
  };

  // --- HÀM XÓA PHÒNG & XÓA TÒA NHÀ ---
  const handleDeleteRoom = async (roomId: string) => {
    const roomToDelete = rooms.find((r) => r.id === roomId);
    const activeTenants = roomToDelete?.tenants?.filter((t: any) => t.is_active) || [];
    
    if (activeTenants.length > 0) return alert("Không thể xóa phòng này! Hiện tại phòng đang có khách ở.");
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng này vĩnh viễn không?")) return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);
      if (error) throw error;
      setSelectedRoomDetails(null);
      fetchData();
    } catch (error: any) {
      alert("Lỗi xóa phòng: " + error.message);
    }
  };

  const handleDeleteBuilding = async (e: React.MouseEvent, b: any) => {
    e.stopPropagation();

    const roomsInBuilding = rooms.filter(r => r.building_id === b.id);
    const activeTenantsCount = roomsInBuilding.reduce((count, r) => {
        return count + (r.tenants?.filter((t: any) => t.is_active).length || 0);
    }, 0);

    if (activeTenantsCount > 0) {
        return alert(`Không thể gỡ! Tòa nhà này đang có ${activeTenantsCount} khách thuê đang ở.`);
    }

    if (!window.confirm(`Bạn có chắc chắn muốn gỡ tòa nhà "${b.name || b.address}" và toàn bộ ${roomsInBuilding.length} phòng bên trong khỏi hệ thống?`)) return;

    try {
      const { error } = await supabase.from("buildings").delete().eq("id", b.id);
      if (error) throw error;

      const remainingInWard = buildings.filter(x => x.district === b.district && x.ward === b.ward && x.id !== b.id);
      const remainingInDistrict = buildings.filter(x => x.district === b.district && x.id !== b.id);

      if (remainingInWard.length === 0) setSelectedWard(null);
      if (remainingInDistrict.length === 0) setSelectedDistrict(null);

      fetchData(); 
    } catch (error: any) {
      alert("Lỗi khi gỡ tòa nhà: " + error.message);
    }
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";

  if (isLoading) return <div className="p-8 text-slate-500 font-medium text-center mt-10 text-sm">Đang tải dữ liệu HANOI STAY...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sơ đồ Chuỗi HANOI STAY</h2>
          <div className="text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <span onClick={() => { setSelectedDistrict(null); setSelectedWard(null); setSelectedBuilding(null); }} className="cursor-pointer hover:text-slate-900 transition bg-slate-100 px-2 py-1 rounded-md text-slate-600">Hà Nội</span>
            {selectedDistrict && (
              <>
                <span>/</span>
                <span onClick={() => { setSelectedWard(null); setSelectedBuilding(null); }} className="cursor-pointer hover:text-slate-900 transition bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">Q. {selectedDistrict}</span>
              </>
            )}
            {selectedWard && (
              <>
                <span>/</span>
                <span onClick={() => setSelectedBuilding(null)} className="cursor-pointer hover:text-slate-900 transition bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">P. {selectedWard}</span>
              </>
            )}
            {selectedBuilding && (
              <>
                <span>/</span>
                <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded-md">{selectedBuilding.name}</span>
              </>
            )}
          </div>
        </div>
        <button onClick={() => { handleCloseBuildingModal(); setIsAddBuildingModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition shadow-md font-bold text-sm whitespace-nowrap">
          <Plus size={18} /> Thêm Tòa nhà mới
        </button>
      </div>

      {!selectedDistrict && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Khu vực Quận</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {listDistricts.map((d) => (
              <div key={d} onClick={() => setSelectedDistrict(d)} className="bg-white border border-slate-200 p-4 rounded-2xl cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group text-center">
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <Map size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-800">Quận {d}</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">Có {getWardsCountInDistrict(d)} phường</p>
              </div>
            ))}
            {listDistricts.length === 0 && <p className="text-slate-400 col-span-full text-center py-8 text-sm italic">Hệ thống chưa có dữ liệu cơ sở nào.</p>}
          </div>
        </div>
      )}

      {selectedDistrict && !selectedWard && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <button onClick={() => setSelectedDistrict(null)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition bg-white border border-slate-200 px-3 py-1.5 rounded-xl"><ArrowLeft size={14} /> Chọn lại Quận</button>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {listWardsInSelectedDistrict.map((w) => (
              <div key={w} onClick={() => setSelectedWard(w)} className="bg-white border border-slate-200 p-4 rounded-2xl cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group text-center">
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <MapPin size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-800">Phường {w}</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">Có {buildings.filter(b => b.district === selectedDistrict && b.ward === w).length} tòa nhà</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedWard && !selectedBuilding && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <button onClick={() => setSelectedWard(null)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition bg-white border border-slate-200 px-3 py-1.5 rounded-xl"><ArrowLeft size={14} /> Quay lại chọn Phường</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listBuildingsInSelectedWard.map((b) => (
              <div key={b.id} onClick={() => { setSelectedBuilding(b); setActiveFloor(1); }} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Building2 size={22} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{b.name}</h3>
                    </div>
                    
                    {/* KHU VỰC GÓC PHẢI: BADGE PET + NÚT SỬA + NÚT XÓA TÒA NHÀ */}
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${b.allow_pets ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {b.allow_pets ? "🐾 Cho nuôi Pet" : "🚫 Không Pet"}
                      </div>
                      <button 
                         onClick={(e) => handleOpenEditBuilding(e, b)}
                         className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                         title="Chỉnh sửa thông tin Tòa nhà"
                      >
                         <PenLine size={16} />
                      </button>
                      <button 
                         onClick={(e) => handleDeleteBuilding(e, b)}
                         className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                         title="Gỡ tòa nhà này"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-start gap-1.5 mb-6 line-clamp-2"><MapPin size={14} className="mt-0.5 shrink-0 text-slate-400"/> {b.address}</p>
                </div>
                
                {/* Lưới thông số Số tầng & Phân loại Xe */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Số tầng</p>
                    <p className="text-sm font-black text-slate-700">{b.total_floors || 1}</p>
                  </div>
                  
                  {/* Khu vực xử lý logic hiển thị Sức chứa xe THỰC TẾ */}
                  {(() => {
                    const maxSlots = b.total_bike_slots || 0;
                    const maxElectric = b.electric_bike_slots || 0;
                    const maxMotor = b.motorcycle_slots || 0;
                    
                    let currentElectric = 0;
                    let currentMotor = 0;

                    const bRooms = rooms.filter(r => r.building_id === b.id);
                    bRooms.forEach(room => {
                      const activeTenants = room.tenants?.filter((t: any) => t.is_active) || [];
                      activeTenants.forEach((t: any) => {
                        if (t.vehicle_type === 'ELECTRIC') currentElectric++;
                        if (t.vehicle_type === 'MOTORBIKE') currentMotor++;
                      });
                    });

                    const currentTotal = currentElectric + currentMotor;
                    const isFull = maxSlots > 0 && currentTotal >= maxSlots;

                    return (
                      <div className={`col-span-2 rounded-xl p-2.5 border transition-colors flex flex-col justify-center ${isFull ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 text-center ${isFull ? "text-rose-500" : "text-slate-400"}`}>
                          Sức chứa xe: {currentTotal}/{maxSlots} {isFull && <span className="text-rose-600 font-black animate-pulse">(FULL)</span>}
                        </p>
                        
                        {b.allow_electric_bikes ? (
                          <div className="flex justify-around text-xs font-bold">
                            <span className="flex items-center gap-1 text-slate-700">
                              🔋 Xe Điện: <span className={currentElectric >= maxElectric ? "text-rose-600" : "text-emerald-600"}>{currentElectric}/{maxElectric}</span>
                            </span>
                            <span className="flex items-center gap-1 text-slate-700">
                              🏍️ Xe Máy: <span className={currentMotor >= maxMotor ? "text-rose-600" : "text-blue-600"}>{currentMotor}/{maxMotor}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-slate-700">
                              🏍️ Xe Máy: <span className={currentMotor >= maxMotor ? "text-rose-600" : "text-blue-600"}>{currentMotor}/{maxMotor}</span>
                            </span>
                            <span className="text-[9px] text-rose-500 font-semibold mt-0.5">Không nhận xe điện</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBuilding && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <button onClick={() => setSelectedBuilding(null)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition bg-white border border-slate-200 px-3 py-1.5 rounded-xl"><ArrowLeft size={14} /> Quay lại danh sách Tòa nhà</button>
            <button onClick={() => { handleCloseRoomModal(); setNewRoom({...newRoom, floor: activeFloor}); setIsAddRoomModalOpen(true); }} className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition font-bold text-xs shadow-sm">
              <Plus size={14} /> Thêm phòng Tầng {activeFloor}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Array.from({ length: selectedBuilding.total_floors || 1 }, (_, i) => i + 1).map((floorNum) => (
              <button key={floorNum} onClick={() => setActiveFloor(floorNum)} className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${activeFloor === floorNum ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Tầng {floorNum}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rooms
              .filter((r) => r.building_id === selectedBuilding.id && (r.floor || 1) === activeFloor)
              .sort((a, b) => (a.status === 'EMPTY' ? -1 : 1))
              .map((room) => {
                const activeTenants = room.tenants?.filter((t: any) => t.is_active) || [];
                const currentCount = activeTenants.length;
                const maxCount = room.max_tenants || 2;
                const vehiclesCount = activeTenants.filter((t: any) => t.vehicle_type && t.vehicle_type !== 'NONE').length;
                const maxVehicles = room.max_bikes || room.max_vehicles || 2; 
                const isEmpty = currentCount === 0;

                return (
                  <div key={room.id} onClick={() => setSelectedRoomDetails({ ...room, currentCount, maxCount, vehiclesCount, maxVehicles, activeTenants })} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{room.name}</h4>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{room.area} m²</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{formatMoney(room.base_price)}</span>
                        {/* NÚT SỬA PHÒNG BÊN NGOÀI CARD */}
                        <button onClick={(e) => handleOpenEditRoom(e, room)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="Chỉnh sửa thông tin phòng"><PenLine size={18} /></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-between border border-slate-100 text-slate-600"><Users size={14} /><span className="font-bold text-xs">{currentCount}/{maxCount}</span></div>
                      <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-between border border-slate-100 text-slate-600"><Bike size={14} /><span className="font-bold text-xs">{vehiclesCount}/{maxVehicles} xe</span></div>
                    </div>

                    <div className={`w-full py-2.5 rounded-xl text-center text-xs font-black uppercase tracking-wider text-white transition-colors ${isEmpty ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"}`}>
                      {isEmpty ? "Phòng Trống" : "Đang Thuê"}
                    </div>
                  </div>
                );
              })}
            
            {rooms.filter((r) => r.building_id === selectedBuilding.id && (r.floor || 1) === activeFloor).length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <DoorOpen size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 font-medium text-xs">Hiện tại tầng này chưa được tạo phòng nào.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: THÊM / CẬP NHẬT TÒA NHÀ */}
      {/* ========================================== */}
      {isAddBuildingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-800 mb-5">
              {isEditBuildingMode ? "Cập nhật thông tin Tòa nhà" : "Thêm Cơ sở Vận hành mới"}
            </h3>
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Chọn Quận</label>
                  <select value={newBuilding.district} onChange={(e) => setNewBuilding({...newBuilding, district: e.target.value, ward: ""})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition">
                    <option value="">-- Chọn Quận --</option>
                    {Object.keys(HANOI_DATA).map(d => <option key={d} value={d}>Quận {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Chọn Phường</label>
                  <select value={newBuilding.ward} onChange={(e) => setNewBuilding({...newBuilding, ward: e.target.value})} disabled={!newBuilding.district} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm disabled:opacity-50 focus:border-emerald-500 transition">
                    <option value="">-- Chọn Phường --</option>
                    {newBuilding.district && HANOI_DATA[newBuilding.district].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div><label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ (Sẽ làm Tên tòa nhà)</label><input type="text" placeholder="VD: Số 17, Ngõ 442 Phạm Văn Đồng" value={newBuilding.address} onChange={(e) => setNewBuilding({...newBuilding, address: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition" /></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Tổng số tầng</label><input type="number" min={1} value={newBuilding.totalFloors} onChange={(e) => setNewBuilding({...newBuilding, totalFloors: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition" /></div>
                <div className="flex flex-col justify-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={newBuilding.allowPets} onChange={(e) => setNewBuilding({...newBuilding, allowPets: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300" />
                    <span className="text-xs font-bold text-slate-700">Cho phép nuôi Pet 🐾</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Chính sách Xe điện 🔋</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={newBuilding.allowElectricBikes} onChange={(e) => setNewBuilding({...newBuilding, allowElectricBikes: e.target.checked})} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {newBuilding.allowElectricBikes && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Số chỗ Xe điện</label>
                        <input type="number" min={0} value={newBuilding.electricBikeSlots} onChange={(e) => setNewBuilding({...newBuilding, electricBikeSlots: Number(e.target.value)})} className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm focus:border-emerald-500 transition" />
                      </div>
                    )}
                    <div className={!newBuilding.allowElectricBikes ? "col-span-2" : ""}>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Số chỗ Xe máy</label>
                      <input type="number" min={0} value={newBuilding.motorcycleSlots} onChange={(e) => setNewBuilding({...newBuilding, motorcycleSlots: Number(e.target.value)})} className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm focus:border-emerald-500 transition" />
                    </div>
                 </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleCloseBuildingModal} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition">Hủy bỏ</button>
              <button onClick={handleSaveBuilding} className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition">
                {isEditBuildingMode ? "Lưu thay đổi" : "Lưu Tòa nhà"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: THÊM / CẬP NHẬT PHÒNG */}
      {/* ========================================== */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-800">
                {isEditRoomMode ? "Cập nhật thông tin phòng" : `Thêm phòng mới - Tầng ${newRoom.floor}`}
              </h3>
              <button onClick={handleCloseRoomModal} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition"><X size={18} /></button>
            </div>
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Số / Tên phòng</label><input type="text" placeholder="VD: 201" value={newRoom.name} onChange={(e) => setNewRoom({...newRoom, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Vị trí Tầng</label><select value={newRoom.floor} onChange={(e) => setNewRoom({...newRoom, floor: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition">{Array.from({ length: selectedBuilding.total_floors || 1 }, (_, i) => i + 1).map(f => <option key={f} value={f}>Tầng {f}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Giá định mức (VNĐ)</label><input type="number" value={newRoom.price || ""} onChange={(e) => setNewRoom({...newRoom, price: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Diện tích (m²)</label><input type="number" value={newRoom.area || ""} onChange={(e) => setNewRoom({...newRoom, area: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Số khách ở max</label><input type="number" value={newRoom.maxTenants} onChange={(e) => setNewRoom({...newRoom, maxTenants: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Số xe gửi max</label><input type="number" value={newRoom.maxVehicles} onChange={(e) => setNewRoom({...newRoom, maxVehicles: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-emerald-500 transition" /></div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleCloseRoomModal} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition">Hủy</button>
              <button onClick={handleSaveRoom} className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition">
                {isEditRoomMode ? "Lưu thay đổi" : "Lưu thông tin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRoomDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setSelectedRoomDetails(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"><X size={18} /></button>
            <h3 className="text-xl font-extrabold text-slate-800 mb-0.5">Phòng {selectedRoomDetails.name}</h3>
            <p className="text-slate-400 text-xs font-medium mb-5">Danh sách khách thuê hợp đồng</p>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center"><p className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Thực tế người ở</p><p className="text-base font-black text-slate-800"><span className={selectedRoomDetails.currentCount >= selectedRoomDetails.maxCount ? "text-rose-500" : "text-emerald-500"}>{selectedRoomDetails.currentCount}</span><span className="text-slate-400 text-xs"> / {selectedRoomDetails.maxCount}</span></p></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center"><p className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Thực tế xe gửi</p><p className="text-base font-black text-slate-800"><span className={selectedRoomDetails.vehiclesCount >= selectedRoomDetails.maxVehicles ? "text-rose-500" : "text-emerald-500"}>{selectedRoomDetails.vehiclesCount}</span><span className="text-slate-400 text-xs"> / {selectedRoomDetails.maxVehicles}</span></p></div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 border-b border-slate-100 pb-1.5">Khách đang lưu trú</h4>
              {selectedRoomDetails.activeTenants.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-slate-100">Hiện tại phòng trống, chưa xếp lịch ở.</p>
              ) : (
                <div className="space-y-2">
                  {selectedRoomDetails.activeTenants.map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center bg-white border border-slate-200 p-2.5 rounded-xl text-xs">
                      <div><p className="font-bold text-slate-800">{t.full_name}</p><p className="text-slate-400 font-medium mt-0.5">{t.phone || "Không để lại SĐT"}</p></div>
                      <span className="font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{t.vehicle_type === 'MOTORBIKE' ? '🏍️ Xe máy' : t.vehicle_type === 'ELECTRIC' ? '🔋 Xe điện' : t.vehicle_type === 'BICYCLE' ? '🚲 Xe đạp' : '❌ Không xe'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => handleDeleteRoom(selectedRoomDetails.id)} className="w-full flex justify-center items-center gap-1.5 py-3 bg-white border border-rose-200 text-rose-500 font-bold rounded-xl hover:bg-rose-50 text-xs transition"><Trash2 size={14} /> Gỡ bỏ phòng khỏi hệ thống</button>
          </div>
        </div>
      )}
    </div>
  );
}