import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Printer, Bluetooth, Moon, Sun } from 'lucide-react';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { PasumaiLogo } from '../ui/PasumaiLogo';
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
  const { t } = useTranslation();
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
      alert(err.message || t('header.couldNotConnectBt'));
      setBtStatus('ready');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3 shadow-xs">
      {/* Brand & Store: Logo "P" and Business Name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Custom Leaf + P Monogram (sits directly on header background without container) */}
        <PasumaiLogo 
          aria-label="Pasumai Cafe Logo"
          className="h-9 w-auto sm:h-10 shrink-0"
        />

        {/* Brand Name & Tagline - Strictly Single-Line Nowrap */}
        <div className="min-w-0 flex flex-col justify-center">
          <h1
            style={{ fontSize: 'clamp(18px, 4vw, 22px)' }}
            className="font-extrabold text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis cafe-metallic-text"
          >
            {businessName}
          </h1>
          <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-800/80 dark:text-[#B8A990] whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
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
              placeholder={t('header.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 bg-slate-200 rounded"
              >
                {t('header.clear')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions & Status */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Live Clock */}
        <div className="hidden lg:flex items-center pr-2.5 border-r border-slate-200">
          <span className="text-xs font-mono font-bold text-slate-700">{currentTime}</span>
        </div>

        {/* Install PWA Button */}
        <PWAInstallButton />

        {/* Sync Badge */}
        <SyncStatusBadge />

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? t('header.switchToLight') : t('header.switchToDark')}
          aria-label={isDarkMode ? t('header.switchToLight') : t('header.switchToDark')}
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
          title={t('header.btPrinterTitle')}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
        >
          <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>{btStatus === 'connecting' ? t('header.connecting') : btStatus.startsWith('Connected:') ? btStatus : t('header.btPrinter')}</span>
        </button>
      </div>
    </header>
  );
};
