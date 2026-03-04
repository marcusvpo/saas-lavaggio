import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Users, Building, Settings as ConfigIcon } from "lucide-react";

export function Settings() {
  const { session, role } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState("client");
  const [targetStore, setTargetStore] = useState("");

  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [users, setUsers] = useState<
    {
      id: string;
      role: string;
      store_id: string | null;
      stores: { name: string } | null;
    }[]
  >([]);

  useEffect(() => {
    if (role === "admin") {
      fetchStores();
      fetchUsers();
    }
  }, [role]);

  const fetchUsers = async () => {
    // Because we can't fetch Emails directly from auth.users without an Edge Function,
    // we fetch from user_roles as a workaround to show active profiles.
    const { data, error } = await supabase
      .from("user_roles")
      .select("id, role, store_id, stores(name)");

    if (data && !error) {
      // Cast the response to match the state type since Supabase nested selects return arrays for relations by default
      const typedData = data.map(
        (d: {
          id: string;
          role: string;
          store_id: string | null;
          stores: { name: string } | { name: string }[] | null;
        }) => ({
          id: d.id,
          role: d.role,
          store_id: d.store_id,
          stores: Array.isArray(d.stores) ? d.stores[0] : d.stores,
        }),
      );
      setUsers(typedData);
    }
  };

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name");
    if (data) {
      setStores(data);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email,
            password,
            role: targetRole,
            store_id: targetRole === "client" ? targetStore : null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar usuário");
      }

      setMessage({ type: "success", text: "Usuário criado com sucesso!" });
      setEmail("");
      setPassword("");
      setTargetStore("");
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "Ocorreu um erro inesperado." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm(
        "Você não pode deletar o usuário do Auth sem backend rules. Deseja revogar o acesso deste usuário (remover role)?",
      )
    )
      return;

    // Workaround: delete the user's role to revoke their access
    // Proper implementation would require an Edge Function or trigger to delete from auth.users
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", userId);

    if (!error) {
      fetchUsers();
    }
  };

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-500">
        <Shield className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          A aba de configurações é exclusiva para administradores da rede
          Lavaggio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ConfigIcon className="w-8 h-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerenciamento central do sistema, usuários e parametrizações.
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários e Acessos
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Parametrizações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Usuário</CardTitle>
                <CardDescription>
                  Gere um acesso para um novo administrador ou gerente de loja.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  {message && (
                    <div
                      className={`p-3 text-sm rounded-md ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-destructive/10 text-destructive"}`}
                    >
                      {message.text}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Acesso</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@lavaggio.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Temporária</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil de Acesso</Label>
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          Administrador (Rede Completa)
                        </SelectItem>
                        <SelectItem value="client">
                          Cliente / Gerente de Loja
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {targetRole === "client" && (
                    <div className="space-y-2">
                      <Label>Atribuir a qual Loja? (Apenas para Cliente)</Label>
                      <Select
                        value={targetStore}
                        onValueChange={setTargetStore}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma loja" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando Usuário..." : "Criar Novo Usuário"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento</CardTitle>
                <CardDescription>
                  Lista de usuários ativos e seus vínculos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-sm text-muted-foreground flex items-center justify-center p-8 border border-dashed rounded-lg">
                    Nenhum usuário secundário localizado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            ID: {u.id.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Papel:{" "}
                            {u.role === "admin" ? "Administrador" : "Cliente"}
                            {u.store_id && u.stores
                              ? ` - Loja: ${u.stores.name}`
                              : ""}
                          </p>
                        </div>
                        {u.id !== session?.user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-8"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Revogar Acesso
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Parametrizações do Sistema</CardTitle>
              <CardDescription>
                Configure detalhes globais da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Oções de faturamento e customização em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
