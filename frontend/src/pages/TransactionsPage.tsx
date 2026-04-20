import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { TrendingUp, Search, ArrowLeftRight, Trash2, RotateCcw, Download, Eye, AlertCircle } from 'lucide-react';

interface Transaction {
  id: number;
  invoice_no: string;
  receipt_no: string;
  total: number;
  profit: number;
  payment_mode: string;
  paid: number;
  cashier: string;
  created_at: string;
  tax_amount?: number;
  is_credit?: boolean;
  customer_name?: string;
}

interface SummaryData {
  total_sales: number;
  revenue: number;
  profit: number;
}

const getInitialDates = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: format(now), to: format(now) };
};

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState(getInitialDates());
  const [viewDeleted, setViewDeleted] = useState(false);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', searchTerm, dateRange, viewDeleted],
    queryFn: async () => {
      const { from, to } = dateRange;
      const res = await api.get(`/ReportController/fetchTransactions?q=${searchTerm}&from=${from}&to=${to}&deleted=${viewDeleted ? 1 : 0}`);
      return (res.data.data as Transaction[]) || [];
    }
  });

  const { data: summary } = useQuery<SummaryData>({
    queryKey: ['report-summary', dateRange],
    queryFn: async () => {
      const { from, to } = dateRange;
      const res = await api.get(`/ReportController/getSummary?from=${from}&to=${to}`);
      return (res.data.data as SummaryData) || { total_sales: 0, revenue: 0, profit: 0 };
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.get(`/ReportController/softDelete?id=${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => api.get(`/ReportController/restore?id=${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPeriod(val);
    
    if (val === 'custom') return;
    
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    let from = '';
    let to = '';
    
    if (val === 'daily') {
      from = format(now);
      to = format(now);
    } else if (val === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      from = format(start);
      to = format(end);
    } else if (val === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      from = format(start);
      to = format(end);
    } else if (val === 'quarterly') {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      const end = new Date(now.getFullYear(), q * 3 + 3, 0);
      from = format(start);
      to = format(end);
    } else if (val === 'annually') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      from = format(start);
      to = format(end);
    }
    
    setDateRange({ from, to });
  };

  const handlePrint = (id: number) => {
    const win = window.open(`/print_receipt.php?id=${id}`, '_blank');
    if (win) win.focus();
  };

  return (
    <div className="flex flex-col gap-10 h-full w-full animate-slide-in p-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Sales History</h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Detailed records of all completed transactions.</p>
        </div>
        <button type="button" className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 text-xs uppercase tracking-widest" title="Export current results to Excel">
          <Download className="w-5 h-5" /> Export Report
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-8 border-none group hover:shadow-xl transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Sales</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">{summary?.total_sales ?? 0}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] font-black text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
            <TrendingUp className="w-3 h-3" /> Performance Stable
          </div>
        </div>
        <div className="premium-card p-8 border-none group hover:shadow-xl transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Gross Revenue</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">MK {summary?.revenue?.toLocaleString() ?? 0}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 text-[9px] font-bold text-slate-400 uppercase">Total Sales Value</div>
        </div>
        <div className="premium-card p-8 bg-primary text-white border-none shadow-xl shadow-primary/20">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-2">Net Profit</p>
          <p className="text-3xl font-black tracking-tighter">MK {summary?.profit?.toLocaleString() ?? 0}</p>
          <div className="mt-4 pt-4 border-t border-white/10 text-[9px] font-bold opacity-60 uppercase tracking-widest">Calculated Margin</div>
        </div>
      </div>

      <div className="premium-card p-4 border-none flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input type="text" placeholder="SEARCH INVOICE # OR CUSTOMER..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50/50 rounded-2xl border border-slate-100 outline-none font-black text-xs uppercase tracking-widest focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <select 
                 value={period} 
                 onChange={handlePeriodChange}
                 title="Select Date Filter"
                 className="bg-transparent border-none px-4 py-2 rounded-xl text-xs font-black uppercase outline-none text-slate-600 cursor-pointer appearance-none"
              >
                 <option value="daily">Today</option>
                 <option value="weekly">This Week</option>
                 <option value="monthly">This Month</option>
                 <option value="quarterly">Quarter</option>
                 <option value="annually">Yearly</option>
                 <option value="custom">Pick Dates</option>
              </select>

              {period === 'custom' && (
                <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                  <input type="date" title="Start Date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent border-none p-1 text-[10px] font-black uppercase outline-none text-slate-900" />
                  <span className="text-slate-300 text-[9px] font-black">TO</span>
                  <input type="date" title="End Date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent border-none p-1 text-[10px] font-black uppercase outline-none text-slate-900" />
                </div>
              )}
           </div>
           <button type="button" onClick={() => setViewDeleted(!viewDeleted)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${viewDeleted ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-200' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm hover:shadow-md'}`}>
             {viewDeleted ? 'Show Active' : 'Show Deleted'}
           </button>
        </div>
      </div>

      <div className="premium-card border-none overflow-hidden flex flex-col flex-1 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/50">
                <th className="px-10 py-6">Transaction Ref</th>
                <th className="px-10 py-6">Sale Amount</th>
                <th className="px-10 py-6">Payment Mode</th>
                <th className="px-10 py-6">Cashier</th>
                <th className="px-10 py-6">Date & Time</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-20 text-center uppercase text-[10px] font-black text-slate-300 tracking-[0.3em] animate-pulse">Fetching history records...</td></tr>
              ) : transactions?.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-8">
                     <p className="font-black text-slate-800 text-sm mb-1 group-hover:text-primary transition-colors">#{t.invoice_no}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase opacity-60 font-mono italic">{t.receipt_no}</p>
                  </td>
                  <td className="px-10 py-8">
                     <p className="font-black text-slate-900 text-lg tracking-tighter">MK {t.total.toLocaleString()}</p>
                     <p className="text-[10px] uppercase font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mt-1 tracking-tighter">Profit: MK {t.profit.toLocaleString()}</p>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t.is_credit ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                           {t.is_credit ? <AlertCircle className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`font-black text-xs uppercase leading-none mb-1 ${t.is_credit ? 'text-rose-600' : 'text-slate-800'}`}>{t.payment_mode}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t.is_credit ? 'Credit Balance' : `Received: MK ${t.paid.toLocaleString()}`}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{t.cashier.charAt(0)}</div>
                        <div>
                           <span className="font-black text-slate-800 tracking-tight block text-sm">@{t.cashier}</span>
                           {t.customer_name && <span className="text-[9px] font-black text-primary uppercase">To: {t.customer_name}</span>}
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{new Date(t.created_at).toLocaleDateString()}</p>
                     <p className="text-[10px] font-bold text-slate-400 opacity-60">{new Date(t.created_at).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button type="button" onClick={() => handlePrint(t.id)} title="View full receipt details" className="p-3 bg-white text-slate-400 border border-slate-100 hover:text-primary hover:shadow-md rounded-xl transition-all active:scale-95"><Eye className="w-4 h-4" /></button>
                        {viewDeleted ? (
                          <button type="button" onClick={() => restoreMutation.mutate(t.id)} title="Restore deleted transaction" className="p-3 bg-white text-slate-400 border border-slate-100 hover:text-emerald-500 hover:shadow-md rounded-xl transition-all active:scale-95"><RotateCcw className="w-4 h-4" /></button>
                        ) : (
                          <button type="button" onClick={() => deleteMutation.mutate(t.id)} title="Delete this transaction" className="p-3 bg-white text-slate-400 border border-slate-100 hover:text-rose-500 hover:shadow-md rounded-xl transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
