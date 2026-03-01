import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAccounts, transfer } from '../../api/accounts';
import { formatCurrency, getErrorMessage } from '../../utils/format';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/Spinner';
import {
  ArrowLeft, ArrowLeftRight, CircleDollarSign,
  CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Transfer() {
  const navigate = useNavigate();
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(null);
  const [form, setForm]             = useState({
    fromAccountId: '', toAccountId: '', amount: '', description: ''
  });

  useEffect(() => {
    getAllAccounts()
      .then(({ data }) => setAccounts(data.filter(a => a.status === 'ACTIVE')))
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const fromAcc = accounts.find(a => a.accountId === Number(form.fromAccountId));
  const toAcc   = accounts.find(a => a.accountId === Number(form.toAccountId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromAccountId || !form.toAccountId) { toast.error('Select both accounts'); return; }
    if (form.fromAccountId === form.toAccountId)  { toast.error('Cannot transfer to same account'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (fromAcc && Number(form.amount) > fromAcc.balance) {
      toast.error('Insufficient balance'); return;
    }

    setSubmitting(true);
    try {
      const { data } = await transfer({
        fromAccountId: Number(form.fromAccountId),
        toAccountId:   Number(form.toAccountId),
        amount:        Number(form.amount),
        description:   form.description || undefined,
      });
      setSuccess({
        amount: form.amount,
        from: fromAcc?.accountHolderName,
        to:   toAcc?.accountHolderName,
        txId: data.transactionId,
      });
      toast.success('Transfer successful!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSuccess(null);
    setForm({ fromAccountId: '', toAccountId: '', amount: '', description: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Success Screen */}
        {success ? (
          <div className="card text-center py-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Successful!</h2>
            <p className="text-gray-500 text-sm mb-6">Your transaction has been processed</p>

            <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900">{formatCurrency(success.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">From</span>
                <span className="font-semibold text-gray-800">{success.from}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">To</span>
                <span className="font-semibold text-gray-800">{success.to}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-mono text-xs text-gray-600">#{success.txId}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="btn-secondary flex-1">
                New Transfer
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1">
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Page Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <ArrowLeftRight size={18} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Fund Transfer</h1>
              </div>
              <p className="text-gray-500 text-sm">Transfer funds between active accounts instantly</p>
            </div>

            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* From Account */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    From Account
                  </label>
                  <select
                    className="input-field"
                    value={form.fromAccountId}
                    onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                  >
                    <option value="">— Select source account —</option>
                    {accounts.map(a => (
                      <option key={a.accountId} value={a.accountId}>
                        {a.accountHolderName} ({a.accountNumber}) — {formatCurrency(a.balance)}
                      </option>
                    ))}
                  </select>
                  {fromAcc && (
                    <div className="mt-2 flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">{fromAcc.accountHolderName}</p>
                        <p className="text-xs text-blue-400 font-mono">{fromAcc.accountNumber}</p>
                      </div>
                      <p className="text-sm font-bold text-blue-700">{formatCurrency(fromAcc.balance)}</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                    <ArrowLeftRight size={16} className="text-gray-400" />
                  </div>
                </div>

                {/* To Account */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    To Account
                  </label>
                  <select
                    className="input-field"
                    value={form.toAccountId}
                    onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                  >
                    <option value="">— Select destination account —</option>
                    {accounts
                      .filter(a => a.accountId !== Number(form.fromAccountId))
                      .map(a => (
                        <option key={a.accountId} value={a.accountId}>
                          {a.accountHolderName} ({a.accountNumber})
                        </option>
                      ))}
                  </select>
                  {toAcc && (
                    <div className="mt-2 flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-xs text-emerald-600 font-semibold">{toAcc.accountHolderName}</p>
                        <p className="text-xs text-emerald-400 font-mono">{toAcc.accountNumber}</p>
                      </div>
                      <span className={toAcc.accountType === 'SAVINGS' ? 'badge-savings' : 'badge-current'}>
                        {toAcc.accountType}
                      </span>
                    </div>
                  )}
                </div>

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
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[500, 1000, 5000, 10000].map(v => (
                      <button key={v} type="button"
                        onClick={() => setForm({ ...form, amount: String(v) })}
                        className={`text-xs font-semibold py-2 rounded-lg border transition-all
                          ${Number(form.amount) === v
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        ₹{v.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {/* Insufficient balance warning */}
                  {fromAcc && form.amount && Number(form.amount) > fromAcc.balance && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-xs">
                      <AlertCircle size={13} />
                      Insufficient balance. Available: {formatCurrency(fromAcc.balance)}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Description <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Rent payment, Reimbursement..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* Summary */}
                {fromAcc && toAcc && form.amount && Number(form.amount) > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Transfer Summary
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">From</span>
                        <span className="font-semibold">{fromAcc.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">To</span>
                        <span className="font-semibold">{toAcc.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-bold text-blue-700 text-base">
                          {formatCurrency(form.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !form.fromAccountId || !form.toAccountId || !form.amount}
                  className="btn-primary w-full h-12 text-base"
                >
                  {submitting
                    ? <Spinner size="sm" color="white" />
                    : <><ArrowLeftRight size={17} /> Transfer Now</>
                  }
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
