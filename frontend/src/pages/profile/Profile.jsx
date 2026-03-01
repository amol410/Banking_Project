import { useEffect, useState } from 'react';
import { getProfile, changePassword } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/format';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/Spinner';
import {
  User, Mail, Shield, KeyRound,
  Eye, EyeOff, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user: authUser }      = useAuth();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurr, setShowCurr] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [pwDone,   setPwDone]   = useState(false);

  useEffect(() => {
    getProfile()
      .then(({ data }) => setProfile(data))
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('Fill in all password fields'); return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters'); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    setSaving(true);
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwDone(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const roleColor = {
    ADMIN:    'bg-violet-100 text-violet-700 border-violet-200',
    CUSTOMER: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* Profile Card */}
        <div className="card mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl font-bold">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{profile?.username}</h2>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleColor[profile?.role] || roleColor.CUSTOMER}`}>
                    <Shield size={11} />
                    {profile?.role}
                  </span>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Username</p>
                    <p className="text-sm font-semibold text-gray-800">{profile?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-gray-800">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Role</p>
                    <p className="text-sm font-semibold text-gray-800">{profile?.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">User ID</p>
                    <p className="text-sm font-semibold text-gray-800">#{profile?.userId}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <KeyRound size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Change Password</h3>
              <p className="text-xs text-gray-400">Keep your account secure</p>
            </div>
          </div>

          {pwDone && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">Password changed successfully!</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurr ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter current password"
                  value={pwForm.currentPassword}
                  onChange={(e) => { setPwDone(false); setPwForm({ ...pwForm, currentPassword: e.target.value }); }}
                />
                <button type="button" onClick={() => setShowCurr(!showCurr)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurr ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Min. 6 characters"
                  value={pwForm.newPassword}
                  onChange={(e) => { setPwDone(false); setPwForm({ ...pwForm, newPassword: e.target.value }); }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {pwForm.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        pwForm.newPassword.length >= i * 3
                          ? i <= 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : i === 3 ? 'bg-blue-400' : 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {pwForm.newPassword.length < 4 ? 'Too short' :
                     pwForm.newPassword.length < 7 ? 'Weak' :
                     pwForm.newPassword.length < 10 ? 'Good' : 'Strong'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Confirm New Password
              </label>
              <input
                type="password"
                className={`input-field ${
                  pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                    ? 'border-red-300 focus:ring-red-400'
                    : pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword
                    ? 'border-emerald-300 focus:ring-emerald-400'
                    : ''
                }`}
                placeholder="Re-enter new password"
                value={pwForm.confirmPassword}
                onChange={(e) => { setPwDone(false); setPwForm({ ...pwForm, confirmPassword: e.target.value }); }}
              />
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
              {saving ? <Spinner size="sm" color="white" /> : <><KeyRound size={15} /> Change Password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
