import React, { useState, useEffect, useCallback } from "react";
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
import {
  Shield,
  Users,
  Building,
  Settings as ConfigIcon,
  Target,
  Tag,
  Sliders,
  Plus,
  Trash2,
  Pencil,
  X,
  Save,
  Check,
  CreditCard,
  Clock,
  Package,
} from "lucide-react";

/* ============================================================
   Types
   ============================================================ */
interface Goal {
  id: string;
  store_id: string | null;
  type: string;
  value: number;
  month: number | null;
  year: number | null;
  store_name?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface RevenueCategory {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  fee_percentage: number;
  installments: number;
  is_active: boolean;
}

interface PaymentDelayRule {
  id: string;
  payment_method_id: string;
  delay_days: number | null;
  description: string | null;
}

interface InventoryCategory {
  id: string;
  name: string;
  is_active: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

const GOAL_LABELS: Record<string, string> = {
  revenue_monthly: "Meta Entrada Mensal",
  revenue_daily: "Meta Entrada Diária",
  expense_monthly: "Meta Despesa Mensal",
  margin_target: "Meta de Margem (%)",
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/* ============================================================
   Component
   ============================================================ */
export function Settings() {
  const { session, role } = useAuth();

  /* ----- User management state ----- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState("client");
  const [targetStore, setTargetStore] = useState<string | undefined>(undefined);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [users, setUsers] = useState<
    {
      id: string;
      email: string;
      role: string;
      store_id: string | null;
      store_name: string | null;
    }[]
  >([]);

  /* ----- Parametrization state ----- */
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expCategories, setExpCategories] = useState<ExpenseCategory[]>([]);
  const [revCategories, setRevCategories] = useState<RevenueCategory[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>(
    [],
  );
  const [paramLoading, setParamLoading] = useState(true);

  // Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState({
    store_id: "__global__",
    type: "revenue_monthly",
    value: "",
    month: "",
    year: new Date().getFullYear().toString(),
  });

  // Expense Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: "", type: "fixed" });

  // Revenue Category modal
  const [revCatModalOpen, setRevCatModalOpen] = useState(false);
  const [editingRevCat, setEditingRevCat] = useState<RevenueCategory | null>(
    null,
  );
  const [revCatForm, setRevCatForm] = useState({ name: "", type: "fixed" });

  // Settings editing
  const [editingSettings, setEditingSettings] = useState<
    Record<string, string>
  >({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);
  const [pmForm, setPmForm] = useState({
    name: "",
    type: "credit",
    fee_percentage: "",
    installments: "1",
  });

  // Payment delay rules state
  const [delayRules, setDelayRules] = useState<PaymentDelayRule[]>([]);
  const [savingDelays, setSavingDelays] = useState(false);
  const [editingDelays, setEditingDelays] = useState<Record<string, string>>(
    {},
  );

  // Inventory categories state
  const [invCategories, setInvCategories] = useState<InventoryCategory[]>([]);
  const [invCatModalOpen, setInvCatModalOpen] = useState(false);
  const [editingInvCat, setEditingInvCat] = useState<InventoryCategory | null>(
    null,
  );
  const [invCatForm, setInvCatForm] = useState({ name: "" });

  /* =========================
     Data fetching
     ========================= */

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      );
      if (response.ok) {
        const result = await response.json();
        if (result.users) setUsers(result.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, [session?.access_token]);

  const fetchStores = useCallback(async () => {
    const { data } = await supabase.from("stores").select("id, name");
    if (data) setStores(data);
  }, []);

  const fetchParametrizations = useCallback(async () => {
    setParamLoading(true);
    try {
      const [
        goalsRes,
        catsRes,
        revCatsRes,
        settingsRes,
        pmRes,
        delayRes,
        invCatRes,
      ] = await Promise.all([
        supabase
          .from("goals")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("expense_categories").select("*").order("name"),
        supabase.from("revenue_categories").select("*").order("name"),
        supabase.from("platform_settings").select("*").order("key"),
        supabase.from("payment_methods").select("*").order("installments"),
        supabase.from("payment_delay_rules").select("*"),
        supabase.from("inventory_categories").select("*").order("name"),
      ]);

      if (goalsRes.data) {
        const { data: storesList } = await supabase
          .from("stores")
          .select("id, name");
        const storeMap = new Map(
          (storesList || []).map((s: { id: string; name: string }) => [
            s.id,
            s.name,
          ]),
        );
        setGoals(
          goalsRes.data.map((g: Goal) => ({
            ...g,
            store_name: g.store_id
              ? storeMap.get(g.store_id) || "—"
              : "Geral (Rede)",
          })),
        );
      }
      if (catsRes.data) setExpCategories(catsRes.data);
      if (revCatsRes.data) setRevCategories(revCatsRes.data);
      if (settingsRes.data) {
        setPlatformSettings(settingsRes.data);
        const map: Record<string, string> = {};
        settingsRes.data.forEach((s: PlatformSetting) => {
          map[s.key] = s.value;
        });
        setEditingSettings(map);
      }
      if (pmRes.data) setPaymentMethods(pmRes.data);
      if (delayRes.data) {
        setDelayRules(delayRes.data);
        const dMap: Record<string, string> = {};
        delayRes.data.forEach((d: PaymentDelayRule) => {
          dMap[d.payment_method_id] =
            d.delay_days !== null ? String(d.delay_days) : "";
        });
        setEditingDelays(dMap);
      }
      if (invCatRes.data) setInvCategories(invCatRes.data);
    } finally {
      setParamLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchStores();
      fetchUsers();
      fetchParametrizations();
    }
  }, [role, fetchStores, fetchUsers, fetchParametrizations]);

  /* =========================
     User management handlers
     ========================= */
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
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email,
            password,
            role: targetRole,
            store_id: targetRole === "client" ? targetStore || null : null,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Erro ao criar usuário");
      setMessage({ type: "success", text: "Usuário criado com sucesso!" });
      setEmail("");
      setPassword("");
      setTargetStore(undefined);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error)
        setMessage({ type: "error", text: err.message });
      else setMessage({ type: "error", text: "Ocorreu um erro inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm("Deseja revogar o acesso deste usuário (remover conta)?")
    )
      return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ userId }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao excluir usuário.");
      }
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Ocorreu um erro ao excluir o usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     Goal handlers
     ========================= */
  const openGoalModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalForm({
        store_id: goal.store_id || "__global__",
        type: goal.type,
        value: String(goal.value),
        month: goal.month ? String(goal.month) : "all",
        year: goal.year
          ? String(goal.year)
          : new Date().getFullYear().toString(),
      });
    } else {
      setEditingGoal(null);
      setGoalForm({
        store_id: "__global__",
        type: "revenue_monthly",
        value: "",
        month: "all",
        year: new Date().getFullYear().toString(),
      });
    }
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      store_id: goalForm.store_id === "__global__" ? null : goalForm.store_id,
      type: goalForm.type,
      value: parseFloat(goalForm.value),
      month: goalForm.month === "all" ? null : parseInt(goalForm.month),
      year: goalForm.year ? parseInt(goalForm.year) : null,
    };

    if (editingGoal) {
      await supabase.from("goals").update(payload).eq("id", editingGoal.id);
    } else {
      await supabase.from("goals").insert([payload]);
    }
    setGoalModalOpen(false);
    fetchParametrizations();
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm("Excluir esta meta?")) return;
    await supabase.from("goals").delete().eq("id", id);
    fetchParametrizations();
  };

  /* =========================
     Category handlers
     ========================= */
  const openCatModal = (cat?: ExpenseCategory) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, type: cat.type });
    } else {
      setEditingCat(null);
      setCatForm({ name: "", type: "fixed" });
    }
    setCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      await supabase
        .from("expense_categories")
        .update({ name: catForm.name, type: catForm.type })
        .eq("id", editingCat.id);
    } else {
      await supabase
        .from("expense_categories")
        .insert([{ name: catForm.name, type: catForm.type }]);
    }
    setCatModalOpen(false);
    fetchParametrizations();
  };

  const handleToggleCat = async (cat: ExpenseCategory) => {
    await supabase
      .from("expense_categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    fetchParametrizations();
  };

  /* =========================
     Revenue Category handlers
     ========================= */
  const openRevCatModal = (cat?: RevenueCategory) => {
    if (cat) {
      setEditingRevCat(cat);
      setRevCatForm({ name: cat.name, type: cat.type });
    } else {
      setEditingRevCat(null);
      setRevCatForm({ name: "", type: "fixed" });
    }
    setRevCatModalOpen(true);
  };

  const handleSaveRevCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRevCat) {
      await supabase
        .from("revenue_categories")
        .update({ name: revCatForm.name, type: revCatForm.type })
        .eq("id", editingRevCat.id);
    } else {
      await supabase
        .from("revenue_categories")
        .insert([{ name: revCatForm.name, type: revCatForm.type }]);
    }
    setRevCatModalOpen(false);
    fetchParametrizations();
  };

  const handleToggleRevCat = async (cat: RevenueCategory) => {
    await supabase
      .from("revenue_categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    fetchParametrizations();
  };

  const handleDeleteRevCat = async (id: string) => {
    if (!window.confirm("Excluir esta categoria de entrada?")) return;
    await supabase.from("revenue_categories").delete().eq("id", id);
    fetchParametrizations();
  };

  const handleDeleteCat = async (id: string) => {
    if (!window.confirm("Excluir esta categoria?")) return;
    await supabase.from("expense_categories").delete().eq("id", id);
    fetchParametrizations();
  };

  /* =========================
     Payment Method handlers
     ========================= */
  const openPmModal = (pm?: PaymentMethod) => {
    if (pm) {
      setEditingPm(pm);
      setPmForm({
        name: pm.name,
        type: pm.type,
        fee_percentage: String(pm.fee_percentage),
        installments: String(pm.installments),
      });
    } else {
      setEditingPm(null);
      setPmForm({
        name: "",
        type: "credit",
        fee_percentage: "",
        installments: "1",
      });
    }
    setPmModalOpen(true);
  };

  const handleSavePm = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: pmForm.name,
      type: pmForm.type,
      fee_percentage: parseFloat(pmForm.fee_percentage) || 0,
      installments: parseInt(pmForm.installments) || 1,
    };
    if (editingPm) {
      await supabase
        .from("payment_methods")
        .update(payload)
        .eq("id", editingPm.id);
    } else {
      const { data } = await supabase
        .from("payment_methods")
        .insert([payload])
        .select();
      // Also create a delay rule for the new method
      if (data && data[0]) {
        await supabase
          .from("payment_delay_rules")
          .insert([
            {
              payment_method_id: data[0].id,
              delay_days: null,
              description: "Configurar dias de delay",
            },
          ]);
      }
    }
    setPmModalOpen(false);
    fetchParametrizations();
  };

  const handleDeletePm = async (id: string) => {
    if (!window.confirm("Excluir este método de pagamento?")) return;
    await supabase.from("payment_methods").delete().eq("id", id);
    fetchParametrizations();
  };

  const handleTogglePm = async (pm: PaymentMethod) => {
    await supabase
      .from("payment_methods")
      .update({ is_active: !pm.is_active })
      .eq("id", pm.id);
    fetchParametrizations();
  };

  /* =========================
     Delay Rules handler
     ========================= */
  const handleSaveDelays = async () => {
    setSavingDelays(true);
    try {
      for (const rule of delayRules) {
        const newVal = editingDelays[rule.payment_method_id];
        const newDays = newVal !== "" ? parseInt(newVal) : null;
        if (newDays !== rule.delay_days) {
          await supabase
            .from("payment_delay_rules")
            .update({ delay_days: newDays })
            .eq("id", rule.id);
        }
      }
      await fetchParametrizations();
    } finally {
      setSavingDelays(false);
    }
  };

  /* =========================
     Inventory Category handlers
     ========================= */
  const openInvCatModal = (cat?: InventoryCategory) => {
    if (cat) {
      setEditingInvCat(cat);
      setInvCatForm({ name: cat.name });
    } else {
      setEditingInvCat(null);
      setInvCatForm({ name: "" });
    }
    setInvCatModalOpen(true);
  };

  const handleSaveInvCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInvCat) {
      await supabase
        .from("inventory_categories")
        .update({ name: invCatForm.name })
        .eq("id", editingInvCat.id);
    } else {
      await supabase
        .from("inventory_categories")
        .insert([{ name: invCatForm.name }]);
    }
    setInvCatModalOpen(false);
    fetchParametrizations();
  };

  const handleToggleInvCat = async (cat: InventoryCategory) => {
    await supabase
      .from("inventory_categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    fetchParametrizations();
  };

  const handleDeleteInvCat = async (id: string) => {
    if (!window.confirm("Excluir esta categoria de estoque?")) return;
    await supabase.from("inventory_categories").delete().eq("id", id);
    fetchParametrizations();
  };

  /* =========================
     Platform settings handler
     ========================= */
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      for (const setting of platformSettings) {
        const newValue = editingSettings[setting.key];
        if (newValue !== setting.value) {
          await supabase
            .from("platform_settings")
            .update({ value: newValue, updated_at: new Date().toISOString() })
            .eq("id", setting.id);
        }
      }
      await fetchParametrizations();
    } finally {
      setSavingSettings(false);
    }
  };

  const SETTINGS_LABELS: Record<string, string> = {
    fiscal_year_start_month: "Mês de Início do Ano Fiscal",
    default_margin_target: "Meta de Margem Padrão (%)",
    working_days_per_month: "Dias Úteis por Mês",
    currency: "Moeda Padrão",
  };

  const PM_TYPE_LABELS: Record<string, string> = {
    pix: "Pix",
    debit: "Débito",
    credit: "Crédito",
  };

  /* =========================
     Access guard
     ========================= */
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

  /* =========================
     Render
     ========================= */
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

        {/* =============== USERS TAB =============== */}
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
                      autoComplete="new-password"
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
                          <p className="font-semibold text-sm">{u.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Papel:{" "}
                            {u.role === "admin" ? "Administrador" : "Cliente"}
                            {u.store_name ? ` - Loja: ${u.store_name}` : ""}
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

        {/* =============== PARAMETRIZATIONS TAB =============== */}
        <TabsContent value="general">
          {paramLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="goals" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Metas
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="flex items-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Categorias de Despesa
                </TabsTrigger>
                <TabsTrigger
                  value="rev-categories"
                  className="flex items-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Categorias de Entrada
                </TabsTrigger>
                <TabsTrigger
                  value="payment-methods"
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Métodos de Pagamento
                </TabsTrigger>
                <TabsTrigger
                  value="delay-rules"
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Projeção de Entrada
                </TabsTrigger>
                <TabsTrigger
                  value="inv-categories"
                  className="flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Categorias de Estoque
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2"
                >
                  <Sliders className="w-4 h-4" />
                  Configurações Gerais
                </TabsTrigger>
              </TabsList>

              {/* ----------- Goals Sub-Tab ----------- */}
              <TabsContent value="goals">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Metas de Faturamento e Margem</CardTitle>
                      <CardDescription className="mt-1">
                        Defina metas mensais, diárias ou de margem por loja ou
                        para toda a rede.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => openGoalModal()}
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Meta
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {goals.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center justify-center p-10 border border-dashed rounded-lg">
                        Nenhuma meta cadastrada. Clique em "Nova Meta" para
                        começar.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                          <div className="col-span-3">Loja / Escopo</div>
                          <div className="col-span-3">Tipo</div>
                          <div className="col-span-2 text-right">Valor</div>
                          <div className="col-span-2">Período</div>
                          <div className="col-span-2 text-right">Ações</div>
                        </div>
                        {goals.map((goal) => (
                          <div
                            key={goal.id}
                            className="grid grid-cols-12 gap-2 items-center px-3 py-3 border rounded-lg hover:bg-slate-50 transition-colors group"
                          >
                            <div className="col-span-3">
                              <span
                                className={`text-sm font-medium ${goal.store_id ? "text-blue-700" : "text-purple-700"}`}
                              >
                                {goal.store_name}
                              </span>
                            </div>
                            <div className="col-span-3">
                              <span className="text-sm text-slate-600">
                                {GOAL_LABELS[goal.type] || goal.type}
                              </span>
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="text-sm font-bold text-emerald-600">
                                {goal.type === "margin_target"
                                  ? `${goal.value}%`
                                  : fmt(goal.value)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-xs text-slate-500">
                                {goal.month
                                  ? `${MONTHS[goal.month - 1]}`
                                  : "Geral"}{" "}
                                {goal.year || ""}
                              </span>
                            </div>
                            <div className="col-span-2 flex justify-end gap-1">
                              <button
                                onClick={() => openGoalModal(goal)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------- Categories Sub-Tab ----------- */}
              <TabsContent value="categories">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Categorias de Despesa</CardTitle>
                      <CardDescription className="mt-1">
                        Gerencie as categorias padrão para lançamento de
                        despesas nas lojas.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => openCatModal()}
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Categoria
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Table header */}
                      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                        <div className="col-span-4">Nome</div>
                        <div className="col-span-3">Tipo</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3 text-right">Ações</div>
                      </div>
                      {expCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className={`grid grid-cols-12 gap-2 items-center px-3 py-3 border rounded-lg hover:bg-slate-50 transition-colors group ${!cat.is_active ? "opacity-50" : ""}`}
                        >
                          <div className="col-span-4">
                            <span className="text-sm font-medium text-slate-700">
                              {cat.name}
                            </span>
                          </div>
                          <div className="col-span-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                cat.type === "fixed"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-cyan-100 text-cyan-700"
                              }`}
                            >
                              {cat.type === "fixed" ? "Fixo" : "Variável"}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <button
                              onClick={() => handleToggleCat(cat)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${
                                cat.is_active
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {cat.is_active ? "Ativo" : "Inativo"}
                            </button>
                          </div>
                          <div className="col-span-3 flex justify-end gap-1">
                            <button
                              onClick={() => openCatModal(cat)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCat(cat.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------- Revenue Categories Sub-Tab ----------- */}
              <TabsContent value="rev-categories">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Categorias de Entrada</CardTitle>
                      <CardDescription className="mt-1">
                        Gerencie as categorias padrão para lançamento de
                        entradas (receitas) nas lojas.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => openRevCatModal()}
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Categoria
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Table header */}
                      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                        <div className="col-span-4">Nome</div>
                        <div className="col-span-3">Tipo</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3 text-right">Ações</div>
                      </div>
                      {revCategories.length === 0 ? (
                        <div className="text-sm text-muted-foreground flex items-center justify-center p-10 border border-dashed rounded-lg">
                          Nenhuma categoria de entrada cadastrada.
                        </div>
                      ) : (
                        revCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`grid grid-cols-12 gap-2 items-center px-3 py-3 border rounded-lg hover:bg-slate-50 transition-colors group ${!cat.is_active ? "opacity-50" : ""}`}
                          >
                            <div className="col-span-4">
                              <span className="text-sm font-medium text-slate-700">
                                {cat.name}
                              </span>
                            </div>
                            <div className="col-span-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                  cat.type === "fixed"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-cyan-100 text-cyan-700"
                                }`}
                              >
                                {cat.type === "fixed" ? "Fixo" : "Variável"}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <button
                                onClick={() => handleToggleRevCat(cat)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${
                                  cat.is_active
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {cat.is_active ? "Ativo" : "Inativo"}
                              </button>
                            </div>
                            <div className="col-span-3 flex justify-end gap-1">
                              <button
                                onClick={() => openRevCatModal(cat)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRevCat(cat.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------- General Settings Sub-Tab ----------- */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Configurações Gerais da Plataforma</CardTitle>
                      <CardDescription className="mt-1">
                        Parâmetros que impactam cálculos e exibições em toda a
                        plataforma.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {savingSettings ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {platformSettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 border rounded-lg bg-slate-50/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700">
                              {SETTINGS_LABELS[setting.key] || setting.key}
                            </p>
                            {setting.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          <div className="w-full sm:w-48">
                            <Input
                              value={editingSettings[setting.key] || ""}
                              onChange={(e) =>
                                setEditingSettings((prev) => ({
                                  ...prev,
                                  [setting.key]: e.target.value,
                                }))
                              }
                              className="bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------- Payment Methods Sub-Tab ----------- */}
              <TabsContent value="payment-methods">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Métodos de Pagamento</CardTitle>
                      <CardDescription className="mt-1">
                        Gerencie os métodos de pagamento aceitos e suas
                        respectivas taxas de maquininha.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => openPmModal()}
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Plus className="w-4 h-4" /> Novo Método
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                        <div className="col-span-3">Nome</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-2 text-right">Taxa (%)</div>
                        <div className="col-span-1 text-right">Parcelas</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Ações</div>
                      </div>
                      {paymentMethods.map((pm) => (
                        <div
                          key={pm.id}
                          className={`grid grid-cols-12 gap-2 items-center px-3 py-3 border rounded-lg hover:bg-slate-50 transition-colors group ${!pm.is_active ? "opacity-50" : ""}`}
                        >
                          <div className="col-span-3">
                            <span className="text-sm font-medium text-slate-700">
                              {pm.name}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-full ${pm.type === "pix" ? "bg-emerald-100 text-emerald-700" : pm.type === "debit" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                            >
                              {PM_TYPE_LABELS[pm.type] || pm.type}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-bold text-slate-700">
                              {pm.fee_percentage}%
                            </span>
                          </div>
                          <div className="col-span-1 text-right">
                            <span className="text-sm text-slate-600">
                              {pm.installments}x
                            </span>
                          </div>
                          <div className="col-span-2">
                            <button
                              onClick={() => handleTogglePm(pm)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${pm.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                            >
                              {pm.is_active ? "Ativo" : "Inativo"}
                            </button>
                          </div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <button
                              onClick={() => openPmModal(pm)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePm(pm.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------- Delay Rules Sub-Tab ----------- */}
              <TabsContent value="delay-rules">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>
                        Projeção de Entrada (Delay de Recebimento)
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configure quantos dias úteis cada método de pagamento
                        demora para o dinheiro entrar na conta.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleSaveDelays}
                      disabled={savingDelays}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {savingDelays ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentMethods
                        .filter((pm) => pm.is_active)
                        .map((pm) => {
                          const rule = delayRules.find(
                            (r) => r.payment_method_id === pm.id,
                          );
                          return (
                            <div
                              key={pm.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 border rounded-lg bg-slate-50/50"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-700">
                                  {pm.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Taxa: {pm.fee_percentage}% · {pm.installments}
                                  x
                                </p>
                              </div>
                              <div className="w-full sm:w-48 flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="—"
                                  value={editingDelays[pm.id] || ""}
                                  onChange={(e) =>
                                    setEditingDelays((prev) => ({
                                      ...prev,
                                      [pm.id]: e.target.value,
                                    }))
                                  }
                                  className="bg-white"
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  dias
                                </span>
                              </div>
                              {rule && editingDelays[pm.id] && (
                                <p className="text-xs text-blue-600">
                                  Recebe em {editingDelays[pm.id]} dia(s)
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ----------- Inventory Categories Sub-Tab ----------- */}
              <TabsContent value="inv-categories">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Categorias de Estoque</CardTitle>
                      <CardDescription className="mt-1">
                        Gerencie as categorias para organizar itens de estoque
                        nas lojas.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => openInvCatModal()}
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Plus className="w-4 h-4" /> Nova Categoria
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                        <div className="col-span-5">Nome</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-4 text-right">Ações</div>
                      </div>
                      {invCategories.length === 0 ? (
                        <div className="text-sm text-muted-foreground flex items-center justify-center p-10 border border-dashed rounded-lg">
                          Nenhuma categoria de estoque cadastrada.
                        </div>
                      ) : (
                        invCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`grid grid-cols-12 gap-2 items-center px-3 py-3 border rounded-lg hover:bg-slate-50 transition-colors group ${!cat.is_active ? "opacity-50" : ""}`}
                          >
                            <div className="col-span-5">
                              <span className="text-sm font-medium text-slate-700">
                                {cat.name}
                              </span>
                            </div>
                            <div className="col-span-3">
                              <button
                                onClick={() => handleToggleInvCat(cat)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${cat.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                              >
                                {cat.is_active ? "Ativo" : "Inativo"}
                              </button>
                            </div>
                            <div className="col-span-4 flex justify-end gap-1">
                              <button
                                onClick={() => openInvCatModal(cat)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteInvCat(cat.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>

      {/* =============== GOAL MODAL =============== */}
      {goalModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingGoal ? "Editar Meta" : "Nova Meta"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Escopo</Label>
                <Select
                  value={goalForm.store_id}
                  onValueChange={(v) =>
                    setGoalForm((p) => ({ ...p, store_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__global__">
                      Geral (Toda a Rede)
                    </SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Meta</Label>
                <Select
                  value={goalForm.type}
                  onValueChange={(v) => setGoalForm((p) => ({ ...p, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue_monthly">
                      Meta Entrada Mensal
                    </SelectItem>
                    <SelectItem value="revenue_daily">
                      Meta Entrada Diária
                    </SelectItem>
                    <SelectItem value="expense_monthly">
                      Meta Despesa Mensal
                    </SelectItem>
                    <SelectItem value="margin_target">
                      Meta de Margem (%)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Valor {goalForm.type === "margin_target" ? "(%)" : "(R$)"} *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={goalForm.value}
                    onChange={(e) =>
                      setGoalForm((p) => ({ ...p, value: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ano</Label>
                  <Input
                    type="number"
                    placeholder={new Date().getFullYear().toString()}
                    value={goalForm.year}
                    onChange={(e) =>
                      setGoalForm((p) => ({ ...p, year: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Mês (vazio = meta geral/anual)
                </Label>
                <Select
                  value={goalForm.month}
                  onValueChange={(v) =>
                    setGoalForm((p) => ({ ...p, month: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingGoal ? "Salvar Alterações" : "Criar Meta"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* =============== CATEGORY MODAL =============== */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCat ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSaveCat} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da Categoria *</Label>
                <Input
                  value={catForm.name}
                  onChange={(e) =>
                    setCatForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Aluguel"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo *</Label>
                <Select
                  value={catForm.type}
                  onValueChange={(v) => setCatForm((p) => ({ ...p, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixo</SelectItem>
                    <SelectItem value="variable">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingCat ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </form>
          </div>
        </div>
      )}
      {/* =============== REVENUE CATEGORY MODAL =============== */}
      {revCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingRevCat
                  ? "Editar Categoria de Entrada"
                  : "Nova Categoria de Entrada"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRevCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSaveRevCat} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da Categoria *</Label>
                <Input
                  value={revCatForm.name}
                  onChange={(e) =>
                    setRevCatForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Lavagem Comum"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo *</Label>
                <Select
                  value={revCatForm.type}
                  onValueChange={(v) =>
                    setRevCatForm((p) => ({ ...p, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixo</SelectItem>
                    <SelectItem value="variable">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingRevCat ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* =============== PAYMENT METHOD MODAL =============== */}
      {pmModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingPm ? "Editar Método" : "Novo Método de Pagamento"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSavePm} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input
                  value={pmForm.name}
                  onChange={(e) =>
                    setPmForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Crédito 6x"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo *</Label>
                <Select
                  value={pmForm.type}
                  onValueChange={(v) => setPmForm((p) => ({ ...p, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Taxa (%) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={pmForm.fee_percentage}
                    onChange={(e) =>
                      setPmForm((p) => ({
                        ...p,
                        fee_percentage: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={pmForm.installments}
                    onChange={(e) =>
                      setPmForm((p) => ({ ...p, installments: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingPm ? "Salvar Alterações" : "Criar Método"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* =============== INVENTORY CATEGORY MODAL =============== */}
      {invCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingInvCat
                  ? "Editar Categoria de Estoque"
                  : "Nova Categoria de Estoque"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInvCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSaveInvCat} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da Categoria *</Label>
                <Input
                  value={invCatForm.name}
                  onChange={(e) =>
                    setInvCatForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Detergentes"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingInvCat ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
