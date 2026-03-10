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
        .or(
          `and(payment_date.gte.${dateFilter.start},payment_date.lte.${dateFilter.end}),and(payment_date.is.null,due_date.gte.${dateFilter.start},due_date.lte.${dateFilter.end})`,
        );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <BarChart3 className="w-8 h-8 text-purple-600 hidden sm:block" />
              Comparador
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {dateRangeLabel(dateRange)}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
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
          <div className="space-y-4 md:space-y-2">
            <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
              <div className="col-span-3">Loja</div>
              <div className="col-span-2 text-right">Faturamento</div>
              <div className="col-span-2 text-right">Despesas</div>
              <div className="col-span-2 text-right">Lucro</div>
              <div className="col-span-2 text-center">Margem</div>
              <div className="col-span-1 text-right">Peças</div>
            </div>

            {storesData
              .sort((a, b) => b.totalRevenue - a.totalRevenue)
              .map((store) => (
                <div
                  key={store.id}
                  className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-2 items-start md:items-center p-4 md:p-0 md:py-3 border md:border-b md:border-x-0 md:border-t-0 rounded-lg md:rounded-none md:last:border-0 hover:bg-slate-50 transition-colors"
                >
                  {/* Nome da Loja */}
                  <div className="col-span-3 w-full border-b md:border-0 pb-2 md:pb-0 mb-2 md:mb-0">
                    <Link
                      to={`/stores/${store.id}`}
                      className="text-base md:text-sm font-bold md:font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                    >
                      {store.name}
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:contents w-full gap-4">
                    {/* Faturamento */}
                    <div className="md:col-span-2 flex flex-col md:block md:text-right">
                      <span className="text-[10px] uppercase text-slate-500 font-bold md:hidden mb-1">
                        Faturamento
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {fmt(store.totalRevenue)}
                      </span>
                      <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-1 md:mt-2">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(store.totalRevenue / maxRevenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Despesas */}
                    <div className="md:col-span-2 flex flex-col md:block items-end md:items-start md:text-right">
                      <span className="text-[10px] uppercase text-slate-500 font-bold md:hidden mb-1">
                        Despesas
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        {fmt(store.totalExpense)}
                      </span>
                      <div className="w-full bg-red-100 rounded-full h-1.5 mt-1 md:mt-2">
                        <div
                          className="bg-red-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(store.totalExpense / maxExpense) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:contents w-full gap-2 items-center border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                    {/* Lucro */}
                    <div className="col-span-1 flex flex-col md:block md:text-right">
                      <span className="text-[10px] uppercase text-slate-500 font-bold md:hidden mb-1">
                        Lucro
                      </span>
                      <span
                        className={`text-sm font-bold ${store.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {fmt(store.profit)}
                      </span>
                    </div>

                    {/* Margem */}
                    <div className="col-span-1 flex flex-col md:block items-center">
                      <span className="text-[10px] uppercase text-slate-500 font-bold md:hidden mb-1">
                        Margem
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full w-max ${
                          store.margin >= 30
                            ? "bg-emerald-100 text-emerald-700"
                            : store.margin >= 10
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {store.margin.toFixed(1)}%
                      </span>
                    </div>

                    {/* Peças */}
                    <div className="col-span-1 flex flex-col md:block items-end md:text-right">
                      <span className="text-[10px] uppercase text-slate-500 font-bold md:hidden mb-1">
                        Peças
                      </span>
                      <span className="text-sm text-slate-600 font-medium md:font-normal">
                        {store.totalPieces.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
