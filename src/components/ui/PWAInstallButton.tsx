import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'To install BillFlow POS as a standalone app:\n\n' +
        '1. Desktop Chrome: Click the (⊕) icon in Chrome\'s address bar at http://localhost:5173\n' +
        '2. Desktop Shortcut: Double-click the "BillFlow POS" shortcut on your Desktop to open directly in app mode!\n' +
        '3. Android Phone: Chrome blocks PWA installation on plain HTTP LAN IPs (192.168.x.x). To install on phone, enable the Chrome flag at chrome://flags/#unsafely-treat-insecure-origin-as-secure for your IP address.'
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      title="Install BillFlow POS as a standalone app"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition select-none cursor-pointer"
    >
      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
};
