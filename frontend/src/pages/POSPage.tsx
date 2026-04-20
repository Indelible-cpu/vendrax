import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/posDB';
import type { LocalProduct } from '../db/posDB';
import { Search, ShoppingCart, Power, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { SyncService } from '../services/SyncService';

import { Receipt } from '../components/Receipt';
import { Invoice } from '../components/Invoice';

const generateInvoiceNo = () => `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const POSPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT'>('CASH');
  const [cart, setCart] = useState<{ product: LocalProduct; quantity: number }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<{
    items: { product: LocalProduct; quantity: number }[];
    total: number;
    invoiceNo: string;
    date: string;
    mode: 'CASH' | 'CREDIT';
  } | null>(null);

  // Load products and categories from IndexedDB
  const products = useLiveQuery(
    () => db.products.where('name').startsWithIgnoreCase(searchTerm).toArray(),
    [searchTerm]
  );
  const categories = useLiveQuery(() => db.categories.toArray());

  const filteredProducts = selectedCategory 
    ? products?.filter(p => p.categoryId === selectedCategory)
    : products;

  const addToCart = (product: LocalProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Added ${product.name}`, { 
      duration: 800, 
      position: 'bottom-left',
      style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } 
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.sellPrice * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const invoiceNo = generateInvoiceNo();
    const now = new Date().toISOString();
    
    const sale = {
      id: crypto.randomUUID(),
      invoiceNo,
      subtotal: cartTotal,
      discount: 0,
      total: cartTotal,
      paid: paymentMode === 'CASH' ? cartTotal : 0,
      changeDue: 0,
      paymentMode: paymentMode,
      isCredit: paymentMode === 'CREDIT',
      status: 'COMPLETED',
      itemsCount: cart.length,
      createdAt: now,
      synced: 0,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        unitPrice: item.product.sellPrice,
        quantity: item.quantity,
        discount: 0,
        lineTotal: item.product.sellPrice * item.quantity,
        profit: (item.product.sellPrice - 0) * item.quantity
      }))
    };

    try {
      await db.salesQueue.add(sale);
      
      // Store current cart for receipt display before clearing
      const receiptData = {
        items: [...cart],
        total: cartTotal,
        invoiceNo,
        date: now,
        mode: paymentMode
      };
      
      // Attempt immediate sync (background)
      SyncService.pushSales();
      
      setShowReceipt(receiptData);
      setCart([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save sale');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden lg:flex-row bg-slate-950 text-slate-100">
      <AnimatePresence>
        {showReceipt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel max-w-lg w-full p-8 flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-primary-600/20 text-primary-400 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black mb-2">SALE COMPLETED</h2>
              <p className="text-slate-400 mb-8 text-center uppercase tracking-widest text-[10px] font-bold">MODE: {showReceipt.mode}</p>
              
              <div className="w-full bg-white rounded-xl overflow-hidden mb-8 shadow-2xl">
                {showReceipt.mode === 'CASH' ? <Receipt {...showReceipt} /> : <Invoice {...showReceipt} />}
              </div>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={handlePrint}
                  className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> PRINT
                </button>
                <button 
                  onClick={() => setShowReceipt(null)}
                  className="flex-1 btn-primary py-4 uppercase font-black tracking-tighter"
                >
                  New Transaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="p-4 glass-panel m-2">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search products (SKU or Name)..."
                className="input-field w-full pl-11 !bg-slate-950/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              title="Sync Sales Data"
              aria-label="Sync Sales Data"
              onClick={async () => {
                setIsSyncing(true);
                const results = await SyncService.pushSales();
                setIsSyncing(false);
                if (results) toast.success('Data Synced');
              }}
              className={`p-3 glass-card ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5 text-primary-400" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all font-medium ${!selectedCategory ? 'bg-primary-600 shadow-lg shadow-primary-900/40 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              All Items
            </button>
            {categories?.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all font-medium ${selectedCategory === cat.id ? 'bg-primary-600 shadow-lg shadow-primary-900/40 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 scroll-smooth">
          <AnimatePresence mode="popLayout">
            {filteredProducts?.map(product => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={product.id}
                onClick={() => addToCart(product)}
                className="glass-card p-4 cursor-pointer active:scale-95 flex flex-col group overflow-hidden border-slate-800/50 hover:bg-slate-800/40"
              >
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">{product.sku}</div>
                <div className="font-bold text-slate-100 group-hover:text-primary-400 transition-colors line-clamp-2">{product.name}</div>
                <div className="mt-auto pt-4 flex justify-between items-end">
                  <div className="text-lg font-black text-primary-400">MK {product.sellPrice.toLocaleString()}</div>
                  <div className="text-[10px] px-2 py-1 bg-slate-950/50 rounded text-slate-400 font-bold border border-slate-800">{product.quantity} IN STOCK</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full lg:w-96 glass-panel m-2 flex flex-col shrink-0 border-slate-800/50">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tighter">
            <ShoppingCart className="w-6 h-6 text-primary-400" />
            CURRENT ORDER
          </h2>
          <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {cart.length} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-slate-600"
              >
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                  <ShoppingCart className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-bold tracking-tight text-slate-500 uppercase text-xs">Ready for new transaction</p>
              </motion.div>
            ) : (
              cart.map((item) => (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  key={item.product.id} 
                  className="flex justify-between items-start gap-4 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 group hover:border-primary-500/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight text-slate-200 line-clamp-1">{item.product.name}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
                      <span>MK {item.product.sellPrice.toLocaleString()}</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-primary-400/80">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="font-black text-primary-400 text-sm whitespace-nowrap">
                    MK {(item.product.sellPrice * item.quantity).toLocaleString()}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-slate-900/60 backdrop-blur-2xl border-t border-slate-800 space-y-6">
          {/* Payment Mode Selector */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button 
              onClick={() => setPaymentMode('CASH')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${paymentMode === 'CASH' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cash Payment
            </button>
            <button 
              onClick={() => setPaymentMode('CREDIT')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${paymentMode === 'CREDIT' ? 'bg-accent-vibrant text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Credit/Debt
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <span>Subtotal</span>
              <span>MK {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-3xl font-black text-white">
              <span className="tracking-tighter">TOTAL</span>
              <span className={`transition-colors ${paymentMode === 'CREDIT' ? 'text-accent-vibrant' : 'text-primary-400'}`}>
                MK {cartTotal.toLocaleString()}
              </span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className={`w-full !py-5 text-lg font-black tracking-tighter disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3 group transition-all rounded-2xl shadow-2xl active:scale-95 ${paymentMode === 'CREDIT' ? 'bg-accent-vibrant text-black hover:bg-amber-400 shadow-amber-900/20' : 'btn-primary'}`}
          >
            {paymentMode === 'CREDIT' ? 'GENERATE INVOICE' : 'COMPLETE TRANSACTION'}
            <Power className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default POSPage;
