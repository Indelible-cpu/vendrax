import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/posDB';
import type { LocalProduct } from '../db/posDB';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import Modal from '../components/Modal';

// Helper for generating unique numeric IDs outside render cycle
const generateNumericId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

const InventoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    costPrice: 0,
    sellPrice: 0,
    quantity: 0,
    categoryId: 0,
  });

  // DB Data
  const products = useLiveQuery(
    () => db.products.where('name').startsWithIgnoreCase(searchTerm).toArray(),
    [searchTerm]
  );
  const categories = useLiveQuery(() => db.categories.toArray());

  const filteredProducts = selectedCategory
    ? products?.filter(p => p.categoryId === selectedCategory)
    : products;

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await db.products.update(editingProduct.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Product updated');
      } else {
        const newId = generateNumericId();
        await db.products.add({
          ...formData,
          id: newId,
          isService: false,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast.success('Product added to inventory');
      }
      setIsAddModalOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch {
      toast.error('Failed to save product');
    }
  };

  const deleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await db.products.delete(id);
      toast.success('Product removed');
    }
  };

  const resetForm = async () => {
    const defaultCatId = categories?.[0]?.id || 0;
    let initialSku = '';
    if (defaultCatId) {
      const cat = await db.categories.get(defaultCatId);
      const prefix = cat ? cat.title.substring(0, 2).toUpperCase() : 'PR';
      const productsInCat = await db.products.where('categoryId').equals(defaultCatId).toArray();
      initialSku = `${prefix}-${(productsInCat.length + 1).toString().padStart(3, '0')}`;
    }

    setFormData({
      name: '',
      sku: initialSku,
      costPrice: 0,
      sellPrice: 0,
      quantity: 0,
      categoryId: defaultCatId,
    });
  };

  const openEditModal = (product: LocalProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      quantity: product.quantity,
      categoryId: product.categoryId,
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-bg transition-all pb-24 md:pb-0">
      <header className="p-6 bg-surface-card border-b border-surface-border sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600/10 text-primary-400 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Inventory</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 bg-surface-bg border border-surface-border hover:bg-surface-card transition-all text-surface-text rounded-xl flex items-center gap-2 text-xs font-bold"
            >
              Manage Categories
            </button>
            <button 
              onClick={async () => { await resetForm(); setEditingProduct(null); setIsAddModalOpen(true); }}
              className="btn-primary !px-4 !py-2 flex items-center gap-2 text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Add item
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-text/40 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..."
              className="input-field w-full pl-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={clsx(
                "px-4 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap",
                !selectedCategory ? "bg-primary-600 border-primary-600 text-white shadow-lg" : "bg-surface-bg border-surface-border text-surface-text/40"
              )}
            >
              All
            </button>
            {categories?.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "px-4 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap",
                  selectedCategory === cat.id ? "bg-primary-600 border-primary-600 text-white shadow-lg" : "bg-surface-bg border-surface-border text-surface-text/40"
                )}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts?.map(product => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={product.id}
                className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden group hover:border-primary-500/30 transition-all flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-[10px] font-bold text-surface-text/30">{product.sku}</div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(product)} 
                        title="Edit Product"
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors text-primary-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)} 
                        title="Delete Product"
                        className="p-2 hover:bg-accent-danger/10 rounded-lg transition-colors text-accent-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary-400 transition-colors tracking-tight">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-primary-400 font-black text-xl leading-none">MK {product.sellPrice.toLocaleString()}</span>
                  </div>
                  <div className={clsx(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold",
                    product.quantity <= 5 ? "bg-accent-danger/10 text-accent-danger border border-accent-danger/20" : "bg-accent-success/10 text-accent-success border border-accent-success/20"
                  )}>
                    {product.quantity <= 5 ? <AlertTriangle className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                    {product.quantity} in stock
                  </div>
                </div>
                <div className="px-5 py-3 bg-surface-bg/50 border-t border-surface-border flex justify-between items-center text-[10px] font-bold text-surface-text/40">
                  <span>Profit: MK {(product.sellPrice - product.costPrice).toLocaleString()}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title={editingProduct ? 'Edit Product' : 'New Product'}
      >
        <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label htmlFor="prod-name" className="text-[10px] font-bold text-surface-text/40 ml-1">Product name</label>
              <input 
                id="prod-name"
                required 
                type="text" 
                title="Product Name"
                placeholder="Enter product name"
                className="input-field w-full" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="prod-sku" className="text-[10px] font-bold text-surface-text/40 ml-1">SKU / Code</label>
              <input 
                id="prod-sku"
                required 
                type="text" 
                title="SKU / Code"
                placeholder="SKU Code"
                className="input-field w-full" 
                value={formData.sku} 
                onChange={(e) => setFormData({...formData, sku: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="prod-cat" className="text-[10px] font-bold text-surface-text/40 ml-1">Category</label>
              <select 
                id="prod-cat"
                title="Product Category"
                className="input-field w-full appearance-none bg-surface-bg" 
                value={formData.categoryId} 
                onChange={async (e) => {
                  const newCatId = parseInt(e.target.value);
                  const cat = await db.categories.get(newCatId);
                  const prefix = cat ? cat.title.substring(0, 2).toUpperCase() : 'PR';
                  const productsInCat = await db.products.where('categoryId').equals(newCatId).toArray();
                  setFormData({...formData, categoryId: newCatId, sku: `${prefix}-${(productsInCat.length + 1).toString().padStart(3, '0')}`});
                }}
              >
                {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 bg-surface-bg/30 p-4 rounded-2xl border border-surface-border">
            <div className="space-y-2">
              <label htmlFor="prod-cost" className="text-[10px] font-bold text-surface-text/40 ml-1">Cost</label>
              <input 
                id="prod-cost"
                required 
                type="number" 
                title="Cost Price"
                placeholder="0.00"
                className="input-field w-full text-center" 
                value={formData.costPrice} 
                onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="prod-sell" className="text-[10px] font-bold text-surface-text/40 ml-1">Sell</label>
              <input 
                id="prod-sell"
                required 
                type="number" 
                title="Selling Price"
                placeholder="0.00"
                className="input-field w-full text-center font-black text-primary-400" 
                value={formData.sellPrice} 
                onChange={(e) => setFormData({...formData, sellPrice: parseFloat(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="prod-stock" className="text-[10px] font-bold text-surface-text/40 ml-1">Stock</label>
              <input 
                id="prod-stock"
                required 
                type="number" 
                title="Stock Quantity"
                placeholder="0"
                className="input-field w-full text-center font-bold" 
                value={formData.quantity} 
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} 
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-surface-bg border border-surface-border rounded-2xl text-[10px] font-bold hover:bg-surface-card transition-all">Cancel</button>
            <button type="submit" className="flex-1 btn-primary !py-4 text-[10px] font-bold">Save changes</button>
          </div>
        </form>
      </Modal>
      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        title="Manage Categories"
      >
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-surface-text">Existing Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories?.map(cat => (
                <div key={cat.id} className="px-3 py-1.5 bg-surface-bg border border-surface-border rounded-lg text-xs font-bold flex items-center gap-2">
                  {cat.title}
                  <button onClick={async () => {
                    if (confirm(`Delete category "${cat.title}"?`)) {
                      await db.categories.delete(cat.id);
                      toast.success('Category deleted');
                    }
                  }} className="text-accent-danger hover:text-red-600 transition-colors ml-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <hr className="border-surface-border" />
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newCategoryTitle.trim()) return;
            const slug = newCategoryTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
            try {
              await db.categories.add({
                id: generateNumericId(),
                title: newCategoryTitle.trim(),
                slug
              });
              setNewCategoryTitle('');
              toast.success('Category created');
            } catch {
              toast.error('Failed to create category');
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-cat" className="text-[10px] font-bold text-surface-text/40 ml-1">New Category Name</label>
              <div className="flex gap-2">
                <input 
                  id="new-cat"
                  type="text" 
                  required
                  placeholder="e.g. Electronics"
                  className="input-field flex-1" 
                  value={newCategoryTitle} 
                  onChange={(e) => setNewCategoryTitle(e.target.value)} 
                />
                <button type="submit" className="btn-primary !px-4 text-xs font-bold">Add</button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;
