import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import api from '../../utils/api'
import { VEHICLE_TYPES, formatPrice } from '../../utils/helpers'
import { FiSave, FiPlus, FiTrash2, FiInfo, FiDollarSign } from 'react-icons/fi'
import { FaTruck } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

export default function VendorCabPricingPage() {
  const { user } = useSelector(s => s.auth)
  const [pricing, setPricing] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { data } = await api.get('/vendors/profile')
        setPricing(data.vendor.cabPricing || [])
      } catch (err) {
        toast.error('Failed to fetch pricing')
      } finally {
        setLoading(false)
      }
    }
    fetchPricing()
  }, [])

  const handleAddVehicle = (type) => {
    if (pricing.some(p => p.vehicleType === type)) {
      toast.error('This vehicle type is already added')
      return
    }
    setPricing([...pricing, {
      vehicleType: type,
      baseFare: 3000,
      includedKm: 40,
      pricePerKm: 15,
      decorationCharge: 1500,
      waitingCharge: 500,
      nightCharge: 500,
      isActive: true
    }])
  }

  const handleRemoveVehicle = (index) => {
    setPricing(pricing.filter((_, i) => i !== index))
  }

  const handleUpdateField = (index, field, value) => {
    const newPricing = [...pricing]
    newPricing[index] = { ...newPricing[index], [field]: value }
    setPricing(newPricing)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/vendors/cab-pricing', { cabPricing: pricing })
      toast.success('Pricing updated successfully!')
    } catch (err) {
      toast.error('Failed to update pricing')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading pricing data...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display text-4xl font-black text-gray-900 mb-2">Transport Pricing</h1>
          <p className="text-gray-500 font-medium italic">Configure your KM-based rates and additional service charges.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
          {saving ? 'Saving...' : <><FiSave /> Save Pricing Plan</>}
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Vehicle Selection Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-pink-50 sticky top-28">
            <h3 className="font-black text-gray-900 mb-6 flex items-center gap-3">
              <FaTruck className="text-[#C2185B]" /> Add Vehicle Type
            </h3>
            <div className="space-y-3">
              {VEHICLE_TYPES.map(v => (
                <button
                  key={v.value}
                  onClick={() => handleAddVehicle(v.value)}
                  disabled={pricing.some(p => p.vehicleType === v.value)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${
                    pricing.some(p => p.vehicleType === v.value)
                      ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                      : 'bg-white border-gray-100 hover:border-[#C2185B] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{v.icon}</span>
                    <div className="text-left">
                      <p className="font-black text-gray-900 text-xs uppercase tracking-widest">{v.label}</p>
                      <p className="text-[9px] font-bold text-gray-400">{v.capacity} Seats</p>
                    </div>
                  </div>
                  <FiPlus className="text-gray-300 group-hover:text-[#C2185B]" />
                </button>
              ))}
            </div>
            <div className="mt-8 p-4 bg-[#FFF8F0] rounded-xl border border-pink-100">
              <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                <FiInfo /> Pro Tip
              </p>
              <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed">
                Add multiple vehicle types to your profile to attract different customer requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Editor */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="popLayout">
            {pricing.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-200">
                <FaTruck size={64} className="text-gray-200 mx-auto mb-6" />
                <h3 className="font-display text-2xl font-black text-gray-900 mb-2">No Vehicles Configured</h3>
                <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8 italic">Start by adding your fleet vehicles from the sidebar to set your custom rates.</p>
              </motion.div>
            ) : (
              pricing.map((p, idx) => {
                const info = VEHICLE_TYPES.find(v => v.value === p.vehicleType)
                return (
                  <motion.div
                    key={p.vehicleType}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[3rem] p-8 md:p-12 shadow-premium border border-pink-50 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
                      <div className="flex items-center gap-6">
                        <span className="text-5xl drop-shadow-sm">{info?.icon}</span>
                        <div>
                          <h3 className="font-black text-gray-900 text-2xl tracking-tighter uppercase">{info?.label}</h3>
                          <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{info?.capacity} Seats Fleet</span>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveVehicle(idx)} className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-inner">
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                      {/* Base Config */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-4 italic">Core Pricing</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Base Fare (₹)</label>
                            <input type="number" value={p.baseFare} onChange={e => handleUpdateField(idx, 'baseFare', parseInt(e.target.value))} className="w-full bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Included KM</label>
                            <input type="number" value={p.includedKm} onChange={e => handleUpdateField(idx, 'includedKm', parseInt(e.target.value))} className="w-full bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Extra KM Charge (₹/KM)</label>
                          <input type="number" value={p.pricePerKm} onChange={e => handleUpdateField(idx, 'pricePerKm', parseInt(e.target.value))} className="w-full bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                        </div>
                      </div>

                      {/* Add-ons */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.2em] mb-4 italic">Extra Charges</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Decoration (₹)</label>
                            <input type="number" value={p.decorationCharge} onChange={e => handleUpdateField(idx, 'decorationCharge', parseInt(e.target.value))} className="w-full bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Night Charge (₹)</label>
                            <input type="number" value={p.nightCharge} onChange={e => handleUpdateField(idx, 'nightCharge', parseInt(e.target.value))} className="w-full bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block italic">Waiting Charge (₹/HR)</label>
                          <input type="number" value={p.waitingCharge} onChange={e => handleUpdateField(idx, 'waitingCharge', parseInt(e.target.value))} className="w-full bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
