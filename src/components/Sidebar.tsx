import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  CalendarDays,
  Factory,
  Package,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import logoBrancoPng from "@/assets/logo-lavaggio-branco.png";
import logomarcaPng from "@/assets/logomarca.png";

interface SidebarStore {
  id: string;
  name: string;
  type: string;
}

export function Sidebar() {
  const { user, role, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stores, setStores] = useState<SidebarStore[]>([]);
  const [storesOpen, setStoresOpen] = useState(true);

  useEffect(() => {
    async function fetchStores() {
      const { data } = await supabase
        .from("stores")
        .select("id, name, type")
        .neq("type", "sofn")
        .order("name");
      if (data) setStores(data);
    }
    fetchStores();
  }, []);

  const mainMenus = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      name: "SOFN (Central)",
      path: "/sofn",
      icon: <Factory className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Calendário",
      path: "/calendar",
      icon: <CalendarDays className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Comparador",
      path: "/comparator",
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Estoque",
      path: "/inventory",
      icon: <Package className="w-5 h-5 shrink-0" />,
    },
    {
      name: "Configurações",
      path: "/settings",
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-white/20 text-white font-medium shadow-sm"
        : "text-blue-200/70 hover:bg-white/10 hover:text-white"
    }`;

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div
        className={`flex items-center shrink-0 border-b border-white/10 ${collapsed ? "justify-center px-2 h-20" : "px-5 h-20"}`}
      >
        {collapsed ? (
          <img
            src={logomarcaPng}
            alt="Lavaggio"
            className="w-10 h-10 object-contain"
          />
        ) : (
          <img
            src={logoBrancoPng}
            alt="Lavaggio Lavanderias"
            className="h-12 object-contain"
          />
        )}
      </div>

      {/* Toggle button (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center w-full py-2 text-blue-300/50 hover:text-white hover:bg-white/10 transition-colors border-b border-white/10"
        title={collapsed ? "Expandir" : "Recolher"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {mainMenus.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => linkClass(isActive)}
            onClick={() => setMobileOpen(false)}
          >
            {item.icon}
            {!collapsed && (
              <span className="text-sm truncate">{item.name}</span>
            )}
          </NavLink>
        ))}

        {/* Stores separator */}
        <div className="pt-4 pb-1">
          {!collapsed && (
            <button
              onClick={() => setStoresOpen(!storesOpen)}
              className="flex items-center justify-between w-full px-3 text-[11px] uppercase tracking-widest font-bold text-blue-300/50 hover:text-blue-100 transition-colors"
            >
              <span>Unidades</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${storesOpen ? "rotate-90" : ""}`}
              />
            </button>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <Store className="w-4 h-4 text-blue-300/50" />
            </div>
          )}
        </div>

        {/* Store Links */}
        {(storesOpen || collapsed) &&
          stores.map((store) => (
            <NavLink
              key={store.id}
              to={`/stores/${store.id}`}
              className={({ isActive }) => linkClass(isActive)}
              onClick={() => setMobileOpen(false)}
              title={store.name}
            >
              <div className="w-5 h-5 shrink-0 rounded bg-white/15 flex items-center justify-center text-[10px] font-bold text-white/80">
                {store.name.charAt(0)}
              </div>
              {!collapsed && (
                <span className="text-sm truncate">{store.name}</span>
              )}
            </NavLink>
          ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/10 mt-auto shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-medium text-white truncate capitalize">
                {role === "admin" ? "Administrador" : "Usuário"}
              </p>
              <p
                className="text-[11px] text-blue-200/60 truncate"
                title={user?.email || ""}
              >
                {user?.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className={`flex items-center gap-3 w-full rounded-lg text-blue-200/60 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-medium ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"}`}
          title="Sair"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#3538A0] text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#3538A0] flex flex-col md:hidden transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-blue-200/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#3538A0] h-screen sticky top-0 transition-all duration-300 shrink-0 ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
