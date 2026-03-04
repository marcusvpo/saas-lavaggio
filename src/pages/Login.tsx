import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logoPretoPng from "@/assets/logo-lavaggio-preto.png";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(
          err.message || "Erro ao realizar login. Verifique suas credenciais.",
        );
      } else {
        setError("Ocorreu um erro inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 animate-in fade-in duration-700 delay-300">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdminLogin(!isAdminLogin)}
          className="text-xs text-muted-foreground opacity-50 hover:opacity-100 uppercase tracking-widest font-semibold"
        >
          {isAdminLogin ? "Acesso Cliente" : "Admin"}
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-6">
          <img
            src={logoPretoPng}
            alt="Lavaggio Lavanderias"
            className="h-14 object-contain"
          />
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground font-medium uppercase tracking-wider">
          Dashboard Financeiro
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="shadow-xl border-blue-100/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isAdminLogin ? "Acesso Administrador" : "Acesso Restrito"}
            </CardTitle>
            <CardDescription className="text-center">
              {isAdminLogin
                ? "Painel de controle geral da rede Lavaggio."
                : "Insira suas credenciais para acessar a plataforma."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    isAdminLogin ? "admin@lavaggio.com" : "usuario@lavaggio.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar na Plataforma"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground">
              Acesso exclusivo para funcionários autorizados.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
