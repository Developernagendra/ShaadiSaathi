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
    <div className="pb-24 animate-fade-in relative max-w-7xl mx-auto px-4 md:px-8 pt-8">
      <div className="absolute inset-0 floral-pattern opacity-[0.02] pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
        <div>
          <div className="divider-luxe !justify-start mb-3 !gap-3">
            <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] italic">Baraat Cab Service</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Transport Pricing</h1>
          <p className="text-gray-500 font-medium italic mt-2">Configure your KM-based rates and additional service charges.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white hover:from-[#D4AF37] hover:to-[#F4D03F] hover:text-black px-10 py-5 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-premium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
          {saving ? 'Saving...' : <><FiSave size={18} /> Save Pricing Plan</>}
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 relative z-10">
        {/* Vehicle Selection Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 shadow-premium border border-white sticky top-28">
            <h3 className="font-display text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#FFF8F0] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20 shadow-sm"><FaTruck size={16} /></span> 
              Add Vehicle Type
            </h3>
            <div className="space-y-4">
              {VEHICLE_TYPES.map(v => (
                <button
                  key={v.value}
                  onClick={() => handleAddVehicle(v.value)}
                  disabled={pricing.some(p => p.vehicleType === v.value)}
                  className={`w-full flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all duration-300 group ${
                    pricing.some(p => p.vehicleType === v.value)
                      ? 'bg-gray-50/50 border-gray-100 opacity-50 cursor-not-allowed'
                      : 'bg-white border-gray-100 hover:border-[#D4AF37] hover:bg-[#FFF8F0]/30 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{v.icon}</span>
                    <div className="text-left">
                      <p className="font-black text-gray-900 text-[10px] uppercase tracking-widest">{v.label}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{v.capacity} Seats</p>
                    </div>
                  </div>
                  <FiPlus className="text-gray-300 group-hover:text-[#D4AF37]" size={18} />
                </button>
              ))}
            </div>
            <div className="mt-8 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-[2rem] shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full blur-2xl pointer-events-none" />
              <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2 mb-3">
                <FiInfo size={12} /> Pro Tip
              </p>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">
                Add multiple vehicle types to your profile to attract different customer requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Editor */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="popLayout">
            {pricing.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-20 text-center border-2 border-dashed border-[#D4AF37]/30 shadow-sm hover:border-[#D4AF37] transition-all">
                <div className="w-24 h-24 bg-[#FFF8F0] rounded-[1.5rem] flex items-center justify-center text-[#D4AF37] mx-auto mb-8 shadow-sm">
                   <FaTruck size={40} />
                </div>
                <h3 className="font-display text-3xl font-black text-gray-900 mb-3 tracking-tight">No Vehicles Configured</h3>
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
                    className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-premium border border-white group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#FFF8F0] to-transparent rounded-bl-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-10 pb-8 border-b border-gray-100 relative z-10">
                      <div className="flex items-center gap-6">
                        <span className="text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-500">{info?.icon}</span>
                        <div>
                          <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight uppercase mb-2">{info?.label}</h3>
                          <span className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">{info?.capacity} Seats Fleet</span>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveVehicle(idx)} className="w-14 h-14 rounded-[1.5rem] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm">
                        <FiTrash2 size={20} />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
                      {/* Base Config */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-[#D4AF37]" /> Core Pricing
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/50">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Base Fare (₹)</label>
                            <input type="number" value={p.baseFare} onChange={e => handleUpdateField(idx, 'baseFare', parseInt(e.target.value))} className="w-full bg-white border border-gray-100 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-4 py-3 font-black text-gray-900 outline-none transition-all shadow-sm" />
                          </div>
                          <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/50">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Included KM</label>
                            <input type="number" value={p.includedKm} onChange={e => handleUpdateField(idx, 'includedKm', parseInt(e.target.value))} className="w-full bg-white border border-gray-100 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-4 py-3 font-black text-gray-900 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/50">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Extra KM Charge (₹/KM)</label>
                          <input type="number" value={p.pricePerKm} onChange={e => handleUpdateField(idx, 'pricePerKm', parseInt(e.target.value))} className="w-full bg-white border border-gray-100 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl px-4 py-3 font-black text-gray-900 outline-none transition-all shadow-sm" />
                        </div>
                      </div>

                      {/* Add-ons */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-[#C2185B]" /> Extra Charges
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/50">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Decoration (₹)</label>
                            <input type="number" value={p.decorationCharge} onChange={e => handleUpdateField(idx, 'decorationCharge', parseInt(e.target.value))} className="w-full bg-white border border-gray-100 focus:border-[#C2185B] focus:ring-1 focus:ring-[#C2185B] rounded-xl px-4 py-3 font-black text-gray-900 outline-none transition-all shadow-sm" />
                          </div>
                          <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/50">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Night Charge (₹)</label>
                            <input type="number" value={p.nightCharge} onChange={e => handleUpdateField(idx, 'nightCharge', parseInt(e.target.value))} className="w-full bg-white border border-gray-100 focus:border-[#C2185B] focus:ring-1 focus:ring-[#C2185B] rounded-xl px-4 py-3 font-black text-gray-900 outline-none transition-all shadow-sm" />
                          </div>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100/50">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Waiting Charge (₹/HR)</label>
                          <input type="number" value={p.waitingCharge} onChange={e => handleUpdateField(idx, 'waitingCharge', parseInt(e.target.value))} className="w-full bg-white border border-gray-100 focus:border-[#C2185B] focus:ring-1 focus:ring-[#C2185B] rounded-xl px-4 py-3 font-black text-gray-900 outline-none transition-all shadow-sm" />
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
