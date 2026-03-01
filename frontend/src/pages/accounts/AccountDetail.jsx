import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAccount, getBalance, deposit, withdraw, getTransactions
} from '../../api/accounts';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/format';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  RefreshCw, TrendingUp, TrendingDown, Clock, CreditCard,
  ChevronLeft, ChevronRight, CircleDollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const TxIcon = ({ type }) => {
  const icons = {
    DEPOSIT:    { icon: ArrowDownLeft,  cls: 'text-emerald-600 bg-emerald-50' },
    WITHDRAWAL: { icon: ArrowUpRight,   cls: 'text-red-500 bg-red-50' },
    TRANSFER:   { icon: ArrowLeftRight, cls: 'text-blue-600 bg-blue-50' },
  };
  const { icon: Icon, cls } = icons[type] || icons.TRANSFER;
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
      <Icon size={16} />
    </div>
  );
};

export default function AccountDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [account, setAccount]       = useState(null);
  const [balance,  setBalance]      = useState(null);
  const [txPage, setTxPage]         = useState(null); // paginated response
  const [page, setPage]             = useState(0);
  const [loading, setLoading]       = useState(true);
  const [txLoading, setTxLoading]   = useState(false);
  const [modal, setModal]           = useState(null); // 'deposit' | 'withdraw'
  const [amount, setAmount]         = useState('');
  const [desc, setDesc]             = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, balRes] = await Promise.all([getAccount(id), getBalance(id)]);
      setAccount(accRes.data);
      setBalance(balRes.data.balance);
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

  useEffect(() => { fetchAll(); fetchTx(0); }, [fetchAll, fetchTx]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchTx(newPage);
  };

  const handleAction = async (e) => {
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

  const txList = txPage?.content || [];
  const totalPages = txPage?.totalPages || 0;
  const totalElements = txPage?.totalElements || 0;

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
          ${account?.accountType === 'SAVINGS'
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
                ${account?.status === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${account?.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {account?.status}
              </span>
            </div>
          </div>

          {/* Actions */}
          {account?.status === 'ACTIVE' && (
            <div className="flex gap-3 mt-6">
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
        </div>

        {/* Transaction History */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
              {totalElements > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{totalElements} total transactions</p>
              )}
            </div>
            <button
              onClick={() => { fetchAll(); fetchTx(page); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
          ) : txList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No transactions yet</p>
              <p className="text-gray-400 text-xs mt-1">Deposits and withdrawals will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {txList.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT' ||
                    (tx.type === 'TRANSFER' && tx.toAccount?.accountId === Number(id));
                  const isDebit  = tx.type === 'WITHDRAWAL' ||
                    (tx.type === 'TRANSFER' && tx.fromAccount?.accountId === Number(id));

                  return (
                    <div key={tx.transactionId}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <TxIcon type={tx.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.timestamp)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : isDebit ? 'text-red-500' : 'text-gray-700'}`}>
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
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Page {page + 1} of {totalPages}
                  </p>
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
        </div>
      </div>

      {/* Deposit / Withdraw Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
      >
        <form onSubmit={handleAction} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Amount (₹)
            </label>
            <div className="relative">
              <CircleDollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input-field pl-9"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Quick select</p>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 5000, 10000].map(v => (
                <button
                  key={v}
                  type="button"
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

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Description <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={modal === 'deposit' ? 'e.g. Salary credit' : 'e.g. ATM withdrawal'}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* Info */}
          {modal === 'withdraw' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <span className="text-amber-500 text-lg leading-none">⚠</span>
              <p className="text-xs text-amber-700">
                Daily withdrawal limit: <strong>₹10,000</strong>. Current balance: <strong>{formatCurrency(balance)}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 ${modal === 'deposit' ? 'btn-success' : 'btn-danger'}`}
            >
              {submitting ? <Spinner size="sm" color="white" /> :
                modal === 'deposit'
                  ? <><ArrowDownLeft size={15} /> Deposit</>
                  : <><ArrowUpRight size={15} /> Withdraw</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
