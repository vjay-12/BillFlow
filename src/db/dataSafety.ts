import { db } from './schema';
import canonicalData from '../data/seed-backup.json';
import type { Item, Customer, Bill, BusinessProfile } from '../types';

export const SETUP_COMPLETE_KEY = 'billflow_setup_complete';

export interface BackupData {
  appName: string;
  version: number;
  exportedAt: string;
  source?: string;
  itemCount: number;
  profile: BusinessProfile;
  items: Item[];
  customers?: Customer[];
  bills?: Bill[];
}

export const CANONICAL_BACKUP: BackupData = canonicalData as unknown as BackupData;

/**
 * Auto-restore safety net:
 * Checks on every app load whether the menu item catalog is unexpectedly empty.
 * If storage was cleared or corrupted, instantly restores from the canonical backup.
 */
export async function checkAndAutoRestore(): Promise<{ restored: boolean; itemCount: number }> {
  try {
    const itemsCount = await db.items.count();
    const wasSetupComplete = localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';

    // If items are unexpectedly missing or empty:
    if (itemsCount === 0) {
      if (wasSetupComplete) {
        console.warn(
          '⚠️ [BillFlow SafetyNet] Menu items storage was unexpectedly empty! Auto-restoring 59 canonical items transparently...'
        );
      } else {
        console.info(
          'ℹ️ [BillFlow SafetyNet] First-time setup detected. Seeding canonical 59-item menu catalog...'
        );
      }

      await restoreCanonicalSeedData();
      localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
      return { restored: true, itemCount: CANONICAL_BACKUP.items.length };
    }

    // Ensure setup flag is set if data already exists
    if (!wasSetupComplete) {
      localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    }

    return { restored: false, itemCount: itemsCount };
  } catch (err) {
    console.error('❌ [BillFlow SafetyNet] Error during auto-restore check:', err);
    return { restored: false, itemCount: 0 };
  }
}

/**
 * Restores canonical 59 items, default profile, and default customers
 */
export async function restoreCanonicalSeedData(): Promise<void> {
  await db.transaction('rw', [db.items, db.businessProfile, db.customers], async () => {
    await db.items.clear();
    await db.items.bulkPut(CANONICAL_BACKUP.items);

    const existingProfile = await db.businessProfile.get('main');
    if (!existingProfile) {
      await db.businessProfile.put({ ...CANONICAL_BACKUP.profile, id: 'main' } as any);
    }

    const custCount = await db.customers.count();
    if (custCount === 0 && CANONICAL_BACKUP.customers) {
      await db.customers.bulkPut(CANONICAL_BACKUP.customers);
    }
  });
  localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
}

/**
 * Emergency Reset: One-tap instant restore of default 59-item menu & settings
 * Used during live demos if something goes visibly wrong.
 */
export async function restoreDefaultMenu(): Promise<{ success: boolean; itemCount: number; message: string }> {
  const startTime = performance.now();
  try {
    await db.transaction('rw', [db.items, db.businessProfile], async () => {
      await db.items.clear();
      await db.items.bulkPut(CANONICAL_BACKUP.items);
      await db.businessProfile.put({ ...CANONICAL_BACKUP.profile, id: 'main' } as any);
    });

    localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    localStorage.setItem('billflow_enable_gst', String(CANONICAL_BACKUP.profile.enableGst ?? true));

    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: true,
      itemCount: CANONICAL_BACKUP.items.length,
      message: `Default menu restored (${CANONICAL_BACKUP.items.length} items) in ${elapsed}ms`,
    };
  } catch (err: any) {
    console.error('❌ [BillFlow SafetyNet] Failed to restore default menu:', err);
    return {
      success: false,
      itemCount: 0,
      message: `Failed to restore default menu: ${err?.message || 'Unknown error'}`,
    };
  }
}

/**
 * Manual Backup: Download current full app state as a timestamped JSON file
 */
export async function downloadBackupFile(): Promise<{ success: boolean; filename: string; itemCount: number }> {
  try {
    const profile = (await db.businessProfile.get('main')) || CANONICAL_BACKUP.profile;
    const items = await db.items.toArray();
    const bills = await db.bills.toArray();
    const customers = await db.customers.toArray();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `pasumai-cafe-backup-${timestamp}.json`;

    const backupPayload: BackupData = {
      appName: 'BillFlow POS',
      version: 1,
      exportedAt: new Date().toISOString(),
      source: 'manual-download',
      itemCount: items.length,
      profile,
      items,
      customers,
      bills,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename, itemCount: items.length };
  } catch (err: any) {
    console.error('❌ [BillFlow SafetyNet] Export backup failed:', err);
    throw new Error(`Failed to generate backup file: ${err?.message || 'Unknown error'}`);
  }
}

/**
 * Manual Restore: Parses, validates, and imports a backup JSON file
 */
export async function restoreFromBackupFile(
  jsonText: string
): Promise<{ success: boolean; itemCount: number; billsCount: number; message: string }> {
  const startTime = performance.now();
  try {
    const parsed = JSON.parse(jsonText);

    // Validate payload
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON backup file format.');
    }

    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      throw new Error('Backup file does not contain a valid items list.');
    }

    // Atomically replace state
    await db.transaction('rw', [db.items, db.businessProfile, db.customers, db.bills], async () => {
      // 1. Items
      await db.items.clear();
      await db.items.bulkPut(parsed.items);

      // 2. Profile
      if (parsed.profile && typeof parsed.profile === 'object') {
        await db.businessProfile.put({ ...parsed.profile, id: 'main' } as any);
        if (parsed.profile.enableGst !== undefined) {
          localStorage.setItem('billflow_enable_gst', String(parsed.profile.enableGst));
        }
      }

      // 3. Customers
      if (Array.isArray(parsed.customers)) {
        await db.customers.clear();
        await db.customers.bulkPut(parsed.customers);
      }

      // 4. Bills
      if (Array.isArray(parsed.bills)) {
        await db.bills.clear();
        await db.bills.bulkPut(parsed.bills);
      }
    });

    localStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    const elapsed = Math.round(performance.now() - startTime);

    return {
      success: true,
      itemCount: parsed.items.length,
      billsCount: Array.isArray(parsed.bills) ? parsed.bills.length : 0,
      message: `Restored ${parsed.items.length} items & settings in ${elapsed}ms`,
    };
  } catch (err: any) {
    console.error('❌ [BillFlow SafetyNet] Restore from file failed:', err);
    throw new Error(`Restore failed: ${err?.message || 'Corrupted file'}`);
  }
}
