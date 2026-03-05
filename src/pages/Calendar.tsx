import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { DateFilter } from "@/components/DateFilter";
import {
  useDateFilter,
  dateRangeToFilter,
  dateRangeLabel,
} from "@/lib/dateFilter";
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Expense {
  id: string;
  store_id: string;
  category: string;
  amount: number;
  due_date: string;
  status: "paid" | "pending" | "late";
  observations?: string;
  store_name?: string;
}

interface Revenue {
  id: string;
  store_id: string;
  total_amount: number;
  paid_amount: number;
  date: string;
  store_name?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useDateFilter();
  const dateFilter = useMemo(() => dateRangeToFilter(dateRange), [dateRange]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: storesList } = await supabase
        .from("stores")
        .select("id, name");
      if (storesList) setStores(storesList);

      const { data: expData } = await supabase
        .from("expenses")
        .select("*")
        .gte("due_date", dateFilter.start)
        .lte("due_date", dateFilter.end)
        .order("due_date", { ascending: true });
      if (expData) setExpenses(expData);

      const { data: revData } = await supabase
        .from("revenues")
        .select("*")
        .gte("date", dateFilter.start)
        .lte("date", dateFilter.end)
        .order("date", { ascending: true });
      if (revData) setRevenues(revData);
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter.start, dateFilter.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStoreName = (storeId: string) => {
    return stores.find((s) => s.id === storeId)?.name || "—";
  };

  // Filter data for the selected calendar day
  const selectedDateStr = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";

  // Filter by store
  const filteredExpenses =
    selectedStore === "all"
      ? expenses
      : expenses.filter((e) => e.store_id === selectedStore);
  const filteredRevenues =
    selectedStore === "all"
      ? revenues
      : revenues.filter((r) => r.store_id === selectedStore);

  const dayExpenses = filteredExpenses.filter(
    (e) => e.due_date === selectedDateStr,
  );
  const dayRevenues = filteredRevenues.filter(
    (r) => r.date === selectedDateStr,
  );

  // Compute net balance per day for coloring
  const dayNetMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRevenues) {
      const key = r.date;
      map.set(key, (map.get(key) || 0) + Number(r.total_amount));
    }
    for (const e of filteredExpenses) {
      const key = e.due_date;
      map.set(key, (map.get(key) || 0) - Number(e.amount));
    }
    return map;
  }, [filteredRevenues, filteredExpenses]);

  const getDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Monthly totals
  const totalExpMonth = filteredExpenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0,
  );
  const totalRevMonth = filteredRevenues.reduce(
    (acc, r) => acc + Number(r.total_amount),
    0,
  );

  // Monthly combined entries
  const monthlyEntries = useMemo(() => {
    const list = [
      ...filteredRevenues.map((r) => ({
        ...r,
        entryType: "revenue" as const,
        sortDate: r.date,
      })),
      ...filteredExpenses.map((e) => ({
        ...e,
        entryType: "expense" as const,
        sortDate: e.due_date,
      })),
    ];
    return list.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  }, [filteredRevenues, filteredExpenses]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Calendário Financeiro
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {dateRangeLabel(dateRange)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedStore} onValueChange={setSelectedStore}>
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
          <DateFilter value={dateRange} onChange={setDateRange} />
          <Link to="/comparator">
            <Button
              variant="outline"
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <BarChart3 className="w-4 h-4" />
              Comparador
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Entradas
              </p>
              <p className="text-lg font-bold text-emerald-600">
                {fmt(totalRevMonth)}
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
                Despesas
              </p>
              <p className="text-lg font-bold text-red-600">
                {fmt(totalExpMonth)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200 col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                Resultado
              </p>
              <p
                className={`text-lg font-bold ${totalRevMonth - totalExpMonth >= 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                {fmt(totalRevMonth - totalExpMonth)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-5 lg:col-span-4 h-fit">
          <CardContent className="pt-6 flex justify-center">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border shadow"
              modifiers={{
                dayPositive: (d) => {
                  const net = dayNetMap.get(getDayKey(d));
                  return net !== undefined && net > 0;
                },
                dayNegative: (d) => {
                  const net = dayNetMap.get(getDayKey(d));
                  return net !== undefined && net < 0;
                },
              }}
              modifiersClassNames={{
                dayPositive: "bg-emerald-100 text-emerald-700 font-bold",
                dayNegative: "bg-red-100 text-red-700 font-bold",
              }}
            />
          </CardContent>
        </Card>

        <Tabs
          defaultValue="day"
          className="md:col-span-7 lg:col-span-8 flex flex-col gap-4"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="day">Lançamentos do Dia</TabsTrigger>
            <TabsTrigger value="month">Lançamentos do Mês</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="m-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lançamentos do Dia</CardTitle>
                <CardDescription>
                  {date
                    ? date.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Selecione uma data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : dayExpenses.length === 0 && dayRevenues.length === 0 ? (
                  <div className="text-sm text-center py-8 text-muted-foreground border-dashed border rounded-lg">
                    Nenhum lançamento para este dia.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-auto pr-2 scrollbar-thin">
                    {/* Revenue entries for the day */}
                    {dayRevenues.map((rev) => (
                      <div
                        key={rev.id}
                        className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50/50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-sm text-emerald-700">
                            Entrada — {getStoreName(rev.store_id)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recebido: {fmt(Number(rev.paid_amount))}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">
                            Entrada
                          </Badge>
                          <span className="font-bold text-emerald-600">
                            {fmt(Number(rev.total_amount))}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Expense entries for the day */}
                    {dayExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          expense.status === "paid"
                            ? "border-slate-200"
                            : expense.status === "late"
                              ? "border-red-300 bg-red-50/50"
                              : "border-amber-200 bg-amber-50/30"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {expense.category} —{" "}
                            {getStoreName(expense.store_id)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expense.observations || "Despesa"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {expense.status === "paid" ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">
                              Pago
                            </Badge>
                          ) : expense.status === "late" ? (
                            <Badge className="bg-red-500 hover:bg-red-600 text-[10px]">
                              Atrasado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-500 text-[10px]"
                            >
                              Pendente
                            </Badge>
                          )}
                          <span className="font-bold text-red-600">
                            {fmt(expense.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="m-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lançamentos do Mês</CardTitle>
                <CardDescription>
                  Todos os lançamentos do período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : monthlyEntries.length === 0 ? (
                  <div className="text-sm text-center py-8 text-muted-foreground border-dashed border rounded-lg">
                    Nenhum lançamento no período.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-auto pr-2 scrollbar-thin">
                    {monthlyEntries.map((item) => {
                      if (item.entryType === "revenue") {
                        const rev = item as Revenue;
                        return (
                          <div
                            key={`rev-${rev.id}`}
                            className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50/50 rounded-lg"
                          >
                            <div>
                              <p className="font-semibold text-sm text-emerald-700 flex items-center gap-2">
                                Entrada — {getStoreName(rev.store_id)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(
                                  rev.date + "T12:00:00",
                                ).toLocaleDateString("pt-BR")}{" "}
                                · Recebido: {fmt(Number(rev.paid_amount))}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-emerald-600">
                                {fmt(Number(rev.total_amount))}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        const exp = item as Expense;
                        return (
                          <div
                            key={`exp-${exp.id}`}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              exp.status === "paid"
                                ? "border-slate-200"
                                : exp.status === "late"
                                  ? "border-red-300 bg-red-50/50"
                                  : "border-amber-200 bg-amber-50/30"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-sm flex items-center gap-2">
                                {exp.category} — {getStoreName(exp.store_id)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(
                                  exp.due_date + "T12:00:00",
                                ).toLocaleDateString("pt-BR")}
                                {exp.observations
                                  ? ` · ${exp.observations}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {exp.status === "paid" ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] scale-90">
                                  Pago
                                </Badge>
                              ) : exp.status === "late" ? (
                                <Badge className="bg-red-500 hover:bg-red-600 text-[10px] scale-90">
                                  Atrasado
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-500 text-[10px] scale-90"
                                >
                                  Pendente
                                </Badge>
                              )}
                              <span className="font-bold text-red-600 ml-1">
                                {fmt(exp.amount)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
