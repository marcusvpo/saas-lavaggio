import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface StoreMetric {
  id: string;
  name: string;
  type: string;
  isSofn: boolean;
  revenue: number;
  expenses: number;
  margin: number;
  share: number;
}

export interface DashboardMetrics {
  stores: StoreMetric[];
  totalRevenue: number;
  totalExpenses: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  profit: number;
  averageMargin: number;
  averageTicket: number;
  revenueHistory: { month: string; revenue: number }[];
  isLoading: boolean;
}

// Categories considered as "fixed costs"
const FIXED_COST_CATEGORIES = [
  'aluguel', 'folha', 'salário', 'salario', 'condomínio', 'condominio',
  'contador', 'internet', 'telefone', 'seguro', 'iptu',
];

interface DateFilterParams {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export function useFetchDashboard(dateFilter?: DateFilterParams) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    stores: [],
    totalRevenue: 0,
    totalExpenses: 0,
    totalFixedCosts: 0,
    totalVariableCosts: 0,
    profit: 0,
    averageMargin: 0,
    averageTicket: 0,
    revenueHistory: [],
    isLoading: true,
  });

  const startDate = dateFilter?.start ?? `${new Date().getFullYear()}-01-01`;
  const endDate = dateFilter?.end ?? `${new Date().getFullYear()}-12-31`;

  useEffect(() => {
    async function loadData() {
      try {
        setMetrics(prev => ({ ...prev, isLoading: true }));

        const { data: storesList } = await supabase.from('stores').select('*');
        const { data: revenues } = await supabase
          .from('revenues')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);
        const { data: expenses } = await supabase
          .from('expenses')
          .select('*')
          .gte('due_date', startDate)
          .lte('due_date', endDate);

        const storesData = storesList || [];
        const revData = revenues || [];
        const expData = expenses || [];

        let totalNetworkRevenue = 0;
        let totalNetworkExpenses = 0;
        let totalPieces = 0;
        let totalFixed = 0;
        let totalVariable = 0;

        // Classify costs
        expData.forEach(e => {
          const cat = (e.category || '').toLowerCase().trim();
          const amount = Number(e.amount || 0);
          const isFixed = FIXED_COST_CATEGORIES.some(fc => cat.includes(fc));
          if (isFixed) {
            totalFixed += amount;
          } else {
            totalVariable += amount;
          }
        });

        // Caching values per store
        const storeAggregations = storesData.map((store) => {
          const sRevs = revData.filter((r) => r.store_id === store.id);
          const sExps = expData.filter((e) => e.store_id === store.id);

          const totalRev = sRevs.reduce((acc, r) => acc + Number(r.total_amount || 0), 0);
          const totalExp = sExps.reduce((acc, e) => acc + Number(e.amount || 0), 0);
          
          totalPieces += sRevs.reduce((acc, r) => acc + Number(r.pieces_count || 0), 0);
          
          totalNetworkRevenue += totalRev;
          totalNetworkExpenses += totalExp;

          let margin = 0;
          if (totalRev > 0) {
            margin = ((totalRev - totalExp) / totalRev) * 100;
          }

          return {
            id: store.id,
            name: store.name,
            type: store.type,
            isSofn: store.type === 'sofn',
            revenue: totalRev,
            expenses: totalExp,
            margin: Math.round(margin),
            share: 0,
          };
        });

        // Calculate share
        const storesExt = storeAggregations.map(s => ({
          ...s,
          share: totalNetworkRevenue > 0 ? Math.round((s.revenue / totalNetworkRevenue) * 100) : 0
        }));

        let netMargin = 0;
        if (totalNetworkRevenue > 0) {
          netMargin = ((totalNetworkRevenue - totalNetworkExpenses) / totalNetworkRevenue) * 100;
        }

        const avgTicket = totalPieces > 0 ? (totalNetworkRevenue / totalPieces) : 0;

        // Revenue history by month
        const historyMap: Record<number, number> = {};
        revData.forEach(r => {
          if (r.date) {
            const m = new Date(r.date).getMonth();
            historyMap[m] = (historyMap[m] || 0) + Number(r.total_amount || 0);
          }
        });
        
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const historyData = monthNames.map((month, i) => ({
          month,
          revenue: historyMap[i] || 0,
        }));

        setMetrics({
          stores: storesExt,
          totalRevenue: totalNetworkRevenue,
          totalExpenses: totalNetworkExpenses,
          totalFixedCosts: totalFixed,
          totalVariableCosts: totalVariable,
          profit: totalNetworkRevenue - totalNetworkExpenses,
          averageMargin: isNaN(netMargin) ? 0 : Number(netMargin.toFixed(1)),
          averageTicket: isNaN(avgTicket) ? 0 : Number(avgTicket.toFixed(2)),
          revenueHistory: historyData,
          isLoading: false
        });
      } catch (err) {
        console.error("Dashboard fetch error", err);
        setMetrics(prev => ({ ...prev, isLoading: false }));
      }
    }

    loadData();
  }, [startDate, endDate]);

  return metrics;
}
