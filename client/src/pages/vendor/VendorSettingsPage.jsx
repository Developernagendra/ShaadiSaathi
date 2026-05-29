import { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { FiLock, FiBell, FiShield, FiCreditCard } from 'react-icons/fi'

export default function VendorSettingsPage() {
  const { user } = useSelector(s => s.auth)
  const [loading, setLoading] = useState(false)
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await api.patch('/auth/update-password', passForm)
      toast.success('Password updated successfully!')
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-2">
            {[
              { id: 'security', label: 'Security', icon: <FiLock /> },
              { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
              { id: 'billing', label: 'Billing & Plans', icon: <FiCreditCard /> },
            ].map(item => (
              <button key={item.id} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${item.id === 'security' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Password Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <FiShield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Change Password</h3>
                  <p className="text-xs text-gray-500">Secure your account with a strong password</p>
                </div>
              </div>

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input 
                    type="password" 
                    required 
                    value={passForm.oldPassword} 
                    onChange={e => setPassForm(p => ({ ...p, oldPassword: e.target.value }))}
                    className="input-field" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passForm.newPassword} 
                      onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                      className="input-field" 
                    />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passForm.confirmPassword} 
                      onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      className="input-field" 
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-4">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Account Status</h3>
              <p className="text-sm text-gray-500 mb-6">Manage your account visibility and presence on ShaadiSaathi.</p>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800 text-sm">Deactivate Account</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Temporary or Permanent</p>
                </div>
                <button className="text-xs font-bold text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
