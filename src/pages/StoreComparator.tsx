import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/DateFilter";
import {
  useDateFilter,
  dateRangeToFilter,
  dateRangeLabel,
} from "@/lib/dateFilter";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface StoreData {
  id: string;
  name: string;
  totalRevenue: number;
  totalReceived: number;
  totalExpense: number;
  profit: number;
  margin: number;
  totalPieces: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export function StoreComparator() {
  const [storesData, setStoresData] = useState<StoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useDateFilter();
  const dateFilter = useMemo(() => dateRangeToFilter(dateRange), [dateRange]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: stores } = await supabase
        .from("stores")
        .select("id, name")
        .order("name");
      if (!stores) return;

      const { data: revenues } = await supabase
        .from("revenues")
        .select("store_id, total_amount, paid_amount, pieces_count")
        .gte("date", dateFilter.start)
        .lte("date", dateFilter.end);

      const { data: expenses } = await supabase
        .from("expenses")
        .select("store_id, amount")
        .gte("due_date", dateFilter.start)
        .lte("due_date", dateFilter.end);

      const result: StoreData[] = stores.map((store) => {
        const storeRevs = (revenues || []).filter(
          (r) => r.store_id === store.id,
        );
        const storeExps = (expenses || []).filter(
          (e) => e.store_id === store.id,
        );

        const totalRevenue = storeRevs.reduce(
          (acc, r) => acc + Number(r.total_amount),
          0,
        );
        const totalReceived = storeRevs.reduce(
          (acc, r) => acc + Number(r.paid_amount),
          0,
        );
        const totalExpense = storeExps.reduce(
          (acc, e) => acc + Number(e.amount),
          0,
        );
        const profit = totalReceived - totalExpense;
        const margin = totalReceived > 0 ? (profit / totalReceived) * 100 : 0;
        const totalPieces = storeRevs.reduce(
          (acc, r) => acc + Number(r.pieces_count || 0),
          0,
        );

        return {
          id: store.id,
          name: store.name,
          totalRevenue,
          totalReceived,
          totalExpense,
          profit,
          margin,
          totalPieces,
        };
      });

      setStoresData(result);
    } catch (err) {
      console.error("Error fetching comparator data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter.start, dateFilter.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxRevenue = Math.max(...storesData.map((s) => s.totalRevenue), 1);
  const maxExpense = Math.max(...storesData.map((s) => s.totalExpense), 1);

  const totalAllRev = storesData.reduce((a, s) => a + s.totalRevenue, 0);
  const totalAllExp = storesData.reduce((a, s) => a + s.totalExpense, 0);
  const totalAllProfit = storesData.reduce((a, s) => a + s.profit, 0);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/calendar">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              Comparador de Lojas
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {dateRangeLabel(dateRange)} — Compare o desempenho financeiro de
              todas as unidades.
            </p>
          </div>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Global Summary */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Faturamento Total
              </p>
              <p className="text-lg font-bold text-emerald-600">
                {fmt(totalAllRev)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">
                Despesas Total
              </p>
              <p className="text-lg font-bold text-red-600">
                {fmt(totalAllExp)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`${totalAllProfit >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                Resultado
              </p>
              <p
                className={`text-lg font-bold ${totalAllProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {fmt(totalAllProfit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            Desempenho por Loja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                  <th className="text-left pb-3 pr-4">Loja</th>
                  <th className="text-right pb-3 px-2">Faturamento</th>
                  <th className="w-[120px] pb-3 px-2"></th>
                  <th className="text-right pb-3 px-2">Despesas</th>
                  <th className="w-[120px] pb-3 px-2"></th>
                  <th className="text-right pb-3 px-2">Lucro</th>
                  <th className="text-right pb-3 px-2">Margem</th>
                  <th className="text-right pb-3 pl-2">Peças</th>
                </tr>
              </thead>
              <tbody>
                {storesData
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .map((store) => (
                    <tr
                      key={store.id}
                      className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          to={`/stores/${store.id}`}
                          className="font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                        >
                          {store.name}
                        </Link>
                      </td>
                      <td className="text-right py-3 px-2 font-bold text-emerald-600">
                        {fmt(store.totalRevenue)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="w-full bg-emerald-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${(store.totalRevenue / maxRevenue) * 100}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-bold text-red-600">
                        {fmt(store.totalExpense)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="w-full bg-red-100 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${(store.totalExpense / maxExpense) * 100}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td
                        className={`text-right py-3 px-2 font-bold ${store.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {fmt(store.profit)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            store.margin >= 30
                              ? "bg-emerald-100 text-emerald-700"
                              : store.margin >= 10
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {store.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 pl-2 text-slate-600">
                        {store.totalPieces.toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
