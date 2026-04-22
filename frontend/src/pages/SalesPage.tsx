import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/posDB';
import { 
  Receipt, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { db, type LocalSale, type LocalSaleItem } from '../db/posDB';

const SalesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<LocalSale | null>(null);

  // Load all sales from Dexie
  const sales = useLiveQuery(
    () => db.salesQueue.reverse().toArray()
  );

  const filteredSales = sales?.filter(s => 
    s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.paymentMode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculations
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales?.filter(s => s.createdAt.startsWith(today)) || [];
  const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = todaySales.reduce((sum, s) => {
    const saleProfit = s.items.reduce((pSum, item) => pSum + (item.profit || 0), 0);
    return sum + saleProfit;
  }, 0);

  return (
    <div className="flex flex-col min-h-screen bg-surface-bg transition-all pb-24 md:pb-0">
      {/* Dashboard Header */}
      <header className="p-6 bg-surface-card border-b border-surface-border sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-600/10 text-primary-400 rounded-xl flex items-center justify-center border border-primary-600/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Sales & Profit</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-surface-bg border border-surface-border p-4 rounded-2xl">
             <div className="flex items-center gap-2 mb-2 text-surface-text/40">
                <DollarSign className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Today's Revenue</span>
             </div>
             <div className="text-xl font-black text-primary-400 leading-none">MK {totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-surface-bg border border-surface-border p-4 rounded-2xl">
             <div className="flex items-center gap-2 mb-2 text-surface-text/40">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Today's Profit</span>
             </div>
             <div className="text-xl font-black text-accent-success leading-none">MK {totalProfit.toLocaleString()}</div>
          </div>
          <div className="hidden lg:block bg-surface-bg border border-surface-border p-4 rounded-2xl">
             <div className="flex items-center gap-2 mb-2 text-surface-text/40">
                <Receipt className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Transactions</span>
             </div>
             <div className="text-xl font-black text-surface-text leading-none">{todaySales.length}</div>
          </div>
          <div className="hidden lg:block bg-surface-bg border border-surface-border p-4 rounded-2xl">
             <div className="flex items-center gap-2 mb-2 text-surface-text/40">
                <Package className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Items Sold</span>
             </div>
             <div className="text-xl font-black text-surface-text leading-none">
                {todaySales.reduce((sum, s) => sum + s.itemsCount, 0)}
             </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-text/40 w-5 h-5" />
          <input 
            title="Search Invoices"
            type="text" 
            placeholder="Search invoice number or payment mode..."
            className="input-field w-full pl-12 py-4 text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="p-0 md:p-8">
        <div className="bg-surface-card border-y md:border md:rounded-3xl border-surface-border overflow-hidden">
          <div className="hidden md:grid grid-cols-5 px-8 py-4 bg-surface-bg/50 border-b border-surface-border text-[10px] font-black uppercase tracking-widest text-surface-text/30">
            <span>Invoice info</span>
            <span>Date & Time</span>
            <span>Customer / Mode</span>
            <span className="text-right">Total Amount</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-surface-border/50">
            {filteredSales?.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-surface-text/20">
                <Receipt className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm">No transactions found</p>
              </div>
            ) : (
              filteredSales?.map((sale) => (
                <div 
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="group hover:bg-primary-500/5 transition-all cursor-pointer"
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-5 items-center px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-sm tracking-tight group-hover:text-primary-400 transition-colors uppercase">{sale.invoiceNo}</span>
                      <span className="text-[10px] text-surface-text/40 font-bold uppercase tracking-widest">{sale.itemsCount} Items</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{format(new Date(sale.createdAt), 'MMM dd, yyyy')}</span>
                      <span className="text-[10px] text-surface-text/30 font-bold uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(new Date(sale.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    <div>
                      <span className={clsx(
                        "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        sale.paymentMode === 'CREDIT' ? 'bg-accent-vibrant/10 text-accent-vibrant border-accent-vibrant/20' : 'bg-accent-success/10 text-accent-success border-accent-success/20'
                      )}>
                        {sale.paymentMode}
                      </span>
                    </div>
                    <div className="text-right font-black text-surface-text">
                      MK {sale.total.toLocaleString()}
                    </div>
                    <div className="flex justify-end text-surface-text/20 group-hover:text-primary-400 transition-all group-hover:translate-x-1">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden p-6 flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm uppercase tracking-tight">{sale.invoiceNo}</span>
                        <span className={clsx(
                          "w-2 h-2 rounded-full",
                          sale.paymentMode === 'CREDIT' ? 'bg-accent-vibrant' : 'bg-accent-success'
                        )}></span>
                      </div>
                      <span className="text-[10px] text-surface-text/40 font-black uppercase tracking-[0.2em]">{format(new Date(sale.createdAt), 'HH:mm')} • {sale.itemsCount} ITEMS</span>
                    </div>
                    <div className="text-right">
                       <div className="font-black text-base text-primary-400">MK {sale.total.toLocaleString()}</div>
                       <div className="text-[9px] text-surface-text/30 font-black uppercase tracking-widest">{sale.paymentMode}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sale Detail Drawer */}
      <AnimatePresence>
        {selectedSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSale(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-surface-bg/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-card border-t md:border border-surface-border rounded-t-3xl md:rounded-3xl w-full max-w-2xl h-full md:h-auto md:max-h-[85vh] shadow-2xl flex flex-col mt-auto md:mt-0"
            >
              <div className="p-8 border-b border-surface-border flex justify-between items-center sticky top-0 bg-surface-card/80 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase">{selectedSale.invoiceNo}</h2>
                  <p className="text-[10px] text-surface-text/40 font-bold uppercase tracking-[0.2em]">{format(new Date(selectedSale.createdAt), 'MMMM dd, yyyy @ HH:mm')}</p>
                </div>
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="w-10 h-10 bg-surface-bg border border-surface-border rounded-xl flex items-center justify-center font-black hover:bg-surface-card transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-6">
                  {/* Items List */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-text/30 mb-4 flex items-center gap-2">
                       <Package className="w-3 h-3" /> Items Purchased
                    </h3>
                    <div className="space-y-3">
                      {selectedSale.items.map((item: LocalSaleItem, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-surface-bg/40 rounded-2xl border border-surface-border">
                          <div>
                            <div className="font-bold text-sm uppercase leading-tight">{item.productName}</div>
                            <div className="text-[10px] text-surface-text/40 font-bold uppercase mt-1">MK {item.unitPrice.toLocaleString()} × {item.quantity}</div>
                          </div>
                          <div className="font-black text-primary-400">MK {item.lineTotal.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-surface-bg/60 p-6 rounded-2xl border border-surface-border space-y-3">
                    <div className="flex justify-between text-xs font-bold text-surface-text/40 uppercase tracking-widest">
                      <span>Payment Method</span>
                      <span className="text-surface-text">{selectedSale.paymentMode}</span>
                    </div>
                     <div className="flex justify-between text-xs font-bold text-surface-text/40 uppercase tracking-widest pt-2 border-t border-surface-border/50">
                      <span>Total Profit</span>
                      <span className="text-accent-success">MK {selectedSale.items.reduce((s: number, i: LocalSaleItem) => s + i.profit, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-surface-border">
                      <span className="text-lg font-black tracking-tighter uppercase">Grand Total</span>
                      <span className="text-2xl font-black text-primary-400">MK {selectedSale.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-surface-bg/30 border-t border-surface-border flex gap-4">
                  <button 
                    title="Reprint Receipt"
                    onClick={() => { window.print(); }}
                    className="flex-1 py-4 bg-surface-card border border-surface-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-card transition-all"
                  >
                    Reprint Order
                  </button>
                  <button 
                    onClick={() => setSelectedSale(null)}
                    className="flex-1 btn-primary !py-4 text-[10px] font-black uppercase tracking-widest"
                  >
                    Done
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesPage;
