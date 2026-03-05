import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Package,
  ArrowLeft,
  Plus,
  X,
  Trash2,
  Pencil,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Check,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryCategory {
  id: string;
  name: string;
  is_active: boolean;
}

interface InventoryItem {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  current_quantity: number;
  unit: string;
  min_stock_alert: number | null;
  category_name?: string;
}

interface InventoryMovement {
  id: string;
  item_id: string;
  movement_type: "entry" | "exit";
  quantity: number;
  reason: string | null;
  created_at: string;
}

export function StoreInventory() {
  const { id } = useParams();
  const [storeName, setStoreName] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Item modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    category_id: "",
    current_quantity: "",
    unit: "un",
    min_stock_alert: "",
  });

  // Movement modal
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<InventoryItem | null>(null);
  const [moveForm, setMoveForm] = useState({
    movement_type: "entry" as "entry" | "exit",
    quantity: "",
    reason: "",
  });

  // History modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [storeRes, itemsRes, catsRes] = await Promise.all([
        supabase.from("stores").select("name").eq("id", id).single(),
        supabase
          .from("inventory_items")
          .select("*")
          .eq("store_id", id)
          .order("name"),
        supabase
          .from("inventory_categories")
          .select("*")
          .eq("is_active", true)
          .order("name"),
      ]);
      if (storeRes.data) setStoreName(storeRes.data.name);
      if (catsRes.data) setCategories(catsRes.data);
      if (itemsRes.data && catsRes.data) {
        const catMap = new Map(
          catsRes.data.map((c: InventoryCategory) => [c.id, c.name]),
        );
        setItems(
          itemsRes.data.map((item: InventoryItem) => ({
            ...item,
            category_name: item.category_id
              ? catMap.get(item.category_id) || "—"
              : "Sem categoria",
          })),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCat =
      filterCategory === "all" || item.category_id === filterCategory;
    return matchesSearch && matchesCat;
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

  // Item CRUD
  const openItemModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        category_id: item.category_id || "",
        current_quantity: String(item.current_quantity),
        unit: item.unit,
        min_stock_alert:
          item.min_stock_alert !== null ? String(item.min_stock_alert) : "",
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: "",
        category_id: "",
        current_quantity: "0",
        unit: "un",
        min_stock_alert: "",
      });
    }
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      store_id: id,
      name: itemForm.name,
      category_id: itemForm.category_id || null,
      current_quantity: parseInt(itemForm.current_quantity) || 0,
      unit: itemForm.unit,
      min_stock_alert: itemForm.min_stock_alert
        ? parseFloat(itemForm.min_stock_alert)
        : null,
    };
    if (editingItem) {
      await supabase
        .from("inventory_items")
        .update(payload)
        .eq("id", editingItem.id);
    } else {
      await supabase.from("inventory_items").insert([payload]);
    }
    setItemModalOpen(false);
    fetchData();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (
      !window.confirm(
        "Excluir este item? Todos os movimentos associados também serão perdidos.",
      )
    )
      return;
    await supabase.from("inventory_movements").delete().eq("item_id", itemId);
    await supabase.from("inventory_items").delete().eq("id", itemId);
    fetchData();
  };

  // Movement
  const openMoveModal = (item: InventoryItem, type: "entry" | "exit") => {
    setMoveItem(item);
    setMoveForm({ movement_type: type, quantity: "", reason: "" });
    setMoveModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveItem) return;
    const qty = parseInt(moveForm.quantity) || 0;
    if (qty <= 0) return;

    await supabase.from("inventory_movements").insert([
      {
        item_id: moveItem.id,
        movement_type: moveForm.movement_type,
        quantity: qty,
        reason: moveForm.reason || null,
      },
    ]);

    const newQty =
      moveForm.movement_type === "entry"
        ? Number(moveItem.current_quantity) + qty
        : Math.max(0, Number(moveItem.current_quantity) - qty);
    await supabase
      .from("inventory_items")
      .update({ current_quantity: newQty })
      .eq("id", moveItem.id);

    setMoveModalOpen(false);
    fetchData();
  };

  // History
  const openHistory = async (item: InventoryItem) => {
    setHistoryItem(item);
    const { data } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setMovements(data || []);
    setHistoryModalOpen(true);
  };

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
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground -ml-3"
          >
            <Link to={`/stores/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Package className="w-7 h-7 text-primary" />
              Estoque — {storeName || "Carregando..."}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gerencie itens, entradas e saídas de estoque da unidade.
            </p>
          </div>
          <Button
            onClick={() => openItemModal()}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-blue-700 font-medium uppercase tracking-wide">
              Itens Cadastrados
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
        <Card
          className={`${lowStockItems.length > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}
        >
          <CardContent className="p-4">
            <p
              className={`text-[11px] font-medium uppercase tracking-wide ${lowStockItems.length > 0 ? "text-red-700" : "text-slate-600"}`}
            >
              Estoque Baixo
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
                  <span className="text-red-600 font-bold">
                    {item.current_quantity} {item.unit}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (mín: {item.min_stock_alert})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
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
                  <th className="text-left py-3 px-2">Categoria</th>
                  <th className="text-right py-3 px-2">Qtd. Atual</th>
                  <th className="text-center py-3 px-2">Unidade</th>
                  <th className="text-right py-3 px-2">Mín. Alerta</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-right py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {items.length === 0
                        ? 'Nenhum item cadastrado. Clique em "Novo Item" para começar.'
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
                        className="border-b last:border-0 hover:bg-slate-50 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openHistory(item)}
                            className="font-semibold text-slate-700 hover:text-blue-600 transition-colors text-left"
                          >
                            {item.name}
                          </button>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs text-slate-500">
                            {item.category_name}
                          </span>
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
                        <td className="text-center py-3 px-2">
                          <span className="text-xs text-slate-500">
                            {item.unit}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className="text-xs text-slate-400">
                            {item.min_stock_alert !== null
                              ? item.min_stock_alert
                              : "—"}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
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
                        <td className="text-right py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openMoveModal(item, "entry")}
                              className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-all"
                              title="Entrada"
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openMoveModal(item, "exit")}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Saída"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openItemModal(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ========= ITEM MODAL ========= */}
      {itemModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem ? "Editar Item" : "Novo Item de Estoque"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do Item *</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) =>
                    setItemForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Sabão em Pó 5kg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={itemForm.category_id}
                  onValueChange={(v) =>
                    setItemForm((p) => ({ ...p, category_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Qtd. Inicial</Label>
                  <Input
                    type="number"
                    min="0"
                    value={itemForm.current_quantity}
                    onChange={(e) =>
                      setItemForm((p) => ({
                        ...p,
                        current_quantity: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unidade</Label>
                  <Select
                    value={itemForm.unit}
                    onValueChange={(v) =>
                      setItemForm((p) => ({ ...p, unit: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">un</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="cx">cx</SelectItem>
                      <SelectItem value="pc">pc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mín. Alerta</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="—"
                    value={itemForm.min_stock_alert}
                    onChange={(e) =>
                      setItemForm((p) => ({
                        ...p,
                        min_stock_alert: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingItem ? "Salvar Alterações" : "Criar Item"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========= MOVEMENT MODAL ========= */}
      {moveModalOpen && moveItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {moveForm.movement_type === "entry" ? "Entrada" : "Saída"} —{" "}
                {moveItem.name}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMoveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSaveMovement} className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estoque atual</span>
                  <span className="font-bold text-slate-700">
                    {moveItem.current_quantity} {moveItem.unit}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={moveForm.quantity}
                  onChange={(e) =>
                    setMoveForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Motivo</Label>
                <Input
                  placeholder="Ex: Compra semanal, uso diário..."
                  value={moveForm.reason}
                  onChange={(e) =>
                    setMoveForm((p) => ({ ...p, reason: e.target.value }))
                  }
                />
              </div>
              {moveForm.quantity && (
                <div
                  className={`p-3 rounded-lg border text-sm ${moveForm.movement_type === "entry" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex justify-between">
                    <span
                      className={
                        moveForm.movement_type === "entry"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      Novo estoque
                    </span>
                    <span className="font-bold">
                      {moveForm.movement_type === "entry"
                        ? Number(moveItem.current_quantity) +
                          (parseInt(moveForm.quantity) || 0)
                        : Math.max(
                            0,
                            Number(moveItem.current_quantity) -
                              (parseInt(moveForm.quantity) || 0),
                          )}{" "}
                      {moveItem.unit}
                    </span>
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className={`w-full font-semibold ${moveForm.movement_type === "entry" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {moveForm.movement_type === "entry" ? (
                  <>
                    <ArrowUpCircle className="w-4 h-4 mr-2" /> Registrar Entrada
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-4 h-4 mr-2" /> Registrar Saída
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========= HISTORY MODAL ========= */}
      {historyModalOpen && historyItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Histórico — {historyItem.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Estoque atual:{" "}
                  <span className="font-bold">
                    {historyItem.current_quantity} {historyItem.unit}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {movements.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
                  Nenhuma movimentação registrada para este item.
                </div>
              ) : (
                <div className="space-y-2">
                  {movements.map((m) => (
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
                          <p
                            className={`text-sm font-semibold ${m.movement_type === "entry" ? "text-emerald-700" : "text-red-700"}`}
                          >
                            {m.movement_type === "entry" ? "+" : "-"}
                            {m.quantity} {historyItem.unit}
                          </p>
                          {m.reason && (
                            <p className="text-[10px] text-muted-foreground">
                              {m.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
