import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Package, Construction, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StoreInventory() {
  const { id } = useParams();
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    async function fetchStore() {
      const { data } = await supabase
        .from("stores")
        .select("name")
        .eq("id", id)
        .single();
      if (data) setStoreName(data.name);
    }
    if (id) fetchStore();
  }, [id]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground -ml-3"
          >
            <Link to={`/stores/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Package className="w-7 h-7 text-primary" />
          Estoque — {storeName || "Carregando..."}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Controle de estoque da unidade.
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
            A funcionalidade de gestão de estoque por unidade está sendo
            desenvolvida. Em breve você poderá gerenciar entradas, saídas e
            níveis de insumos desta loja.
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
