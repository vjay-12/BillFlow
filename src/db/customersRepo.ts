import { db } from './schema';
import type { Customer } from '../types';

export const customersRepo = {
  async getAll(): Promise<Customer[]> {
    return await db.customers.toArray();
  },

  async getById(id: string): Promise<Customer | undefined> {
    return await db.customers.get(id);
  },

  async create(customer: Customer): Promise<string> {
    await db.customers.add(customer);
    await db.syncQueue.add({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entity: 'customer',
      action: 'create',
      payload: customer,
      timestamp: Date.now(),
      status: 'pending',
    });
    return customer.id;
  },

  async update(id: string, updates: Partial<Customer>): Promise<void> {
    await db.customers.update(id, updates);
    await db.syncQueue.add({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entity: 'customer',
      action: 'update',
      payload: { id, ...updates },
      timestamp: Date.now(),
      status: 'pending',
    });
  },

  async settleOutstanding(id: string, amount: number): Promise<void> {
    const cust = await db.customers.get(id);
    if (!cust) return;
    const newOutstanding = Math.max(0, cust.outstanding - amount);
    await this.update(id, { outstanding: newOutstanding });
  },

  async delete(id: string): Promise<void> {
    await db.customers.delete(id);
  }
};
