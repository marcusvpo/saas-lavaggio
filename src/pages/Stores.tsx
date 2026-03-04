import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

import { useFetchDashboard } from "@/hooks/useFetchDashboard";
import { DateFilter } from "@/components/DateFilter";
import {
  useDateFilter,
  dateRangeToFilter,
  dateRangeLabel,
} from "@/lib/dateFilter";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export function Stores() {
  const [dateRange, setDateRange] = useDateFilter(undefined, null);
  const dateFilter = useMemo(() => dateRangeToFilter(dateRange), [dateRange]);
  const { stores, isLoading } = useFetchDashboard(dateFilter);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const unitStores = stores.filter((s) => !s.isSofn);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Store className="w-7 h-7 text-blue-600" />
            Unidades Lavaggio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {dateRangeLabel(dateRange)}
          </p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {unitStores.map((store) => (
          <Link
            key={store.id}
            to={`/stores/${store.id}`}
            className="group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
          >
            <Card className="h-full hover:border-blue-300 hover:shadow-md transition-all duration-200 group-hover:scale-[1.01]">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{store.name}</CardTitle>
                </div>
                {store.margin >= 0 ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="mt-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Faturamento
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {fmt(store.revenue)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">
                      Margem
                    </span>
                    <span
                      className={`font-semibold ${store.margin >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {store.margin}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-medium text-xs group-hover:underline">
                    <span>Acessar</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
