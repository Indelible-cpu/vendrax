import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import MobileNav from './MobileNav';
import MobileHeader from './MobileHeader';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const hideNav = location.pathname === '/login';

  const PULL_THRESHOLD = 80;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.4, 120));
    }
  }, [isPulling, isRefreshing]);

  const onTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50);
      // Reload the page
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  }, [pullDistance, isRefreshing]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg transition-colors duration-300">
      {/* Dynamic Mobile Header */}
      {!hideNav && <MobileHeader />}

      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center transition-all"
          style={{ top: `calc(env(safe-area-inset-top) + 68px + ${Math.min(pullDistance, 60)}px)` }}
        >
          <div className={clsx(
            "w-10 h-10 bg-surface-card border border-surface-border rounded-full flex items-center justify-center shadow-lg transition-all",
            isRefreshing && "animate-spin",
            pullDistance >= PULL_THRESHOLD && "border-primary-500 bg-primary-500/10"
          )}>
            <RefreshCw className={clsx("w-5 h-5", pullDistance >= PULL_THRESHOLD ? "text-primary-500" : "text-surface-text/40")} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main 
        ref={mainRef}
        onTouchStart={!hideNav ? onTouchStart : undefined}
        onTouchMove={!hideNav ? onTouchMove : undefined}
        onTouchEnd={!hideNav ? onTouchEnd : undefined}
        className={clsx(
          "flex-1 w-full mx-auto pb-24 md:pb-0 pt-[calc(64px+env(safe-area-inset-top))] transition-all overflow-y-auto",
          "px-0 md:px-6 max-w-screen-2xl"
        )}
        style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined, transition: isPulling ? 'none' : 'transform 0.3s ease' }}
      >
        {children}
      </main>

      {/* Desktop Sign Out */}
      <div className="hidden md:flex fixed top-4 right-6 z-50 gap-3">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-surface-card border border-surface-border rounded-full shadow-lg text-xs font-bold hover:bg-accent-danger hover:text-white transition-all group"
        >
          <LogOut className="w-4 h-4 text-accent-danger group-hover:text-white transition-colors" />
          Sign out
        </button>
      </div>

      {!hideNav && <MobileNav />}
    </div>
  );
};

export default MainLayout;
