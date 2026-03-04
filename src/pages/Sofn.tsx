import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Factory, TrendingDown, Scale, PieChart } from "lucide-react";

export function Sofn() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Factory className="w-8 h-8 text-primary" />
          SOFN (Unidade Operacional)
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhamento de custos de operação, rateios para as lojas da rede e
          indicadores de eficiência.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custo Total Operacional
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 48.500,00</div>
            <p className="text-xs text-muted-foreground mt-1">
              -1.2% comparado ao orçamento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custo Médio por Quilo
            </CardTitle>
            <Scale className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 5,40/kg</div>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-600 font-medium">
              Abaixo da meta de R$ 6,00/kg
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rateio de Custos por Loja
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 bg-secondary rounded-full h-3 flex overflow-hidden">
                <div
                  className="bg-primary hover:opacity-80 transition-opacity"
                  style={{ width: "30%" }}
                  title="Lago Norte: 30%"
                ></div>
                <div
                  className="bg-sky-500 hover:opacity-80 transition-opacity"
                  style={{ width: "25%" }}
                  title="202 Norte: 25%"
                ></div>
                <div
                  className="bg-indigo-400 hover:opacity-80 transition-opacity"
                  style={{ width: "20%" }}
                  title="213 Norte: 20%"
                ></div>
                <div
                  className="bg-purple-400 hover:opacity-80 transition-opacity"
                  style={{ width: "15%" }}
                  title="Sudoeste: 15%"
                ></div>
                <div
                  className="bg-emerald-400 hover:opacity-80 transition-opacity"
                  style={{ width: "10%" }}
                  title="Águas Claras: 10%"
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" /> Lago N.
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-sky-500" /> 202 N.
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400" /> 213 N.
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400" /> Sudoest.
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /> Águas C.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Histórico de Eficiência e Insumos</CardTitle>
          <CardDescription>
            Acompanhamento de despesas com energia, água e produtos de limpeza e
            lavagem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 text-center bg-muted/20 text-muted-foreground flex flex-col items-center justify-center">
            <Factory className="w-12 h-12 mb-4 opacity-20" />
            <p>
              O gráfico de evolução de insumos será sincronizado após conexão
              com o Supabase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
