import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Building2, 
  Printer, 
  Bluetooth, 
  Save, 
  Database, 
  RotateCcw, 
  CheckCircle,
  Download,
  Receipt,
  Check
} from 'lucide-react';
import { db, INITIAL_BUSINESS_PROFILE, seedInitialDataIfNeeded } from '../db/schema';
import { bluetoothPrinter } from '../printing/bluetoothPrinter';
import { useCartStore } from '../stores/cartStore';
import type { BusinessProfile } from '../types';

export const SettingsRoute: React.FC = () => {
  const profileRecord = useLiveQuery(async () => {
    return await db.businessProfile.get('main');
  }, []);

  const [profile, setProfile] = useState<BusinessProfile>(INITIAL_BUSINESS_PROFILE);
  const [prevRecord, setPrevRecord] = useState(profileRecord);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [btStatus, setBtStatus] = useState<string>('Disconnected');

  if (profileRecord && profileRecord !== prevRecord) {
    setPrevRecord(profileRecord);
    setProfile(profileRecord);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.businessProfile.put({ ...profile, id: 'main' } as any);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    }
  };

  const handleConnectBt = async () => {
    try {
      setBtStatus('Searching...');
      const name = await bluetoothPrinter.connect();
      setBtStatus(`Connected: ${name}`);
    } catch (err: any) {
      alert(err.message || 'Bluetooth connection failed');
      setBtStatus('Disconnected');
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  const handleExportBackup = async () => {
    const items = await db.items.toArray();
    const bills = await db.bills.toArray();
    const customers = await db.customers.toArray();

    const data = {
      profile,
      items,
      bills,
      customers,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all data and re-seed sample items?')) {
      await db.items.clear();
      await db.bills.clear();
      await db.customers.clear();
      await seedInitialDataIfNeeded();
      alert('Sample data reloaded successfully!');
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 pb-20 md:pb-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-5">
      {/* Top Title */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">
            Store & Hardware Settings
          </h2>
          <p className="text-xs text-slate-500">
            Configure business identity, receipt headers, ESC/POS Bluetooth printers, and tax settings
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Tax & GST Settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tax & GST Settings</h3>
              <p className="text-[11px] text-slate-500">
                Enable or disable GST calculation across checkout, receipts, and reports
              </p>
            </div>
          </div>

          {/* GST Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              profile.enableGst !== false
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {profile.enableGst !== false ? 'GST Enabled' : 'GST Disabled (₹0 Tax)'}
          </span>
        </div>

        {/* GST Enable/Disable Toggle Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1 max-w-xl">
            <span className="font-bold text-slate-900 text-sm">GST Calculation</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              When enabled, item GST rates apply during checkout and display on receipts. When disabled, tax is ₹0 across the entire app (checkout, receipts, and reports show GST: ₹0).
            </p>
          </div>

          {/* Interactive Toggle Switch */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <span className="text-xs font-bold text-slate-600">
              {profile.enableGst !== false ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={profile.enableGst !== false}
              aria-label="Toggle GST calculation"
              onClick={async () => {
                const nextState = profile.enableGst === false;
                const updated = { ...profile, enableGst: nextState };
                setProfile(updated);
                useCartStore.getState().setGstEnabled(nextState);
                localStorage.setItem('billflow_enable_gst', String(nextState));
                await db.businessProfile.put({ ...updated, id: 'main' } as any);
              }}
              className={`relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                profile.enableGst !== false ? 'bg-teal-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-flex h-7 w-7 transform rounded-full bg-white shadow-md ring-0 items-center justify-center transition duration-200 ease-in-out ${
                  profile.enableGst !== false ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                {profile.enableGst !== false ? (
                  <Check className="w-4 h-4 text-teal-700" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Off</span>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Business Identity Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-800 text-sm">Business & Receipt Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Store Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Merchant UPI VPA (for QR)</label>
              <input
                type="text"
                value={profile.upiId || ''}
                onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                placeholder="storename@oksbi"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={profile.gstin || ''}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">FSSAI License No.</label>
              <input
                type="text"
                value={profile.fssai || ''}
                onChange={(e) => setProfile({ ...profile, fssai: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Hardware & Printer Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Printer className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-800 text-sm">Thermal Printer & Hardware</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Receipt Paper Roll Width</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, paperWidth: '58mm' })}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                    profile.paperWidth === '58mm'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  58mm (2 Inch Pocket)
                </button>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, paperWidth: '80mm' })}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                    profile.paperWidth === '80mm'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  80mm (3 Inch Standard)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Web Bluetooth Printer</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnectBt}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Bluetooth className="w-4 h-4 text-blue-600" />
                  <span>{btStatus}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 transition"
                >
                  Test Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>

      {/* Database & Backup Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Database className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-800 text-sm">Local Storage & Data Tools</h3>
        </div>

        <p className="text-xs text-slate-500">
          BillFlow stores all records in browser IndexedDB for offline-first reliability. You can export a JSON backup anytime or reload sample menu items.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>

          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Sample Menu & Bills</span>
          </button>
        </div>
      </div>
    </div>
  );
};
