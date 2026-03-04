import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full">
          <div className="mx-auto max-w-7xl h-full pt-12 md:pt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
