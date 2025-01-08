import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import TransactionFilter from '../components/TransactionFilter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Plus, LogOut, User } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category_id: string;
  date: string;
}

interface Category {
  id: string;
  name: string;
}

interface Profile {
  email: string;
  created_at: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchProfile();
  }, []);

  async function fetchProfile() {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('email, created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
  }

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data);
    calculateTotals(data);
  }

  async function fetchCategories() {
    const { data, error } = await supabase.from('categories').select('*');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data);
  }

  function calculateTotals(transactions: Transaction[]) {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setTotalIncome(income);
    setTotalExpenses(expenses);
  }

  const categoryData = categories
    .map((category) => {
      const amount = transactions
        .filter((t) => t.category_id === category.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: category.name, value: amount };
    })
    .filter((item) => item.value > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">
          Financial Dashboard
        </h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-dark-400 rounded-lg hover:bg-dark-500 transition-all hover:scale-105"
            >
              <User size={20} />
              <span>{profile?.email}</span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-dark-200 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-400">Profile</h3>
                    <p className="text-sm mt-1">{profile?.email}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-400">Member Since</h3>
                    <p className="text-sm mt-1">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-dark-300 rounded-lg transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary-500/20"
          >
            <Plus size={20} /> Add Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300">
          <h3 className="text-lg text-gray-400 mb-2">Total Balance</h3>
          <p className="text-2xl font-bold gradient-text">
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
        <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300">
          <h3 className="text-lg text-gray-400 mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300">
          <h3 className="text-lg text-gray-400 mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-500">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-6 rounded-xl bg-dark-200">
          <h3 className="text-xl font-semibold mb-4">Spending by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-dark-200">
          <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-4 rounded-lg bg-dark-300 hover:bg-dark-400 transition-colors"
              >
                <div>
                  <p className="font-medium">{transaction.title}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === 'income'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }
                >
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TransactionFilter transactions={transactions} />

      {isModalOpen && (
        <TransactionModal
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchTransactions}
        />
      )}
    </div>
  );
}