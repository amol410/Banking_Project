import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllAccounts, createAccount, searchByName,
  globalSearch, softDeleteAccount, exportAccountsCsv
} from '../../api/accounts';
import { getAdminDashboard } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateShort, getErrorMessage } from '../../utils/format';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import {
  Wallet, Users, TrendingUp, Plus, Eye,
  CreditCard, PiggyBank, RefreshCw, Search, X,
  Globe, Download, Trash2, BarChart3,
  ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  CheckCircle, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

// helper: trigger browser file download from a blob response
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const isAdmin     = user?.role === 'ADMIN';

  const [accounts, setAccounts]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);

  // search state
  const [search, setSearch]         = useState('');
  const [searching, setSearching]   = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchMode, setSearchMode] = useState('name'); // 'name' | 'global'

  // modals
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [newAcc, setNewAcc]         = useState({ accountHolderName: '', accountType: 'SAVINGS' });

  // Group 4: soft delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null); // account object to delete
  const [deleting, setDeleting]         = useState(false);

  // Group 4: admin dashboard stats
  const [adminStats, setAdminStats]   = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showStats, setShowStats]     = useState(false);

  // Group 4: CSV export loading
  const [exportingCsv, setExportingCsv] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    setIsSearchMode(false);
    setSearch('');
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

  // client-side filter while typing (instant, non-search mode only)
  useEffect(() => {
    if (isSearchMode) return;
    const q = search.toLowerCase();
    setFiltered(
      accounts.filter(a =>
        a.accountHolderName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        a.accountType.toLowerCase().includes(q)
      )
    );
  }, [search, accounts, isSearchMode]);

  // backend search — name (Group 2) or global keyword (Group 4)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) { fetchAccounts(); return; }
    setSearching(true);
    setIsSearchMode(true);
    try {
      let data;
      if (searchMode === 'global') {
        ({ data } = await globalSearch(search.trim()));
      } else {
        ({ data } = await searchByName(search.trim()));
      }
      setFiltered(data);
      if (data.length === 0) toast('No accounts found', { icon: '🔍' });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsSearchMode(false);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setIsSearchMode(false);
    setFiltered(accounts);
  };

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

  // Group 4: soft delete
  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await softDeleteAccount(deleteTarget.accountId);
      toast.success(`Account ${deleteTarget.accountNumber} deleted`);
      setDeleteTarget(null);
      fetchAccounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // Group 4: export all accounts CSV
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const { data } = await exportAccountsCsv();
      downloadBlob(data, 'accounts.csv');
      toast.success('Accounts CSV downloaded!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportingCsv(false);
    }
  };

  // Group 4: admin dashboard stats
  const handleLoadStats = async () => {
    if (adminStats) { setShowStats(true); return; }
    setStatsLoading(true);
    setShowStats(true);
    try {
      const { data } = await getAdminDashboard();
      setAdminStats(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setShowStats(false);
    } finally {
      setStatsLoading(false);
    }
  };

  // Stats (local from fetched accounts)
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const activeCount  = accounts.filter(a => a.status === 'ACTIVE').length;
  const savingsCount = accounts.filter(a => a.accountType === 'SAVINGS').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium">Good day,</p>
              <h1 className="text-2xl font-bold mt-0.5">{user?.username} 👋</h1>
              <p className="text-blue-200 text-sm mt-1">
                {isAdmin ? 'Admin panel — full system access' : 'Manage all your bank accounts from here'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchAccounts}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                <RefreshCw size={15} /> Refresh
              </button>
              {/* Group 4: Admin Stats button */}
              {isAdmin && (
                <button
                  onClick={handleLoadStats}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
                >
                  <BarChart3 size={15} /> Admin Stats
                </button>
              )}
              {/* Group 4: Export CSV */}
              <button
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-60"
              >
                {exportingCsv ? <Spinner size="sm" color="white" /> : <Download size={15} />}
                Export CSV
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

        {/* Group 4: Admin Dashboard Stats Panel */}
        {showStats && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <BarChart3 size={18} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Admin Dashboard</h2>
                  <p className="text-xs text-gray-400">Live system statistics</p>
                </div>
              </div>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center py-10"><Spinner size="lg" /></div>
            ) : adminStats ? (
              <div className="space-y-5">
                {/* Top stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Accounts',   value: adminStats.totalAccounts,          icon: Users,         color: 'blue'   },
                    { label: 'Active Accounts',  value: adminStats.activeAccounts,          icon: CheckCircle,   color: 'emerald'},
                    { label: 'Inactive Accounts',value: adminStats.inactiveAccounts,        icon: AlertTriangle, color: 'amber'  },
                    { label: 'Total Balance',    value: formatCurrency(adminStats.totalBalance), icon: Wallet,   color: 'violet' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={15} className={`text-${color}-500`} />
                        <p className="text-xs font-semibold text-gray-500">{label}</p>
                      </div>
                      <p className={`text-xl font-bold text-${color}-700`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Second row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Savings Accounts',  value: adminStats.savingsAccounts  ?? '—', icon: PiggyBank,      color: 'blue'   },
                    { label: 'Current Accounts',  value: adminStats.currentAccounts  ?? '—', icon: CreditCard,     color: 'violet' },
                    { label: 'Total Deposits',    value: formatCurrency(adminStats.totalDeposits    ?? 0), icon: ArrowDownLeft, color: 'emerald'},
                    { label: 'Total Withdrawals', value: formatCurrency(adminStats.totalWithdrawals ?? 0), icon: ArrowUpRight,  color: 'red'    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={15} className={`text-${color}-500`} />
                        <p className="text-xs font-semibold text-gray-500">{label}</p>
                      </div>
                      <p className={`text-xl font-bold text-${color}-700`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Total transactions */}
                {adminStats.totalTransactions !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                      <ArrowLeftRight size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Transactions</p>
                      <p className="text-lg font-bold text-gray-800">{adminStats.totalTransactions}</p>
                    </div>
                    <button
                      onClick={() => { setAdminStats(null); handleLoadStats(); }}
                      className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}      label="Total Accounts"   value={accounts.length}              color="blue"    />
          <StatCard icon={TrendingUp} label="Active Accounts"  value={activeCount}                  color="emerald" />
          <StatCard icon={Wallet}     label="Total Balance"    value={formatCurrency(totalBalance)}  color="violet"  />
          <StatCard icon={PiggyBank}  label="Savings Accounts" value={savingsCount}                  color="amber"   />
        </div>

        {/* Accounts Table */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">All Accounts</h2>
              {isSearchMode && (
                <p className="text-xs font-medium mt-0.5 text-blue-600">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
                  {searchMode === 'global' && (
                    <span className="ml-1.5 text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold">
                      Global
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Group 4: Search mode toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => { setSearchMode('name'); clearSearch(); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all
                    ${searchMode === 'name' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Search size={12} /> Name
                </button>
                <button
                  onClick={() => { setSearchMode('global'); clearSearch(); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all
                    ${searchMode === 'global' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Globe size={12} /> Global
                </button>
              </div>

              {/* Search input */}
              <form onSubmit={handleSearch} className="flex items-center gap-1">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchMode === 'global' ? 'Name or acc. number...' : 'Search by name...'}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); if (!e.target.value) clearSearch(); }}
                    className="input-field pl-9 w-44 sm:w-52"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="btn-secondary !py-2 !px-3"
                >
                  {searching ? <Spinner size="sm" color="gray" /> : <Search size={14} />}
                </button>
              </form>

              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={15} />
                <span className="hidden sm:inline">New Account</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {search ? `No accounts found for "${search}"` : 'No accounts yet'}
              </p>
              {search ? (
                <button onClick={clearSearch} className="btn-secondary mt-4 mx-auto">
                  <X size={14} /> Clear Search
                </button>
              ) : (
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
                            ${acc.accountType === 'SAVINGS'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                              : 'bg-gradient-to-br from-violet-500 to-violet-600'}`}>
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
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/accounts/${acc.accountId}`)}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            <Eye size={13} /> View
                          </button>
                          {/* Group 4: Soft Delete */}
                          <button
                            onClick={() => setDeleteTarget(acc)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-all"
                            title="Soft delete account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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

      {/* Group 4: Soft Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Trash2 size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Permanently delete this account?</p>
                <p className="text-xs text-red-600 mt-1">
                  This is a soft delete — the record is marked as deleted in the database but
                  not physically removed. This action cannot be undone from the UI.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Account Holder</span>
              <span className="font-semibold">{deleteTarget?.accountHolderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number</span>
              <span className="font-mono font-semibold text-xs">{deleteTarget?.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Balance</span>
              <span className="font-semibold">{formatCurrency(deleteTarget?.balance)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSoftDelete} disabled={deleting} className="btn-danger flex-1">
              {deleting ? <Spinner size="sm" color="white" /> : <><Trash2 size={14} /> Delete</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
