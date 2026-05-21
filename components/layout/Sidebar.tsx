"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Users, Wallet, Receipt } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Tổng quan", icon: Home, path: "/" },
    { name: "Sơ đồ phòng", icon: Building2, path: "/buildings" },
    { name: "Khách thuê", icon: Users, path: "/tenants" },
    { name: "Thu chi", icon: Wallet, path: "/expenses" },
    { name: "Hoá đơn", icon: Receipt, path: "/invoice" },
  ];

  return (
    // 'hidden md:flex': Ẩn trên mobile, hiện trên màn hình to
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen transition-all shadow-xl z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Home size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">Hanoi Stay</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 mb-1">Version</p>
          <p className="text-sm font-bold text-emerald-400">1.0</p>
        </div>
      </div>
    </aside>
  );
}