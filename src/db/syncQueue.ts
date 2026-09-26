import { db } from './schema';

export const syncQueue = {
  async getPendingCount(): Promise<number> {
    return await db.syncQueue.where('status').equals('pending').count();
  },

  async markAllSynced(): Promise<void> {
    const pending = await db.syncQueue.where('status').equals('pending').toArray();
    for (const item of pending) {
      await db.syncQueue.update(item.id, { status: 'syncing' });
    }
    // Simulate cloud sync delay
    await new Promise(resolve => setTimeout(resolve, 800));
    for (const item of pending) {
      if (item.entity === 'bill') {
        await db.bills.update(item.payload.id || item.payload, { synced: true });
      }
      await db.syncQueue.delete(item.id);
    }
  },

  async clearQueue(): Promise<void> {
    await db.syncQueue.clear();
  }
};
