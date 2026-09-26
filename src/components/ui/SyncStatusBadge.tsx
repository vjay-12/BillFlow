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
      } catch (err) {
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-600" />
        <span>Offline Mode</span>
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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <button
        onClick={handleManualSync}
        title="Unsynced local records. Click to sync."
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
      >
        <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
        <span>Sync ({pendingSyncCount})</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      title="All bills and records are saved locally & synced."
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>Synced</span>
    </button>
  );
};
