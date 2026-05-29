import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  FiPlus, FiTrash2, FiEdit2, FiInfo, FiImage,
  FiSettings, FiStar, FiDollarSign, FiUpload, FiX, FiCheck,
  FiChevronRight, FiChevronLeft, FiMapPin, FiClock, FiCalendar, FiShield, FiUser
} from 'react-icons/fi'
import { FaTruck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import api from '../../utils/api'
import LoadingScreen from '../../components/common/LoadingScreen'
import { formatPrice, INDIAN_CITIES } from '../../utils/helpers'

import { getSocket } from '../../utils/socket'

export default function VendorManageCabsPage() {
  const [cabs, setCabs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [searchQueries, setSearchQueries] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCab, setEditingCab] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingField, setUploadingField] = useState(null)
  const [step, setStep] = useState(1)
  const [agreeChecked, setAgreeChecked] = useState(false)

  const fileInputRefs = {
    front: useRef(null),
    back: useRef(null),
    side: useRef(null),
    interior: useRef(null),
    decorated: useRef(null),
    registrationCertificate: useRef(null),
    insuranceCertificate: useRef(null),
    drivingLicense: useRef(null),
    pollutionCertificate: useRef(null),
    ownerIdProof: useRef(null)
  }

  const [formData, setFormData] = useState({
    name: '',
    type: 'sedan',
    brand: '',
    model: '',
    modelYear: new Date().getFullYear(),
    color: '',
    fuelType: 'diesel',
    ac: true,
    seatingCapacity: 4,
    vehicleNumber: '',
    registrationNumber: '',
    description: '',
    packages: [], // New Baraat Cab Premium Packages
    bundlePackages: [], // Multi-Vehicle Bundles
    images: [], // array of { url, publicId, viewType, isPrimary }
    documents: {
      registrationCertificate: { url: '', publicId: '' },
      insuranceCertificate: { url: '', publicId: '' },
      drivingLicense: { url: '', publicId: '' },
      pollutionCertificate: { url: '', publicId: '' },
      ownerIdProof: { url: '', publicId: '' }
    },
    driverDetails: {
      name: '',
      phone: '',
      experienceYears: 5,
      uniformAvailable: true
    },
    availableDates: [],
    outstationAvailable: false,
    driverIncluded: true,
    additionalServices: {
      flowerDecoration: false,
      ribbonDecoration: false,
      groomEntrySetup: false,
      baraatSoundSupport: false
    },
    pricing: {
      baseFare: 3000,
      advancePercentage: 50,
      pricePerDay: 3000,
      decorationCharges: 0,
      extraKmCharges: 0,
      driverCharges: 0
    },
    price: '',
    features: {
      driverIncluded: true,
      decorationAvailable: true,
      musicSystem: true,
      ac: true,
      fuelIncluded: true
    },
    location: {
      city: 'Patna',
      state: 'Bihar'
    },
    status: 'draft'
  })

  useEffect(() => {
    loadCabs()

    // Handle outside clicks to close searchable dropdown
    const handleOutsideClick = (e) => {
      if (openDropdownId && !e.target.closest('.relative')) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)

    // Setup Socket Real-time Listener
    const socket = getSocket()
    if (socket) {
      const handleSync = () => {
        loadCabs()
      }
      socket.on('fleet_updated', handleSync)
      socket.on('cab_updated', handleSync)
      socket.on('vendor_updated', handleSync)

      return () => {
        document.removeEventListener('click', handleOutsideClick)
        socket.off('fleet_updated', handleSync)
        socket.off('cab_updated', handleSync)
        socket.off('vendor_updated', handleSync)
      }
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [openDropdownId])

  const loadVehicles = async () => {
    setVehiclesLoading(true)
    try {
      const { data } = await api.get('/vendor/fleet/vehicles')
      setVehicles(data.data || [])
    } catch (err) {
      console.error('Vehicles load error:', err)
    } finally {
      setVehiclesLoading(false)
    }
  }

  const loadCabs = async () => {
    try {
      const { data } = await api.get('/fleet')
      setCabs(data.cabs || [])
      // Also load approved vehicles for dropdowns in parallel
      await loadVehicles()
    } catch (err) {
      console.error('Fleet load error:', err)
      toast.error(err.response?.data?.message || 'Failed to load fleet')
    } finally {
      setLoading(false)
    }
  }

  // Handle Photo Viewpoint Uploads
  const handleViewImageUpload = async (e, viewType) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    setUploadingField(viewType)
    setUploadProgress(0)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/fleet/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })

      setFormData(prev => {
        // Remove existing preview of the same viewType
        const filtered = prev.images.filter(img => img.viewType !== viewType)
        return {
          ...prev,
          images: [...filtered, { url: data.url, publicId: data.publicId, viewType, isPrimary: viewType === 'front' }]
        }
      })
      toast.success(`${viewType.toUpperCase()} view uploaded successfully!`)
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
      setUploadingField(null)
      setUploadProgress(0)
    }
  }

  // Handle Document Uploads
  const handleDocUpload = async (e, docKey) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    setUploadingField(docKey)
    setUploadProgress(0)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/fleet/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: { url: data.url, publicId: data.publicId }
        }
      }))
      toast.success('Document uploaded successfully!')
    } catch (err) {
      toast.error('Document upload failed')
    } finally {
      setIsUploading(false)
      setUploadingField(null)
      setUploadProgress(0)
    }
  }

  const removeViewImage = (viewType) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.viewType !== viewType)
    }))
  }

  const removeDoc = (docKey) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: { url: '', publicId: '' }
      }
    }))
  }

  // --- Package Management Handlers ---
  const addPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [...(prev.packages || []), {
        name: '', price: '', originalPrice: '', hours: 8, kmLimit: 80,
        description: '', features: [], decorationIncluded: false,
        driverIncluded: true, fuelIncluded: true, isPopular: false
      }]
    }))
  }
  const removePackage = (index) => {
    setFormData(prev => ({ ...prev, packages: prev.packages.filter((_, i) => i !== index) }))
  }
  const updatePackage = (index, field, value) => {
    setFormData(prev => {
      const newPackages = [...prev.packages]
      newPackages[index] = { ...newPackages[index], [field]: value }
      return { ...prev, packages: newPackages }
    })
  }

  // --- Bundle Management Handlers ---
  const addBundle = () => {
    setFormData(prev => ({
      ...prev,
      bundlePackages: [...(prev.bundlePackages || []), {
        bundleName: '', description: '', totalPrice: '', discountedPrice: '',
        vehicles: [], features: [], isPopular: false, isLuxury: false
      }]
    }))
  }
  const removeBundle = (index) => {
    setFormData(prev => ({ ...prev, bundlePackages: prev.bundlePackages.filter((_, i) => i !== index) }))
  }
  const updateBundle = (index, field, value) => {
    setFormData(prev => {
      const newBundles = [...prev.bundlePackages]
      newBundles[index] = { ...newBundles[index], [field]: value }
      return { ...prev, bundlePackages: newBundles }
    })
  }
  const addVehicleToBundle = (bundleIndex) => {
    setFormData(prev => {
      const newBundles = [...prev.bundlePackages]
      newBundles[bundleIndex].vehicles.push({ vehicleId: '', quantity: 1, includedHours: 8, includedKm: 80 })
      return { ...prev, bundlePackages: newBundles }
    })
  }
  const updateVehicleInBundle = (bundleIndex, vIndex, field, value) => {
    setFormData(prev => {
      const newBundles = [...prev.bundlePackages]
      newBundles[bundleIndex].vehicles[vIndex] = { ...newBundles[bundleIndex].vehicles[vIndex], [field]: value }
      return { ...prev, bundlePackages: newBundles }
    })
  }
  const removeVehicleFromBundle = (bundleIndex, vIndex) => {
    setFormData(prev => {
      const newBundles = [...prev.bundlePackages]
      newBundles[bundleIndex].vehicles = newBundles[bundleIndex].vehicles.filter((_, i) => i !== vIndex)
      return { ...prev, bundlePackages: newBundles }
    })
  }

  const handleSubmit = async (e, finalStatus = 'pending') => {
    if (e) e.preventDefault()

    // Validate pricing
    const priceVal = Number(formData.price || formData.pricing?.baseFare)
    if (!priceVal || isNaN(priceVal) || priceVal <= 0) {
      toast.error('Flat Pricing per Booking is required and must be a positive number')
      setStep(2)
      return
    }

    if (finalStatus === 'pending') {
      // Perform strict validation checks for official submission
      if (!formData.name) { toast.error('Vehicle Name is required'); setStep(1); return; }
      if (!formData.vehicleNumber) { toast.error('Registration/Plate Number is required'); setStep(1); return; }
      if (formData.images.filter(i => ['front', 'back', 'side', 'interior'].includes(i.viewType)).length < 4) {
        toast.error('Please upload at least Front, Back, Side, and Interior views');
        setStep(3);
        return;
      }
      const docs = formData.documents;
      if (!docs.registrationCertificate?.url || !docs.insuranceCertificate?.url || !docs.drivingLicense?.url || !docs.ownerIdProof?.url) {
        toast.error('Please upload all required verification documents (RC, Insurance, DL, Owner ID)');
        setStep(4);
        return;
      }
      if (!formData.driverDetails.name || !formData.driverDetails.phone) {
        toast.error('Driver contact details are required');
        setStep(5);
        return;
      }
      if (!agreeChecked) {
        toast.error('You must declare and certify that vehicle details and driver records are correct');
        setStep(8);
        return;
      }
    }

    const payload = {
      ...formData,
      status: finalStatus,
      price: priceVal,
      pricing: {
        ...formData.pricing,
        baseFare: priceVal
      }
    }

    try {
      if (editingCab) {
        await api.patch(`/fleet/${editingCab._id}`, payload)
        toast.success(finalStatus === 'draft' ? 'Draft specifications saved' : 'Vehicle submitted for Admin Verification!')
      } else {
        await api.post('/fleet', payload)
        toast.success(finalStatus === 'draft' ? 'New draft vehicle saved' : 'New vehicle submitted for Admin Verification!')
      }
      setShowModal(false)
      loadCabs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return
    try {
      await api.delete(`/fleet/${id}`)
      toast.success('Vehicle removed')
      loadCabs()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const openEdit = (cab) => {
    setEditingCab(cab)
    setFormData({
      name: cab.name || '',
      type: cab.type || 'sedan',
      brand: cab.brand || '',
      model: cab.model || '',
      modelYear: cab.modelYear || 2024,
      color: cab.color || '',
      fuelType: cab.fuelType || 'diesel',
      ac: cab.ac !== undefined ? cab.ac : true,
      seatingCapacity: cab.seatingCapacity || 4,
      vehicleNumber: cab.vehicleNumber || '',
      registrationNumber: cab.registrationNumber || cab.vehicleNumber || '',
      description: cab.description || '',
      images: cab.images || [],
      documents: cab.documents || {
        registrationCertificate: { url: '', publicId: '' },
        insuranceCertificate: { url: '', publicId: '' },
        drivingLicense: { url: '', publicId: '' },
        pollutionCertificate: { url: '', publicId: '' },
        ownerIdProof: { url: '', publicId: '' }
      },
      driverDetails: cab.driverDetails || { name: '', phone: '', experienceYears: 5, uniformAvailable: true },
      availableDates: cab.availableDates || [],
      outstationAvailable: cab.outstationAvailable || false,
      driverIncluded: cab.driverIncluded !== undefined ? cab.driverIncluded : true,
      additionalServices: cab.additionalServices || { flowerDecoration: false, ribbonDecoration: false, groomEntrySetup: false, baraatSoundSupport: false },
      pricing: cab.pricing || { baseFare: 3000, advancePercentage: 50, pricePerDay: 3000, decorationCharges: 0, extraKmCharges: 0, driverCharges: 0 },
      price: cab.price || cab.pricing?.baseFare || '',
      features: cab.features || { driverIncluded: true, decorationAvailable: true, musicSystem: true, ac: true, fuelIncluded: true },
      location: cab.location || { city: 'Patna', state: 'Bihar' },
      status: cab.status || 'draft'
    })
    setStep(1)
    setAgreeChecked(false)
    setShowModal(true)
  }

  const openAdd = () => {
    setEditingCab(null)
    setFormData({
      name: '',
      type: 'sedan',
      brand: '',
      model: '',
      modelYear: 2024,
      color: '',
      fuelType: 'diesel',
      ac: true,
      seatingCapacity: 4,
      vehicleNumber: '',
      registrationNumber: '',
      description: '',
      images: [],
      documents: {
        registrationCertificate: { url: '', publicId: '' },
        insuranceCertificate: { url: '', publicId: '' },
        drivingLicense: { url: '', publicId: '' },
        pollutionCertificate: { url: '', publicId: '' },
        ownerIdProof: { url: '', publicId: '' }
      },
      driverDetails: { name: '', phone: '', experienceYears: 5, uniformAvailable: true },
      availableDates: [],
      outstationAvailable: false,
      driverIncluded: true,
      additionalServices: { flowerDecoration: false, ribbonDecoration: false, groomEntrySetup: false, baraatSoundSupport: false },
      pricing: { baseFare: 3000, advancePercentage: 50, pricePerDay: 3000, decorationCharges: 0, extraKmCharges: 0, driverCharges: 0 },
      price: '',
      features: { driverIncluded: true, decorationAvailable: true, musicSystem: true, ac: true, fuelIncluded: true },
      location: { city: 'Patna', state: 'Bihar' },
      status: 'draft'
    })
    setStep(1)
    setAgreeChecked(false)
    setShowModal(true)
  }

  // Dynamic Availability Setter (Toggle weekdays)
  const toggleWeekday = (day) => {
    const days = formData.availableDates || []
    const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    setFormData(prev => ({ ...prev, availableDates: updated }))
  }

  const steps = [
    { id: 1, name: 'Vehicle Info' },
    { id: 2, name: 'Pricing' },
    { id: 3, name: 'Showcase' },
    { id: 4, name: 'Documents' },
    { id: 5, name: 'Driver Details' },
    { id: 6, name: 'Availability' },
    { id: 7, name: 'Wedding Addons' },
    { id: 8, name: 'Authorize' }
  ]

  if (loading) return <LoadingScreen />

  // Dashboard count summaries
  const approvedCount = cabs.filter(c => c.status === 'approved').length
  const pendingCount = cabs.filter(c => c.status === 'pending').length
  const rejectedCount = cabs.filter(c => c.status === 'rejected').length
  const changesCount = cabs.filter(c => c.status === 'changes_requested').length
  const draftCount = cabs.filter(c => c.status === 'draft').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Stepper Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-block bg-[#FFF8F0] border border-[#D4AF37]/20 text-[#D4AF37] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            🔱 ShaadiSaathi Imperial Fleet
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-none">
            Fleet Registry <span className="text-[#C2185B]">Console</span>
          </motion.h1>
          <p className="text-gray-500 font-medium italic mt-2">Manage commercial vehicles, licenses, driver assignments, and live verification workflows.</p>
        </div>
        <button onClick={openAdd} className="bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3">
          <FiPlus size={20} /> Register New Vehicle
        </button>
      </div>

      {/* Metrics Summary Board */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16">
        {[
          { label: 'Total Fleet', count: cabs.length, color: 'text-gray-900', bg: 'bg-white border-gray-100' },
          { label: 'Approved & Live', count: approvedCount, color: 'text-green-600', bg: 'bg-green-50/30 border-green-100' },
          { label: 'Under Review', count: pendingCount, color: 'text-amber-500', bg: 'bg-amber-50/30 border-amber-100' },
          { label: 'Changes Requested', count: changesCount, color: 'text-blue-500', bg: 'bg-blue-50/30 border-blue-100' },
          { label: 'Saved Drafts', count: draftCount, color: 'text-purple-600', bg: 'bg-purple-50/30 border-purple-100' }
        ].map((m, idx) => (
          <div key={idx} className={`bg-white rounded-3xl p-6 border shadow-sm ${m.bg} flex flex-col justify-between`}>
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-4">{m.label}</p>
            <h4 className={`text-4xl font-black tracking-tight ${m.color}`}>{m.count}</h4>
          </div>
        ))}
      </div>

      {/* Notification Remarks if any changes requested */}
      {cabs.some(c => c.status === 'changes_requested') && (
        <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-3xl p-8 mb-16 flex items-start gap-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl flex-shrink-0">⚠️</div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Action Required: Correction Requests</h3>
            <p className="text-gray-600 text-sm italic leading-relaxed">
              Admins have requested changes for one or more vehicles in your fleet. Please review the admin remarks by clicking "Update Specs" on those cards to resubmit details.
            </p>
          </div>
        </div>
      )}

      {/* Fleet Grid */}
      {cabs.length === 0 ? (
        <div className="bg-white rounded-[4rem] p-32 text-center border border-dashed border-gray-200 shadow-premium">
          <div className="w-24 h-24 bg-[#FFF8F0] rounded-full flex items-center justify-center mx-auto mb-8 text-5xl shadow-inner border border-pink-50">🚗</div>
          <h2 className="font-display text-3xl font-black text-gray-900 mb-2 tracking-tight">Fleet Registry Empty</h2>
          <p className="text-gray-500 font-medium italic">Complete vehicle registrations to unlock bookings on the Baraat marketplace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {cabs.map((cab, idx) => (
              <motion.div
                key={cab._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[3.5rem] overflow-hidden border border-gray-100 shadow-premium group hover:shadow-2xl transition-all duration-700 relative"
              >
                {/* Visual Cover */}
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img
                    src={cab.images?.find(i => i.viewType === 'front' || i.isPrimary)?.url || cab.images?.[0]?.url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={cab.name}
                  />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                      {cab?.type?.replace('_', ' ')}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 ${cab.status === 'approved' ? 'bg-green-600 text-white' :
                      cab.status === 'pending' ? 'bg-amber-500 text-white' :
                        cab.status === 'changes_requested' ? 'bg-blue-600 text-white' :
                          cab.status === 'draft' ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {cab.status?.replace('_', ' ') || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="p-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-display font-black text-2xl text-gray-900 mb-1 leading-tight">{cab.name}</h3>
                      <p className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                        <FiMapPin className="text-primary-500" /> {cab.location?.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900 tracking-tight">{formatPrice(cab.price || cab.pricing?.baseFare)}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Day Rate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Plate No</p>
                      <p className="font-black text-xs text-gray-900 uppercase">{cab.vehicleNumber}</p>
                    </div>
                    <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Seating</p>
                      <p className="font-black text-xs text-gray-900">{cab.seatingCapacity} Seater</p>
                    </div>
                  </div>

                  {cab.status === 'changes_requested' && cab.rejectionReason && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest block mb-1">Remarks</span>
                      <p className="text-[10px] italic text-blue-800 leading-relaxed">"{cab.rejectionReason}"</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => openEdit(cab)}
                      className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl ${cab.status === 'changes_requested' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                      <FiEdit2 /> {cab.status === 'draft' ? 'Continue Setup' : cab.status === 'changes_requested' ? 'Correct Specs' : 'Update Specs'}
                    </button>
                    {cab.status !== 'pending' && (
                      <button onClick={() => handleDelete(cab._id)} className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-inner">
                        <FiTrash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 8-Step Multi-Step Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!isUploading) setShowModal(false) }} className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[3.5rem] w-full max-w-5xl relative z-10 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-900 text-[#D4AF37] flex items-center justify-center shadow-xl">
                    <FaTruck size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">
                      {editingCab ? `Configure ${formData.name || 'Fleet Member'}` : 'Register New Fleet Vehicle'}
                    </h2>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic mt-1">
                      Imperial Registry Wizard (Step {step} of 8)
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} disabled={isUploading} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900"><FiX size={18} /></button>
              </div>

              {/* Progress Stepper Bar */}
              <div className="bg-[#FFF8F0]/30 px-10 py-5 border-b border-gray-100 overflow-x-auto flex items-center gap-2 custom-scrollbar">
                {steps.map((s, idx) => (
                  <div key={s.id} className="flex items-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingCab || s.id < step) setStep(s.id)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${step === s.id
                        ? 'bg-[#D4AF37] text-white shadow-lg shadow-yellow-100 scale-105'
                        : step > s.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 text-gray-400'
                        }`}
                    >
                      <span className="w-4 h-4 rounded-full flex items-center justify-center border border-current text-[8px] font-bold">{s.id}</span>
                      <span>{s.name}</span>
                    </button>
                    {idx < steps.length - 1 && <FiChevronRight className="text-gray-300 mx-2 flex-shrink-0" size={14} />}
                  </div>
                ))}
              </div>

              {isUploading && (
                <div className="w-full bg-amber-50 border-b border-amber-100 px-10 py-3.5 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-ping" />
                    Uploading file to Secure Cloud Storage ({uploadProgress}%)
                  </span>
                  <div className="flex-1 max-w-xs bg-amber-100/50 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#D4AF37] h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Wizard Content Body */}
              <div className="flex-1 overflow-y-auto p-10 md:p-12 custom-scrollbar">

                {/* STEP 1: Basic Vehicle Details */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                      <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> Step 1: Vehicle Configuration Specs
                    </h3>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Commercial Fleet Name *</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wedding Mercedes S-Class - Obsidian Black Edition" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all shadow-inner" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Category *</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-xs uppercase tracking-widest text-gray-900 outline-none transition-all shadow-inner">
                          <option value="sedan">Premium Sedan</option>
                          <option value="suv">Luxury SUV</option>
                          <option value="luxury_car">Ultra Luxury Car</option>
                          <option value="vintage_car">Royal Vintage Car</option>
                          <option value="bus">Guest Coach Bus</option>
                          <option value="tempo_traveller">Tempo Traveller</option>
                          <option value="horse_carriage">Groom Horse Carriage</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Registration/Plate Number *</label>
                        <input required type="text" value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value, registrationNumber: e.target.value })} placeholder="e.g. BR 01 AP 9999" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all shadow-inner uppercase" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Brand/Make *</label>
                        <input type="text" value={formData.brand || ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Mercedes-Benz" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Model Name *</label>
                        <input type="text" value={formData.model || ''} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="e.g. S-Class S450" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Model Year *</label>
                        <input type="number" value={formData.modelYear} onChange={e => setFormData({ ...formData, modelYear: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Vehicle Color *</label>
                        <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="e.g. Metallic Black" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Seating Capacity (Passengers) *</label>
                        <input type="number" value={formData.seatingCapacity} onChange={e => setFormData({ ...formData, seatingCapacity: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Fuel Type *</label>
                        <select value={formData.fuelType} onChange={e => setFormData({ ...formData, fuelType: e.target.value })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-xs uppercase tracking-widest text-gray-900 outline-none transition-all shadow-inner">
                          <option value="diesel">Diesel</option>
                          <option value="petrol">Petrol</option>
                          <option value="cng">CNG</option>
                          <option value="electric">Electric</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Air Conditioning</span>
                          <span className="text-xs font-bold text-gray-900">Vehicle features AC systems</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.ac}
                          onChange={e => setFormData({ ...formData, ac: e.target.checked })}
                          className="w-5 h-5 accent-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Pricing Configurations */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                      <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> 🧾 Step 2: Set Your Pricing
                    </h3>

                    <p className="text-sm font-medium text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      This step helps you set your cab prices and understand your earnings.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Base Booking Price */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <label className="text-sm font-black text-gray-900 block mb-2">💰 Base Booking Price (Minimum Fare) *</label>
                        <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">Minimum amount charged for every booking.</p>
                        <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value, pricing: { ...formData.pricing, baseFare: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-xl px-4 py-3 font-black text-xl text-gray-900 outline-none transition-all shadow-inner" />
                      </div>

                      {/* Per KM Charge */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <label className="text-sm font-black text-gray-900 block mb-2">📍 Per KM Charge *</label>
                        <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">Charge applied for every kilometer travelled.</p>
                        <input required type="number" value={formData.pricing.extraKmCharges} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, extraKmCharges: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-xl px-4 py-3 font-black text-xl text-gray-900 outline-none transition-all shadow-inner" />
                      </div>

                      {/* Per Hour Charge */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <label className="text-sm font-black text-gray-900 block mb-2">⏱ Per Hour Charge (Optional)</label>
                        <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">Extra charge for time-based usage or waiting.</p>
                        <input type="number" value={formData.pricing.pricePerDay} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, pricePerDay: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-xl px-4 py-3 font-black text-xl text-gray-900 outline-none transition-all shadow-inner" />
                      </div>

                      {/* Extra Charges */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <label className="text-sm font-black text-gray-900 block mb-2">⛽ Extra Charges (Optional)</label>
                        <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">Add additional costs like toll, parking, or night charges.</p>
                        <div className="space-y-4 border-t border-gray-100 pt-4">
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Driver Allowance</span>
                            <input type="number" value={formData.pricing.driverCharges} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, driverCharges: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Decoration Charges</span>
                            <input type="number" value={formData.pricing.decorationCharges} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, decorationCharges: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Advance Lock Percentage</span>
                            <input type="number" value={formData.pricing.advancePercentage} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, advancePercentage: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-xl px-4 py-3 font-bold text-[#C2185B] outline-none transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Earnings Calculation */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-4 shadow-sm">
                      <h4 className="font-bold text-green-900 flex items-center gap-2">📊 Earnings Calculation</h4>
                      <p className="text-sm text-green-800 font-medium mt-1">System will automatically calculate your total earnings.</p>
                    </div>

                    {/* Important Note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-4 shadow-sm">
                      <h4 className="font-bold text-amber-900 flex items-center gap-2">⚠️ Important Note</h4>
                      <p className="text-sm text-amber-800 font-medium mt-1">Set fair pricing to get more bookings and better earnings.</p>
                    </div>

                    {/* Final Line */}
                    <div className="bg-gray-900 rounded-xl p-5 text-center shadow-lg mt-4 border-b-4 border-[#D4AF37]">
                      <p className="text-sm font-black text-[#D4AF37] flex items-center justify-center gap-2 tracking-wide leading-relaxed">
                        🔥 Keep your pricing simple and clear for customers.
                      </p>
                    </div>

                    {/* PREMIUM PACKAGES BUILDER */}
                    <div className="mt-12 pt-10 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h4 className="font-display text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 italic">Premium Packages <span className="text-[10px] bg-[#FFF8F0] text-[#C2185B] px-3 py-1 rounded-full not-italic">Optional</span></h4>
                          <p className="text-xs text-gray-500 italic mt-1">Offer bundled luxury packages (e.g. Silver, Gold, Platinum) to increase bookings.</p>
                        </div>
                        <button type="button" onClick={addPackage} className="btn-primary py-2 px-6 text-[10px] !rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-2">
                          <FiPlus /> Add Package
                        </button>
                      </div>

                      {formData.packages && formData.packages.length > 0 ? (
                        <div className="space-y-6">
                          {formData.packages.map((pkg, idx) => (
                            <div key={idx} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative group">
                              <button type="button" onClick={() => removePackage(idx)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 /></button>

                              <div className="grid md:grid-cols-3 gap-6 mb-6 pr-10">
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Package Name *</label>
                                  <input type="text" value={pkg.name} onChange={e => updatePackage(idx, 'name', e.target.value)} placeholder="e.g. Platinum Wedding Setup" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#C2185B] focus:bg-white rounded-2xl px-4 py-3 font-bold text-gray-900 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Package Price (₹) *</label>
                                  <input type="number" value={pkg.price} onChange={e => updatePackage(idx, 'price', e.target.value)} placeholder="e.g. 25000" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#C2185B] focus:bg-white rounded-2xl px-4 py-3 font-black text-[#C2185B] outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Original Strike Price (₹)</label>
                                  <input type="number" value={pkg.originalPrice} onChange={e => updatePackage(idx, 'originalPrice', e.target.value)} placeholder="e.g. 30000" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#C2185B] focus:bg-white rounded-2xl px-4 py-3 font-bold text-gray-500 outline-none transition-all line-through decoration-red-500" />
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Duration (Hours) & KM Limit</label>
                                  <div className="flex gap-4">
                                    <input type="number" value={pkg.hours} onChange={e => updatePackage(idx, 'hours', e.target.value)} placeholder="Hours" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none" />
                                    <input type="number" value={pkg.kmLimit} onChange={e => updatePackage(idx, 'kmLimit', e.target.value)} placeholder="KMs" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Package Description</label>
                                  <textarea rows="1" value={pkg.description} onChange={e => updatePackage(idx, 'description', e.target.value)} placeholder="Brief overview of this package..." className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none resize-none" />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-4 items-center">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-xl cursor-pointer">
                                  <input type="checkbox" checked={pkg.decorationIncluded} onChange={e => updatePackage(idx, 'decorationIncluded', e.target.checked)} className="accent-[#C2185B]" /> Includes Decoration
                                </label>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-xl cursor-pointer">
                                  <input type="checkbox" checked={pkg.driverIncluded} onChange={e => updatePackage(idx, 'driverIncluded', e.target.checked)} className="accent-[#C2185B]" /> Driver Included
                                </label>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-xl cursor-pointer">
                                  <input type="checkbox" checked={pkg.fuelIncluded} onChange={e => updatePackage(idx, 'fuelIncluded', e.target.checked)} className="accent-[#C2185B]" /> Fuel Included
                                </label>
                                <label className="flex items-center gap-2 text-xs font-black text-[#C2185B] bg-[#FFF8F0] border border-pink-100 px-4 py-2 rounded-xl cursor-pointer ml-auto">
                                  <input type="checkbox" checked={pkg.isPopular} onChange={e => updatePackage(idx, 'isPopular', e.target.checked)} className="accent-[#C2185B]" /> Mark as Popular 🔥
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                          <p className="text-gray-500 font-medium italic text-sm">No packages added yet. Standard base pricing will be used.</p>
                        </div>
                      )}
                    </div>

                    {/* MULTI-VEHICLE BUNDLES BUILDER */}
                    <div className="mt-12 pt-10 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h4 className="font-display text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 italic">Multi-Vehicle Bundles <span className="text-[10px] bg-[#F3F4F6] text-gray-600 px-3 py-1 rounded-full not-italic">Luxury Baraat Fleet</span></h4>
                          <p className="text-xs text-gray-500 italic mt-1">Combine multiple vehicles from your fleet into a single bookable luxury package.</p>
                        </div>
                        <button type="button" onClick={addBundle} className="bg-gray-900 text-white py-2 px-6 text-[10px] uppercase font-black tracking-widest rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-2">
                          <FiPlus /> Create Bundle
                        </button>
                      </div>

                      {formData.bundlePackages && formData.bundlePackages.length > 0 ? (
                        <div className="space-y-6">
                          {formData.bundlePackages.map((bundle, bIdx) => (
                            <div key={bIdx} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-200 shadow-sm relative group">
                              <button type="button" onClick={() => removeBundle(bIdx)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 size={20} /></button>

                              <div className="grid md:grid-cols-2 gap-6 mb-8 pr-10">
                                <div>
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Bundle Name *</label>
                                  <input type="text" value={bundle.bundleName} onChange={e => updateBundle(bIdx, 'bundleName', e.target.value)} placeholder="e.g. Royal Baraat Convoy" className="w-full bg-white border-2 border-transparent focus:border-gray-900 rounded-2xl px-4 py-3 font-bold text-gray-900 outline-none transition-all shadow-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total Price (₹) *</label>
                                    <input type="number" value={bundle.totalPrice} onChange={e => updateBundle(bIdx, 'totalPrice', e.target.value)} placeholder="e.g. 50000" className="w-full bg-white border-2 border-transparent focus:border-gray-900 rounded-2xl px-4 py-3 font-black text-gray-900 outline-none transition-all shadow-sm" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Discounted (₹)</label>
                                    <input type="number" value={bundle.discountedPrice} onChange={e => updateBundle(bIdx, 'discountedPrice', e.target.value)} placeholder="e.g. 45000" className="w-full bg-white border-2 border-transparent focus:border-green-500 rounded-2xl px-4 py-3 font-black text-green-600 outline-none transition-all shadow-sm" />
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Description</label>
                                  <textarea rows="2" value={bundle.description} onChange={e => updateBundle(bIdx, 'description', e.target.value)} placeholder="Describe what makes this fleet bundle special..." className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none resize-none shadow-sm" />
                                </div>
                              </div>

                              {/* Vehicles inside Bundle */}
                              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h5 className="text-xs font-black text-gray-700 uppercase tracking-widest">Included Vehicles</h5>
                                  <button type="button" onClick={() => addVehicleToBundle(bIdx)} className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline">
                                    <FiPlus /> Add Vehicle
                                  </button>
                                </div>

                                {bundle.vehicles.map((v, vIdx) => (
                                  <div key={vIdx} className="grid grid-cols-12 gap-4 items-center mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <div className="col-span-5 relative">
                                      {vehicles.length === 0 ? (
                                        <div className="flex flex-col items-center gap-1.5 p-2 bg-red-50 border border-dashed border-red-200 rounded-xl">
                                          <span className="text-[10px] font-black text-red-600">No approved vehicles found.</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowModal(true);
                                              setEditingCab(null);
                                              setStep(1);
                                            }}
                                            className="text-[9px] font-black text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-all animate-pulse"
                                          >
                                            + Add Vehicle
                                          </button>
                                        </div>
                                      ) : (
                                        <div>
                                          {/* Trigger Button showing selected vehicle or search prompt */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenDropdownId(openDropdownId === `${bIdx}-${vIdx}` ? null : `${bIdx}-${vIdx}`);
                                            }}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none text-left flex justify-between items-center shadow-sm hover:border-gray-400 transition-colors"
                                          >
                                            <span className="truncate">
                                              {vehicles.find(vh => vh._id === v.vehicleId)?.vehicleName || 'Select Approved Vehicle...'}
                                            </span>
                                            <span className="text-gray-400 text-[10px]">▼</span>
                                          </button>

                                          {/* Floating Dropdown Overlay */}
                                          {openDropdownId === `${bIdx}-${vIdx}` && (
                                            <div
                                              onClick={(e) => e.stopPropagation()}
                                              className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 space-y-2 max-w-full"
                                            >
                                              {/* Search Input */}
                                              <input
                                                type="text"
                                                placeholder="Search model, category..."
                                                value={searchQueries[`${bIdx}-${vIdx}`] || ''}
                                                onChange={e => setSearchQueries(prev => ({ ...prev, [`${bIdx}-${vIdx}`]: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-gray-300"
                                              />

                                              {/* Skeletons while loading */}
                                              {vehiclesLoading ? (
                                                <div className="space-y-1.5 py-1">
                                                  <div className="h-8 bg-gray-100 animate-pulse rounded-lg w-full"></div>
                                                  <div className="h-8 bg-gray-100 animate-pulse rounded-lg w-full"></div>
                                                </div>
                                              ) : (
                                                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                                                  {vehicles
                                                    .filter(vh => {
                                                      const query = (searchQueries[`${bIdx}-${vIdx}`] || '').toLowerCase();
                                                      return (
                                                        (vh.vehicleName || '').toLowerCase().includes(query) ||
                                                        (vh.category || '').toLowerCase().includes(query)
                                                      );
                                                    })
                                                    .map(vehicle => (
                                                      <button
                                                        key={vehicle._id}
                                                        type="button"
                                                        onClick={() => {
                                                          updateVehicleInBundle(bIdx, vIdx, 'vehicleId', vehicle._id);
                                                          setOpenDropdownId(null);
                                                          setSearchQueries(prev => ({ ...prev, [`${bIdx}-${vIdx}`]: '' }));
                                                        }}
                                                        className="w-full text-left p-1.5 rounded-xl hover:bg-gray-50 flex items-center gap-2.5 transition-colors group cursor-pointer"
                                                      >
                                                        {/* Vehicle Thumbnail */}
                                                        {vehicle.images && vehicle.images.length > 0 ? (
                                                          <img
                                                            src={vehicle.images[0].url}
                                                            alt={vehicle.vehicleName}
                                                            className="w-7 h-7 rounded-lg object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                                                          />
                                                        ) : (
                                                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">
                                                            🚗
                                                          </div>
                                                        )}
                                                        {/* Details */}
                                                        <div className="flex-1 min-w-0">
                                                          <div className="flex justify-between items-baseline gap-1">
                                                            <p className="text-[11px] font-bold text-gray-800 truncate group-hover:text-black">
                                                              {vehicle.vehicleName}
                                                            </p>
                                                            <span className="text-[9px] font-black text-primary-600 shrink-0">
                                                              ₹{vehicle.price}/day
                                                            </span>
                                                          </div>
                                                          <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="inline-block text-[8px] font-black text-gray-400 uppercase tracking-wider">
                                                              {vehicle.category?.replace('_', ' ')}
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span className="text-[8px] font-semibold text-gray-500">
                                                              👤 {vehicle.seatingCapacity} Seats
                                                            </span>
                                                          </div>
                                                        </div>
                                                      </button>
                                                    ))}

                                                  {/* Empty Search Results */}
                                                  {vehicles.filter(vh => {
                                                    const query = (searchQueries[`${bIdx}-${vIdx}`] || '').toLowerCase();
                                                    return (
                                                      (vh.vehicleName || '').toLowerCase().includes(query) ||
                                                      (vh.category || '').toLowerCase().includes(query)
                                                    );
                                                  }).length === 0 && (
                                                      <div className="text-center py-3 text-xs text-gray-400 font-medium italic">
                                                        No matching vehicles found.
                                                      </div>
                                                    )}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-span-2">
                                      <input type="number" min="1" value={v.quantity} onChange={e => updateVehicleInBundle(bIdx, vIdx, 'quantity', e.target.value)} placeholder="Qty" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-center outline-none" title="Quantity" />
                                    </div>
                                    <div className="col-span-2">
                                      <input type="number" value={v.includedHours} onChange={e => updateVehicleInBundle(bIdx, vIdx, 'includedHours', e.target.value)} placeholder="Hrs" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-center outline-none" title="Hours Included" />
                                    </div>
                                    <div className="col-span-2">
                                      <input type="number" value={v.includedKm} onChange={e => updateVehicleInBundle(bIdx, vIdx, 'includedKm', e.target.value)} placeholder="KM" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-center outline-none" title="KM Included" />
                                    </div>
                                    <div className="col-span-1 text-right">
                                      <button type="button" onClick={() => removeVehicleFromBundle(bIdx, vIdx)} className="text-gray-400 hover:text-red-500"><FiX /></button>
                                    </div>
                                  </div>
                                ))}
                                {bundle.vehicles.length === 0 && (
                                  <p className="text-[10px] text-gray-400 italic text-center py-2">No vehicles added to this bundle yet.</p>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-4 items-center">
                                <label className="flex items-center gap-2 text-xs font-black text-gray-900 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-xl cursor-pointer">
                                  <input type="checkbox" checked={bundle.isLuxury} onChange={e => updateBundle(bIdx, 'isLuxury', e.target.checked)} className="accent-yellow-600" /> Premium Luxury Badge 👑
                                </label>
                                <label className="flex items-center gap-2 text-xs font-black text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl cursor-pointer ml-auto">
                                  <input type="checkbox" checked={bundle.isPopular} onChange={e => updateBundle(bIdx, 'isPopular', e.target.checked)} className="accent-red-600" /> Mark as Popular 🔥
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                          <p className="text-gray-500 font-medium italic text-sm mb-2">Offer multiple vehicles as a unified Baraat package.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Multi-View Portfolio Uploads */}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                          <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> Step 3: High-Res Visual Showcase
                        </h3>
                        <p className="text-gray-500 text-xs italic mt-1">Upload high quality, clear pictures of the vehicle from multiple directions. Labeled slots below help optimize catalog renders.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                      {[
                        { type: 'front', label: 'Front View *' },
                        { type: 'back', label: 'Back View *' },
                        { type: 'side', label: 'Side View *' },
                        { type: 'interior', label: 'Interior View *' },
                        { type: 'decorated', label: 'Decorated Wedding' }
                      ].map((view) => {
                        const existingImg = formData.images?.find(img => img.viewType === view.type)
                        return (
                          <div key={view.type} className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 text-center">{view.label}</span>

                            {existingImg ? (
                              <div className="aspect-square rounded-3xl relative overflow-hidden group border border-gray-200 bg-gray-50 shadow-sm">
                                <img src={existingImg.url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" onClick={() => removeViewImage(view.type)} className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"><FiTrash2 size={16} /></button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => fileInputRefs[view.type].current.click()}
                                disabled={isUploading}
                                className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex flex-col items-center justify-center text-gray-400 p-4"
                              >
                                {uploadingField === view.type ? (
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-2" />
                                    <span className="text-[9px] font-black text-[#D4AF37]">{uploadProgress}%</span>
                                  </div>
                                ) : isUploading ? (
                                  <div className="w-8 h-8 border-2 border-gray-200 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <FiUpload size={24} />
                                    <span className="text-[8px] font-black uppercase mt-3">Upload View</span>
                                  </>
                                )}
                              </button>
                            )}

                            <input
                              type="file"
                              ref={fileInputRefs[view.type]}
                              className="hidden"
                              accept="image/*"
                              onChange={e => handleViewImageUpload(e, view.type)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Legal & Verification Documents */}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                        <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> Step 4: Verification Paperwork (RC & Licences)
                      </h3>
                      <p className="text-gray-500 text-xs italic mt-1">Upload valid legal documents to secure approved listing. These files are kept completely private and secure 🛡️</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[
                        { key: 'registrationCertificate', label: 'Registration Certificate (RC) *' },
                        { key: 'insuranceCertificate', label: 'Insurance Certificate *' },
                        { key: 'drivingLicense', label: 'Driver Commercial DL *' },
                        { key: 'pollutionCertificate', label: 'Pollution Certificate (PUC)' },
                        { key: 'ownerIdProof', label: 'Owner ID Proof (Aadhaar / PAN) *' }
                      ].map((doc) => {
                        const existingDoc = formData.documents?.[doc.key]
                        return (
                          <div key={doc.key} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col justify-between h-48 group">
                            <div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{doc.label}</span>
                              {existingDoc?.url ? (
                                <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border border-green-200 shadow-sm mt-2">
                                  <FiShield size={12} /> SECURED & UPLOADED
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-400 italic block mt-1">PDF or high-res JPG required</span>
                              )}
                            </div>

                            <div className="flex gap-3">
                              {existingDoc?.url ? (
                                <>
                                  <a href={existingDoc.url} target="_blank" rel="noreferrer" className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-[10px] uppercase text-center tracking-widest hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2">View File</a>
                                  <button type="button" onClick={() => removeDoc(doc.key)} className="w-12 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center border border-red-100"><FiTrash2 size={16} /></button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs[doc.key].current.click()}
                                  disabled={isUploading}
                                  className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37] text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                  {uploadingField === doc.key ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                                      <span>{uploadProgress}% Uploading...</span>
                                    </>
                                  ) : isUploading ? (
                                    <div className="w-4 h-4 border-2 border-gray-200 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <><FiUpload size={14} /> Upload Document</>
                                  )}
                                </button>
                              )}
                            </div>

                            <input
                              type="file"
                              ref={fileInputRefs[doc.key]}
                              className="hidden"
                              onChange={e => handleDocUpload(e, doc.key)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Driver Profile Details */}
                {step === 5 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                      <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> Step 5: Commercial Driver Credentials
                    </h3>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Driver Full Name *</label>
                        <input required type="text" value={formData.driverDetails.name} onChange={e => setFormData({ ...formData, driverDetails: { ...formData.driverDetails, name: e.target.value } })} placeholder="e.g. Satish Kumar" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all shadow-inner" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Driver Contact Number (WhatsApp Active) *</label>
                        <input required type="text" value={formData.driverDetails.phone} onChange={e => setFormData({ ...formData, driverDetails: { ...formData.driverDetails, phone: e.target.value } })} placeholder="e.g. +91 9988776655" className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all shadow-inner" />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Driving Experience (Years) *</label>
                        <input type="number" min="1" max="50" value={formData.driverDetails.experienceYears} onChange={e => setFormData({ ...formData, driverDetails: { ...formData.driverDetails, experienceYears: Number(e.target.value) } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all" />
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-3xl">
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Uniform Compliance</span>
                          <span className="text-xs font-bold text-gray-900">Driver wears formal dress/suit</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.driverDetails.uniformAvailable}
                          onChange={e => setFormData({ ...formData, driverDetails: { ...formData.driverDetails, uniformAvailable: e.target.checked } })}
                          className="w-5 h-5 accent-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6: Availability & Logistics coverage */}
                {step === 6 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                      <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> Step 6: Coverage Area & Availability Rules
                    </h3>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Base Operations City *</label>
                        <select value={formData.location.city} onChange={e => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-xs uppercase tracking-widest text-gray-900 outline-none transition-all shadow-inner">
                          {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Base State *</label>
                        <input type="text" value={formData.location.state} onChange={e => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })} className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none transition-all" />
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-3xl">
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Outstation Bookings</span>
                          <span className="text-xs font-bold text-gray-900">Allow inter-city outstation booking travel</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.outstationAvailable}
                          onChange={e => setFormData({ ...formData, outstationAvailable: e.target.checked })}
                          className="w-5 h-5 accent-[#D4AF37]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-3xl">
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chauffeur Included</span>
                          <span className="text-xs font-bold text-gray-900">Driver included in base booking charge</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.driverIncluded}
                          onChange={e => setFormData({ ...formData, driverIncluded: e.target.checked })}
                          className="w-5 h-5 accent-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 mt-6">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Operations Schedule (Active Days)</span>
                      <div className="flex flex-wrap gap-3">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                          const isActive = formData.availableDates?.includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleWeekday(day)}
                              className={`px-5 py-3 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${isActive ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-500 border-gray-100 hover:border-[#D4AF37]'
                                }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-3 block italic leading-relaxed">Toggled active days are displayed as available for client wedding bookings.</span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 7: Wedding Specific Premium Toggles */}
                {step === 7 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                      <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> Step 7: Elite Wedding Addon Amenity Checklist
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        { key: 'flowerDecoration', label: 'Premium Flower Decoration', desc: 'Decorated using fresh marigolds, roses, and custom florals' },
                        { key: 'ribbonDecoration', label: 'Elegance Ribbon Decoration', desc: 'Ribbons, balloons, and subtle wedding stickers wrap' },
                        { key: 'groomEntrySetup', label: 'Groom Entry Spotlight Setup', desc: 'Special sunroof flags or entry features' },
                        { key: 'baraatSoundSupport', label: 'Baraat Sound Support', desc: 'In-car auxiliary mic/speakers for heavy outdoor sound support' }
                      ].map((service) => {
                        const isSelected = formData.additionalServices?.[service.key]
                        return (
                          <button
                            key={service.key}
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              additionalServices: {
                                ...formData.additionalServices,
                                [service.key]: !isSelected
                              }
                            })}
                            className={`p-6 rounded-[2rem] border-2 text-left transition-all flex flex-col justify-between ${isSelected ? 'border-[#D4AF37] bg-[#FFF8F0]/30 shadow-premium' : 'border-gray-50 bg-gray-50'
                              }`}
                          >
                            <div className="flex items-center justify-between w-full mb-3">
                              <span className="text-xs font-black uppercase tracking-wider text-gray-900">{service.label}</span>
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37] text-white' : 'border-gray-200 bg-white'
                                }`}>
                                {isSelected && <FiCheck size={12} />}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-semibold italic">{service.desc}</p>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {/* STEP 8: Preview, Confirm and Submit */}
                {step === 8 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <h3 className="font-display text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 italic">
                        <span className="w-2 h-6 bg-[#D4AF37] rounded-full" /> Step 8: Registry Authorization Check
                      </h3>
                      <p className="text-gray-500 text-xs italic mt-1">Review the consolidated parameters of your fleet vehicle before submitting to moderation.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                      {/* Left: Summary Grid */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 grid grid-cols-2 gap-6">
                          <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Vehicle Name</span>
                            <span className="font-black text-sm text-gray-900 truncate block">{formData.name}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Plate Number</span>
                            <span className="font-black text-sm text-gray-900 uppercase block">{formData.vehicleNumber}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base Price</span>
                            <span className="font-black text-sm text-[#C2185B] block">{formatPrice(formData.price || formData.pricing?.baseFare)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Location</span>
                            <span className="font-black text-sm text-gray-900 block">{formData.location.city}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Driver Assigned</span>
                            <span className="font-black text-sm text-gray-900 block">{formData.driverDetails.name || 'Not assigned'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Uniform compliance</span>
                            <span className="font-black text-sm text-gray-900 block">{formData.driverDetails.uniformAvailable ? 'YES' : 'NO'}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 bg-[#FFF8F0]/30 border border-[#D4AF37]/20 rounded-3xl">
                          <input
                            required
                            type="checkbox"
                            checked={agreeChecked}
                            onChange={e => setAgreeChecked(e.target.checked)}
                            id="agreeCheck"
                            className="mt-1 w-5 h-5 accent-[#D4AF37] flex-shrink-0 cursor-pointer"
                          />
                          <label htmlFor="agreeCheck" className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-wider cursor-pointer">
                            I solemnly declare that all registration details, insurance coverages, and chauffeur DL qualifications are correct and completely comply with the Indian Motor Vehicles Act.
                          </label>
                        </div>
                      </div>

                      {/* Right: Checklist Indicators */}
                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Onboarding Completion</h4>
                          <ul className="space-y-3">
                            <li className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span>Specs Completed</span>
                              {formData.name && formData.vehicleNumber ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />}
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span>Photos (Min 4)</span>
                              {formData.images.filter(i => ['front', 'back', 'side', 'interior'].includes(i.viewType)).length >= 4 ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />}
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span>Legal Documents</span>
                              {formData.documents.registrationCertificate?.url && formData.documents.insuranceCertificate?.url && formData.documents.drivingLicense?.url && formData.documents.ownerIdProof?.url ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />}
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span>Chauffeur Bio</span>
                              {formData.driverDetails.name && formData.driverDetails.phone ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Wizard Footer Controls */}
              <div className="p-6 md:p-10 border-t border-gray-100 flex flex-col sm:flex-row gap-6 items-center justify-between bg-gray-50/50 w-full">
                <div className="flex gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(prev => prev - 1)}
                      className="flex-1 sm:flex-initial bg-white border border-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiChevronLeft size={16} /> Back
                    </button>
                  )}
                  {step < 8 && (
                    <button
                      type="button"
                      onClick={() => setStep(prev => prev + 1)}
                      className="flex-1 sm:flex-initial bg-gray-900 hover:bg-black text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      Next <FiChevronRight size={16} />
                    </button>
                  )}
                </div>

                <div className="flex gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    type="button"
                    onClick={e => handleSubmit(e, 'draft')}
                    className="flex-1 sm:flex-initial bg-white border border-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Save Draft
                  </button>

                  {step === 8 && (
                    <button
                      type="button"
                      onClick={e => handleSubmit(e, 'pending')}
                      disabled={!agreeChecked}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white py-4 px-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all text-center"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
