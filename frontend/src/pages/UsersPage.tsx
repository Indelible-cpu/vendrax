import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Users, UserPlus, Edit2, Shield, Mail, Phone, Calendar, Search, X, Check, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface User {
  id: number;
  username: string;
  fullname: string;
  email: string | null;
  phone: string | null;
  role: string;
  role_id: number;
  profile_pic: string | null;
  branch_id: number | null;
  branch_name: string | null;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
}

interface EditingUser extends Partial<User> {
  password?: string;
}

export default function UsersPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{title: string, msg: string, onConfirm: () => void} | null>(null);

  const confirm = (title: string, msg: string, onConfirm: () => void) => {
    setConfirmAction({ title, msg, onConfirm });
    setIsConfirmOpen(true);
  };

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/UserController/fetch');
      return res.data as User[];
    }
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/UserController/roles');
      return res.data as Role[];
    }
  });

  const { data: branches } = useQuery<{id: number, name: string}[]>({
    queryKey: ['branches-minimal'],
    queryFn: async () => {
      const res = await api.get('/BranchController/fetchMinimal');
      return res.data.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: EditingUser | null) => api.post('/UserController/save', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      showToast('User account saved successfully.', 'success');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr.response?.data?.message || 'Failed to save account', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.post('/UserController/delete', { id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User account deleted.', 'success');
    }
  });

  const handleEdit = (user: User) => {
    setEditingUser({...user, password: ''});
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser({ 
      username: '', 
      fullname: '', 
      role_id: roles && roles.length > 0 ? roles[0].id : 2, 
      password: '' 
    });
    setIsModalOpen(true);
  };

  const filteredUsers = users?.filter(u => 
    u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10 h-full w-full animate-slide-in p-2 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Team Management</h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Manage your staff accounts and access levels.</p>
        </div>
        <button type="button" onClick={handleAdd} className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 text-xs uppercase tracking-widest" title="Add a new team member">
          <UserPlus className="w-5 h-5" /> Add New Staff
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="premium-card p-8 border-none flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
               <Shield className="w-8 h-8" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admins</p>
               <p className="text-3xl font-black text-slate-800 tracking-tighter">{users?.filter(u => u.role.toLowerCase() === 'superadmin').length || 0}</p>
            </div>
         </div>
         <div className="premium-card p-8 border-none flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
               <Users className="w-8 h-8" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
               <p className="text-3xl font-black text-slate-800 tracking-tighter">{users?.length || 0}</p>
            </div>
         </div>
         <div className="premium-card p-4 border-none flex items-center shadow-sm">
            <div className="relative w-full px-2">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Search Team</p>
               <div className="relative">
                  <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="text" placeholder="FIND USER..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 bg-transparent border-none outline-none font-black text-xs uppercase text-slate-800 placeholder:text-slate-200" />
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
         {isLoading ? <div className="col-span-full py-20 text-center uppercase text-[10px] font-black text-slate-300 tracking-[0.3em] animate-pulse">Loading user directory...</div> : filteredUsers?.map(u => (
           <div key={u.id} className="premium-card border-none p-10 group hover:shadow-2xl transition-all relative overflow-hidden">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                 <button type="button" onClick={() => handleEdit(u)} title="Edit user profile" className="p-3 bg-white text-slate-400 hover:text-primary rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95"><Edit2 className="w-4 h-4" /></button>
                 <button type="button" onClick={() => confirm('Delete User', `Are you sure you want to remove ${u.fullname}?`, () => deleteMutation.mutate(u.id))} title="Permanently delete user" className="p-3 bg-white text-slate-400 hover:text-rose-500 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="flex flex-col items-center text-center">
                 <div className="relative mb-8">
                    <img src={u.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullname)}&background=4f46e5&color=fff&size=200`} alt={u.fullname} className="w-28 h-28 rounded-3xl object-cover ring-8 ring-slate-50 shadow-xl group-hover:scale-105 transition-transform duration-500" />
                     <div className={`absolute -bottom-2 -right-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${u.role.toLowerCase() === 'superadmin' ? 'bg-rose-500' : 'bg-primary'}`}>
                        {u.role}
                     </div>
                  </div>

                 <h4 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{u.fullname}</h4>
                 <p className="font-bold text-slate-400 mb-8 tracking-widest text-[10px] uppercase opacity-60 font-mono">@{u.username}</p>

                 <div className="w-full space-y-5 pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-4 text-slate-400 group-hover:text-slate-800 transition-colors">
                       <Mail className="w-4 h-4 opacity-40" />
                       <span className="truncate flex-1 text-left font-bold text-xs">{u.email || 'No email set'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 group-hover:text-slate-800 transition-colors">
                       <Phone className="w-4 h-4 opacity-40" />
                       <span className="flex-1 text-left font-bold text-xs">{u.phone || 'No phone set'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-300">
                       <Calendar className="w-4 h-4 opacity-30" />
                       <span className="flex-1 text-left font-black text-[9px] uppercase tracking-widest">Joined {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-blur-fade" onClick={() => setIsModalOpen(false)}>
           <div className="premium-card w-full max-w-lg overflow-hidden animate-slide-in border-none shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <header className="px-10 py-8 border-b border-slate-50 bg-white flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingUser?.id ? 'Edit User' : 'Add New Staff'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} title="Close Modal" className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><X className="w-5 h-5" /></button>
              </header>

              <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(editingUser); }} className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                       <input required value={editingUser?.username || ''} onChange={e => setEditingUser(prev => prev ? {...prev, username: e.target.value} : null)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" placeholder="staff.user" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input required value={editingUser?.fullname || ''} onChange={e => setEditingUser(prev => prev ? {...prev, fullname: e.target.value} : null)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all" placeholder="Enter Full Name" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                       <select value={editingUser?.role_id || ''} onChange={e => setEditingUser(prev => prev ? {...prev, role_id: Number(e.target.value)} : null)} title="Select user role" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-xs uppercase cursor-pointer appearance-none focus:ring-4 focus:ring-primary/5">
                          {roles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Branch</label>
                       <select value={editingUser?.branch_id || ''} onChange={e => setEditingUser(prev => prev ? {...prev, branch_id: Number(e.target.value)} : null)} title="Assign to branch" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-xs uppercase cursor-pointer appearance-none focus:ring-4 focus:ring-primary/5">
                          <option value="">Main Branch</option>
                          {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{editingUser?.id ? 'New Password (Optional)' : 'Default Password'}</label>
                    <input type="password" required={!editingUser?.id} value={editingUser?.password || ''} onChange={e => setEditingUser(prev => prev ? {...prev, password: e.target.value} : null)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono" placeholder="********" />
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white border border-slate-100 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                    <button type="submit" disabled={saveMutation.isPending} className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                       {saveMutation.isPending ? 'Saving...' : <><Check className="w-5 h-5" /> Save Staff</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
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
