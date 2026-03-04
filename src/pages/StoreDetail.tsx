import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { DateFilter } from "@/components/DateFilter";
import {
  useDateFilter,
  dateRangeToFilter,
  dateRangeLabel,
} from "@/lib/dateFilter";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Trash2,
  AlertCircle,
  Calendar,
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

interface Store {
  id: string;
  name: string;
  type: string;
}

interface Revenue {
  id: string;
  store_id: string;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  pieces_count: number;
  date: string;
}

interface Expense {
  id: string;
  store_id: string;
  category: string;
  amount: number;
  due_date: string;
  status: "paid" | "pending" | "late";
  observations?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export function StoreDetail() {
  const { id } = useParams();
  const { session } = useAuth();

  const [store, setStore] = useState<Store | null>(null);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marginTarget, setMarginTarget] = useState<number>(20);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<"receita" | "despesa">("receita");

  // Revenue fields
  const [revDate, setRevDate] = useState("");
  const [revTotalAmount, setRevTotalAmount] = useState("");
  const [revPieces, setRevPieces] = useState("");

  // Expense fields
  const [expDate, setExpDate] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expStatus, setExpStatus] = useState("pending");
  const [expObs, setExpObs] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [dateRange, setDateRange] = useDateFilter();
  const dateFilter = useMemo(() => dateRangeToFilter(dateRange), [dateRange]);

  const fetchStoreData = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("id", id)
        .single();
      if (storeData) setStore(storeData);

      const { data: revData } = await supabase
        .from("revenues")
        .select("*")
        .eq("store_id", id)
        .gte("date", dateFilter.start)
        .lte("date", dateFilter.end)
        .order("date", { ascending: false });
      if (revData) setRevenues(revData);

      const { data: expData } = await supabase
        .from("expenses")
        .select("*")
        .eq("store_id", id)
        .gte("due_date", dateFilter.start)
        .lte("due_date", dateFilter.end)
        .order("due_date", { ascending: false });
      if (expData) setExpenses(expData);

      // Fetch margin target: store-specific goal first, then platform default
      const { data: goalData } = await supabase
        .from("goals")
        .select("value")
        .eq("type", "margin_target")
        .eq("store_id", id)
        .limit(1)
        .maybeSingle();
      if (goalData) {
        setMarginTarget(Number(goalData.value));
      } else {
        // Fallback to global default
        const { data: settingData } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "default_margin_target")
          .maybeSingle();
        if (settingData) setMarginTarget(Number(settingData.value));
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, dateFilter.start, dateFilter.end]);

  useEffect(() => {
    if (id) fetchStoreData();
  }, [id, session, fetchStoreData]);

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      if (entryType === "receita") {
        const totalAmount = parseFloat(revTotalAmount);

        const { error } = await supabase.from("revenues").insert([
          {
            store_id: id,
            date: revDate,
            total_amount: totalAmount,
            paid_amount: totalAmount,
            unpaid_amount: 0,
            pieces_count: revPieces ? parseInt(revPieces) : 0,
          },
        ]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert([
          {
            store_id: id,
            due_date: expDate,
            amount: parseFloat(expAmount),
            category: expCategory,
            status: expStatus,
            observations: expObs,
          },
        ]);
        if (error) throw error;
      }
      setSubmitMessage({
        type: "success",
        text: `${entryType === "receita" ? "Receita" : "Despesa"} registrada com sucesso!`,
      });
      // Reset
      setRevDate("");
      setRevTotalAmount("");
      setRevPieces("");
      setExpDate("");
      setExpAmount("");
      setExpCategory("");
      setExpStatus("pending");
      setExpObs("");
      fetchStoreData();
      setTimeout(() => setModalOpen(false), 1200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitMessage({ type: "error", text: err.message });
      } else {
        setSubmitMessage({
          type: "error",
          text: "Erro ao registrar lançamento",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRevenue = async (revId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta receita?")) return;
    try {
      const { error } = await supabase
        .from("revenues")
        .delete()
        .eq("id", revId);
      if (error) throw error;
      fetchStoreData();
    } catch (err) {
      console.error("Erro ao excluir receita:", err);
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expId);
      if (error) throw error;
      fetchStoreData();
    } catch (err) {
      console.error("Erro ao excluir despesa:", err);
    }
  };

  // Computed values
  const totalRecebido = revenues.reduce(
    (acc, r) => acc + Number(r.paid_amount),
    0,
  );
  const totalFaturamento = revenues.reduce(
    (acc, r) => acc + Number(r.total_amount),
    0,
  );
  const totalNaoPago = revenues.reduce(
    (acc, r) => acc + Number(r.unpaid_amount),
    0,
  );
  const totalPecas = revenues.reduce(
    (acc, r) => acc + Number(r.pieces_count),
    0,
  );
  const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const opProfit = totalRecebido - totalExp;
  const margin = totalRecebido > 0 ? (opProfit / totalRecebido) * 100 : 0;

  // Compute Não Pago Acumulado for each revenue row (running sum from oldest to newest)
  const revenuesWithAccum = (() => {
    const sorted = [...revenues].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let accum = 0;
    const map = new Map<string, number>();
    for (const r of sorted) {
      accum += Number(r.unpaid_amount);
      map.set(r.id, accum);
    }
    return map;
  })();

  // Upcoming expenses
  const today = new Date();
  const upcoming = expenses
    .filter((e) => e.status !== "paid" && new Date(e.due_date) >= today)
    .sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    )
    .slice(0, 3);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground -ml-3"
            >
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {store?.name || "Loja Desconhecida"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateRangeLabel(dateRange)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateFilter value={dateRange} onChange={setDateRange} />
          <Button
            onClick={() => {
              setModalOpen(true);
              setSubmitMessage(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* KPI Indicators */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-blue-700 font-medium uppercase tracking-wide">
              Faturamento
            </p>
            <p className="text-lg md:text-xl font-bold text-blue-700">
              {fmt(totalFaturamento)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-emerald-700 font-medium uppercase tracking-wide">
              Recebido
            </p>
            <p className="text-lg md:text-xl font-bold text-emerald-600">
              {fmt(totalRecebido)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-amber-700 font-medium uppercase tracking-wide">
              Não Pago Acum.
            </p>
            <p className="text-lg md:text-xl font-bold text-amber-600">
              {fmt(totalNaoPago)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-red-700 font-medium uppercase tracking-wide">
              Despesas
            </p>
            <p className="text-lg md:text-xl font-bold text-red-600">
              {fmt(totalExp)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <p className="text-[11px] text-slate-600 font-medium uppercase tracking-wide">
              Peças Total
            </p>
            <p className="text-lg md:text-xl font-bold text-slate-700">
              {totalPecas.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit row */}
      <div className="grid gap-3 grid-cols-2">
        <Card
          className={`${opProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Lucro Operacional
              </p>
              <p
                className={`text-xl md:text-2xl font-bold ${opProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {fmt(opProfit)}
              </p>
            </div>
            {opProfit >= 0 ? (
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Margem
              </p>
              <p
                className={`text-xl md:text-2xl font-bold ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {margin.toFixed(1)}%
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Meta: {marginTarget}%
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Dues */}
      {upcoming.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-3">
              {upcoming.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200 text-sm"
                >
                  <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="font-medium text-slate-700">
                    {exp.category}
                  </span>
                  <span className="text-red-600 font-bold">
                    {fmt(exp.amount)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(exp.due_date).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Revenue Table & DRE Split */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Receitas (Left - Green) with Daily Detail */}
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="pb-2 bg-emerald-50 rounded-t-lg">
            <CardTitle className="text-base text-emerald-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Controle Diário — Receitas
            </CardTitle>
            <p className="text-2xl font-bold text-emerald-600">
              {fmt(totalFaturamento)}
            </p>
          </CardHeader>
          <CardContent className="pt-3 max-h-[500px] overflow-y-auto">
            {revenues.length === 0 ? (
              <div className="text-sm text-center py-8 text-muted-foreground border-dashed border rounded-lg">
                Nenhuma receita registrada.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider border-b border-emerald-200">
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2 text-right">Fatur.</div>
                  <div className="col-span-2 text-right">Receb.</div>
                  <div className="col-span-2 text-right">N.Pago</div>
                  <div className="col-span-2 text-right">Acum.</div>
                  <div className="col-span-1 text-right">Pçs</div>
                  <div className="col-span-1"></div>
                </div>
                {revenues.map((rev) => (
                  <div
                    key={rev.id}
                    className="grid grid-cols-12 gap-1 items-center px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-lg group hover:bg-emerald-50 transition-colors text-sm"
                  >
                    <div className="col-span-2 text-xs text-slate-600 font-medium">
                      {new Date(rev.date).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                    <div className="col-span-2 text-right font-semibold text-emerald-700 text-xs">
                      {fmt(Number(rev.total_amount))}
                    </div>
                    <div className="col-span-2 text-right text-xs text-emerald-600">
                      {fmt(Number(rev.paid_amount))}
                    </div>
                    <div className="col-span-2 text-right text-xs text-amber-600 font-medium">
                      {Number(rev.unpaid_amount) > 0
                        ? fmt(Number(rev.unpaid_amount))
                        : "—"}
                    </div>
                    <div className="col-span-2 text-right text-xs text-amber-700 font-bold">
                      {fmt(revenuesWithAccum.get(rev.id) || 0)}
                    </div>
                    <div className="col-span-1 text-right text-xs text-slate-500">
                      {rev.pieces_count}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => handleDeleteRevenue(rev.id)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Despesas (Right - Red) */}
        <Card className="border-red-200 shadow-sm">
          <CardHeader className="pb-2 bg-red-50 rounded-t-lg">
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Despesas
            </CardTitle>
            <p className="text-2xl font-bold text-red-600">{fmt(totalExp)}</p>
          </CardHeader>
          <CardContent className="pt-3 max-h-[500px] overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="text-sm text-center py-8 text-muted-foreground border-dashed border rounded-lg">
                Nenhuma despesa registrada.
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className={`flex items-center justify-between p-3 border rounded-lg group hover:bg-red-50/50 transition-colors ${
                      exp.status === "late"
                        ? "border-red-300 bg-red-50/50"
                        : exp.status === "pending"
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-red-100 bg-red-50/20"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-700">
                        {exp.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {new Date(exp.due_date).toLocaleDateString("pt-BR", {
                            timeZone: "UTC",
                          })}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            exp.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : exp.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {exp.status === "paid"
                            ? "Pago"
                            : exp.status === "pending"
                              ? "Pendente"
                              : "Atrasado"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">
                        - {fmt(exp.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Adicionar Informação Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-slate-800">
                Adicionar Informação
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmitEntry} className="p-5 space-y-4">
              {submitMessage && (
                <div
                  className={`p-3 text-sm rounded-lg ${
                    submitMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              {/* Type Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEntryType("receita")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    entryType === "receita"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType("despesa")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    entryType === "despesa"
                      ? "bg-red-600 text-white"
                      : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Despesa
                </button>
              </div>

              {entryType === "receita" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data *</Label>
                    <Input
                      type="date"
                      value={revDate}
                      onChange={(e) => setRevDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Faturamento Dia (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={revTotalAmount}
                      onChange={(e) => setRevTotalAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">N° de Peças</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={revPieces}
                      onChange={(e) => setRevPieces(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Categoria *</Label>
                      <Input
                        placeholder="Ex: Conta de luz"
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Valor (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Vencimento *</Label>
                      <Input
                        type="date"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status *</Label>
                      <Select value={expStatus} onValueChange={setExpStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="late">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Observações</Label>
                    <Input
                      placeholder="Opcional"
                      value={expObs}
                      onChange={(e) => setExpObs(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-semibold ${
                  entryType === "receita"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white`}
              >
                {isSubmitting
                  ? "Registrando..."
                  : `Registrar ${entryType === "receita" ? "Receita" : "Despesa"}`}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
