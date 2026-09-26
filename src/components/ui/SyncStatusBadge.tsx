import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { syncQueue } from '../../db/syncQueue';
import { useUIStore } from '../../stores/uiStore';

export const SyncStatusBadge: React.FC = () => {
  const { isOnline, setIsOnline, pendingSyncCount, setPendingSyncCount } = useUIStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync count check and interval
    const checkSync = async () => {
      try {
        const count = await syncQueue.getPendingCount();
        setPendingSyncCount(count);
      } catch {
        // quiet catch
      }
    };

    checkSync();
    const interval = setInterval(checkSync, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [setIsOnline, setPendingSyncCount]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncQueue.markAllSynced();
      setPendingSyncCount(0);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div 
        title="App is working offline. All data is saved to IndexedDB and will sync when reconnected."
        className="inline-flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-600" />
        <span className="hidden sm:inline">Offline Mode</span>
        {pendingSyncCount > 0 && (
          <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {pendingSyncCount}
          </span>
        )}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="inline-flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse shrink-0">
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        <span className="hidden sm:inline">Syncing...</span>
      </div>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <button
        onClick={handleManualSync}
        title="Unsynced local records. Click to sync."
        aria-label={`Unsynced local records (${pendingSyncCount}). Click to sync.`}
        className="inline-flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
        <span className="hidden sm:inline">Sync ({pendingSyncCount})</span>
        <span className="sm:hidden text-[10px] font-bold bg-indigo-200 text-indigo-800 px-1 rounded-full">
          {pendingSyncCount}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      title="All bills and records are saved locally & synced."
      aria-label="All bills and records are saved locally and synced"
      className="inline-flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shrink-0"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span className="hidden sm:inline">Synced</span>
    </button>
  );
};
