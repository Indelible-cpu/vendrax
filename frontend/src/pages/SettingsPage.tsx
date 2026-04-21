import { useState } from 'react';
import { useSettingsStore } from '../hooks/useSettings';
import { Camera, Save, Moon, Sun, Monitor, Store, User, Globe } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../hooks/useAuth';

export default function SettingsPage() {
  const { shopName, shopLogo, theme, setShopName, setShopLogo, setTheme } = useSettingsStore();
  const { showToast } = useToast();
  const { user, setUser } = useAuthStore();
  
  const [localShopName, setLocalShopName] = useState(shopName);
  const [logoPreview, setLogoPreview] = useState<string | null>(shopLogo);
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.profile_pic || null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    setShopName(localShopName);
    setShopLogo(logoPreview);
    if (user && profilePreview) {
      setUser({ ...user, profile_pic: profilePreview });
    }
    showToast('System settings updated successfully.');
  };

  return (
    <div className="flex flex-col gap-10 h-full w-full animate-slide-in p-2 font-sans max-w-5xl">
       <header>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">System Settings</h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Configure your business profile and preferences.</p>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
             {/* Business Profile */}
             <div className="premium-card border-none overflow-hidden shadow-xl">
                <header className="px-10 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <Store className="w-5 h-5 text-primary" /> Business Profile
                   </h3>
                </header>
                <div className="p-10 space-y-10">
                   <div className="flex flex-col md:flex-row gap-10 items-start">
                      <div className="flex-1 space-y-3 w-full">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                         <input 
                            type="text" 
                            value={localShopName}
                            onChange={e => setLocalShopName(e.target.value)}
                            className="w-full px-8 py-5 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-black text-lg text-slate-800 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-mono"
                            placeholder="e.g. MY AWESOME SHOP"
                         />
                      </div>
                      
                      <div className="space-y-3 shrink-0">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store Logo</label>
                         <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-3xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                               {logoPreview ? (
                                  <img src={logoPreview} alt="Store Logo" className="w-full h-full object-cover" />
                               ) : (
                                  <Store className="w-10 h-10 text-slate-200" />
                               )}
                            </div>
                            <label className="px-6 py-3 bg-white border border-slate-100 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95">
                               <input aria-label="Choose Logo" title="Choose Logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                               Change Logo
                            </label>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Personal Profile */}
             <div className="premium-card border-none overflow-hidden shadow-xl">
                <header className="px-10 py-6 border-b border-slate-50 bg-slate-50/50">
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" /> User Profile
                   </h3>
                </header>
                <div className="p-10 flex flex-col items-center">
                   <div className="relative mb-8 group">
                      <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center">
                         {profilePreview ? (
                            <img src={profilePreview} alt="User Avatar" className="w-full h-full object-cover" />
                         ) : (
                            <span className="text-5xl font-black text-slate-200 uppercase">{user?.fullname?.charAt(0)}</span>
                         )}
                      </div>
                      <label className="absolute inset-0 bg-slate-900/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all border-8 border-transparent">
                         <input aria-label="Choose Avatar" title="Choose Avatar" type="file" accept="image/*" onChange={handleProfileUpload} className="hidden" />
                         <Camera className="w-8 h-8 text-white" />
                      </label>
                   </div>
                   <h4 className="text-2xl font-black text-slate-800 mb-1">{user?.fullname}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{user?.role}</p>
                </div>
             </div>
          </div>

          <div className="space-y-10">
             {/* Appearance Section */}
             <div className="premium-card border-none overflow-hidden shadow-xl">
                <header className="px-10 py-6 border-b border-slate-50 bg-slate-50/50">
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <Moon className="w-5 h-5 text-primary" /> Appearance
                   </h3>
                </header>
                <div className="p-4 space-y-2">
                   {[
                     { id: 'light', icon: Sun, label: 'Light Mode', desc: 'Default bright theme' },
                     { id: 'dark', icon: Moon, label: 'Dark Mode', desc: 'Cool dark theme' },
                     { id: 'auto', icon: Monitor, label: 'Standard', desc: 'Sync with system' }
                   ].map(opt => (
                     <button 
                       key={opt.id}
                       onClick={() => setTheme(opt.id as 'light' | 'dark' | 'auto')} 
                       className={`w-full p-6 flex items-center gap-6 rounded-2xl transition-all ${theme === opt.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                     >
                       <opt.icon className={`w-6 h-6 shrink-0 ${theme === opt.id ? 'text-white' : 'text-slate-300'}`} />
                       <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest">{opt.label}</p>
                          <p className={`text-[9px] font-medium uppercase tracking-tight opacity-60 ${theme === opt.id ? 'text-white' : 'text-slate-400'}`}>{opt.desc}</p>
                       </div>
                     </button>
                   ))}
                </div>
             </div>

             <div className="premium-card p-8 border-none bg-slate-900 text-white shadow-2xl space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">System Info</h4>
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-slate-300">Version 2.0.4 Premium</span>
                   </div>
                   <div className="pt-6">
                      <button onClick={saveSettings} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/40 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-3">
                         <Save className="w-5 h-5" /> Save Settings
                      </button>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
