import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  Tag,
  Settings,
  LogOut,
  ExternalLink,
  Lock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { store } from '../../services/store';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminOrders } from './AdminOrders';
import { AdminMarketing } from './AdminMarketing';
import { AdminSettings } from './AdminSettings';

interface AdminPortalProps {
  onNavigateHome: () => void;
  onNavigateToProduct: (slug: string) => void;
}

type AdminTabType = 'dashboard' | 'products' | 'categories' | 'orders' | 'marketing' | 'settings';

const getTabFromPath = (path: string): AdminTabType => {
  const clean = path.toLowerCase();
  if (clean.includes('/admin/orders')) return 'orders';
  if (clean.includes('/admin/products')) return 'products';
  if (clean.includes('/admin/catalog') || clean.includes('/admin/categories')) return 'categories';
  if (clean.includes('/admin/promotional') || clean.includes('/admin/marketing') || clean.includes('/admin/pixel')) return 'marketing';
  if (clean.includes('/admin/settings') || clean.includes('/admin/setting')) return 'settings';
  return 'dashboard';
};

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onNavigateHome,
  onNavigateToProduct,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(store.isAdminLoggedIn());
  const [activeTab, setActiveTabState] = useState<AdminTabType>(() => getTabFromPath(window.location.pathname));

  const setActiveTab = (tab: AdminTabType) => {
    setActiveTabState(tab);
    const slugMap: Record<AdminTabType, string> = {
      dashboard: '/admin/dashboard',
      orders: '/admin/orders',
      products: '/admin/products',
      categories: '/admin/catalog',
      marketing: '/admin/promotional',
      settings: '/admin/settings',
    };
    const target = slugMap[tab] || '/admin';
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
  };

  // Login form state (Blank by default for security)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    setIsAuthenticated(store.isAdminLoggedIn());

    const handlePop = () => {
      setActiveTabState(getTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Secure verification against configured admin credentials
    if (store.verifyAdminCredentials(email, password)) {
      store.setAdminLoggedIn(true);
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  const handleLogout = () => {
    store.setAdminLoggedIn(false);
    setIsAuthenticated(false);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#800000] text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-[0.2em] text-neutral-950 block">
              HYDEE
            </span>
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">
              Atelier Management Portal
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Staff Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Security Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 border border-neutral-200 rounded-xl focus:border-[#800000] focus:outline-hidden font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#800000] hover:bg-[#5c0000] text-white py-4 rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors shadow-md cursor-pointer"
            >
              Authenticate & Enter Studio
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              ← Return to Public Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'categories', label: 'Catalog', icon: Layers },
    { id: 'marketing', label: 'Promotional & Pixel', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-neutral-950 text-white h-16 px-6 sm:px-10 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <span className="font-serif text-xl font-bold tracking-widest">HYDEE</span>
          <span className="text-[10px] bg-[#800000] text-white px-2 py-0.5 rounded-sm font-semibold uppercase">
            Admin Atelier
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onNavigateHome}
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar Navigation */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">
        {/* Left Nav */}
        <aside className="w-56 shrink-0 hidden md:block space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#800000] text-white shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex overflow-x-auto no-scrollbar gap-2 pb-2 mb-4 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap font-semibold cursor-pointer ${
                  isActive ? 'bg-[#800000] text-white' : 'bg-white text-neutral-700 border border-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={(t) => setActiveTab(t as any)} />}
          {activeTab === 'products' && <AdminProducts onNavigateToProduct={onNavigateToProduct} />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'marketing' && <AdminMarketing />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};
