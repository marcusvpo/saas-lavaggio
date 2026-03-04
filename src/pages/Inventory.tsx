import React from "react";
import { Package, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Inventory() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          Gestão de Estoque
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Controle centralizado de estoque de toda a rede.
        </p>
      </div>

      <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">
            Em Desenvolvimento
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            A funcionalidade de gestão de estoque global está sendo
            desenvolvida. Em breve você poderá controlar entradas, saídas e
            níveis de estoque de insumos de toda a rede Lavaggio por aqui.
          </p>
          <div className="flex items-center gap-2 mt-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Previsto para próxima versão
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
