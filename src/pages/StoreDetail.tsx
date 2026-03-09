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
  Edit2,
  AlertCircle,
  Calendar,
  Package,
  CreditCard,
  Wallet,
  Target,
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
  observations?: string;
  nao_pago_acumulado: number;
  revenue_category_id?: string;
  payment_method_id?: string;
  net_amount?: number;
  expected_receipt_date?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  fee_percentage: number;
  installments: number;
  is_active: boolean;
}

interface PaymentDelayRule {
  id: string;
  payment_method_id: string;
  delay_days: number | null;
}

interface Goal {
  id: string;
  store_id: string | null;
  type: string;
  value: number;
  month: number | null;
  year: number | null;
}

interface Expense {
  id: string;
  store_id: string;
  category: string;
  amount: number;
  due_date: string;
  status: "paid" | "pending" | "late";
  observations?: string;
  interest_amount?: number;
  payment_date?: string;
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
  const [latestNaoPagoAcum, setLatestNaoPagoAcum] = useState(0);
  const [marginTarget, setMarginTarget] = useState<number>(20);
  const [expCategories, setExpCategories] = useState<
    { id: string; name: string; type: string }[]
  >([]);
  const [revCategories, setRevCategories] = useState<
    { id: string; name: string; type: string }[]
  >([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<"receita" | "despesa">("receita");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Revenue fields
  const [revDate, setRevDate] = useState("");
  const [revPaidAmount, setRevPaidAmount] = useState("");
  const [revUnpaidAmount, setRevUnpaidAmount] = useState("");
  const [revNaoPagoAcumulado, setRevNaoPagoAcumulado] = useState("");
  const [revPieces, setRevPieces] = useState("");
  const [revObs, setRevObs] = useState("");
  const [revCategoryId, setRevCategoryId] = useState<string | undefined>(
    undefined,
  );
  const [revPaymentMethodId, setRevPaymentMethodId] = useState<
    string | undefined
  >(undefined);

  // Expense fields
  const [expDate, setExpDate] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState<string | undefined>(undefined);
  const [expStatus, setExpStatus] = useState("pending");
  const [expObs, setExpObs] = useState("");
  const [expInterest, setExpInterest] = useState("");
  const [expPaymentDate, setExpPaymentDate] = useState("");

  // Payment methods & delay rules
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [delayRules, setDelayRules] = useState<PaymentDelayRule[]>([]);

  // Goals
  const [storeGoals, setStoreGoals] = useState<Goal[]>([]);

  // Projection mode
  const [projectionMode, setProjectionMode] = useState<
    "normal" | "antecipacao"
  >("normal");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [dateRange, setDateRange] = useDateFilter();
  const dateFilter = useMemo(() => dateRangeToFilter(dateRange), [dateRange]);

  // Fetch expense & revenue categories + payment methods on mount
  useEffect(() => {
    async function loadCategories() {
      const [expRes, revRes, pmRes, drRes] = await Promise.all([
        supabase
          .from("expense_categories")
          .select("id, name, type")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("revenue_categories")
          .select("id, name, type")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .order("installments"),
        supabase
          .from("payment_delay_rules")
          .select("id, payment_method_id, delay_days"),
      ]);
      if (expRes.data) setExpCategories(expRes.data);
      if (revRes.data) setRevCategories(revRes.data);
      if (pmRes.data) setPaymentMethods(pmRes.data);
      if (drRes.data) setDelayRules(drRes.data);
    }
    loadCategories();
  }, []);

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

      // Fetch latest nao_pago_acumulado (no date filter - always most recent)
      const { data: latestAccumData } = await supabase
        .from("revenues")
        .select("nao_pago_acumulado")
        .eq("store_id", id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestAccumData) {
        setLatestNaoPagoAcum(Number(latestAccumData.nao_pago_acumulado));
      } else {
        setLatestNaoPagoAcum(0);
      }

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

      // Fetch all goals for this store (and global)
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .or(`store_id.eq.${id},store_id.is.null`)
        .or(`month.eq.${currentMonth},month.is.null`)
        .or(`year.eq.${currentYear},year.is.null`);
      if (goalsData) setStoreGoals(goalsData);
    } catch (error) {
      console.error("Error fetching store data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, dateFilter.start, dateFilter.end]);

  useEffect(() => {
    if (id) fetchStoreData();
  }, [id, session, fetchStoreData]);

  // Computed faturamento dia (indicator)
  const computedFaturamentoDia =
    (parseFloat(revPaidAmount) || 0) + (parseFloat(revUnpaidAmount) || 0);

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      if (entryType === "receita") {
        const paidAmount = parseFloat(revPaidAmount) || 0;
        const unpaidAmount = parseFloat(revUnpaidAmount) || 0;
        const totalAmount = paidAmount + unpaidAmount;
        const acumuladoInput = parseFloat(revNaoPagoAcumulado) || 0;
        const acumuladoFinal = acumuladoInput - unpaidAmount;

        // Calculate net amount and expected receipt date based on payment method
        let netAmount = paidAmount;
        let expectedReceiptDate: string | null = null;
        if (revPaymentMethodId) {
          const pm = paymentMethods.find((p) => p.id === revPaymentMethodId);
          if (pm) {
            netAmount = paidAmount * (1 - pm.fee_percentage / 100);
          }
          const rule = delayRules.find(
            (r) => r.payment_method_id === revPaymentMethodId,
          );
          if (rule && rule.delay_days !== null && revDate) {
            const d = new Date(revDate + "T12:00:00");
            d.setDate(d.getDate() + rule.delay_days);
            expectedReceiptDate = d.toISOString().split("T")[0];
          }
        }

        const insertData: Record<string, unknown> = {
          store_id: id,
          date: revDate,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          unpaid_amount: unpaidAmount,
          nao_pago_acumulado: acumuladoFinal < 0 ? 0 : acumuladoFinal,
          pieces_count: revPieces ? parseInt(revPieces) : 0,
          observations: revObs || null,
          payment_method_id: revPaymentMethodId || null,
          net_amount: netAmount,
          expected_receipt_date: expectedReceiptDate,
        };
        if (revCategoryId && revCategoryId !== "") {
          insertData.revenue_category_id = revCategoryId;
        }

        if (editingEntryId) {
          const { error } = await supabase
            .from("revenues")
            .update(insertData)
            .eq("id", editingEntryId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("revenues")
            .insert([insertData]);
          if (error) throw error;
        }
      } else {
        const expData = {
          store_id: id,
          due_date: expDate,
          amount: parseFloat(expAmount),
          category: expCategory || "",
          status: expStatus,
          observations: expObs,
          interest_amount: parseFloat(expInterest) || 0,
          payment_date: expPaymentDate || null,
        };

        if (editingEntryId) {
          const { error } = await supabase
            .from("expenses")
            .update(expData)
            .eq("id", editingEntryId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("expenses").insert([expData]);
          if (error) throw error;
        }
      }
      setSubmitMessage({
        type: "success",
        text: `${entryType === "receita" ? "Entrada" : "Despesa"} ${editingEntryId ? "atualizada" : "registrada"} com sucesso!`,
      });
      // Reset
      setRevDate("");
      setRevPaidAmount("");
      setRevUnpaidAmount("");
      setRevNaoPagoAcumulado("");
      setRevPieces("");
      setRevObs("");
      setRevCategoryId(undefined);
      setRevPaymentMethodId(undefined);
      setExpDate("");
      setExpAmount("");
      setExpCategory(undefined);
      setExpStatus("pending");
      setExpObs("");
      setExpInterest("");
      setExpPaymentDate("");
      setEditingEntryId(null);
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

  const handleEditRevenue = (rev: Revenue) => {
    setEditingEntryId(rev.id);
    setEntryType("receita");
    setRevDate(rev.date);
    setRevPaidAmount(String(rev.paid_amount));
    setRevUnpaidAmount(String(rev.unpaid_amount));
    setRevNaoPagoAcumulado(String(rev.nao_pago_acumulado));
    setRevPieces(String(rev.pieces_count));
    setRevObs(rev.observations || "");
    setRevCategoryId(rev.revenue_category_id || undefined);
    setRevPaymentMethodId(rev.payment_method_id || undefined);
    setSubmitMessage(null);
    setModalOpen(true);
  };

  const handleEditExpense = (exp: Expense) => {
    setEditingEntryId(exp.id);
    setEntryType("despesa");
    setExpDate(exp.due_date);
    setExpAmount(String(exp.amount));
    setExpCategory(exp.category);
    setExpStatus(exp.status);
    setExpObs(exp.observations || "");
    setExpInterest(String(exp.interest_amount || 0));
    setExpPaymentDate(exp.payment_date || "");
    setSubmitMessage(null);
    setModalOpen(true);
  };

  const handleDeleteRevenue = async (revId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta entrada?")) return;
    try {
      const { error } = await supabase
        .from("revenues")
        .delete()
        .eq("id", revId);
      if (error) throw error;
      fetchStoreData();
    } catch (err) {
      console.error("Erro ao excluir entrada:", err);
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
  const totalPecas = revenues.reduce(
    (acc, r) => acc + Number(r.pieces_count),
    0,
  );
  const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const totalInterest = expenses.reduce(
    (acc, e) => acc + Number(e.interest_amount || 0),
    0,
  );
  const opProfit = totalRecebido - totalExp;
  const margin = totalRecebido > 0 ? (opProfit / totalRecebido) * 100 : 0;

  // Projection: group revenues by expected_receipt_date for next 7 days
  const projectionData = useMemo(() => {
    const today = new Date();
    const days: { date: string; label: string; amount: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      let amount = 0;
      if (projectionMode === "normal") {
        revenues.forEach((r) => {
          if (r.expected_receipt_date === dateStr) {
            amount += Number(r.net_amount || 0);
          }
        });
      } else {
        // Antecipação: all future receipts shown today
        if (i === 0) {
          revenues.forEach((r) => {
            if (r.expected_receipt_date && r.expected_receipt_date >= dateStr) {
              amount += Number(r.net_amount || 0);
            }
          });
        }
      }
      days.push({ date: dateStr, label, amount });
    }
    return days;
  }, [revenues, projectionMode]);

  const totalProjection = projectionData.reduce((a, b) => a + b.amount, 0);

  // Goals progress
  const GOAL_LABELS: Record<string, string> = {
    revenue_monthly: "Meta Entrada Mensal",
    revenue_daily: "Meta Entrada Diária",
    expense_monthly: "Meta Despesa Mensal",
    margin_target: "Meta de Margem (%)",
  };

  const goalProgress = useMemo(() => {
    return storeGoals.map((g) => {
      let current = 0;
      if (g.type === "revenue_monthly") current = totalFaturamento;
      else if (g.type === "revenue_daily")
        current = revenues.length > 0 ? totalFaturamento / revenues.length : 0;
      else if (g.type === "expense_monthly") current = totalExp;
      else if (g.type === "margin_target") current = margin;
      const percent =
        g.value > 0 ? Math.min((current / g.value) * 100, 100) : 0;
      return { ...g, current, percent };
    });
  }, [storeGoals, totalFaturamento, totalExp, margin, revenues.length]);

  // Use the nao_pago_acumulado stored per revenue row
  const revenuesWithAccum = (() => {
    const map = new Map<string, number>();
    for (const r of revenues) {
      map.set(r.id, Number(r.nao_pago_acumulado));
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
          <Button variant="outline" asChild className="gap-2">
            <Link to={`/stores/${id}/inventory`}>
              <Package className="w-4 h-4" />
              Estoque
            </Link>
          </Button>
          <Button
            onClick={() => {
              setEditingEntryId(null);
              setRevDate("");
              setRevPaidAmount("");
              setRevUnpaidAmount("");
              setRevPieces("");
              setRevObs("");
              setRevCategoryId(undefined);
              setRevPaymentMethodId(undefined);
              setExpDate("");
              setExpAmount("");
              setExpCategory(undefined);
              setExpStatus("pending");
              setExpObs("");
              setExpInterest("");
              setExpPaymentDate("");

              setModalOpen(true);
              setSubmitMessage(null);
              // Pre-fill with latest Não Pago Acumulado
              setRevNaoPagoAcumulado(
                latestNaoPagoAcum > 0 ? String(latestNaoPagoAcum) : "",
              );
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
              {fmt(latestNaoPagoAcum)}
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
        {totalInterest > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <p className="text-[11px] text-orange-700 font-medium uppercase tracking-wide">
                Total Juros
              </p>
              <p className="text-lg md:text-xl font-bold text-orange-600">
                {fmt(totalInterest)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Goals Section */}
      {goalProgress.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Metas da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-3 md:grid-cols-2">
              {goalProgress.map((g) => (
                <div
                  key={g.id}
                  className="p-3 bg-white rounded-lg border border-purple-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">
                      {GOAL_LABELS[g.type] || g.type}
                    </span>
                    <span className="text-xs font-bold text-purple-700">
                      {g.percent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-100 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all ${g.percent >= 100 ? "bg-emerald-500" : g.percent >= 70 ? "bg-purple-500" : "bg-purple-300"}`}
                      style={{ width: `${g.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      Atual:{" "}
                      {g.type === "margin_target"
                        ? `${g.current.toFixed(1)}%`
                        : fmt(g.current)}
                    </span>
                    <span>
                      Meta:{" "}
                      {g.type === "margin_target"
                        ? `${g.value}%`
                        : fmt(g.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projection Card */}
      {totalProjection > 0 && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Previsão de Entrada na Conta
              </CardTitle>
              <div className="flex rounded-md overflow-hidden border border-indigo-200 text-[10px]">
                <button
                  onClick={() => setProjectionMode("normal")}
                  className={`px-3 py-1 font-semibold transition-colors ${projectionMode === "normal" ? "bg-indigo-600 text-white" : "bg-white text-indigo-600"}`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setProjectionMode("antecipacao")}
                  className={`px-3 py-1 font-semibold transition-colors ${projectionMode === "antecipacao" ? "bg-indigo-600 text-white" : "bg-white text-indigo-600"}`}
                >
                  Antecipação
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-2 grid-cols-7">
              {projectionData.map((d) => (
                <div
                  key={d.date}
                  className={`text-center p-2 rounded-lg border ${d.amount > 0 ? "bg-white border-indigo-200" : "bg-slate-50 border-slate-100"}`}
                >
                  <p className="text-[9px] text-slate-500 uppercase font-medium">
                    {d.label}
                  </p>
                  <p
                    className={`text-xs font-bold mt-1 ${d.amount > 0 ? "text-indigo-700" : "text-slate-400"}`}
                  >
                    {d.amount > 0 ? fmt(d.amount) : "—"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between p-2 bg-indigo-100 rounded-lg">
              <span className="text-xs font-medium text-indigo-700">
                Total previsto (próx. 7 dias)
              </span>
              <span className="text-sm font-bold text-indigo-800">
                {fmt(totalProjection)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
        {/* Entradas (Left - Green) with Daily Detail */}
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="pb-2 bg-emerald-50 rounded-t-lg">
            <CardTitle className="text-base text-emerald-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Controle Diário — Entradas
            </CardTitle>
            <p className="text-2xl font-bold text-emerald-600">
              {fmt(totalFaturamento)}
            </p>
          </CardHeader>
          <CardContent className="pt-3 max-h-[500px] overflow-y-auto">
            {revenues.length === 0 ? (
              <div className="text-sm text-center py-8 text-muted-foreground border-dashed border rounded-lg">
                Nenhuma entrada registrada.
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
                    <div className="col-span-1 flex justify-end gap-1">
                      <button
                        onClick={() => handleEditRevenue(rev)}
                        className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditExpense(exp)}
                          className="p-1 text-slate-300 hover:text-blue-500"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-slate-300 hover:text-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                {editingEntryId ? "Editar Informação" : "Adicionar Informação"}
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

              {/* Não Pago Acumulado - above the toggle, not revenue nor expense */}
              <div className="space-y-1.5 p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                <Label className="text-xs font-semibold text-amber-700">
                  Não Pago Acumulado (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor acumulado atual"
                  value={revNaoPagoAcumulado}
                  onChange={(e) => setRevNaoPagoAcumulado(e.target.value)}
                  className="bg-white"
                />
                <p className="text-[10px] text-amber-600">
                  Este campo não é entrada nem despesa. Representa o saldo
                  acumulado de 'não pagos'.
                </p>
              </div>

              {/* Type Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-slate-200">
                <button
                  type="button"
                  disabled={!!editingEntryId}
                  onClick={() => setEntryType("receita")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    entryType === "receita"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-500 hover:bg-slate-50"
                  } ${editingEntryId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  disabled={!!editingEntryId}
                  onClick={() => setEntryType("despesa")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    entryType === "despesa"
                      ? "bg-red-600 text-white"
                      : "bg-white text-slate-500 hover:bg-slate-50"
                  } ${editingEntryId ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Recebido Dia (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={revPaidAmount}
                        onChange={(e) => setRevPaidAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Não Pago Dia (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={revUnpaidAmount}
                        onChange={(e) => setRevUnpaidAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Faturamento Dia - computed indicator */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <Label className="text-xs font-semibold text-blue-700">
                      Faturamento Dia (R$)
                    </Label>
                    <p className="text-lg font-bold text-blue-700">
                      {fmt(computedFaturamentoDia)}
                    </p>
                    <p className="text-[10px] text-blue-500">
                      Recebido Dia + Não Pago Dia (calculado automaticamente)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Categoria de Entrada</Label>
                      <Select
                        value={revCategoryId}
                        onValueChange={setRevCategoryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {revCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                {cat.name}
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    cat.type === "fixed"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-cyan-100 text-cyan-700"
                                  }`}
                                >
                                  {cat.type === "fixed" ? "Fixo" : "Variável"}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  </div>
                  {/* Payment Method */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Método de Pagamento</Label>
                    <Select
                      value={revPaymentMethodId}
                      onValueChange={setRevPaymentMethodId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            <span className="flex items-center gap-2">
                              <CreditCard className="w-3 h-3" />
                              {pm.name}
                              <span className="text-[9px] font-bold text-slate-500">
                                ({pm.fee_percentage}%)
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Fee preview */}
                  {revPaymentMethodId &&
                    (parseFloat(revPaidAmount) || 0) > 0 &&
                    (() => {
                      const pm = paymentMethods.find(
                        (p) => p.id === revPaymentMethodId,
                      );
                      if (!pm) return null;
                      const paid = parseFloat(revPaidAmount) || 0;
                      const fee = paid * (pm.fee_percentage / 100);
                      const net = paid - fee;
                      const rule = delayRules.find(
                        (r) => r.payment_method_id === pm.id,
                      );
                      return (
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-indigo-600">
                              Taxa ({pm.fee_percentage}%)
                            </span>
                            <span className="font-bold text-red-600">
                              - {fmt(fee)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-indigo-600">
                              Valor Líquido
                            </span>
                            <span className="font-bold text-emerald-600">
                              {fmt(net)}
                            </span>
                          </div>
                          {rule && rule.delay_days !== null && (
                            <div className="flex justify-between text-xs">
                              <span className="text-indigo-600">
                                Previsão de entrada
                              </span>
                              <span className="font-bold text-indigo-700">
                                {rule.delay_days} dia(s)
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Observação</Label>
                    <Input
                      placeholder="Opcional - ex: pagamento do ticket #123"
                      value={revObs}
                      onChange={(e) => setRevObs(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Categoria *</Label>
                      <Select
                        value={expCategory}
                        onValueChange={setExpCategory}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {expCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <span className="flex items-center gap-2">
                                {cat.name}
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    cat.type === "fixed"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-cyan-100 text-cyan-700"
                                  }`}
                                >
                                  {cat.type === "fixed" ? "Fixo" : "Variável"}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Data de Pagamento</Label>
                      <Input
                        type="date"
                        value={expPaymentDate}
                        onChange={(e) => setExpPaymentDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Juros (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={expInterest}
                        onChange={(e) => setExpInterest(e.target.value)}
                      />
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
                  ? "Salvando..."
                  : `${editingEntryId ? "Salvar" : "Registrar"} ${entryType === "receita" ? "Entrada" : "Despesa"}`}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
