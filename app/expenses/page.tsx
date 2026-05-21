"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wallet, Plus, X, MapPin, Tag, Calendar, FileText, Trash2 } from "lucide-react";

export default function ExpensesPage() {
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

  const [expenses, setExpenses] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // States quản lý 3 ô chọn lồng nhau
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    building_id: "",
    amount: "",
    category: "Sửa chữa",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
  });

  // --- LOGIC LỌC DỮ LIỆU ĐỘNG (Cascading) ---
  const listWards = selectedDistrict ? HANOI_DATA[selectedDistrict] || [] : [];
  
  const listBuildingsModal = selectedWard ? buildings.filter(b => {
    // Ưu tiên check theo cột district/ward nếu có, nếu không thì fallback về chuỗi address
    const bDist = b.district || b.address || "";
    const bWard = b.ward || b.address || "";
    return bDist.includes(selectedDistrict) && bWard.includes(selectedWard);
  }) : [];

  // Load dữ liệu khi vào trang
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // Lấy đầy đủ thông tin tòa nhà để lọc chính xác
    const { data: bData } = await supabase.from("buildings").select("*").order("name");
    if (bData) setBuildings(bData);

    const { data: eData } = await supabase
      .from("expenses")
      .select(`*, buildings(name)`)
      .order("expense_date", { ascending: false });
    
    if (eData) setExpenses(eData);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.building_id || !formData.amount) {
      alert("Vui lòng chọn tòa nhà và nhập số tiền!");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Bạn chưa đăng nhập!");

      const { error } = await supabase.from("expenses").insert({
        user_id: session.user.id,
        building_id: formData.building_id,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        expense_date: formData.expense_date,
      });

      if (error) throw error;

      alert("🎉 Thêm phiếu chi thành công!");
      setIsModalOpen(false); 
      setFormData({ ...formData, building_id: "", amount: "", description: "" });
      setSelectedDistrict("");
      setSelectedWard("");
      fetchData(); 
    } catch (error: any) {
      alert("Lỗi khi lưu: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý xóa phiếu chi
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khoản chi này? Hành động này không thể hoàn tác!")) return;
    
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      
      // Xóa xong thì tải lại danh sách
      fetchData(); 
    } catch (error: any) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  if (isLoading) return <div className="p-10 font-bold text-slate-500 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="text-emerald-600" /> Quản lý Thu Chi
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Theo dõi các khoản chi phí phát sinh hàng tháng</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition"
        >
          <Plus size={20} /> Thêm Phiếu Chi
        </button>
      </div>

      {/* DANH SÁCH PHIẾU CHI */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-bold">Ngày chi</th>
                <th className="p-4 font-bold">Tòa nhà</th>
                <th className="p-4 font-bold">Danh mục</th>
                <th className="p-4 font-bold">Ghi chú</th>
                <th className="p-4 font-bold text-right">Số tiền</th>
                <th className="p-4 font-bold text-center">Xóa</th> {/* <-- Thêm dòng này */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium"> {/* <-- Sửa colSpan từ 5 thành 6 */}
                    Chưa có phiếu chi nào. Bấm "Thêm Phiếu Chi" để bắt đầu!
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-700">
                      {new Date(expense.expense_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 text-slate-600">{expense.buildings?.name}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 max-w-[200px] truncate">{expense.description || "—"}</td>
                    <td className="p-4 font-black text-rose-600 text-right">
                      -{new Intl.NumberFormat("vi-VN").format(expense.amount)} đ
                    </td>
                    <td className="p-4 font-black text-rose-600 text-right">
                      -{new Intl.NumberFormat("vi-VN").format(expense.amount)} đ
                    </td>
                    {/* <-- Thêm khối <td> nút Xóa này vào cuối cùng của thẻ <tr> --> */}
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500 rounded-md transition-colors"
                        title="Xóa phiếu chi này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM PHIẾU CHI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">Tạo Phiếu Chi Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              {/* KHU VỰC CHỌN VỊ TRÍ 3 CẤP (Style giống trang Khách thuê) */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                <label className="block text-sm font-black text-slate-800">Chọn Cơ Sở Vận Hành</label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. Quận</label>
                    <select 
                      value={selectedDistrict} 
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setSelectedWard("");
                        setFormData({...formData, building_id: ""});
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:border-emerald-500 transition"
                    >
                      <option value="">-- Chọn Quận --</option>
                      {Object.keys(HANOI_DATA).map(district => (
                        <option key={district} value={district}>Quận {district}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. Phường</label>
                    <select 
                      value={selectedWard} 
                      onChange={(e) => {
                        setSelectedWard(e.target.value);
                        setFormData({...formData, building_id: ""});
                      }}
                      disabled={!selectedDistrict}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium disabled:opacity-50 disabled:bg-slate-100 focus:border-emerald-500 transition"
                    >
                      <option value="">-- Chọn Phường --</option>
                      {listWards.map(ward => (
                        <option key={ward} value={ward}>Phường {ward}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">3. Tòa nhà</label>
                  <select 
                    value={formData.building_id} 
                    onChange={(e) => setFormData({...formData, building_id: e.target.value})}
                    disabled={!selectedWard}
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl outline-none text-sm font-bold text-emerald-800 disabled:opacity-50 disabled:border-slate-200 disabled:text-slate-500 disabled:bg-slate-100 transition"
                  >
                    <option value="">-- Chọn Tòa nhà --</option>
                    {listBuildingsModal.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} - {b.address}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* THÔNG TIN PHIẾU CHI */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                    <Wallet size={14}/> Số tiền (VNĐ)
                  </label>
                  <input 
                    type="number" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="VD: 350000"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                    <Tag size={14}/> Danh mục
                  </label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Tiền vốn">Tiền vốn</option>
                    <option value="Sửa chữa">Sửa chữa</option>
                    <option value="Vệ sinh">Vệ sinh</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Điện nước chung">Điện nước chung</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                    <Calendar size={14}/> Ngày chi
                  </label>
                  <input 
                    type="date" 
                    value={formData.expense_date} 
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                    <FileText size={14}/> Ghi chú chi tiết
                  </label>
                  <textarea 
                    rows={2}
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="VD: Thay vòi xịt phòng 201..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSaving ? "Đang lưu..." : "Lưu Phiếu Chi"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}