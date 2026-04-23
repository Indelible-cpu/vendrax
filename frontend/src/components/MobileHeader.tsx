import { useLocation } from 'react-router-dom';
import { Bell, ChevronLeft, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileHeader() {
  const location = useLocation();
  const [shopName, setShopName] = useState('VENDRAX');
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const updateHeader = () => {
      const storedName = localStorage.getItem('companyName');
      const storedLogo = localStorage.getItem('companyLogo');
      if (storedName) setShopName(storedName);
      if (storedLogo) setLogo(storedLogo);
    };

    updateHeader();
    window.addEventListener('storage', updateHeader);
    return () => window.removeEventListener('storage', updateHeader);
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard': return 'Overview';
      case '/pos': return 'POS';
      case '/stock': return 'Inventory';
      case '/sales': return 'Sale Logs';
      case '/reports': return 'Analytics';
      case '/settings': return 'Settings';
      case '/branches': return 'Branches';
      case '/customers': return 'Customers';
      case '/audit': return 'Audit Logs';
      default: return 'System';
    }
  };

  const isBasePage = ['/dashboard', '/pos', '/stock', '/sales', '/reports'].includes(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface-card border-b border-surface-border flex items-center justify-between px-4 z-[50] safe-top shadow-sm">
      <div className="flex items-center gap-3 overflow-hidden">
        {isBasePage ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-9 h-9 rounded-xl border border-primary-500/20 bg-surface-bg flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-xs font-black">V</div>
            )}
          </motion.div>
        ) : (
          <button 
            onClick={() => window.history.back()}
            className="p-2 bg-surface-bg rounded-xl border border-surface-border active:scale-95 transition-all flex-shrink-0"
            title="Go back"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-black tracking-tighter uppercase italic text-primary-500 leading-none truncate">
            {shopName}
          </span>
          <span className="text-[10px] font-bold text-surface-text/40 uppercase tracking-widest leading-none mt-0.5 truncate">
            {getPageTitle(location.pathname)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          className="relative p-2.5 bg-surface-bg border border-surface-border rounded-xl text-surface-text/40 active:scale-95 transition-all"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-surface-card"></span>
        </button>
        <div className="w-9 h-9 rounded-full border border-surface-border bg-surface-bg flex items-center justify-center overflow-hidden">
           <User className="w-5 h-5 text-surface-text/20" />
        </div>
      </div>
    </header>
  );
}
