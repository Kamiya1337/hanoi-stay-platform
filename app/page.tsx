"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Bell, DollarSign, Users, Home, AlertCircle, 
  TrendingUp, TrendingDown, ChevronDown, Calendar, Building2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { subMonths, format, isSameMonth, isSameYear, differenceInDays, parseISO } from "date-fns";

// Bảng màu cho biểu đồ Donut (Tỉ lệ lấp đầy theo tòa)
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // State lưu trữ dữ liệu tính toán cho Cards
  const [metrics, setMetrics] = useState({
    currentMonthRevenue: 0,
    totalCapacity: 0,
    activeTenants: 0,
    emptyRoomsCount: 0,
    remainingSlots: 0,
    expiringContracts: 0
  });

  // State lưu trữ dữ liệu cho Biểu đồ
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [buildingOccupancyData, setBuildingOccupancyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();

        // =========================================================================
        // 1. FETCH TOÀN BỘ DỮ LIỆU TỪ SUPABASE (RAW DATA)
        // =========================================================================
        const [
          { data: invoices },
          { data: rooms },
          { data: tenants },
          { data: buildings },
          { data: expenses }
        ] = await Promise.all([
          supabase.from('invoices').select('amount, status, created_at'),
          supabase.from('rooms').select('id, status, max_tenants, building_id'),
          supabase.from('tenants').select('id, is_active, end_date, room_id'),
          supabase.from('buildings').select('id, name'),
          supabase.from('expenses').select('amount, expense_date') // <-- Thêm truy vấn này
        ]);

        // =========================================================================
        // 2. DATA PIPELINE LÀM SẠCH VÀ TÍNH TOÁN CHO 4 CARDS THỐNG KÊ
        // =========================================================================
        
        // --- CARD 1: Dòng tiền thực tế tháng này ---
        const currentMonthInvoices = (invoices || []).filter(inv => {
          if (inv.status !== 'PAID') return false;
          const invDate = new Date(inv.created_at); // Hoặc payment_date nếu bảng có
          return isSameMonth(invDate, today) && isSameYear(invDate, today);
        });
        const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

        // --- CARD 2: Tỉ lệ lấp đầy (Sức chứa) ---
        const totalCapacity = (rooms || []).reduce((sum, r) => sum + Number(r.max_tenants || 2), 0);
        const activeTenants = (tenants || []).filter(t => t.is_active).length;

        // --- CARD 3: Phòng trống hoàn toàn ---
        const emptyRoomsCount = (rooms || []).filter(r => r.status === 'EMPTY').length;
        const remainingSlots = totalCapacity - activeTenants;

        // --- CARD 4: Cảnh báo hết hạn HĐ (<= 30 ngày) ---
        const expiringContracts = (tenants || []).filter(t => {
          if (!t.is_active || !t.end_date) return false;
          const daysLeft = differenceInDays(parseISO(t.end_date), today);
          return daysLeft >= 0 && daysLeft <= 30; // Còn hạn và dưới 30 ngày
        }).length;

        setMetrics({
          currentMonthRevenue,
          totalCapacity,
          activeTenants,
          emptyRoomsCount,
          remainingSlots,
          expiringContracts
        });

        // =========================================================================
        // 3. DATA PIPELINE CHO BIỂU ĐỒ (CHARTS)
        // =========================================================================

        // --- CHART 1: Dòng tiền 6 tháng gần nhất ---
        const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(today, 5 - i));
        
        const chart1Data = last6Months.map(monthDate => {
          // Tìm hóa đơn PAID trong tháng này
          const monthlyInvoices = (invoices || []).filter(inv => {
            if (inv.status !== 'PAID') return false;
            const invDate = new Date(inv.created_at);
            return isSameMonth(invDate, monthDate) && isSameYear(invDate, monthDate);
          });

          // Tính tổng doanh thu tháng đó
          const revenue = monthlyInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
          
          // Lọc các phiếu chi thuộc về tháng hiện tại của vòng lặp
          const monthlyExpenses = (expenses || []).filter(exp => {
            if (!exp.expense_date) return false;
            const expDate = new Date(exp.expense_date);
            return isSameMonth(expDate, monthDate) && isSameYear(expDate, monthDate);
          });
          
          // Tính tổng chi phí thực tế từ Phiếu chi
          const costs = monthlyExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0); 
          
          // Lợi nhuận ròng = Tổng thu - Tổng chi
          const profit = revenue - costs;

          return {
            name: format(monthDate, "MM/yyyy"), 
            thuThue: revenue,
            chiPhi: costs,
            lai: profit
          };
        });
        setCashflowData(chart1Data);

        // --- CHART 2: Tỉ lệ lấp đầy theo tòa nhà (Doughnut) ---
        // Ghép tenants vào rooms, sau đó group theo building_id
        const occupancyByBuilding = (buildings || []).map(b => {
          const bRooms = (rooms || []).filter(r => r.building_id === b.id);
          const roomIds = bRooms.map(r => r.id);
          const bTenants = (tenants || []).filter(t => t.is_active && roomIds.includes(t.room_id));
          return {
            name: b.name || "Tòa nhà",
            value: bTenants.length // Giá trị là số khách đang ở
          };
        }).filter(b => b.value > 0); // Chỉ hiện tòa có người ở

        setBuildingOccupancyData(occupancyByBuilding);

      } catch (error) {
        console.error("Lỗi xử lý dữ liệu Dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
  }, []);

  const formatMoney = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Đang đồng bộ dữ liệu vận hành...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      {/* --- ROW 1: 4 CARDS THỐNG KÊ (GRID 4 CỘT) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Dòng tiền thực tế */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tổng thu tháng</p>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><DollarSign size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{formatMoney(metrics.currentMonthRevenue)}</h3>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">
                <TrendingUp size={12} /> Đã thu
              </span>
              <span className="text-xs font-medium text-gray-400">của tháng hiện tại</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tỉ lệ lấp đầy */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tỉ lệ lấp đầy</p>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Users size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {metrics.activeTenants} <span className="text-xl text-gray-400 font-bold">/ {metrics.totalCapacity}</span>
            </h3>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                {(metrics.totalCapacity > 0 ? (metrics.activeTenants / metrics.totalCapacity) * 100 : 0).toFixed(1)}%
              </span>
              <span className="text-xs font-medium text-gray-400">Dựa trên sức chứa (Người)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Phòng trống hoàn toàn */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Phòng trống</p>
            <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center"><Home size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{metrics.emptyRoomsCount} <span className="text-xl text-gray-400 font-bold">Phòng</span></h3>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md">
                Dư {metrics.remainingSlots > 0 ? metrics.remainingSlots : 0} chỗ
              </span>
              <span className="text-xs font-medium text-gray-400">Có thể ghép thêm khách</span>
            </div>
          </div>
        </div>

        {/* Card 4: Sắp hết hợp đồng */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Sắp hết hạn HĐ</p>
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><AlertCircle size={18} /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{metrics.expiringContracts} <span className="text-xl text-gray-400 font-bold">Hợp đồng</span></h3>
            <div className="flex items-center gap-2 mt-3">
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.expiringContracts > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {metrics.expiringContracts > 0 ? <TrendingDown size={12}/> : <CheckCircle2 size={12}/>} Rủi ro rời đi
              </span>
              <span className="text-xs font-medium text-gray-400">Trong 30 ngày tới</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- ROW 2: BIỂU ĐỒ (GRID 70% - 30%) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI (70%): DÒNG TIỀN AREA CHART */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Biến động Dòng tiền</h3>
              <p className="text-xs font-medium text-gray-500 mt-1">Dữ liệu 6 tháng gần nhất (Doanh thu & Lợi nhuận)</p>
            </div>
            
            {/* Thanh công cụ phụ Chart */}
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-sm rounded-md text-xs font-bold text-gray-700">
                <Building2 size={14}/> Tất cả toà <ChevronDown size={14}/>
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <button className="px-3 py-1.5 bg-white shadow-sm rounded-md text-xs font-bold text-gray-900">6T</button>
              <button className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition">1N</button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition">
                <Calendar size={14}/> Tùy chọn
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div><span className="text-xs font-bold text-gray-600">Doanh thu thu về</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div><span className="text-xs font-bold text-gray-600">Chi phí gốc (30%)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-1 bg-gray-800 rounded-full"></div><span className="text-xs font-bold text-gray-600">Lợi nhuận ròng</span></div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDoanhThu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} tickFormatter={(value) => `${value / 1000000}Tr`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                  formatter={(value: any) => new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}
                />
                <Area type="monotone" name="Doanh thu" dataKey="thuThue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDoanhThu)" />
                <Area type="monotone" name="Chi phí" dataKey="chiPhi" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} fill="none" />
                <Area type="monotone" name="Lợi nhuận" dataKey="lai" stroke="#1f2937" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CỘT PHẢI (30%): TỈ LỆ LẤP ĐẦY THEO TÒA (DOUGHNUT CHART) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Phân bổ khách thuê</h3>
            <p className="text-xs font-medium text-gray-500 mt-1">Lượng khách thực tế tại từng cơ sở</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
            {/* Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-3xl font-black text-gray-800">{metrics.activeTenants}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Tổng khách</span>
            </div>
            
            {buildingOccupancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={buildingOccupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    stroke="none"
                    dataKey="value"
                    cornerRadius={8}
                    paddingAngle={4}
                  >
                    {buildingOccupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: any) => [`${value} Khách`, 'Đang ở']}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm font-bold text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>

          {/* Legend cho Donut Chart */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {buildingOccupancyData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[11px] font-bold text-gray-700">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// Icon ảo thay thế CheckCircle2 do chưa import ở trên
function CheckCircle2(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
}