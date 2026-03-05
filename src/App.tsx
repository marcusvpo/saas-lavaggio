import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Stores } from "@/pages/Stores";
import { Calendar } from "@/pages/Calendar";
import { StoreDetail } from "@/pages/StoreDetail";
import { Sofn } from "@/pages/Sofn";
import { Settings } from "@/pages/Settings";
import { Inventory } from "@/pages/Inventory";
import { StoreInventory } from "@/pages/StoreInventory";
import { StoreComparator } from "@/pages/StoreComparator";
import { Transfers } from "@/pages/Transfers";

import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { Login } from "@/pages/Login";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="stores" element={<Stores />} />
              <Route path="stores/:id" element={<StoreDetail />} />
              <Route path="stores/:id/inventory" element={<StoreInventory />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="comparator" element={<StoreComparator />} />
              <Route path="transfers" element={<Transfers />} />
              <Route path="sofn" element={<Sofn />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
