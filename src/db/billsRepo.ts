import { db } from './schema';
import type { Bill, PaymentMode } from '../types';
import { itemsRepo } from './itemsRepo';

export const billsRepo = {
  async getNextBillNo(): Promise<number> {
    const lastBill = await db.bills.orderBy('billNo').last();
    return lastBill ? lastBill.billNo + 1 : 1001;
  },

  async getAll(): Promise<Bill[]> {
    return await db.bills.orderBy('timestamp').reverse().toArray();
  },

  async getById(id: string): Promise<Bill | undefined> {
    return await db.bills.get(id);
  },

  async create(bill: Bill): Promise<string> {
    await db.bills.add(bill);

    // Deduct stock if stock tracking enabled
    await itemsRepo.deductStock(bill.lines);

    // If customer assigned, update loyalty points (+1 point per 50 currency)
    if (bill.customerId) {
      const cust = await db.customers.get(bill.customerId);
      if (cust) {
        const pointsEarned = Math.floor(bill.total / 50);
        let newOutstanding = cust.outstanding;
        if (bill.paymentMode === 'Credit') {
          newOutstanding += bill.total;
        }
        await db.customers.update(cust.id, {
          loyaltyPoints: cust.loyaltyPoints + pointsEarned,
          outstanding: newOutstanding,
        });
      }
    }

    // Queue for cloud sync
    await db.syncQueue.add({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entity: 'bill',
      action: 'create',
      payload: bill,
      timestamp: Date.now(),
      status: 'pending',
    });

    return bill.id;
  },

  async cancelBill(id: string, reason: string): Promise<void> {
    const bill = await db.bills.get(id);
    if (!bill || bill.status === 'Cancelled') return;

    await db.bills.update(id, {
      status: 'Cancelled',
      cancelReason: reason,
      synced: false,
    });

    // Revert inventory
    await itemsRepo.restoreStock(bill.lines);

    // Revert customer credit if needed
    if (bill.customerId && bill.paymentMode === 'Credit') {
      const cust = await db.customers.get(bill.customerId);
      if (cust) {
        await db.customers.update(cust.id, {
          outstanding: Math.max(0, cust.outstanding - bill.total),
        });
      }
    }

    await db.syncQueue.add({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entity: 'bill',
      action: 'update',
      payload: { id, status: 'Cancelled', cancelReason: reason },
      timestamp: Date.now(),
      status: 'pending',
    });
  },

  async updatePayment(id: string, paymentMode: PaymentMode): Promise<void> {
    const bill = await db.bills.get(id);
    if (!bill) return;

    if (bill.paymentMode === 'Credit' && paymentMode !== 'Credit' && bill.customerId) {
      const cust = await db.customers.get(bill.customerId);
      if (cust) {
        await db.customers.update(cust.id, {
          outstanding: Math.max(0, cust.outstanding - bill.total),
        });
      }
    }

    await db.bills.update(id, {
      paymentMode,
      status: 'Paid',
      synced: false,
    });
  },

  async markAsPaid(id: string, paymentMode?: PaymentMode): Promise<void> {
    const bill = await db.bills.get(id);
    if (!bill) return;
    const mode = paymentMode || bill.paymentMode || 'Cash';
    await this.updatePayment(id, mode);
  },
};
