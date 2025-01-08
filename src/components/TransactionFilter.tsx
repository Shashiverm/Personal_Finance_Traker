import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
}

const TransactionFilter = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  >('daily');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, selectedFilter, startDate, endDate]);

  const fetchTransactions = async () => {
    let filterQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user?.id);

    // Apply filters based on selectedFilter (daily, weekly, etc.)
    if (selectedFilter === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      filterQuery = filterQuery.eq('date', today);
    } else if (selectedFilter === 'weekly') {
      const today = new Date();
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      ); // Get start of the week
      const endOfWeek = new Date(today.setDate(today.getDate() + 6)); // Get end of the week
      filterQuery = filterQuery
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);
    } else if (selectedFilter === 'monthly') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month
      filterQuery = filterQuery
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);
    } else if (selectedFilter === 'yearly') {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1); // First day of the year
      const endOfYear = new Date(today.getFullYear(), 11, 31); // Last day of the year
      filterQuery = filterQuery
        .gte('date', startOfYear.toISOString().split('T')[0])
        .lte('date', endOfYear.toISOString().split('T')[0]);
    } else if (selectedFilter === 'custom' && startDate && endDate) {
      filterQuery = filterQuery.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await filterQuery;

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-dark shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray">
          Filter Transactions
        </h2>

        {/* Filter Selection */}
        <div className="mb-6">
          <label htmlFor="filter" className="block text-white-600 mb-2">
            Select Filter
          </label>
          <select
            id="filter"
            value={selectedFilter}
            onChange={(e) =>
              setSelectedFilter(
                e.target.value as
                  | 'daily'
                  | 'weekly'
                  | 'monthly'
                  | 'yearly'
                  | 'custom'
              )
            }
            // className="w-full px-4 py-2 border rounded-lg bg-dark-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Custom Date Range Inputs */}
        {selectedFilter === 'custom' && (
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <label htmlFor="startDate" className="block text-white-600 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="endDate" className="block text-white-600 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-dark-300 border border-dark-400 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="items-center p-4 rounded-lg bg-dark-300 hover:bg-dark-400 transition-colors"
              >
                <h4 className="text-lg font-medium">{transaction.title}</h4>
                <p className="text-gray-500">{transaction.date}</p>
                <p className="text-xl font-semibold text-green-600">
                  ${transaction.amount}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No transactions found for the selected filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionFilter;
