import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Building2, 
  Printer, 
  Bluetooth, 
  Save, 
  RotateCcw, 
  CheckCircle,
  Download,
  Upload,
  Receipt,
  Check,
  ShieldCheck,
  AlertCircle,
  QrCode,
  X,
  Languages,
  UtensilsCrossed
} from 'lucide-react';
import { db, INITIAL_BUSINESS_PROFILE } from '../db/schema';
import { 
  downloadBackupFile, 
  restoreFromBackupFile, 
  restoreDefaultMenu,
  CANONICAL_BACKUP 
} from '../db/dataSafety';
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
  const [safetyFeedback, setSafetyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOperating, setIsOperating] = useState(false);

  if (profileRecord && profileRecord !== prevRecord) {
    setPrevRecord(profileRecord);
    setProfile(profileRecord);
  }

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setSafetyFeedback({ type, message });
    setTimeout(() => {
      setSafetyFeedback((current) => (current?.message === message ? null : current));
    }, 4000);
  };

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

  // 1. Download Backup Now
  const handleDownloadBackup = async () => {
    try {
      setIsOperating(true);
      const res = await downloadBackupFile();
      showFeedback('success', `Backup downloaded: ${res.filename} (${res.itemCount} items)`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Download failed');
    } finally {
      setIsOperating(false);
    }
  };

  // 2. Restore from File
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Restore backup from "${file.name}"? This will replace current items, bills, and customers with the backup data.`)) {
      e.target.value = '';
      return;
    }

    try {
      setIsOperating(true);
      const text = await file.text();
      const res = await restoreFromBackupFile(text);
      
      // Update local profile state
      const updatedProfile = await db.businessProfile.get('main');
      if (updatedProfile) setProfile(updatedProfile);

      showFeedback('success', res.message);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to restore file');
    } finally {
      setIsOperating(false);
      e.target.value = '';
    }
  };

  // 3. Restore Default Menu (Emergency Reset)
  const handleRestoreDefaultMenu = async () => {
    if (!confirm('Emergency Reset: Restore original 59-item Pasumai Cafe menu and default settings?')) {
      return;
    }

    try {
      setIsOperating(true);
      const res = await restoreDefaultMenu();
      setProfile(CANONICAL_BACKUP.profile);
      showFeedback('success', res.message);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Emergency restore failed');
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 pb-28 md:pb-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-5">
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

      {/* Menu & Language Preferences */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Menu & Language Preferences</h3>
              <p className="text-[11px] text-slate-500">
                Configure non-veg item visibility and menu display language
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              profile.showNonVeg !== false
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {profile.showNonVeg !== false ? 'Non-Veg Visible' : 'Pure Veg Mode (Non-Veg Hidden)'}
          </span>
        </div>

        {/* Setting 1: Show Non-Veg Items Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1 max-w-xl">
            <span className="font-bold text-slate-900 text-sm">Show Non-Veg Items</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              When enabled, non-vegetarian items and the "Non-Veg" diet filter chip appear across Billing POS and Menu Catalog. When disabled, all non-veg items are cleanly hidden from display and counts without deleting any underlying data.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <span className="text-xs font-bold text-slate-600">
              {profile.showNonVeg !== false ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={profile.showNonVeg !== false}
              aria-label="Toggle Non-Veg visibility"
              onClick={async () => {
                const nextState = profile.showNonVeg === false;
                const updated = { ...profile, showNonVeg: nextState };
                setProfile(updated);
                await db.businessProfile.put({ ...updated, id: 'main' } as any);
              }}
              className={`relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                profile.showNonVeg !== false ? 'bg-teal-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-flex h-7 w-7 transform rounded-full bg-white shadow-md ring-0 items-center justify-center transition duration-200 ease-in-out ${
                  profile.showNonVeg !== false ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                {profile.showNonVeg !== false ? (
                  <Check className="w-4 h-4 text-teal-700" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Off</span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Setting 2: Menu Language Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-slate-900 text-sm">Menu Display Language</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Controls item name display language on the main Billing POS cards. Admin Menu & Items view always shows both English and Tamil names together. Receipts, buttons, and navigation remain in English.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                const updated = { ...profile, menuLanguage: 'English' as const };
                setProfile(updated);
                await db.businessProfile.put({ ...updated, id: 'main' } as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                (profile.menuLanguage || 'English') === 'English'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={async () => {
                const updated = { ...profile, menuLanguage: 'Tamil' as const };
                setProfile(updated);
                await db.businessProfile.put({ ...updated, id: 'main' } as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                profile.menuLanguage === 'Tamil'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>
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
            {profile.enableGst !== false ? 'GST Enabled' : 'GST Disabled'}
          </span>
        </div>

        {/* GST Enable/Disable Toggle Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1 max-w-xl">
            <span className="font-bold text-slate-900 text-sm">GST Calculation</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              When enabled, item GST rates apply during checkout and display on receipts. When disabled, tax is ₹0 and tax lines are completely removed across checkout, receipts, bill details, and reports.
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

        {/* Payment Details & UPI QR Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <QrCode className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Payment Details & UPI QR</h3>
              <p className="text-[11px] text-slate-500">
                Configure your store UPI ID and upload QR code image for customer scanning at checkout
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Merchant UPI ID (VPA)</label>
              <input
                type="text"
                value={profile.upiId || ''}
                onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                placeholder="storename@oksbi"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Displayed as text below the QR code on the payment screen as a fallback reference.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Upload QR Code</label>
              <div className="flex items-center gap-3">
                {profile.upiQrCodeUrl ? (
                  <div className="relative shrink-0">
                    <img
                      src={profile.upiQrCodeUrl}
                      alt="Uploaded Store QR Code"
                      className="w-20 h-20 object-contain rounded-xl border border-slate-200 p-1 bg-white shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, upiQrCodeUrl: '' })}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600 transition cursor-pointer"
                      title="Remove QR code"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-1 text-center shrink-0">
                    <QrCode className="w-6 h-6 stroke-[1.5] mb-0.5 text-slate-300" />
                    <span className="text-[9px] font-medium leading-none">No QR</span>
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl border border-teal-200 font-bold text-xs cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{profile.upiQrCodeUrl ? 'Replace QR Code' : 'Upload QR Code'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          alert('QR code image file must be under 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          setProfile({ ...profile, upiQrCodeUrl: base64 });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Upload image of your UPI QR code. It will be displayed prominently on the checkout payment window.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware & Printer Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Printer className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Thermal Printer & Hardware</h3>
              <p className="text-[11px] text-slate-500">Configure receipt paper width preference and Bluetooth thermal printer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Receipt Paper Roll Width (Saved Preference)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, paperWidth: '58mm' })}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
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
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
                    profile.paperWidth === '80mm'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  80mm (3 Inch Standard)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Receipts will automatically use this width setting without needing to choose per-bill.
              </p>
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

      {/* Backup & Restore Safety Net */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Backup & Restore</h3>
              <p className="text-[11px] text-slate-500">
                Guaranteed data safety net: export local backups, restore previous files, or instant emergency menu reset
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            59 Canonical Items Ready
          </span>
        </div>

        {safetyFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in transition ${
              safetyFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {safetyFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{safetyFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSafetyFeedback(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Action A: Download Backup Now */}
          <button
            type="button"
            disabled={isOperating}
            onClick={handleDownloadBackup}
            className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition cursor-pointer text-center group"
          >
            <Download className="w-5 h-5 text-teal-700 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs">Download Backup Now</span>
            <span className="text-[10px] text-slate-400">Save full state as JSON</span>
          </button>

          {/* Action B: Restore from File */}
          <label className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition cursor-pointer text-center group relative">
            <Upload className="w-5 h-5 text-indigo-700 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs">Restore from File</span>
            <span className="text-[10px] text-slate-400">Upload previous backup JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelected}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Action C: Restore Default Menu */}
          <button
            type="button"
            disabled={isOperating}
            onClick={handleRestoreDefaultMenu}
            className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 active:bg-amber-200 text-amber-900 transition cursor-pointer text-center group"
            title="Emergency reset to original 59 Pasumai Cafe items"
          >
            <RotateCcw className="w-5 h-5 text-amber-700 group-hover:-rotate-90 transition-transform duration-200" />
            <span className="font-bold text-xs">Restore Default Menu</span>
            <span className="text-[10px] text-amber-700/80">Emergency reset (59 items)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
