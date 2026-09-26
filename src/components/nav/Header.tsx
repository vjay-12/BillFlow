import { useState, useEffect } from 'react';
import { Receipt, Search, Printer, Bluetooth, Moon, Sun } from 'lucide-react';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { useUIStore } from '../../stores/uiStore';
import { bluetoothPrinter } from '../../printing/bluetoothPrinter';

interface HeaderProps {
  businessName?: string;
  tagline?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  businessName = 'Pasumai Cafe',
  tagline = '100% organic food since 2012'
}) => {
  const { searchQuery, setSearchQuery, activeTab, isDarkMode, toggleDarkMode } = useUIStore();
  const [btStatus, setBtStatus] = useState<string>('ready');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectBt = async () => {
    try {
      setBtStatus('connecting');
      const name = await bluetoothPrinter.connect();
      setBtStatus(`Connected: ${name}`);
      setTimeout(() => setBtStatus('ready'), 3000);
    } catch (err: any) {
      alert(err.message || 'Could not connect to Bluetooth printer');
      setBtStatus('ready');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 shadow-xs">
      {/* Brand & Store */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 ring-1 ring-emerald-600/30">
          <Receipt className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight cafe-metallic-text">
              {businessName}
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
              Organic
            </span>
          </div>
          <p className="text-[11px] font-semibold text-emerald-800/80 truncate max-w-[180px] md:max-w-[260px]">
            {tagline}
          </p>
        </div>
      </div>

      {/* Global Search Bar (for Billing & Inventory) */}
      {(activeTab === 'billing' || activeTab === 'items') && (
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items by name, barcode, or code... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 bg-slate-200 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions & Status */}
      <div className="flex items-center gap-2.5">
        {/* Live Clock */}
        <div className="hidden lg:flex flex-col items-end pr-2 border-r border-slate-200">
          <span className="text-xs font-mono font-bold text-slate-700">{currentTime}</span>
          <span className="text-[10px] text-slate-400 font-medium">Terminal #1</span>
        </div>

        {/* Install PWA Button */}
        <PWAInstallButton />

        {/* Sync Badge */}
        <SyncStatusBadge />

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Crisp Daytime Light' : 'Switch to Pasumai Café Warm Dark'}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-[#D98E3B]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Printer Quick Connect */}
        <button
          onClick={handleConnectBt}
          title="Connect ESC/POS Thermal Bluetooth Printer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
        >
          <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>{btStatus === 'connecting' ? 'Connecting...' : 'BT Printer'}</span>
        </button>
      </div>
    </header>
  );
};
