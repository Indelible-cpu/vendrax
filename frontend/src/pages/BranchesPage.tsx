import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  AlertCircle,
  Network
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface Branch {
  id: number;
  name: string;
  location: string;
  phone: string | null;
  is_active: boolean;
  staff_count: number;
  created_at: string;
}

export default function BranchesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const { data: branches, isLoading } = useQuery<Branch[]>({
    queryKey: ['branches', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/BranchController/fetch?q=${searchTerm}`);
      return (res.data.data as Branch[]) || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Branch>) => api.post('/BranchController/save', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsModalOpen(false);
      showToast('Branch network updated', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr.response?.data?.message || 'Failed to sync branch', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.post('/BranchController/delete', { id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsConfirmOpen(false);
      showToast('Branch removed from network', 'success');
    }
  });

  const handleAdd = () => {
    setEditingBranch({
      name: '',
      location: '',
      phone: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 h-full w-full animate-fade-in overflow-hidden font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-xl shadow-primary/5">
              <Network className="w-8 h-8" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-foreground tracking-tighter italic uppercase">Branch Management</h2>
              <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60">Architect and manage your multi-location network</p>
           </div>
        </div>
        <button onClick={handleAdd} className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest">
          <Plus className="w-5 h-5" /> Establish Branch
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm group">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Locations</p>
            <p className="text-3xl font-black text-foreground tracking-tighter">{branches?.length ?? 0}</p>
         </div>
         <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm group">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Active Nodes</p>
            <p className="text-3xl font-black text-green-500 tracking-tighter">{branches?.filter(b => b.is_active).length ?? 0}</p>
         </div>
         <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm group">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Network Capacity</p>
            <p className="text-3xl font-black text-primary tracking-tighter">UNLIMITED</p>
         </div>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-3xl border border-border shadow-lg flex flex-col md:flex-row gap-4 items-center bg-muted/20">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search branch name or location..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-14 pr-6 py-4 bg-card border-none rounded-2xl outline-none font-bold text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20" 
          />
        </div>
      </div>

      <div className="flex-1 bg-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden flex flex-col min-h-0">
         <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {isLoading ? (
                  <div className="col-span-full p-20 text-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /></div>
               ) : branches?.map(branch => (
                  <div key={branch.id} className="bg-muted/30 border border-border rounded-[2rem] p-8 hover:border-primary/30 transition-all group relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6">
                        <div className={`w-3 h-3 rounded-full ${branch.is_active ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} title={branch.is_active ? 'Online' : 'Offline'} />
                     </div>
                     
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                           <Building2 className="w-7 h-7" />
                        </div>
                        <div>
                           <h4 className="font-black text-foreground text-lg tracking-tight leading-none mb-1">{branch.name}</h4>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: BR-{branch.id.toString().padStart(3, '0')}</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                           <MapPin className="w-4 h-4 text-primary" /> {branch.location}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                           <Phone className="w-4 h-4 text-primary" /> {branch.phone || 'No contact info'}
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-6 border-t border-border">
                        <div className="text-[10px] font-black text-muted-foreground uppercase bg-muted px-3 py-1.5 rounded-full">
                           {branch.staff_count} Active Staff
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => { setEditingBranch(branch); setIsModalOpen(true); }} title="Edit Branch" className="p-2 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={() => { setSelectedBranchId(branch.id); setIsConfirmOpen(true); }} title="Delete Branch" className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-card w-full max-w-lg rounded-[3rem] shadow-2xl border border-border overflow-hidden animate-fade-up">
              <header className="px-10 py-8 border-b border-border flex justify-between items-center bg-muted/30">
                 <h3 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">{editingBranch?.id ? 'Configure Branch' : 'New Branch Node'}</h3>
                 <button onClick={() => setIsModalOpen(false)} title="Close Modal" className="p-3 text-muted-foreground hover:bg-card rounded-2xl shadow-sm transition-all"><X className="w-6 h-6" /></button>
              </header>

              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(editingBranch!); }} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Branch Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Blantyre Head Office"
                      className="w-full px-6 py-4 bg-muted/50 border-border border-2 focus:border-primary rounded-2xl outline-none font-bold transition-all"
                      value={editingBranch?.name}
                      onChange={(e) => setEditingBranch({...editingBranch!, name: e.target.value})}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Physical Location</label>
                    <textarea 
                      required
                      placeholder="Full address of this branch"
                      className="w-full px-6 py-4 bg-muted/50 border-border border-2 focus:border-primary rounded-2xl outline-none font-bold transition-all min-h-[100px]"
                      value={editingBranch?.location}
                      onChange={(e) => setEditingBranch({...editingBranch!, location: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Contact Phone</label>
                       <input 
                          type="text" 
                          placeholder="+265..."
                          className="w-full px-6 py-4 bg-muted/50 border-border border-2 focus:border-primary rounded-2xl outline-none font-bold transition-all"
                          value={editingBranch?.phone || ''}
                          onChange={(e) => setEditingBranch({...editingBranch!, phone: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Status</label>
                       <div className="flex items-center gap-4 py-4">
                          <button 
                            type="button"
                            title={editingBranch?.is_active ? 'Deactivate Branch' : 'Activate Branch'}
                            onClick={() => setEditingBranch({...editingBranch!, is_active: !editingBranch?.is_active})}
                            className={`w-14 h-8 rounded-full transition-all relative ${editingBranch?.is_active ? 'bg-primary' : 'bg-muted'}`}
                          >
                             <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${editingBranch?.is_active ? 'right-1' : 'left-1'}`} />
                          </button>
                          <span className="text-xs font-bold uppercase tracking-widest">{editingBranch?.is_active ? 'Active' : 'Inactive'}</span>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black uppercase tracking-widest text-xs transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest">
                       {saveMutation.isPending ? 'Syncing...' : 'Deploy Branch'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-border p-10 text-center">
              <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-8">
                 <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">Decommission Branch?</h3>
              <p className="text-sm font-bold text-muted-foreground mb-10 opacity-60">This will remove the branch from the network. Staff and inventory assigned here will need to be reallocated.</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-4 bg-muted text-foreground rounded-2xl font-black text-xs uppercase">Cancel</button>
                 <button onClick={() => deleteMutation.mutate(selectedBranchId!)} className="flex-1 py-4 bg-destructive text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-destructive/20">Remove</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
