import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAccount, getBalance, deposit, withdraw, getTransactions,
  closeAccount, updateName, getMiniStatement,
  getTransactionsByDate, calculateInterest,
  exportTransactionsCsv
} from '../../api/accounts';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/format';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  RefreshCw, Clock, ChevronLeft, ChevronRight,
  CircleDollarSign, Pencil, XCircle, List, Zap,
  CalendarRange, TrendingUp, Search, X, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const TxIcon = ({ type }) => {
  const icons = {
    DEPOSIT:    { icon: ArrowDownLeft,  cls: 'text-emerald-600 bg-emerald-50' },
    WITHDRAWAL: { icon: ArrowUpRight,   cls: 'text-red-500    bg-red-50'      },
    TRANSFER:   { icon: ArrowLeftRight, cls: 'text-blue-600   bg-blue-50'     },
  };
  const { icon: Icon, cls } = icons[type] || icons.TRANSFER;
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
      <Icon size={16} />
    </div>
  );
};

const TxRow = ({ tx, accountId }) => {
  const isCredit = tx.type === 'DEPOSIT' ||
    (tx.type === 'TRANSFER' && tx.toAccount?.accountId === Number(accountId));
  const isDebit  = tx.type === 'WITHDRAWAL' ||
    (tx.type === 'TRANSFER' && tx.fromAccount?.accountId === Number(accountId));

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <TxIcon type={tx.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {tx.description || tx.type}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.timestamp)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold
          ${isCredit ? 'text-emerald-600' : isDebit ? 'text-red-500' : 'text-gray-700'}`}>
          {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(tx.amount)}
        </p>
        <span className={`text-xs font-medium
          ${tx.type === 'DEPOSIT' ? 'text-emerald-500' :
            tx.type === 'WITHDRAWAL' ? 'text-red-400' : 'text-blue-500'}`}>
          {tx.type}
        </span>
      </div>
    </div>
  );
};

export default function AccountDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [account, setAccount]       = useState(null);
  const [balance, setBalance]       = useState(null);
  const [txPage, setTxPage]         = useState(null);
  const [miniTx, setMiniTx]         = useState([]);
  const [page, setPage]             = useState(0);
  const [txTab, setTxTab]           = useState('full');  // 'full' | 'mini' | 'filter' | 'interest'
  const [loading, setLoading]       = useState(true);
  const [txLoading, setTxLoading]   = useState(false);
  const [miniLoading, setMiniLoading] = useState(false);

  // modals
  const [modal, setModal]           = useState(null); // 'deposit'|'withdraw'|'updateName'|'close'
  const [amount, setAmount]         = useState('');
  const [desc, setDesc]             = useState('');
  const [newNameVal, setNewNameVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Group 4 — CSV export
  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExportTxCsv = async () => {
    setExportingCsv(true);
    try {
      const { data } = await exportTransactionsCsv(id);
      const url = window.URL.createObjectURL(data);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `transactions_account_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Transactions CSV downloaded!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportingCsv(false);
    }
  };

  // Group 3 — date filter
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];
  const [startDate, setStartDate]   = useState(firstOfMonth);
  const [endDate, setEndDate]       = useState(today);
  const [filteredTx, setFilteredTx] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);

  // Group 3 — interest
  const [interest, setInterest]     = useState(null);
  const [interestLoading, setInterestLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, balRes] = await Promise.all([getAccount(id), getBalance(id)]);
      setAccount(accRes.data);
      setBalance(balRes.data.balance);
      setNewNameVal(accRes.data.accountHolderName);
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchTx = useCallback(async (p = 0) => {
    setTxLoading(true);
    try {
      const { data } = await getTransactions(id, p);
      setTxPage(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTxLoading(false);
    }
  }, [id]);

  const fetchMini = useCallback(async () => {
    setMiniLoading(true);
    try {
      const { data } = await getMiniStatement(id);
      setMiniTx(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMiniLoading(false);
    }
  }, [id]);

  // Group 3 — fetch transactions by date range
  const handleDateFilter = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) { toast.error('Select both start and end dates'); return; }
    if (startDate > endDate) { toast.error('Start date cannot be after end date'); return; }
    setFilterLoading(true);
    setFilterApplied(false);
    try {
      const { data } = await getTransactionsByDate(id, startDate, endDate);
      setFilteredTx(data);
      setFilterApplied(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFilterLoading(false);
    }
  };

  // Group 3 — calculate interest
  const fetchInterest = useCallback(async () => {
    setInterestLoading(true);
    try {
      const { data } = await calculateInterest(id);
      setInterest(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setInterestLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); fetchTx(0); }, [fetchAll, fetchTx]);

  // fetch mini when tab is switched to mini
  useEffect(() => {
    if (txTab === 'mini' && miniTx.length === 0) fetchMini();
  }, [txTab, miniTx.length, fetchMini]);

  // fetch interest when tab is switched to interest
  useEffect(() => {
    if (txTab === 'interest' && interest === null) fetchInterest();
  }, [txTab, interest, fetchInterest]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchTx(newPage);
  };

  // deposit / withdraw
  const handleMoneyAction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    setSubmitting(true);
    try {
      const payload = { amount: Number(amount), description: desc || undefined };
      if (modal === 'deposit') {
        await deposit(id, payload);
        toast.success(`Deposited ${formatCurrency(amount)} successfully!`);
      } else {
        await withdraw(id, payload);
        toast.success(`Withdrew ${formatCurrency(amount)} successfully!`);
      }
      setModal(null); setAmount(''); setDesc('');
      fetchAll(); fetchTx(0); setPage(0);
      if (txTab === 'mini') { setMiniTx([]); fetchMini(); }
      if (txTab === 'interest') { setInterest(null); fetchInterest(); }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // update name (Group 2)
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!newNameVal.trim()) { toast.error('Name cannot be empty'); return; }
    setSubmitting(true);
    try {
      await updateName(id, { accountHolderName: newNameVal.trim() });
      toast.success('Account name updated!');
      setModal(null);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // close account (Group 2)
  const handleClose = async () => {
    setSubmitting(true);
    try {
      await closeAccount(id);
      toast.success('Account closed successfully');
      setModal(null);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>
      </div>
    );
  }

  const txList      = txPage?.content || [];
  const totalPages  = txPage?.totalPages || 0;
  const totalElements = txPage?.totalElements || 0;
  const isActive    = account?.status === 'ACTIVE';
  const isSavings   = account?.accountType === 'SAVINGS';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Account Card */}
        <div className={`rounded-2xl p-6 mb-6 text-white shadow-lg
          ${isSavings
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
            : 'bg-gradient-to-br from-violet-600 to-purple-700'}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                {account?.accountType} Account
              </p>
              <h2 className="text-2xl font-bold">{account?.accountHolderName}</h2>
              <p className="font-mono text-sm text-white/70 mt-1">{account?.accountNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(balance ?? account?.balance)}</p>
              <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold
                ${isActive ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {account?.status}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            {/* Money actions — only when active */}
            {isActive && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setModal('deposit'); setAmount(''); setDesc(''); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
                >
                  <ArrowDownLeft size={16} /> Deposit
                </button>
                <button
                  onClick={() => { setModal('withdraw'); setAmount(''); setDesc(''); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
                >
                  <ArrowUpRight size={16} /> Withdraw
                </button>
                <button
                  onClick={() => navigate('/transfer')}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
                >
                  <ArrowLeftRight size={16} /> Transfer
                </button>
              </div>
            )}

            {/* Management actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setNewNameVal(account?.accountHolderName); setModal('updateName'); }}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-xs font-semibold py-2 rounded-xl transition-all"
              >
                <Pencil size={13} /> Edit Name
              </button>
              {isActive && (
                <button
                  onClick={() => setModal('close')}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/35 border border-red-400/30 text-red-200 text-xs font-semibold py-2 rounded-xl transition-all"
                >
                  <XCircle size={13} /> Close Account
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transaction / Interest tabs */}
        <div className="card">
          {/* Tab header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              <button
                onClick={() => setTxTab('full')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                  ${txTab === 'full' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={14} />
                All
                {totalElements > 0 && (
                  <span className="ml-0.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                    {totalElements}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTxTab('mini')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                  ${txTab === 'mini' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Zap size={14} />
                Mini
              </button>
              {/* Group 3 tabs */}
              <button
                onClick={() => setTxTab('filter')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                  ${txTab === 'filter' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CalendarRange size={14} />
                By Date
              </button>
              {isSavings && (
                <button
                  onClick={() => setTxTab('interest')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                    ${txTab === 'interest' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <TrendingUp size={14} />
                  Interest
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Group 4: Export transactions CSV */}
              <button
                onClick={handleExportTxCsv}
                disabled={exportingCsv}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                title="Export transactions to CSV"
              >
                {exportingCsv ? <Spinner size="sm" color="gray" /> : <Download size={13} />}
                CSV
              </button>
              <button
                onClick={() => {
                  if (txTab === 'full') { fetchAll(); fetchTx(page); }
                  else if (txTab === 'mini') { setMiniTx([]); fetchMini(); }
                  else if (txTab === 'filter') { setFilterApplied(false); setFilteredTx([]); }
                  else if (txTab === 'interest') { setInterest(null); fetchInterest(); }
                }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {/* Full transaction history */}
          {txTab === 'full' && (
            <>
              {txLoading ? (
                <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
              ) : txList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">No transactions yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {txList.map((tx) => (
                      <TxRow key={tx.transactionId} tx={tx} accountId={id} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400">Page {page + 1} of {totalPages}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 0}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= totalPages - 1}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Mini Statement */}
          {txTab === 'mini' && (
            <>
              {miniLoading ? (
                <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
              ) : miniTx.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Zap size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 font-medium">
                      Last {miniTx.length} transaction{miniTx.length !== 1 ? 's' : ''}
                    </p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                      Quick View
                    </span>
                  </div>
                  {miniTx.map((tx) => (
                    <TxRow key={tx.transactionId} tx={tx} accountId={id} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Date Filter — Group 3 */}
          {txTab === 'filter' && (
            <div>
              <form onSubmit={handleDateFilter} className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Filter transactions by date range
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={startDate}
                      max={today}
                      onChange={(e) => { setStartDate(e.target.value); setFilterApplied(false); }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={endDate}
                      max={today}
                      onChange={(e) => { setEndDate(e.target.value); setFilterApplied(false); }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={filterLoading}
                    className="btn-primary flex items-center gap-2">
                    {filterLoading
                      ? <Spinner size="sm" color="white" />
                      : <><Search size={14} /> Search</>}
                  </button>
                  {filterApplied && (
                    <button type="button"
                      onClick={() => { setFilterApplied(false); setFilteredTx([]); }}
                      className="btn-secondary flex items-center gap-1.5">
                      <X size={14} /> Clear
                    </button>
                  )}
                </div>
              </form>

              {filterLoading ? (
                <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
              ) : filterApplied ? (
                filteredTx.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CalendarRange size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">No transactions in this date range</p>
                    <p className="text-gray-400 text-xs mt-1">{startDate} → {endDate}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-500 font-medium">
                        {filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''} found
                      </p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        {startDate} → {endDate}
                      </span>
                    </div>
                    {filteredTx.map((tx) => (
                      <TxRow key={tx.transactionId} tx={tx} accountId={id} />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CalendarRange size={24} className="text-blue-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Select a date range and click Search</p>
                </div>
              )}
            </div>
          )}

          {/* Interest Calculator — Group 3 (SAVINGS only) */}
          {txTab === 'interest' && (
            <div>
              {interestLoading ? (
                <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
              ) : interest ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Interest Projection</p>
                        <p className="text-xs text-gray-500">Annual rate: {interest.annualInterestRatePercent ?? interest.interestRate ?? '4'}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Monthly</p>
                        <p className="text-xl font-bold text-emerald-600">
                          {formatCurrency(interest.monthlyInterest ?? interest.monthly ?? 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">per month</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Yearly</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(interest.yearlyInterest ?? interest.yearly ?? 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">per year</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Calculation Details</p>
                    {[
                      { label: 'Current Balance', value: formatCurrency(interest.principal ?? balance) },
                      { label: 'Annual Rate', value: `${interest.annualInterestRatePercent ?? interest.interestRate ?? '4'}%` },
                      { label: 'Monthly Interest', value: formatCurrency(interest.monthlyInterest ?? interest.monthly ?? 0) },
                      { label: 'Yearly Interest', value: formatCurrency(interest.yearlyInterest ?? interest.yearly ?? 0) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="text-amber-500 text-base leading-none mt-0.5">ℹ</span>
                    <p className="text-xs text-amber-700">
                      Interest is calculated on the current balance. Actual credited amount may vary based on bank policy and account activity.
                    </p>
                  </div>

                  <button
                    onClick={() => { setInterest(null); fetchInterest(); }}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Recalculate
                  </button>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-4">Calculate interest on your savings</p>
                  <button onClick={fetchInterest} className="btn-primary inline-flex items-center gap-2">
                    <TrendingUp size={15} /> Calculate Interest
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deposit / Withdraw Modal */}
      <Modal
        isOpen={modal === 'deposit' || modal === 'withdraw'}
        onClose={() => setModal(null)}
        title={modal === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
      >
        <form onSubmit={handleMoneyAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Amount (₹)
            </label>
            <div className="relative">
              <CircleDollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number" min="0.01" step="0.01"
                className="input-field pl-9"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Quick select</p>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 5000, 10000].map(v => (
                <button
                  key={v} type="button"
                  onClick={() => setAmount(String(v))}
                  className={`text-xs font-semibold py-2 px-2 rounded-lg border transition-all
                    ${Number(amount) === v
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  ₹{v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Description <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text" className="input-field"
              placeholder={modal === 'deposit' ? 'e.g. Salary credit' : 'e.g. ATM withdrawal'}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          {modal === 'withdraw' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <span className="text-amber-500 text-lg leading-none">⚠</span>
              <p className="text-xs text-amber-700">
                Daily withdrawal limit: <strong>₹10,000</strong>. Balance: <strong>{formatCurrency(balance)}</strong>
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting}
              className={`flex-1 ${modal === 'deposit' ? 'btn-success' : 'btn-danger'}`}>
              {submitting ? <Spinner size="sm" color="white" /> :
                modal === 'deposit'
                  ? <><ArrowDownLeft size={15} /> Deposit</>
                  : <><ArrowUpRight size={15} /> Withdraw</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Name Modal */}
      <Modal isOpen={modal === 'updateName'} onClose={() => setModal(null)} title="Update Account Name">
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              New Account Holder Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter new name"
              value={newNameVal}
              onChange={(e) => setNewNameVal(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <Spinner size="sm" color="white" /> : <><Pencil size={14} /> Update Name</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Close Account Confirmation Modal */}
      <Modal isOpen={modal === 'close'} onClose={() => setModal(null)} title="Close Account">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Are you sure?</p>
                <p className="text-xs text-red-600 mt-1">
                  Closing <strong>{account?.accountHolderName}</strong>'s account will set it to
                  INACTIVE. Deposits, withdrawals and transfers will be blocked.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Account</span>
              <span className="font-semibold">{account?.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Balance</span>
              <span className="font-semibold">{formatCurrency(balance)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleClose} disabled={submitting} className="btn-danger flex-1">
              {submitting ? <Spinner size="sm" color="white" /> : <><XCircle size={14} /> Close Account</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
