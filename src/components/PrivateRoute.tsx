import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function PrivateRoute() {
  const { user, role, storeId, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Restrict routes for inventory_only role
  if (role === "inventory_only") {
    const isInventoryPage = location.pathname === "/inventory";
    const isStoreInventoryPage = location.pathname.match(
      /^\/stores\/.*\/inventory$/,
    );

    // For store inventory page, make sure they only access their assigned store
    if (isStoreInventoryPage) {
      const pathStoreId = location.pathname.split("/")[2];
      if (pathStoreId !== storeId) {
        return <Navigate to={`/stores/${storeId}/inventory`} replace />;
      }
    } else if (!isInventoryPage) {
      // Anything else, redirect to their store inventory
      return <Navigate to={`/stores/${storeId}/inventory`} replace />;
    }
  }

  return <Outlet />;
}
