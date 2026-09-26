import { db } from './schema';
import type { Item } from '../types';

export const itemsRepo = {
  async getAll(): Promise<Item[]> {
    return await db.items.toArray();
  },

  async getActive(): Promise<Item[]> {
    return await db.items.filter(item => item.active).toArray();
  },

  async getById(id: string): Promise<Item | undefined> {
    return await db.items.get(id);
  },

  async create(item: Item): Promise<string> {
    await db.items.add(item);
    await db.syncQueue.add({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entity: 'item',
      action: 'create',
      payload: item,
      timestamp: Date.now(),
      status: 'pending',
    });
    return item.id;
  },

  async update(id: string, updates: Partial<Item>): Promise<void> {
    await db.items.update(id, updates);
    await db.syncQueue.add({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entity: 'item',
      action: 'update',
      payload: { id, ...updates },
      timestamp: Date.now(),
      status: 'pending',
    });
  },

  async toggleActive(id: string, currentActive: boolean): Promise<void> {
    await this.update(id, { active: !currentActive });
  },

  async deductStock(lines: { itemId: string; qty: number }[]): Promise<void> {
    for (const line of lines) {
      const item = await db.items.get(line.itemId);
      if (item && item.trackStock && typeof item.stockQty === 'number') {
        const newQty = Math.max(0, item.stockQty - line.qty);
        await db.items.update(line.itemId, { stockQty: newQty });
      }
    }
  },

  async restoreStock(lines: { itemId: string; qty: number }[]): Promise<void> {
    for (const line of lines) {
      const item = await db.items.get(line.itemId);
      if (item && item.trackStock && typeof item.stockQty === 'number') {
        await db.items.update(line.itemId, { stockQty: item.stockQty + line.qty });
      }
    }
  },
};
