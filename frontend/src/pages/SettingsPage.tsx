import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Store, Smartphone } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-bg text-surface-text">
       {/* Mobile Header */}
       <header className="p-6 bg-surface-card border-b border-surface-border md:hidden">
          <h1 className="text-2xl font-black tracking-tighter">Account Menu</h1>
       </header>

       <div className="p-0 md:p-8 space-y-px md:space-y-6">
          {/* User Profile Section */}
          <div className="bg-surface-card p-6 border-b border-surface-border md:border md:rounded-2xl flex items-center gap-4">
             <div className="w-16 h-16 bg-primary-600/20 text-primary-400 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-lg font-bold">{user.username || 'Employee'}</h2>
                <p className="text-sm text-surface-text/40 font-medium">Branch: Domasi Primary</p>
             </div>
          </div>

          <div className="space-y-px md:space-y-6">
            {/* System Preferences */}
            <div className="bg-surface-card md:border md:rounded-2xl overflow-hidden">
               <div className="px-6 py-4 border-b border-surface-border/50">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-text/30">System Preferences</h3>
               </div>
               <div className="p-6 flex items-center justify-between group hover:bg-primary-500/5 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-surface-bg rounded-xl flex items-center justify-center border border-surface-border">
                        <Smartphone className="w-5 h-5 text-primary-400" />
                     </div>
                     <div>
                        <div className="font-bold text-sm">Appearance</div>
                        <div className="text-xs text-surface-text/40">Switch between light and dark themes</div>
                     </div>
                  </div>
                  <ThemeToggle />
               </div>
            </div>

            {/* Business Info */}
            <div className="bg-surface-card md:border md:rounded-2xl overflow-hidden">
               <div className="px-6 py-4 border-b border-surface-border/50">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-text/30">Business Tools</h3>
               </div>
               <button className="w-full text-left p-6 flex items-center justify-between group hover:bg-primary-500/5 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-surface-bg rounded-xl flex items-center justify-center border border-surface-border">
                        <Store className="w-5 h-5 text-primary-400" />
                     </div>
                     <div>
                        <div className="font-bold text-sm">Branch Management</div>
                        <div className="text-xs text-surface-text/40">View and update location details</div>
                     </div>
                  </div>
               </button>
            </div>

            {/* Logout Action */}
            <div className="p-6 md:px-0">
               <button 
                  onClick={handleSignOut}
                  className="w-full py-5 bg-accent-danger/10 hover:bg-accent-danger text-accent-danger hover:text-white border border-accent-danger/20 rounded-2xl font-black flex items-center justify-center gap-3 transition-all duration-300 active:scale-95"
               >
                  <LogOut className="w-6 h-6" />
                  SIGN OUT OF SYSTEM
               </button>
            </div>
          </div>
       </div>
    </div>
  );
};

export default SettingsPage;
