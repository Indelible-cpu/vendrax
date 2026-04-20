import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit2, 
  X, 
  AlertCircle,
  ArrowDownCircle,
  FileText
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  created_by: string;
}

interface ExpenseSummary {
  total: number;
  count: number;
  by_category: { category: string, total: number }[];
}

export default function ExpensesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('monthly'); 
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', searchTerm, dateRange],
    queryFn: async () => {
      const { from, to } = dateRange;
      const res = await api.get(`/ExpenseController/fetch?q=${searchTerm}&from=${from}&to=${to}`);
      return (res.data.data as Expense[]) || [];
    }
  });

  const { data: summary } = useQuery<ExpenseSummary>({
    queryKey: ['expense-summary', dateRange],
    queryFn: async () => {
      const { from, to } = dateRange;
      const res = await api.get(`/ExpenseController/getSummary?from=${from}&to=${to}`);
      return res.data.data as ExpenseSummary || { total: 0, count: 0, by_category: [] };
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

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Expense>) => api.post('/ExpenseController/save', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      setIsModalOpen(false);
      showToast('Expense saved successfully.', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr.response?.data?.message || 'Failed to save expense', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.post('/ExpenseController/delete', { id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      setIsConfirmOpen(false);
      showToast('Expense record deleted.', 'success');
    }
  });

  const handleAdd = () => {
    setEditingExpense({
      category: 'Utilities',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash'
    });
    setIsModalOpen(true);
  };

  const categories = ['Utilities', 'Stock Purchase', 'Salaries', 'Rent', 'Maintenance', 'Marketing', 'Other'];

  return (
    <div className="flex flex-col gap-10 h-full w-full animate-slide-in p-2 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Business Expenses</h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Track and manage your daily operational costs.</p>
        </div>
        <button onClick={handleAdd} className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 text-xs uppercase tracking-widest" title="Record a new expense">
          <Plus className="w-5 h-5" /> Add New Expense
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="premium-card p-8 border-none flex items-center gap-8 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <ArrowDownCircle className="w-8 h-8" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Spent</p>
               <p className="text-3xl font-black text-slate-800 tracking-tighter">MK {summary?.total.toLocaleString() ?? 0}</p>
            </div>
         </div>
         <div className="grid grid-cols-2 gap-4 col-span-2">
            {summary?.by_category.slice(0, 4).map((cat, i) => (
                <div key={i} className="premium-card p-4 border-none flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{cat.category}</p>
                   <p className="font-black text-slate-800 text-sm tracking-tighter">MK {cat.total.toLocaleString()}</p>
                </div>
            ))}
         </div>
      </div>

      <div className="premium-card p-4 border-none flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="SEARCH BY DESCRIPTION OR CATEGORY..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-16 pr-6 py-5 bg-slate-50/50 rounded-2xl border border-slate-100 outline-none font-black text-xs uppercase tracking-widest focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" 
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <select 
                 value={period} 
                 onChange={handlePeriodChange}
                 title="Select Filter Period"
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
        </div>
      </div>

      <div className="premium-card border-none overflow-hidden flex flex-col flex-1 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
               <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/50">
                     <th className="px-10 py-6">Expense Detail</th>
                     <th className="px-10 py-6">Category</th>
                     <th className="px-10 py-6">Amount</th>
                     <th className="px-10 py-6">Payment Method</th>
                     <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50/50">
                  {isLoading ? (
                      <tr><td colSpan={5} className="p-20 text-center uppercase text-[10px] font-black text-slate-300 tracking-[0.3em] animate-pulse">Loading expense records...</td></tr>
                  ) : expenses?.map(exp => (
                     <tr key={exp.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                                 <FileText className="w-6 h-6 text-slate-300 group-hover:text-rose-500 transition-colors" />
                              </div>
                              <div>
                                 <p className="font-black text-slate-800 text-sm tracking-tight mb-1 group-hover:text-primary transition-colors">{exp.description || 'No description'}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recorded: {exp.date}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <span className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-inner">{exp.category}</span>
                        </td>
                        <td className="px-10 py-8">
                           <p className="text-lg font-black text-rose-500 tracking-tighter">MK {exp.amount.toLocaleString()}</p>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-slate-300" />
                              <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{exp.payment_method}</span>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }} title="Edit this expense record" className="p-3 bg-white text-slate-400 border border-slate-100 hover:text-primary hover:shadow-md rounded-xl transition-all active:scale-95"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => { setSelectedExpenseId(exp.id); setIsConfirmOpen(true); }} title="Delete this expense" className="p-3 bg-white text-slate-400 border border-slate-100 hover:text-rose-500 hover:shadow-md rounded-xl transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-blur-fade" onClick={() => setIsModalOpen(false)}>
           <div className="premium-card w-full max-w-lg overflow-hidden animate-slide-in border-none shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <header className="px-10 py-8 border-b border-slate-50 bg-white flex justify-between items-center">
                 <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingExpense?.id ? 'Edit Expense' : 'Add New Expense'}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Record your operational cost details.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} title="Close Modal" className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><X className="w-5 h-5" /></button>
              </header>

              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingExpense!); }} className="p-10 space-y-10">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                       <select 
                          title="Select Expense Category"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer appearance-none"
                          value={editingExpense?.category}
                          onChange={(e) => setEditingExpense({...editingExpense!, category: e.target.value})}
                       >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                       <input 
                          type="date" 
                          title="Select Date"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer" 
                          value={editingExpense?.date}
                          onChange={(e) => setEditingExpense({...editingExpense!, date: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (MK)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm font-mono">MK</span>
                       <input 
                          type="number" 
                          required
                          className="w-full pl-16 pr-6 py-6 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-black text-3xl text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" 
                          placeholder="0.00"
                          value={editingExpense?.amount}
                          onChange={(e) => setEditingExpense({...editingExpense!, amount: Number(e.target.value)})}
                       />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Notes</label>
                    <textarea 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all min-h-[120px]"
                       placeholder="What was this expense for?"
                       value={editingExpense?.description}
                       onChange={(e) => setEditingExpense({...editingExpense!, description: e.target.value})}
                    />
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white border border-slate-100 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em]">
                       {saveMutation.isPending ? 'Processing...' : 'Save Expense'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-blur-fade">
           <div className="premium-card w-full max-w-sm p-10 text-center border-none shadow-2xl animate-slide-in">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Delete Record?</h3>
              <p className="text-sm font-bold text-slate-400 mb-10 uppercase tracking-tight opacity-60">This action will permanently delete this expense record.</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                 <button onClick={() => deleteMutation.mutate(selectedExpenseId!)} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all">Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
