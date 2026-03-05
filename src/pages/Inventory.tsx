import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Package,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Store,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StoreInfo {
  id: string;
  name: string;
}

interface CategoryInfo {
  id: string;
  name: string;
}

interface InventoryItemRow {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  current_quantity: number;
  unit: string;
  min_stock_alert: number | null;
  store_name: string;
  category_name: string;
}

interface RecentMovement {
  id: string;
  item_id: string;
  movement_type: "entry" | "exit";
  quantity: number;
  reason: string | null;
  created_at: string;
  item_name: string;
  store_name: string;
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStore, setFilterStore] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storesRes, catsRes, itemsRes, movementsRes] = await Promise.all([
        supabase.from("stores").select("id, name").order("name"),
        supabase
          .from("inventory_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase.from("inventory_items").select("*").order("name"),
        supabase
          .from("inventory_movements")
          .select("*, inventory_items!inner(name, store_id)")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const storesList: StoreInfo[] = storesRes.data || [];
      const catsList: CategoryInfo[] = catsRes.data || [];
      setStores(storesList);
      setCategories(catsList);

      const storeMap = new Map(storesList.map((s) => [s.id, s.name]));
      const catMap = new Map(catsList.map((c) => [c.id, c.name]));

      if (itemsRes.data) {
        setItems(
          itemsRes.data.map(
            (item: {
              id: string;
              store_id: string;
              category_id: string | null;
              name: string;
              current_quantity: number;
              unit: string;
              min_stock_alert: number | null;
            }) => ({
              ...item,
              store_name: storeMap.get(item.store_id) || "—",
              category_name: item.category_id
                ? catMap.get(item.category_id) || "Sem categoria"
                : "Sem categoria",
            }),
          ),
        );
      }

      if (movementsRes.data) {
        setRecentMovements(
          movementsRes.data.map(
            (m: {
              id: string;
              item_id: string;
              movement_type: "entry" | "exit";
              quantity: number;
              reason: string | null;
              created_at: string;
              inventory_items: { name: string; store_id: string };
            }) => ({
              id: m.id,
              item_id: m.item_id,
              movement_type: m.movement_type,
              quantity: m.quantity,
              reason: m.reason,
              created_at: m.created_at,
              item_name: m.inventory_items?.name || "—",
              store_name: storeMap.get(m.inventory_items?.store_id) || "—",
            }),
          ),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStore = filterStore === "all" || item.store_id === filterStore;
    const matchesCat =
      filterCategory === "all" || item.category_id === filterCategory;
    return matchesSearch && matchesStore && matchesCat;
  });

  // Stats
  const totalItems = items.length;
  const totalStock = items.reduce(
    (acc, i) => acc + Number(i.current_quantity),
    0,
  );
  const lowStockItems = items.filter(
    (i) =>
      i.min_stock_alert !== null &&
      Number(i.current_quantity) <= Number(i.min_stock_alert),
  );
  const storesWithItems = new Set(items.map((i) => i.store_id)).size;

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          Gestão de Estoque
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visão consolidada de estoque de toda a rede Lavaggio.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-blue-700 font-medium uppercase tracking-wide">
              Total Itens
            </p>
            <p className="text-2xl font-bold text-blue-700">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-emerald-700 font-medium uppercase tracking-wide">
              Total em Estoque
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {totalStock.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-purple-700 font-medium uppercase tracking-wide">
              Lojas com Estoque
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {storesWithItems}
            </p>
          </CardContent>
        </Card>
        <Card
          className={`${lowStockItems.length > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}
        >
          <CardContent className="p-4">
            <p
              className={`text-[11px] font-medium uppercase tracking-wide ${lowStockItems.length > 0 ? "text-red-700" : "text-slate-600"}`}
            >
              Alertas
            </p>
            <p
              className={`text-2xl font-bold ${lowStockItems.length > 0 ? "text-red-600" : "text-slate-500"}`}
            >
              {lowStockItems.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-red-200 text-sm"
                >
                  <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                  <span className="font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({item.store_name})
                  </span>
                  <span className="text-red-600 font-bold">
                    {item.current_quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main layout: Store cards + Table */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Quick store links */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider px-1">
            Estoque por Unidade
          </h2>
          {stores.filter((s) => items.some((i) => i.store_id === s.id))
            .length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
              Nenhuma loja possui itens cadastrados.
            </div>
          )}
          {stores.map((store) => {
            const storeItems = items.filter((i) => i.store_id === store.id);
            if (storeItems.length === 0) return null;
            const storeTotal = storeItems.reduce(
              (a, i) => a + Number(i.current_quantity),
              0,
            );
            const storeLow = storeItems.filter(
              (i) =>
                i.min_stock_alert !== null &&
                Number(i.current_quantity) <= Number(i.min_stock_alert),
            );
            return (
              <Link
                key={store.id}
                to={`/stores/${store.id}/inventory`}
                className="block"
              >
                <Card className="hover:shadow-md transition-all hover:scale-[1.01] border-slate-200 hover:border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700">
                          {store.name}
                        </span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{storeItems.length} itens</span>
                      <span>{storeTotal.toLocaleString("pt-BR")} un</span>
                      {storeLow.length > 0 && (
                        <span className="text-red-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />{" "}
                          {storeLow.length} baixo
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {/* Show stores without inventory */}
          {stores
            .filter((s) => !items.some((i) => i.store_id === s.id))
            .map((store) => (
              <Link
                key={store.id}
                to={`/stores/${store.id}/inventory`}
                className="block"
              >
                <Card className="hover:shadow-md transition-all border-dashed border-slate-200 opacity-60 hover:opacity-100">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-500">
                          {store.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Sem itens
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>

        {/* Table + Movements */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search & Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas as lojas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Lojas</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b bg-slate-50">
                      <th className="text-left py-3 px-4">Item</th>
                      <th className="text-left py-3 px-2">Loja</th>
                      <th className="text-left py-3 px-2">Categoria</th>
                      <th className="text-right py-3 px-2">Qtd.</th>
                      <th className="text-center py-3 px-2">Un.</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-12 text-muted-foreground"
                        >
                          {items.length === 0
                            ? "Nenhum item de estoque cadastrado na rede. Acesse o estoque de uma loja para começar."
                            : "Nenhum item encontrado com os filtros atuais."}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isLow =
                          item.min_stock_alert !== null &&
                          Number(item.current_quantity) <=
                            Number(item.min_stock_alert);
                        return (
                          <tr
                            key={item.id}
                            className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {item.name}
                            </td>
                            <td className="py-3 px-2">
                              <Link
                                to={`/stores/${item.store_id}/inventory`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {item.store_name}
                              </Link>
                            </td>
                            <td className="py-3 px-2 text-xs text-slate-500">
                              {item.category_name}
                            </td>
                            <td className="text-right py-3 px-2">
                              <span
                                className={`font-bold ${isLow ? "text-red-600" : "text-slate-700"}`}
                              >
                                {Number(item.current_quantity).toLocaleString(
                                  "pt-BR",
                                )}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2 text-xs text-slate-500">
                              {item.unit}
                            </td>
                            <td className="text-center py-3 px-4">
                              {isLow ? (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">
                                  Baixo
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                  OK
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                Movimentações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMovements.length === 0 ? (
                <div className="text-sm text-center py-6 text-muted-foreground border-dashed border rounded-lg">
                  Nenhuma movimentação registrada.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMovements.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        m.movement_type === "entry"
                          ? "border-emerald-100 bg-emerald-50/50"
                          : "border-red-100 bg-red-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {m.movement_type === "entry" ? (
                          <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {m.item_name}
                            <span className="text-[10px] text-slate-400 ml-2">
                              ({m.store_name})
                            </span>
                          </p>
                          {m.reason && (
                            <p className="text-[10px] text-muted-foreground">
                              {m.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${m.movement_type === "entry" ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {m.movement_type === "entry" ? "+" : "-"}
                          {m.quantity}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(m.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
