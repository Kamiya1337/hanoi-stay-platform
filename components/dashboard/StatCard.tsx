import { ReactNode } from "react";

// Định nghĩa các "biến" mà thẻ này sẽ nhận vào
interface StatCardProps {
  title: string;
  value: string | number;
  subText: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({ title, value, subText, icon, trend }: StatCardProps) {
  // Đổi màu chữ theo xu hướng (trend)
  const trendColor = 
    trend === "up" ? "text-emerald-600 bg-emerald-100" : 
    trend === "down" ? "text-red-600 bg-red-100" : 
    "text-slate-600 bg-slate-100";

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 font-medium">{title}</h3>
        <div className="p-2 rounded-full bg-slate-50 text-slate-500">
          {icon}
        </div>
      </div>
      
      <div>
        <p className="text-3xl font-bold text-slate-800 mb-2">{value}</p>
        <div className="flex items-center gap-2 text-sm">
          {trend && (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${trendColor}`}>
              {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
            </span>
          )}
          <span className="text-slate-500">{subText}</span>
        </div>
      </div>
    </div>
  );
}