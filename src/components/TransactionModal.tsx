import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface TransactionModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function TransactionModal({
  onClose,
  onSave,
}: TransactionModalProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function fetchAndEnsureCategories() {
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      const defaultCategories = [
        { name: 'Food', user_id: user.id },
        { name: 'Travel', user_id: user.id },
        { name: 'Clothes', user_id: user.id },
        { name: 'Groceries', user_id: user.id },
        { name: 'Stationary', user_id: user.id },
      ];

      // Find missing default categories
      const missingCategories = defaultCategories.filter(
        (defaultCategory) =>
          !data.some((category) => category.name === defaultCategory.name)
      );

      if (missingCategories.length > 0) {
        const { error: insertError } = await supabase
          .from('categories')
          .insert(missingCategories);

        if (insertError) {
          console.error('Error inserting missing categories:', insertError);
          return;
        }

        // Refetch categories after inserting missing ones
        const { data: updatedCategories, error: refetchError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id);

        if (refetchError) {
          console.error('Error refetching categories:', refetchError);
          return;
        }

        setCategories(updatedCategories);
      } else {
        setCategories(data);
      }
    }

    fetchAndEnsureCategories();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('transactions').insert([
      {
        user_id: user.id,
        title,
        amount: Number(amount),
        type,
        category_id: categoryId,
        date,
      },
    ]);

    if (error) {
      console.error('Error creating transaction:', error);
      return;
    }

    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Transaction</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'expense' | 'income')}
              className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
