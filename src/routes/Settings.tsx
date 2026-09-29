import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  UtensilsCrossed,
  LayoutGrid,
  Globe
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
  const { t, i18n } = useTranslation();
  const currentAppLang = i18n.resolvedLanguage || i18n.language || 'en';

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

  const handleAppLanguageChange = (lang: 'en' | 'ta') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('billflow_app_language', lang);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.businessProfile.put({ ...profile, id: 'main' } as any);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(t('settings.errorSaving', { message: err.message }));
    }
  };

  const handleConnectBt = async () => {
    try {
      setBtStatus(t('settings.searching'));
      const name = await bluetoothPrinter.connect();
      setBtStatus(t('settings.connected', { name }));
    } catch (err: any) {
      alert(err.message || t('settings.btFailed'));
      setBtStatus(t('settings.disconnected'));
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
      showFeedback('success', t('settings.backupDownloaded', { filename: res.filename, count: res.itemCount }));
    } catch (err: any) {
      showFeedback('error', err?.message || t('settings.downloadFailed'));
    } finally {
      setIsOperating(false);
    }
  };

  // 2. Restore from File
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(t('settings.restoreConfirm', { name: file.name }))) {
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
      showFeedback('error', err?.message || t('settings.restoreFailed'));
    } finally {
      setIsOperating(false);
      e.target.value = '';
    }
  };

  // 3. Restore Default Menu (Emergency Reset)
  const handleRestoreDefaultMenu = async () => {
    if (!confirm(t('settings.emergencyResetConfirm'))) {
      return;
    }

    try {
      setIsOperating(true);
      const res = await restoreDefaultMenu();
      setProfile(CANONICAL_BACKUP.profile);
      showFeedback('success', res.message);
    } catch (err: any) {
      showFeedback('error', err?.message || t('settings.emergencyResetFailed'));
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 pb-28 md:pb-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-5">
      {/* Top Title */}
      <div className="flex items-center justify-between bg-white dark:bg-[#2E2119] p-4 rounded-2xl border border-slate-200 dark:border-[#3D2C20] shadow-xs">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-[#F5F0E6] tracking-tight">
            {t('settings.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#B8A990]">
            {t('settings.subtitle')}
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{t('settings.settingsSaved')}</span>
          </div>
        )}
      </div>

      {/* App Language (Entire UI Localization) */}
      <div className="bg-white dark:bg-[#2E2119] rounded-2xl p-5 border border-slate-200 dark:border-[#3D2C20] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3D2C20] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-700 dark:text-[#14A89B]" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-[#F5F0E6] text-sm">{t('settings.appLanguage')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#B8A990]">
                {t('settings.appLanguageDesc')}
              </p>
            </div>
          </div>

          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-[#14A89B] border border-teal-200 dark:border-teal-800/50"
          >
            {currentAppLang === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#271C15] border border-slate-200 dark:border-[#3D2C20]">
          <div className="space-y-1 max-w-xl">
            <span className="font-bold text-slate-900 dark:text-[#F5F0E6] text-sm">{t('settings.appLanguage')}</span>
            <p className="text-xs text-slate-600 dark:text-[#B8A990] leading-relaxed">
              {t('settings.appLanguageDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleAppLanguageChange('en')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                currentAppLang !== 'ta'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white dark:bg-[#2E2119] text-slate-700 dark:text-[#D4C7B5] border-slate-200 dark:border-[#3D2C20] hover:bg-slate-100 dark:hover:bg-[#38291F]'
              }`}
            >
              {t('settings.english')}
            </button>
            <button
              type="button"
              onClick={() => handleAppLanguageChange('ta')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                currentAppLang === 'ta'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white dark:bg-[#2E2119] text-slate-700 dark:text-[#D4C7B5] border-slate-200 dark:border-[#3D2C20] hover:bg-slate-100 dark:hover:bg-[#38291F]'
              }`}
            >
              {t('settings.tamil')}
            </button>
          </div>
        </div>
      </div>

      {/* Menu & Language Preferences */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t('settings.menuPreferences')}</h3>
              <p className="text-[11px] text-slate-500">
                {t('settings.menuPreferencesSub')}
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
            {profile.showNonVeg !== false ? t('settings.nonVegVisible') : t('settings.pureVegMode')}
          </span>
        </div>

        {/* Setting 1: Show Non-Veg Items Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1 max-w-xl">
            <span className="font-bold text-slate-900 text-sm">{t('settings.showNonVeg')}</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('settings.showNonVegDesc')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <span className="text-xs font-bold text-slate-600">
              {profile.showNonVeg !== false ? t('settings.enabled') : t('settings.disabled')}
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
              <span className="font-bold text-slate-900 text-sm">{t('settings.menuDisplayLanguage')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('settings.menuDisplayLanguageDesc')}
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

        {/* Setting 3: Number of Tables Configuration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-slate-900 text-sm">{t('settings.numberOfTables')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('settings.numberOfTablesDesc')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <input
              type="number"
              min="1"
              max="100"
              value={profile.tableCount ?? 10}
              onChange={async (e) => {
                const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                const updated = { ...profile, tableCount: val };
                setProfile(updated);
                await db.businessProfile.put({ ...updated, id: 'main' } as any);
              }}
              className="w-24 px-3 py-2 bg-white text-slate-800 rounded-xl border border-slate-300 font-mono font-bold text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <span className="text-xs font-bold text-slate-500">{t('settings.tables')}</span>
          </div>
        </div>
      </div>

      {/* Tax & GST Settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t('settings.taxGstSettings')}</h3>
              <p className="text-[11px] text-slate-500">
                {t('settings.taxGstSub')}
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
            {profile.enableGst !== false ? t('settings.gstEnabled') : t('settings.gstDisabled')}
          </span>
        </div>

        {/* GST Enable/Disable Toggle Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1 max-w-xl">
            <span className="font-bold text-slate-900 text-sm">{t('settings.gstCalculation')}</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('settings.gstCalculationDesc')}
            </p>
          </div>

          {/* Interactive Toggle Switch */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <span className="text-xs font-bold text-slate-600">
              {profile.enableGst !== false ? t('settings.enabled') : t('settings.disabled')}
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
        <div className="bg-white dark:bg-[#2E2119] rounded-2xl p-5 border border-slate-200 dark:border-[#3D2C20] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#3D2C20]">
            <Building2 className="w-5 h-5 text-teal-700 dark:text-[#14A89B]" />
            <h3 className="font-bold text-slate-800 dark:text-[#F5F0E6] text-sm">{t('settings.businessReceiptProfile')}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.businessName')}</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#271C15] rounded-xl border border-slate-200 dark:border-[#3D2C20] font-semibold text-slate-900 dark:text-[#F5F0E6] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.tagline')}</label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#271C15] rounded-xl border border-slate-200 dark:border-[#3D2C20] text-slate-900 dark:text-[#F5F0E6] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.storeAddress')}</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#271C15] rounded-xl border border-slate-200 dark:border-[#3D2C20] text-slate-900 dark:text-[#F5F0E6] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.phoneNumber')}</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#271C15] rounded-xl border border-slate-200 dark:border-[#3D2C20] font-mono text-slate-900 dark:text-[#F5F0E6] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.gstinNumber')}</label>
              <input
                type="text"
                value={profile.gstin || ''}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#271C15] rounded-xl border border-slate-200 dark:border-[#3D2C20] font-mono uppercase text-slate-900 dark:text-[#F5F0E6] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.fssaiNumber')}</label>
              <input
                type="text"
                value={profile.fssai || ''}
                onChange={(e) => setProfile({ ...profile, fssai: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#271C15] rounded-xl border border-slate-200 dark:border-[#3D2C20] font-mono text-slate-900 dark:text-[#F5F0E6] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
              />
            </div>
          </div>
        </div>

        {/* Payment Details & UPI QR Section */}
        <div className="bg-white dark:bg-[#2E2119] rounded-2xl p-5 border border-slate-200 dark:border-[#3D2C20] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#3D2C20]">
            <QrCode className="w-5 h-5 text-teal-700 dark:text-[#14A89B]" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-[#F5F0E6] text-sm">{t('settings.paymentDetails')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#B8A990]">
                {t('settings.paymentDetailsSub')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.merchantUpiId')}</label>
              <input
                type="text"
                value={profile.upiId || ''}
                onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                placeholder={t('settings.merchantUpiPlaceholder')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#271C15] rounded-xl border border-slate-200 dark:border-[#3D2C20] font-mono text-sm text-slate-900 dark:text-[#F5F0E6] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-[#211712]"
              />
              <p className="text-[10px] text-slate-400 dark:text-[#B8A990] mt-1">
                {t('settings.merchantUpiHint')}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.uploadQr')}</label>
              <div className="flex items-center gap-3">
                {profile.upiQrCodeUrl ? (
                  <div className="relative shrink-0">
                    <img
                      src={profile.upiQrCodeUrl}
                      alt="Uploaded Store QR Code"
                      className="w-20 h-20 object-contain rounded-xl border border-slate-200 dark:border-[#3D2C20] p-1 bg-white shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, upiQrCodeUrl: '' })}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600 transition cursor-pointer"
                      title={t('settings.removeQr')}
                      aria-label={t('settings.removeQr')}
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-[#3D2C20] bg-slate-50 dark:bg-[#271C15] flex flex-col items-center justify-center text-slate-400 dark:text-[#B8A990] p-1 text-center shrink-0">
                    <QrCode className="w-6 h-6 stroke-[1.5] mb-0.5 text-slate-300 dark:text-slate-600" />
                    <span className="text-[9px] font-medium leading-none">{t('settings.noQr')}</span>
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-[#14A89B] rounded-xl border border-teal-200 dark:border-teal-800/50 font-bold text-xs cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{profile.upiQrCodeUrl ? t('settings.replaceQr') : t('settings.uploadQr')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          alert(t('settings.qrSizeLimit'));
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
                  <p className="text-[10px] text-slate-400 dark:text-[#B8A990] leading-tight">
                    {t('settings.uploadQrHint')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware & Printer Settings */}
        <div className="bg-white dark:bg-[#2E2119] rounded-2xl p-5 border border-slate-200 dark:border-[#3D2C20] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#3D2C20]">
            <Printer className="w-5 h-5 text-teal-700 dark:text-[#14A89B]" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-[#F5F0E6] text-sm">{t('settings.thermalPrinterHardware')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#B8A990]">{t('settings.thermalPrinterSub')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.paperRollWidth')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, paperWidth: '58mm' })}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
                    profile.paperWidth === '58mm'
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-[#14A89B] ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-[#3D2C20] bg-slate-50 dark:bg-[#271C15] text-slate-600 dark:text-[#D4C7B5]'
                  }`}
                >
                  {t('settings.paper58mm')}
                </button>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, paperWidth: '80mm' })}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
                    profile.paperWidth === '80mm'
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-[#14A89B] ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-[#3D2C20] bg-slate-50 dark:bg-[#271C15] text-slate-600 dark:text-[#D4C7B5]'
                  }`}
                >
                  {t('settings.paper80mm')}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-[#B8A990] mt-1">
                {t('settings.paperWidthHint')}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-[#D4C7B5] mb-1">{t('settings.webBtPrinter')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnectBt}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#271C15] hover:bg-slate-200 dark:hover:bg-[#38291F] text-slate-700 dark:text-[#D4C7B5] font-bold border border-slate-200 dark:border-[#3D2C20] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Bluetooth className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{btStatus}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-[#14A89B] font-bold border border-teal-200 dark:border-teal-800/50 transition cursor-pointer"
                >
                  {t('settings.testPrint')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t('settings.saveStoreSettings')}</span>
          </button>
        </div>
      </form>

      {/* Backup & Restore Safety Net */}
      <div className="bg-white dark:bg-[#2E2119] rounded-2xl p-5 border border-slate-200 dark:border-[#3D2C20] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3D2C20] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-[#14A89B]" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-[#F5F0E6] text-sm">{t('settings.backupRestore')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#B8A990]">
                {t('settings.backupRestoreSub')}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            {t('settings.canonicalReady')}
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
            className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-[#3D2C20] bg-slate-50 dark:bg-[#271C15] hover:bg-slate-100 dark:hover:bg-[#38291F] active:bg-slate-200 text-slate-700 dark:text-[#D4C7B5] transition cursor-pointer text-center group"
          >
            <Download className="w-5 h-5 text-teal-700 dark:text-[#14A89B] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs">{t('settings.downloadBackupNow')}</span>
            <span className="text-[10px] text-slate-400 dark:text-[#B8A990]">{t('settings.downloadBackupSub')}</span>
          </button>

          {/* Action B: Restore from File */}
          <label className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-[#3D2C20] bg-slate-50 dark:bg-[#271C15] hover:bg-slate-100 dark:hover:bg-[#38291F] active:bg-slate-200 text-slate-700 dark:text-[#D4C7B5] transition cursor-pointer text-center group relative">
            <Upload className="w-5 h-5 text-indigo-700 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs">{t('settings.restoreFromFile')}</span>
            <span className="text-[10px] text-slate-400 dark:text-[#B8A990]">{t('settings.restoreFromFileSub')}</span>
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
            className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:bg-amber-200 text-amber-900 dark:text-amber-300 transition cursor-pointer text-center group"
            title={t('settings.restoreDefaultMenu')}
          >
            <RotateCcw className="w-5 h-5 text-amber-700 dark:text-amber-400 group-hover:-rotate-90 transition-transform duration-200" />
            <span className="font-bold text-xs">{t('settings.restoreDefaultMenu')}</span>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">{t('settings.restoreDefaultMenuSub')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
