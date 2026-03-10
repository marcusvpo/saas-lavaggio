import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { DateFilter } from "@/components/DateFilter";
import {
  useDateFilter,
  dateRangeToFilter,
  dateRangeLabel,
} from "@/lib/dateFilter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";

interface Store {
  id: string;
  name: string;
}

interface Transfer {
  id: string;
  source_store_id: string;
  destination_store_id: string;
  amount: number;
  transfer_date: string;
  description: string | null;
  category: string | null;
  created_at: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export function Transfers() {
  const { session, role, storeId } = useAuth();

  const [dateRange, setDateRange] = useDateFilter();
  const dateFilter = useMemo(() => dateRangeToFilter(dateRange), [dateRange]);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSource, setFormSource] = useState("");
  const [formDestination, setFormDestination] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Receita");
  const [editingTransferId, setEditingTransferId] = useState<string | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: storesList } = await supabase.from("stores").select("*");
      if (storesList) setStores(storesList);

      const { data: transfersData } = await supabase
        .from("transfers")
        .select("*")
        .gte("transfer_date", dateFilter.start)
        .lte("transfer_date", dateFilter.end)
        .order("transfer_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (transfersData) setTransfers(transfersData);

      // Default the source store based on role
      // Admin defaults to nothing (empty string), Client defaults to their store.
      if (role === "client" && storeId) {
        setFormSource(storeId);
      }
    } catch (err) {
      console.error("Error fetching transfers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter.start, dateFilter.end, role, storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStoreName = (id: string) => {
    return (
      stores.find((s) => s.id === id)?.name || "Loja Excluída/Desconhecida"
    );
  };

  const filteredTransfers = useMemo(() => {
    if (selectedStore === "all") return transfers;
    return transfers.filter(
      (t) =>
        t.source_store_id === selectedStore ||
        t.destination_store_id === selectedStore,
    );
  }, [transfers, selectedStore]);

  const handleOpenModal = () => {
    setEditingTransferId(null);
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDesc("");
    setFormCategory("Receita");
    if (role === "admin") {
      setFormSource("");
    }
    setFormDestination("");
    setIsModalOpen(true);
  };

  const handleEditTransfer = (t: Transfer) => {
    setEditingTransferId(t.id);
    setFormSource(t.source_store_id);
    setFormDestination(t.destination_store_id);
    setFormAmount(
      t.amount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
    setFormDate(t.transfer_date);
    setFormDesc(t.description || "");
    setFormCategory(t.category || "Receita");
    setIsModalOpen(true);
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSource || !formDestination) {
      alert("Selecione a loja de origem e destino.");
      return;
    }

    const numericAmount = parseFloat(
      formAmount.replace(/\./g, "").replace(",", "."),
    );
    if (!numericAmount || numericAmount <= 0) {
      alert("Insira um valor válido maior que 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransferId) {
        const { error } = await supabase
          .from("transfers")
          .update({
            source_store_id: formSource,
            destination_store_id: formDestination,
            amount: numericAmount,
            transfer_date: formDate,
            description: formDesc || null,
            category: formCategory,
          })
          .eq("id", editingTransferId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transfers").insert([
          {
            source_store_id: formSource,
            destination_store_id: formDestination,
            amount: numericAmount,
            transfer_date: formDate,
            description: formDesc || null,
            category: formCategory,
            created_by: session?.user.id,
          },
        ]);
        if (error) throw error;
      }

      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      const error = err as Error;
      console.error("Error saving transfer:", error);
      alert(error.message || "Erro ao salvar transferência.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta transferência?")) return;
    try {
      const { error } = await supabase.from("transfers").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      const error = err as Error;
      console.error(error);
      alert("Erro ao excluir transferência.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Transferências
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {dateRangeLabel(dateRange)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {role === "admin" && (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por loja" />
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
          )}

          <DateFilter value={dateRange} onChange={setDateRange} />
          <Button
            onClick={handleOpenModal}
            className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Transferência
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transferências</CardTitle>
          <CardDescription>
            Abaixo estão os registros de valores transferidos entre unidades que
            não impactam no faturamento ou nas despesas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-sm text-center py-12 text-muted-foreground border-dashed border rounded-lg">
              Nenhuma transferência registrada para este período.
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Header (Desktop only) */}
              <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                <div className="col-span-2">Data</div>
                <div className="col-span-3">Origem</div>
                <div className="col-span-3">Destino</div>
                <div className="col-span-2 text-right">Valor / Tipo</div>
                <div className="col-span-2"></div>
              </div>

              <div className="divide-y divide-border">
                {filteredTransfers.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 md:gap-2 px-4 py-4 md:py-3 border-b last:border-0 border-border bg-slate-50/50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex justify-between items-center md:contents">
                      <div className="md:col-span-2 font-medium text-slate-700 text-sm md:text-xs">
                        {new Date(t.transfer_date).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </div>
                      <div className="md:hidden flex gap-2">
                        {role === "admin" && (
                          <button
                            onClick={() => handleEditTransfer(t)}
                            className="p-3 text-slate-400 hover:text-blue-500 bg-white border border-slate-200 rounded shadow-sm h-10 w-10 flex items-center justify-center"
                            title="Editar"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-3 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded shadow-sm h-10 w-10 flex items-center justify-center"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-2">
                      <span className="md:hidden font-semibold text-xs uppercase text-slate-500">
                        De:
                      </span>
                      {getStoreName(t.source_store_id)}
                    </div>

                    <div className="md:col-span-3 text-sm text-slate-600 flex items-center gap-2">
                      <span className="md:hidden font-semibold text-xs uppercase text-slate-500">
                        Para:
                      </span>
                      {getStoreName(t.destination_store_id)}
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between md:flex-col md:items-end md:justify-center border-t md:border-t-0 pt-2 md:pt-0 mt-1 md:mt-0">
                      <span className="font-bold text-slate-700 text-base md:text-sm">
                        {fmt(t.amount)}
                      </span>
                      {t.category === "Ajuste de Caixa" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 mt-0 md:mt-1">
                          Ajuste de Caixa
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0 md:mt-1 ${
                            t.category === "Aplicação"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {t.category || "Receita"}
                        </span>
                      )}
                    </div>

                    <div className="hidden md:flex md:col-span-2 justify-end gap-2">
                      {role === "admin" && (
                        <button
                          onClick={() => handleEditTransfer(t)}
                          className="p-2 text-slate-400 hover:text-blue-500"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-slate-400 hover:text-red-500"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {t.description && (
                      <div className="md:col-span-12 mt-1 md:mt-0 text-xs text-muted-foreground border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
                        <span className="font-semibold">Obs:</span>{" "}
                        {t.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTransferId
                ? "Editar Transferência"
                : "Nova Transferência"}
            </DialogTitle>
            <DialogDescription>
              Lance a movimentação isolada de caixa entre duas unidades.
            </DialogDescription>
          </DialogHeader>
          <form
            id="transfer-form"
            onSubmit={handleSaveTransfer}
            className="space-y-4 py-4"
          >
            {role === "admin" ? (
              <div className="space-y-2">
                <Label htmlFor="source">Loja Origem (De)</Label>
                <Select
                  value={formSource}
                  onValueChange={setFormSource}
                  required
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Loja Origem</Label>
                <div className="px-3 py-2 bg-slate-100 rounded-md text-sm text-slate-600 border border-slate-200 cursor-not-allowed">
                  {getStoreName(storeId!)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="destination">Loja Destino (Para)</Label>
              <Select
                value={formDestination}
                onValueChange={setFormDestination}
                required
              >
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Tipo de Transferência</Label>
              <Select
                value={formCategory === "Ajuste de Caixa" ? "" : formCategory}
                onValueChange={setFormCategory}
                disabled={formCategory === "Ajuste de Caixa"}
                required={formCategory !== "Ajuste de Caixa"}
              >
                <SelectTrigger id="category">
                  <SelectValue
                    placeholder={
                      formCategory === "Ajuste de Caixa"
                        ? "Opção sobrescrita pelo checkbox..."
                        : "Selecione o tipo"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Aplicação">Aplicação</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="non_payment"
                  checked={formCategory === "Ajuste de Caixa"}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormCategory("Ajuste de Caixa");
                    } else {
                      setFormCategory("Receita");
                    }
                  }}
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                />
                <Label
                  htmlFor="non_payment"
                  className="text-sm font-medium cursor-pointer text-slate-700"
                >
                  Ajuste de Caixa (Retirada sem pagamento)
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  placeholder="0,00"
                  required
                  value={formAmount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d.,]/g, "");
                    setFormAmount(v);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data da Transf.</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Observações (opcional)</Label>
              <Input
                id="desc"
                placeholder="Exibilidade, justificativa, etc."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" form="transfer-form" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
