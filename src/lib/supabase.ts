import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
    "https://projeto-sem-env-configurado-no-vercel.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
    "chave-publica-nao-configurada";

if (supabaseUrl.includes("projeto-sem-env-configurado")) {
    console.warn(
        "⚠️ VARIÁVEIS DO SUPABASE AUSENTES: Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas Environment Variables do Vercel.",
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
