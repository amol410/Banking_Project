import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAccounts, createAccount } from '../../api/accounts';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateShort, getErrorMessage } from '../../utils/format';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import {
  Wallet, Users, TrendingUp, Plus, Eye,
  CreditCard, PiggyBank, RefreshCw, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user }           = useAuth();
  const navigate           = useNavigate();
  const [accounts, setAccounts]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [newAcc, setNewAcc]       = useState({ accountHolderName: '', accountType: 'SAVINGS' });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await getAllAccounts();
      setAccounts(data);
      setFiltered(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      accounts.filter(a =>
        a.accountHolderName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        a.accountType.toLowerCase().includes(q)
      )
    );
  }, [search, accounts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAcc.accountHolderName.trim()) { toast.error('Name is required'); return; }
    setCreating(true);
    try {
      await createAccount(newAcc);
      toast.success('Account created successfully!');
      setShowCreate(false);
      setNewAcc({ accountHolderName: '', accountType: 'SAVINGS' });
      fetchAccounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  // Stats
  const totalBalance   = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const activeCount    = accounts.filter(a => a.status === 'ACTIVE').length;
  const savingsCount   = accounts.filter(a => a.accountType === 'SAVINGS').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Good day,</p>
              <h1 className="text-2xl font-bold mt-0.5">{user?.username} 👋</h1>
              <p className="text-blue-200 text-sm mt-1">Manage all your bank accounts from here</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={fetchAccounts}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                <RefreshCw size={15} /> Refresh
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Plus size={15} /> New Account
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}     label="Total Accounts" value={accounts.length}         color="blue"    />
          <StatCard icon={TrendingUp} label="Active Accounts" value={activeCount}            color="emerald" />
          <StatCard icon={Wallet}    label="Total Balance"   value={formatCurrency(totalBalance)} color="violet" />
          <StatCard icon={PiggyBank} label="Savings Accounts" value={savingsCount}           color="amber"   />
        </div>

        {/* Accounts Table */}
        <div className="card">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-lg font-bold text-gray-900">All Accounts</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 w-48 sm:w-64"
                />
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary sm:hidden"
              >
                <Plus size={15} />
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary hidden sm:flex">
                <Plus size={15} /> New Account
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {search ? 'No accounts match your search' : 'No accounts yet'}
              </p>
              {!search && (
                <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 mx-auto">
                  <Plus size={15} /> Create First Account
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Account</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 hidden md:table-cell">Number</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Type</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Balance</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 hidden lg:table-cell">Created</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((acc) => (
                    <tr key={acc.accountId} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm
                            ${acc.accountType === 'SAVINGS' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-violet-500 to-violet-600'}`}>
                            {acc.accountHolderName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{acc.accountHolderName}</p>
                            <p className="text-xs text-gray-400 md:hidden">{acc.accountNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 hidden md:table-cell">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                          {acc.accountNumber}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={acc.accountType === 'SAVINGS' ? 'badge-savings' : 'badge-current'}>
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <span className="font-bold text-gray-900">{formatCurrency(acc.balance)}</span>
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <span className={acc.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${acc.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {acc.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 hidden lg:table-cell text-xs text-gray-400">
                        {formatDateShort(acc.createdAt)}
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => navigate(`/accounts/${acc.accountId}`)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Account Holder Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. John Doe"
              value={newAcc.accountHolderName}
              onChange={(e) => setNewAcc({ ...newAcc, accountHolderName: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['SAVINGS', 'CURRENT'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewAcc({ ...newAcc, accountType: type })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left
                    ${newAcc.accountType === type
                      ? type === 'SAVINGS'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <div className="text-lg mb-1">{type === 'SAVINGS' ? '🏦' : '💳'}</div>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary flex-1">
              {creating ? <Spinner size="sm" color="white" /> : <><Plus size={15} /> Create</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
