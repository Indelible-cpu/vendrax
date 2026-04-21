import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Search, Calendar, UserCheck, ArrowRightCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../hooks/useToast';

interface Credit {
  id: number;
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  original_amount: number;
  paid_amount: number;
  due_date: string;
  days_late: number;
  interest: number;
  current_total: number;
  status: 'Pending' | 'Late' | 'Paid';
}

export default function CreditsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ id: number, total: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const { data: credits, isLoading } = useQuery({
    queryKey: ['credits'],
    queryFn: async () => {
      const res = await api.get('/CreditController/list');
      return res.data.data as Credit[];
    }
  });

  const payMutation = useMutation({
    mutationFn: async (data: { id: number, amount: number }) => {
      return api.post('/CreditController/recordPayment', data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['credits'] });
      setPaymentModal(null);
      setPayAmount('');
      showToast('Payment received and balance updated.');
    }
  });

  const filtered = credits?.filter(c => 
    c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10 h-full w-full animate-slide-in p-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Credit Management</h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Track customer balances and payments.</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="text-right border-r border-slate-100 pr-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Balances</p>
              <p className="text-lg font-black text-slate-800 tracking-tighter">MK {(filtered?.reduce((acc, c) => acc + (c.current_total - c.paid_amount), 0) ?? 0).toLocaleString()}</p>
           </div>
           <UserCheck className="w-8 h-8 text-primary opacity-20" />
        </div>
      </header>

      <div className="premium-card p-4 border-none flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            placeholder="FILTER BY CUSTOMER NAME OR INVOICE #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-slate-50/50 rounded-2xl border border-slate-100 outline-none font-black text-xs uppercase tracking-[0.1em] focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="premium-card border-none overflow-hidden flex flex-col flex-1 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/50">
                <th className="px-10 py-6">Customer</th>
                <th className="px-10 py-6">Invoice #</th>
                <th className="px-10 py-6">Due Date</th>
                <th className="px-10 py-6 text-right">Original Amt</th>
                <th className="px-10 py-6 text-right">Late Fees</th>
                <th className="px-10 py-6 text-right">Balance Due</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {isLoading ? (
                <tr><td colSpan={8} className="p-20 text-center uppercase text-[10px] font-black text-slate-300 tracking-[0.3em] animate-pulse">Loading balances...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={8} className="p-20 text-center uppercase text-[10px] font-black text-slate-300 tracking-[0.2em]">No outstanding balances found.</td></tr>
              ) : filtered?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-8">
                    <p className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight group-hover:text-primary transition-colors">{c.customer_name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{c.customer_phone}</p>
                  </td>
                  <td className="px-10 py-8 text-[11px] font-black text-slate-500 font-mono tracking-widest">#{c.invoice_no}</td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                       <Calendar className="w-4 h-4 text-slate-300" />
                       <span className={`text-xs font-black tracking-tight ${c.status === 'Late' ? 'text-rose-600' : 'text-slate-600'}`}>{c.due_date}</span>
                    </div>
                    {c.days_late > 0 && <p className="text-[9px] font-black text-rose-500 uppercase mt-2 animate-pulse">{c.days_late} Days Overdue</p>}
                  </td>
                  <td className="px-10 py-8 text-right text-sm font-black text-slate-600 tracking-tighter">MK {c.original_amount.toLocaleString()}</td>
                  <td className="px-10 py-8 text-right text-sm font-black text-rose-500 tracking-tighter">MK {c.interest.toLocaleString()}</td>
                  <td className="px-10 py-8 text-right">
                    <p className="text-lg font-black text-slate-900 tracking-tighter">MK {c.current_total.toLocaleString()}</p>
                    {c.paid_amount > 0 && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Paid: MK {c.paid_amount.toLocaleString()}</p>}
                  </td>
                  <td className="px-10 py-8 text-center">
                     <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-inner ${
                        c.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                        c.status === 'Late' ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-50 text-slate-400'
                     }`}>
                        {c.status}
                     </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    {c.status !== 'Paid' && (
                       <button 
                          onClick={() => { setPaymentModal({ id: c.id, total: c.current_total - c.paid_amount }); setPayAmount(String(c.current_total - c.paid_amount)); }}
                          className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
                          title="Record a payment for this balance"
                       >
                          Pay Balance <ArrowRightCircle className="w-4 h-4" />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paymentModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-blur-fade" onClick={() => setPaymentModal(null)}>
           <div className="premium-card w-full max-w-md overflow-hidden animate-slide-in border-none shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <header className="px-10 py-8 border-b border-slate-50 bg-white flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pay Balance</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Record a customer payment.</p>
                 </div>
                 <button onClick={() => setPaymentModal(null)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900" title="Close modal"><X className="w-5 h-5" /></button>
              </header>
              <div className="p-10 space-y-10">
                 <div className="space-y-3">
                    <label htmlFor="pay-amt-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount (MK)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm font-mono">MK</span>
                       <input 
                          id="pay-amt-input"
                          type="number"
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          className="w-full pl-16 pr-6 py-6 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-black text-2xl text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" 
                       />
                    </div>
                    <div className="flex justify-between px-2 pt-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Balance</span>
                       <span className="text-xs font-black text-slate-800 font-mono">MK {paymentModal.total.toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setPaymentModal(null)} className="flex-1 py-5 bg-white border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                    <button 
                       onClick={() => payMutation.mutate({ id: paymentModal.id, amount: Number(payAmount) })}
                       disabled={payMutation.isPending}
                       className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                    >
                       {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
