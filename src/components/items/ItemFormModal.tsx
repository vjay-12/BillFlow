import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Save, Leaf, Flame } from 'lucide-react';
import { db } from '../../db/schema';
import { useUIStore } from '../../stores/uiStore';
import { itemsRepo } from '../../db/itemsRepo';
import type { Item } from '../../types';

export const ItemFormModal: React.FC = () => {
  const { t } = useTranslation();
  const { isItemFormModalOpen, setIsItemFormModalOpen, editingItem, setEditingItem } = useUIStore();
  const profile = useLiveQuery(() => db.businessProfile.get('main'), []);
  const showNonVeg = profile?.showNonVeg !== false;

  const [name, setName] = useState(editingItem?.name || '');
  const [nameTamil, setNameTamil] = useState(editingItem?.nameTamil || '');
  const [code, setCode] = useState(editingItem?.code || '');
  const [category, setCategory] = useState(editingItem?.category || 'Tiffin');
  const [price, setPrice] = useState<number>(editingItem?.price ?? 50);
  const [isVeg, setIsVeg] = useState(editingItem?.isVeg ?? true);
  const [prevEditing, setPrevEditing] = useState(editingItem);

  if (editingItem !== prevEditing) {
    setPrevEditing(editingItem);
    if (editingItem) {
      setName(editingItem.name);
      setNameTamil(editingItem.nameTamil || '');
      setCode(editingItem.code);
      setCategory(editingItem.category);
      setPrice(editingItem.price);
      setIsVeg(editingItem.isVeg ?? true);
    } else {
      setName('');
      setNameTamil('');
      setCode('');
      setCategory('Tiffin');
      setPrice(50);
      setIsVeg(true);
    }
  }

  if (!isItemFormModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('items.enterNameAlert'));
      return;
    }

    try {
      const finalIsVeg = showNonVeg ? isVeg : true;

      if (editingItem) {
        await itemsRepo.update(editingItem.id, {
          name,
          nameTamil: nameTamil.trim() || undefined,
          code,
          category,
          price: Number(price),
          isVeg: finalIsVeg,
        });
      } else {
        const newItem: Item = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          nameTamil: nameTamil.trim() || undefined,
          code,
          category,
          price: Number(price),
          taxPercent: 5,
          isVeg: finalIsVeg,
          active: true,
        };
        await itemsRepo.create(newItem);
      }

      setIsItemFormModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      alert(t('items.errorSaving', { message: err.message }));
    }
  };

  const categories = ['Tiffin', 'Lunch', 'Snacks', 'Special', 'Sweets'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              {editingItem ? t('items.editMenuTitle') : t('items.addNewItemTitle')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('items.formSubtitle')}
            </p>
          </div>
          <button
            onClick={() => setIsItemFormModalOpen(false)}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Item Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('items.itemName')}</label>
            <input
              type="text"
              required
              placeholder={t('items.itemNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>

          {/* Tamil Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('items.tamilName')}</label>
            <input
              type="text"
              placeholder={t('items.tamilNamePlaceholder')}
              value={nameTamil}
              onChange={(e) => setNameTamil(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">{t('items.tamilNameHint')}</p>
          </div>

          {/* SKU Code & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('items.skuShortCode')}</label>
              <input
                type="text"
                placeholder={t('items.skuPlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('items.category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {t(`common.categories.${c}`, { defaultValue: c })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('items.sellingPrice')}</label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">{t('items.zeroPriceHint')}</p>
          </div>

          {/* Veg / Non-Veg Toggle - only visible when Non-Veg items are enabled in Settings */}
          {showNonVeg && (
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">{t('items.dietaryType')}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsVeg(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                    isVeg
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>{t('items.vegetarian')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVeg(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                    !isVeg
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>{t('items.nonVegetarian')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsItemFormModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              {t('items.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingItem ? t('items.saveChanges') : t('items.createItem')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
