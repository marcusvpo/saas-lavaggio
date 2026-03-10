import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Factory,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Landmark,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";

import { useFetchDashboard } from "@/hooks/useFetchDashboard";
import type { StoreMetric } from "@/hooks/useFetchDashboard";
import { DateFilter } from "@/components/DateFilter";
import {
  useDateFilter,
  dateRangeToFilter,
  dateRangeLabel,
} from "@/lib/dateFilter";
import { supabase } from "@/lib/supabase";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export function Dashboard() {
  const [dateRange, setDateRange] = useDateFilter(undefined, null); // default: full current year
  const dateFilter = useMemo(() => dateRangeToFilter(dateRange), [dateRange]);

  const {
    stores,
    totalRevenue,
    totalFixedCosts,
    totalVariableCosts,
    profit,
    revenueHistory,
    isLoading,
  } = useFetchDashboard(dateFilter);

  const [selectedStore, setSelectedStore] = useState<StoreMetric | null>(null);
  const [projectedToday, setProjectedToday] = useState(0);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    supabase
      .from("revenues")
      .select("net_amount")
      .eq("expected_receipt_date", todayStr)
      .then(({ data }) => {
        if (data) {
          const total = data.reduce(
            (acc: number, r: { net_amount: number | null }) =>
              acc + Number(r.net_amount || 0),
            0,
          );
          setProjectedToday(total);
        }
      });
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sofnStore = stores.find((s) => s.isSofn);
  const unitStores = stores.filter((s) => !s.isSofn);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Dashboard da Rede
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visão geral — {dateRangeLabel(dateRange)}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Faturamento Total */}
        <Card className="bg-blue-900 text-white border-none shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-blue-200">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {fmt(totalRevenue)}
            </div>
            <p className="text-[11px] text-blue-300 mt-1">Entrada do período</p>
          </CardContent>
        </Card>

        {/* Custos Fixos */}
        <Card className="bg-orange-500 text-white border-none shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-orange-100">
              Custos Fixos
            </CardTitle>
            <Landmark className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {fmt(totalFixedCosts)}
            </div>
            <p className="text-[11px] text-orange-100 mt-1">
              Aluguel, folha, etc.
            </p>
          </CardContent>
        </Card>

        {/* Custos Variáveis */}
        <Card className="bg-amber-500 text-white border-none shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-amber-100">
              Custos Variáveis
            </CardTitle>
            <Wallet className="h-4 w-4 text-amber-200" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {fmt(totalVariableCosts)}
            </div>
            <p className="text-[11px] text-amber-100 mt-1">
              Insumos, comissões, etc.
            </p>
          </CardContent>
        </Card>

        {/* Lucro */}
        <Card
          className={`border-none shadow-lg ${profit >= 0 ? "bg-emerald-600" : "bg-red-600"} text-white`}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-white/80">
              Lucro
            </CardTitle>
            {profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-200" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-200" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{fmt(profit)}</div>
            <p className="text-[11px] text-white/70 mt-1">Entrada - Despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* Projection Today Card */}
      {projectedToday > 0 && (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">
                Previsão de Entrada Hoje
              </p>
              <p className="text-xl font-bold text-indigo-700">
                {fmt(projectedToday)}
              </p>
              <p className="text-[10px] text-indigo-500 mt-0.5">
                Valor líquido previsto para cair na conta hoje (já descontando
                taxas)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SOFN Indicator */}
      {sofnStore && (
        <Card className="shadow-sm border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Factory className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">
                  SOFN — Central Operacional
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Centraliza processos e gestão financeira da rede
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Entrada</p>
                <p className="font-bold text-emerald-600">
                  {fmt(sofnStore.revenue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Despesas</p>
                <p className="font-bold text-red-500">
                  {fmt(sofnStore.expenses)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Margem</p>
                <p
                  className={`font-bold ${sofnStore.margin >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {sofnStore.margin}%
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Revenue Evolution Chart */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Evolução do Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueHistory}
                margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(val) => `R$${val / 1000}k`}
                  dx={-5}
                />
                <Tooltip
                  cursor={{
                    stroke: "#94a3b8",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-slate-200 shadow-lg rounded-xl p-3">
                          <p className="font-semibold text-slate-700 mb-1 text-sm">
                            {label}
                          </p>
                          <p className="font-bold text-blue-600 text-sm">
                            {fmt(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Store Cards */}
      <div>
        <h2 className="text-lg font-bold tracking-tight mb-3">
          Desempenho por Unidade
        </h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {unitStores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className="text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
            >
              <Card className="h-full bg-blue-900 text-white border-none hover:bg-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-blue-100 truncate">
                    {store.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-lg md:text-xl font-bold">
                    {fmt(store.revenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {store.margin >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${store.margin >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {store.margin}% margem
                    </span>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Store Popup Modal */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedStore.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Resumo da Unidade
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedStore(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              {/* Mini KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-emerald-700 font-medium">
                    Entrada
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {fmt(selectedStore.revenue)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-red-700 font-medium">Despesas</p>
                  <p className="text-xl font-bold text-red-600">
                    {fmt(selectedStore.expenses)}
                  </p>
                </div>
              </div>

              {/* Profit & Margin */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium">
                    Lucro Operacional
                  </p>
                  <p
                    className={`text-xl font-bold ${selectedStore.revenue - selectedStore.expenses >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {fmt(selectedStore.revenue - selectedStore.expenses)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium">Margem</p>
                  <p
                    className={`text-xl font-bold ${selectedStore.margin >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {selectedStore.margin}%
                  </p>
                </div>
              </div>

              {/* Share */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-2">
                  Participação no faturamento
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${selectedStore.share}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-700">
                    {selectedStore.share}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  window.location.href = `/stores/${selectedStore.id}`;
                }}
              >
                Ver Dashboard Completo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
