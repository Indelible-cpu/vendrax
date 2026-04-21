import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Search, Plus, Edit2, Trash2, Layers, X, Smartphone, Package, ShieldCheck, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import BarcodeScanner from '../components/BarcodeScanner';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  category_id: number;
  cost_price: number;
  sell_price: number;
  tax_rate: number;
  quantity: number;
  is_service: boolean;
  description: string;
}

interface Category {
  id: number;
  title: string;
}

interface InventoryTotals {
  total_qty: number;
  total_cost: number;
  total_sell: number;
  total_profit: number;
}

const StatCard = ({ label, value, sub, icon: Icon, color }: { label: string, value: string | number, sub?: string, icon: React.ElementType, color: string }) => (
  <div className="premium-card p-6 border-none group hover:shadow-xl transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`${color} p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
      </div>
    </div>
    {sub && (
      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sub}</span>
        <TrendingUp className="w-3 h-3 text-emerald-500 opacity-50" />
      </div>
    )}
  </div>
);

export default function InventoryPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{title: string, msg: string, onConfirm: () => void} | null>(null);

  const confirm = (title: string, msg: string, onConfirm: () => void) => {
    setConfirmAction({ title, msg, onConfirm });
    setIsConfirmOpen(true);
  };

  const { data: productsData, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/ProductController/fetch');
      return res.data.data.products as Product[];
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/ProductController/categories');
      return res.data as Category[];
    }
  });

  const { data: totals } = useQuery<InventoryTotals>({
    queryKey: ['inventory-totals', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/ProductController/totals?search=${searchTerm}`);
      return res.data.data as InventoryTotals;
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Product> | null) => api.post('/ProductController/save', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      showToast('Inventory updated successfully.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.get(`/ProductController/delete?id=${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Product removed.');
    }
  });

  const saveCategoryMutation = useMutation({
    mutationFn: (data: Partial<Category> | null) => api.post('/ProductController/saveCategory', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      showToast('Categories updated.');
    }
  });

  const filteredProducts = productsData?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10 h-full w-full animate-slide-in font-sans p-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Inventory Management</h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Manage your products and stock levels here.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm font-black text-xs uppercase tracking-widest text-slate-600 hover:shadow-md transition-all active:scale-95"
            title="Manage categories"
          >
            <Layers className="w-5 h-5 text-primary" /> Categories
          </button>
          <button 
            onClick={() => { setEditingProduct({ quantity: 0, cost_price: 0, sell_price: 0, tax_rate: 0, is_service: false }); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            title="Add a new product"
          >
            <Plus className="w-5 h-5" /> Add New Product
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Stock" value={totals?.total_qty ?? 0} sub="Items in store" icon={Package} color="bg-indigo-600" />
        <StatCard label="Stock Value" value={`MK ${totals?.total_cost?.toLocaleString() ?? 0}`} sub="Cost Basis" icon={ShieldCheck} color="bg-blue-500" />
        <StatCard label="Total Potential" value={`MK ${totals?.total_sell?.toLocaleString() ?? 0}`} sub="Selling Value" icon={Zap} color="bg-emerald-500" />
        <StatCard label="Total Products" value={filteredProducts?.length ?? 0} sub="Unique Items" icon={Search} color="bg-purple-500" />
      </div>

      <div className="premium-card p-4 border-none flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="SEARCH PRODUCTS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-slate-50/50 rounded-2xl border border-slate-100 outline-none font-black text-xs uppercase tracking-widest focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="premium-card border-none overflow-hidden flex flex-col flex-1 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/50">
                <th className="px-10 py-6">Product Name</th>
                <th className="px-10 py-6">SKU #</th>
                <th className="px-10 py-6">Category</th>
                <th className="px-10 py-6 text-right">Price</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-20 text-center uppercase text-[10px] font-black text-slate-300 tracking-[0.3em] animate-pulse">Loading products...</td></tr>
              ) : filteredProducts?.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-8">
                    <p className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">ID: {p.id}</p>
                  </td>
                  <td className="px-10 py-8">
                     <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-1.5 tracking-widest uppercase shadow-sm font-mono">{p.sku || 'N/A'}</span>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{categories?.find(c => c.id === p.category_id)?.title}</span>
                  </td>
                  <td className="px-10 py-8 text-right">
                     <p className="font-black text-slate-900 text-sm tracking-tighter">MK {p.sell_price.toLocaleString()}</p>
                  </td>
                  <td className="px-10 py-8 text-center">
                     <div className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-inner ${p.quantity < 10 && !p.is_service ? 'bg-rose-50 text-rose-600 shadow-inner' : 'bg-emerald-50 text-emerald-600 shadow-inner'}`}>
                        {p.is_service ? 'Service' : p.quantity < 10 ? 'Low Stock' : 'In Stock'}
                        {!p.is_service && <span className="ml-2 opacity-60 font-mono">({p.quantity})</span>}
                     </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3">
                       <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-3 bg-white text-slate-400 hover:text-primary rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95" title="Edit product information"><Edit2 className="w-4 h-4" /></button>
                       <button onClick={() => confirm('Delete Product', `Are you sure you want to remove ${p.name}?`, () => deleteMutation.mutate(p.id))} className="p-3 bg-white text-slate-400 hover:text-rose-500 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95" title="Delete product"><Trash2 className="w-4 h-4" /></button>
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
          <div className="premium-card w-full max-w-2xl overflow-hidden animate-slide-in border-none" onClick={(e) => e.stopPropagation()}>
            <header className="px-10 py-8 border-b border-slate-50 bg-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fill in the details below.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all" title="Close modal"><X className="w-5 h-5" /></button>
            </header>
            
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingProduct); }} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2">
                  <label htmlFor="prod-name-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</label>
                  <input id="prod-name-input" required value={editingProduct?.name || ''} onChange={e => setEditingProduct(prev => ({...prev!, name: e.target.value}))} className="w-full px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all" placeholder="Enter product name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cat-tax-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select id="cat-tax-select" title="Select Category" value={editingProduct?.category_id} onChange={e => setEditingProduct(prev => ({...prev!, category_id: parseInt(e.target.value)}))} className="w-full px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer">
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                   <label htmlFor="sku-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU #</label>
                   <div className="flex gap-3">
                      <input id="sku-input" value={editingProduct?.sku || ''} onChange={e => setEditingProduct(prev => ({...prev!, sku: e.target.value}))} className="flex-1 px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" placeholder="SCANNABLE REF" />
                      <button 
                        type="button"
                        onClick={() => setIsScanning(true)}
                        className="px-5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-primary hover:shadow-md transition-all active:scale-95"
                        title="Scan barcode with camera"
                      >
                        <Smartphone className="w-6 h-6" />
                      </button>
                   </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="cost-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Price (MK)</label>
                  <input id="cost-input" type="number" step="0.01" required value={editingProduct?.cost_price} onChange={e => setEditingProduct(prev => ({...prev!, cost_price: parseFloat(e.target.value)}))} className="w-full px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sell-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selling Price (MK)</label>
                  <input id="sell-input" type="number" step="0.01" required value={editingProduct?.sell_price} onChange={e => setEditingProduct(prev => ({...prev!, sell_price: parseFloat(e.target.value)}))} className="w-full px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tax-rate-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Rate (%)</label>
                  <input id="tax-rate-input" type="number" step="0.01" required value={editingProduct?.tax_rate} onChange={e => setEditingProduct(prev => ({...prev!, tax_rate: parseFloat(e.target.value)}))} className="w-full px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" />
                </div>
                <div className="space-y-2">
                   <label htmlFor="qty-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</label>
                   <input id="qty-input" type="number" disabled={editingProduct?.is_service} value={editingProduct?.quantity} onChange={e => setEditingProduct(prev => ({...prev!, quantity: parseInt(e.target.value)}))} className="w-full px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono disabled:opacity-30" />
                </div>
                <div className="flex items-center pt-8">
                   <button type="button" onClick={() => setEditingProduct(p => ({...p!, is_service: !p!.is_service}))} className="flex items-center gap-6 group" title="Toggle between physical product and service">
                      <div className={`w-14 h-7 rounded-full border transition-all relative ${editingProduct?.is_service ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-200'}`}>
                         <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${editingProduct?.is_service ? 'right-1' : 'left-1'}`} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Is this a Service?</span>
                   </button>
                </div>
              </div>
              <div className="flex gap-4 pt-10 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-blur-fade" onClick={() => setIsCategoryModalOpen(false)}>
           <div className="premium-card w-full max-w-xl overflow-hidden animate-slide-in border-none shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <header className="px-10 py-8 border-b border-slate-50 bg-white flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Product Categories</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage groupings for your products.</p>
                 </div>
                 <button onClick={() => setIsCategoryModalOpen(false)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all" title="Close category modal"><X className="w-5 h-5 text-slate-600" /></button>
              </header>
              <div className="p-10 space-y-10">
                 <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Add New Category</label>
                    <div className="flex gap-3">
                       <input 
                          type="text" 
                          placeholder="e.g. ELECTRONICS" 
                          value={editingCategory?.title || ''} 
                          onChange={e => setEditingCategory({ ...editingCategory as Category, title: e.target.value.toUpperCase() })}
                          className="flex-1 px-6 py-4 bg-white rounded-xl border border-slate-100 outline-none font-black text-xs tracking-widest focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                       />
                       <button onClick={() => saveCategoryMutation.mutate(editingCategory)} className="px-8 py-4 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Save</button>
                    </div>
                 </div>
                 <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                    {categories?.map(c => (
                       <div key={c.id} className="flex justify-between items-center p-6 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                          <span className="font-black text-slate-800 text-xs uppercase tracking-widest group-hover:text-primary transition-colors">{c.title}</span>
                          <button onClick={() => setEditingCategory(c)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-all" title="Edit Category"><Edit2 className="w-4 h-4" /></button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
         </div>
      )}

      {isScanning && (
        <BarcodeScanner 
          onScan={(code) => {
            setEditingProduct(prev => ({ ...prev!, sku: code }));
            setIsScanning(false);
          }} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      {isConfirmOpen && confirmAction && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-blur-fade">
           <div className="premium-card w-full max-w-sm p-12 text-center border-none shadow-2xl animate-slide-in">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">{confirmAction.title}</h3>
              <p className="text-sm font-bold text-slate-400 mb-10 opacity-60 leading-relaxed">{confirmAction.msg}</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl font-black transition-all uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-50">Back</button>
                 <button 
                   onClick={() => { confirmAction.onConfirm(); setIsConfirmOpen(false); }} 
                   className="flex-[1.5] py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-200 transition-all active:scale-95 uppercase tracking-widest text-xs"
                 >
                    Confirm Deletion
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
