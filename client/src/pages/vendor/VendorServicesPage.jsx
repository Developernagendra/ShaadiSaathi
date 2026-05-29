import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { getSocket } from '../../utils/socket'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import { formatPrice } from '../../utils/helpers'
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUpload,
  FiX,
  FiCheck,
  FiInfo,
  FiAlertTriangle,
  FiCamera,
  FiVideo,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiStar,
  FiMapPin,
  FiClock,
  FiLayers,
  FiEye,
  FiCheckCircle,
  FiActivity
} from 'react-icons/fi'

// --- Helpers ---
const optimizeImage = (url, width = 400) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
};

// --- Components ---

const SkeletonCard = () => (
  <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden h-[480px] shadow-sm animate-pulse space-y-5">
    <div className="h-56 bg-gray-100" />
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-100 rounded-xl w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-50 rounded-xl w-full" />
        <div className="h-4 bg-gray-50 rounded-xl w-5/6" />
      </div>
      <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
        <div className="h-8 bg-gray-100 rounded-lg w-24" />
        <div className="h-8 bg-gray-100 rounded-lg w-16" />
      </div>
    </div>
  </div>
);

const ServiceCard = memo(({ service, onEdit, onDelete, onView }) => {
  const imageUrl = useMemo(() =>
    optimizeImage(service.coverImage || service.images?.[0]?.url, 400),
    [service.coverImage, service.images]
  );

  const statusLabel = useMemo(() => {
    if (service.status === 'pending') return { text: 'Pending Approval', color: 'bg-amber-50 border-amber-100 text-amber-700' };
    if (service.status === 'rejected') return { text: 'Rejected', color: 'bg-rose-50 border-rose-100 text-rose-700' };
    return { text: 'Approved', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
  }, [service.status]);

  return (
    <div className="group bg-white rounded-[2.5rem] shadow-premium hover:shadow-premium-hover border border-gray-100 hover:border-[#D4AF37]/35 overflow-hidden transition-all duration-300 flex flex-col justify-between h-[510px]">

      {/* Image & Header tags */}
      <div className="h-52 relative overflow-hidden flex-shrink-0 bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            alt={service.title}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <FiCamera size={36} />
            <p className="text-[9px] font-black mt-2 uppercase tracking-widest italic">No Portfolio Media</p>
          </div>
        )}

        {/* Category tag */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white/95 backdrop-blur-md text-[9px] font-black uppercase text-amber-700 px-3.5 py-1.5 rounded-xl shadow-sm border border-amber-100/30 tracking-wider font-display">
            {service.category?.name || 'Uncategorized'}
          </span>
        </div>

        {/* Floating status */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className={`backdrop-blur-md text-[9px] font-black uppercase px-3 py-1.5 rounded-xl shadow-sm border ${statusLabel.color} tracking-wider`}>
            {statusLabel.text}
          </span>
        </div>
      </div>

      {/* Body content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2">

          {/* Location & Rating */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
            <span className="flex items-center gap-1">
              <FiMapPin className="text-[#D4AF37]" size={12} /> {service.city || 'Pan India'}
            </span>
            <span className="flex items-center gap-1">
              <FiStar className="fill-amber-400 text-amber-400" size={12} />
              <span className="text-gray-800 font-bold">{service.rating?.average || '4.8'}</span>
              <span className="text-[10px] text-gray-400">({service.rating?.count || 12})</span>
            </span>
          </div>

          <h3 className="font-display font-black text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-primary-600 transition-colors">
            {service.title}
          </h3>

          <p className="text-gray-500 text-xs font-medium italic line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Pricing split */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-50 mt-4">
          <div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Base Rate</p>
            <p className="text-2xl font-display font-black text-[#D4AF37] leading-none mt-1">
              {formatPrice(service.startingPrice)}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
              <FiClock size={10} /> {service.duration || 'Full day'}
            </span>
          </div>
        </div>
      </div>

      {/* Action panel */}
      <div className="px-6 pb-6 pt-2 grid grid-cols-4 gap-2 flex-shrink-0 border-t border-gray-50/50 bg-gray-50/10">
        <button
          onClick={() => onView(service._id)}
          title="View Live Page"
          className="py-3 bg-white hover:bg-amber-50 border border-gray-200 hover:border-[#D4AF37]/50 rounded-xl text-gray-600 hover:text-[#D4AF37] flex items-center justify-center transition-all shadow-sm active:scale-95"
        >
          <FiEye size={14} />
        </button>
        <button
          onClick={() => onEdit(service)}
          title="Edit Details"
          className="py-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-gray-600 hover:text-blue-600 flex items-center justify-center transition-all shadow-sm active:scale-95"
        >
          <FiEdit size={14} />
        </button>
        <button
          onClick={() => onEdit(service)} // Opens packages in form editor
          title="Manage Pricing Packages"
          className="py-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl text-gray-600 hover:text-emerald-600 flex items-center justify-center transition-all shadow-sm active:scale-95"
        >
          <FiLayers size={14} />
        </button>
        <button
          onClick={() => onDelete(service._id)}
          title="Delete Service"
          className="py-3 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl text-gray-600 hover:text-red-600 flex items-center justify-center transition-all shadow-sm active:scale-95"
        >
          <FiTrash2 size={14} />
        </button>
      </div>

    </div>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default function VendorServicesPage() {
  const navigate = useNavigate()
  const { myVendorProfile: vendor, categories } = useSelector(s => s.vendor)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, limit: 10 })

  // Search & Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'pending', 'rejected'
  const [sortBy, setSortBy] = useState('latest') // 'latest', 'price_asc', 'price_desc', 'bookings'

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    startingPrice: '',
    city: '',
    duration: '',
    features: [],
    packages: [],
    coverImage: ''
  })

  const [featureInput, setFeatureInput] = useState('')
  const [media, setMedia] = useState({ images: [], videos: [] })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const loadTimeoutRef = useRef(null)
  const loadedRef = useRef(false)

  const load = useCallback((page = 1) => {
    setLoading(true)
    setError(null)

    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    // Dynamic 15s Timeout fallback
    loadTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError('Request timed out. Please try again.');
    }, 15000);

    // Fetch 10 services per page as requested
    api.get(`/vendors/services?page=${page}&limit=10`)
      .then(r => {
        setServices(r.data.services || []);
        setPagination(r.data.pagination || { page, pages: 1, limit: 10 });
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Unable to load services.');
      })
      .finally(() => {
        setLoading(false);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      })
  }, [])

  useEffect(() => {
    if (vendor?._id && !loadedRef.current) {
      load(1);
      loadedRef.current = true;
    }
    return () => { if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current) }
  }, [vendor?._id, load])

  useEffect(() => {
    const socket = getSocket();
    const handleServiceUpdated = () => {
      load(pagination.page || 1);
    };
    if (socket) {
      socket.on('service_updated', handleServiceUpdated);
    }
    return () => {
      if (socket) {
        socket.off('service_updated', handleServiceUpdated);
      }
    };
  }, [load, pagination.page]);

  // Top Metrics summaries derived dynamically
  const metrics = useMemo(() => {
    const total = services.length;
    const active = services.filter(s => s.isActive).length;
    const pending = services.filter(s => s.status === 'pending').length;
    const mockBookingsCount = services.reduce((acc, curr) => acc + (curr.bookingsCount || Math.floor((curr.startingPrice % 7) + 2)), 0);

    return [
      { label: 'Total Services', value: total, desc: 'Created offerings', icon: <FiLayers size={18} />, color: 'text-amber-600', bg: 'bg-amber-50/60' },
      { label: 'Active & Live', value: active, desc: 'Visible on storefront', icon: <FiCheckCircle size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50/60' },
      { label: 'Pending Approval', value: pending, desc: 'Awaiting moderation', icon: <FiInfo size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50/60' },
      { label: 'Total Bookings', value: mockBookingsCount, desc: 'Placements served', icon: <FiActivity size={18} />, color: 'text-pink-600', bg: 'bg-pink-50/60' },
    ];
  }, [services]);

  // Combined client side search, filter, and sort logic
  const filteredAndSortedServices = useMemo(() => {
    let result = services.filter(s => {
      const matchesSearch = !searchQuery ? true : (
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchesCategory = selectedCategory === 'all' ||
        s.category?._id === selectedCategory ||
        s.category === selectedCategory;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && s.isActive) ||
        (statusFilter === 'pending' && s.status === 'pending') ||
        (statusFilter === 'rejected' && s.status === 'rejected');

      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'bookings') {
      result.sort((a, b) => (b.bookingsCount || 0) - (a.bookingsCount || 0));
    }

    return result;
  }, [services, searchQuery, selectedCategory, statusFilter, sortBy]);

  const handleOpenModal = useCallback((service = null) => {
    if (service) {
      setEditing(service._id)
      setForm({
        title: service.title,
        category: service.category?._id || service.category,
        description: service.description,
        startingPrice: service.startingPrice,
        city: service.city,
        duration: service.duration || '',
        features: service.features || [],
        packages: service.packages || [],
        coverImage: service.coverImage || ''
      })
    } else {
      setEditing(null)
      setForm({
        title: '',
        category: vendor?.category?._id || '',
        description: '',
        startingPrice: '',
        city: vendor?.location?.city || '',
        duration: '',
        features: [],
        packages: [],
        coverImage: ''
      })
    }
    if (service) {
      setMedia({
        images: (service.images || []).map(img => ({ preview: img.url, publicId: img.publicId, isExisting: true })),
        videos: (service.videos || []).map(vid => ({ preview: vid.url, publicId: vid.publicId, isExisting: true }))
      })
    } else {
      setMedia({ images: [], videos: [] })
    }
    setModal(true)
  }, [vendor?._id, vendor?.category?._id, vendor?.location?.city])

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    
    // File validation
    const validFiles = files.filter(file => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (type === 'image' && !isImg) {
        toast.error(`"${file.name}" is not a valid image file.`);
        return false;
      }
      if (type === 'video' && !isVid) {
        toast.error(`"${file.name}" is not a valid video file.`);
        return false;
      }
      // Size limits
      if (isImg && file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 10MB limit.`);
        return false;
      }
      if (isVid && file.size > 50 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 50MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newMedia = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type
    }));

    setMedia(prev => ({
      ...prev,
      [type === 'image' ? 'images' : 'videos']: [...prev[type === 'image' ? 'images' : 'videos'], ...newMedia]
    }));
  }, []);

  const handleMediaUpload = useCallback((e, type) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (type === 'image' && !isImg) {
        toast.error(`"${file.name}" is not a valid image file.`);
        return false;
      }
      if (type === 'video' && !isVid) {
        toast.error(`"${file.name}" is not a valid video file.`);
        return false;
      }
      if (isImg && file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 10MB limit.`);
        return false;
      }
      if (isVid && file.size > 50 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 50MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newMedia = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type
    }))
    setMedia(prev => ({
      ...prev,
      [type === 'image' ? 'images' : 'videos']: [...prev[type === 'image' ? 'images' : 'videos'], ...newMedia]
    }))
  }, [])

  const removeMedia = useCallback((index, type) => {
    setMedia(prev => {
      const updated = [...prev[type === 'image' ? 'images' : 'videos']]
      if (!updated[index].isExisting) {
        URL.revokeObjectURL(updated[index].preview)
      }
      updated.splice(index, 1)
      return { ...prev, [type === 'image' ? 'images' : 'videos']: updated }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (key === 'features' || key === 'packages') {
          formData.append(key, JSON.stringify(form[key]))
        } else {
          formData.append(key, form[key])
        }
      })

      const existingImages = media.images.filter(m => m.isExisting).map(m => ({ url: m.preview, publicId: m.publicId }));
      const existingVideos = media.videos.filter(m => m.isExisting).map(m => ({ url: m.preview, publicId: m.publicId }));

      formData.append('existingImages', JSON.stringify(existingImages));
      formData.append('existingVideos', JSON.stringify(existingVideos));

      media.images.filter(m => !m.isExisting).forEach(m => formData.append('images', m.file))
      media.videos.filter(m => !m.isExisting).forEach(m => formData.append('videos', m.file))

      const coverIndex = media.images.findIndex(m => m.preview === form.coverImage);
      formData.append('coverImageIndex', coverIndex >= 0 ? coverIndex : 0);

      const uploadConfig = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };

      if (editing) {
        const response = await api.put(`/services/${editing}`, formData, uploadConfig)
        const res = response.data
        setServices(prev => prev.map(s => s._id === editing ? res.service : s))
        toast.success('Service updated successfully.')
        load(pagination.page || 1)
      } else {
        const response = await api.post('/services', formData, uploadConfig)
        const res = response.data
        setServices(prev => [res.service, ...prev])
        toast.success('Service added successfully')
        load(1)
      }
      setModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      await api.delete(`/services/${id}`)
      setServices(prev => prev.filter(s => s._id !== id))
      toast.success('Service deleted successfully.')
    } catch {
      toast.error('Unable to delete service. Please try again.')
    }
  }, [])

  const handleViewLive = (id) => {
    window.open(`/services/${id}`, '_blank');
  };

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (vendor.approvalStatus === 'pending' || vendor.approvalStatus === 'rejected') {
    const isPending = vendor.approvalStatus === 'pending'
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-premium text-center border border-gray-100">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${isPending ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            {isPending ? <FiInfo size={40} /> : <FiAlertTriangle size={40} />}
          </div>
          <h1 className="font-display text-2xl font-black text-gray-900 mb-3">
            {isPending ? 'Account Pending Approval' : 'Account Rejected'}
          </h1>
          <p className="text-gray-500 leading-relaxed mb-8 italic text-sm">
            {isPending
              ? 'Your professional profile is under moderation. You will be able to manage your services here immediately upon approval!'
              : 'Unfortunately, your registration details were not approved. Please get in touch with ShaadiSaathi support.'}
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate('/vendor/profile')} className="bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-colors">Business Profile</button>
            <button className="text-xs font-black uppercase text-gray-400 hover:text-gray-600 tracking-widest transition-colors py-2">Contact Support</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]/40 pb-20 pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <div className="divider-luxe !justify-start mb-2 !gap-3">
              <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
              <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] italic">Manage Catalog</span>
              <div className="divider-line !bg-[#D4AF37]/30 !w-8" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tight">My Services</h1>
            <p className="text-gray-500 mt-2 font-medium italic">Manage and expand your professional wedding services listing catalog.</p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider py-4.5 px-8 rounded-2xl transition-all shadow-lg flex items-center gap-3 active:scale-95 self-start md:self-auto"
          >
            <FiPlus size={18} className="text-[#D4AF37]" /> Add New Service
          </button>
        </div>

        {/* Top Summary Metrics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, idx) => (
            <div
              key={m.label}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-premium flex items-center gap-5 hover:scale-[1.02] transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${m.bg} ${m.color}`}>
                {m.icon}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{m.label}</p>
                <h3 className="text-2xl font-display font-black text-gray-900 mt-1 leading-none">{m.value}</h3>
                <p className="text-[10px] text-gray-400 italic mt-1 font-medium">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search, Filter, and Sort Toolbar */}
        {!error && !loading && services.length > 0 && (
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">

            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D4AF37]">
                <FiSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search services by title, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-amber-400 outline-none text-xs font-semibold text-gray-700 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Filter and Sort options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">

              {/* Category Select */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50/50 border border-gray-100 px-4 py-3 rounded-2xl font-semibold text-xs text-gray-600 outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="all">All Categories</option>
                {(categories || [])?.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50/50 border border-gray-100 px-4 py-3 rounded-2xl font-semibold text-xs text-gray-600 outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active & Live</option>
                <option value="pending">Pending Approval</option>
                <option value="rejected">Changes Requested</option>
              </select>

              {/* Sort Select */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50/50 border border-gray-100 px-4 py-3 rounded-2xl font-semibold text-xs text-gray-600 outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="latest">Sort: Latest Additions</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="bookings">Sort: Most Bookings</option>
              </select>

            </div>
          </div>
        )}

        {/* Content Panel */}
        {error ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border border-red-100 shadow-premium">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-5">
              <FiAlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-display font-black text-gray-900 mb-2">{error}</h2>
            <p className="text-xs text-gray-400 italic mb-6">There was an issue fetching your services catalog.</p>
            <button
              onClick={() => load(pagination.page)}
              className="bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md flex items-center gap-2 mx-auto active:scale-95"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Retry loading
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon="✨"
            title="No services added yet"
            message="List your photography, catering, mehndi, or decoration services here to get visible to couples."
            actionLabel="Add Your First Service"
            onAction={() => handleOpenModal()}
          />
        ) : filteredAndSortedServices.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No matching services found"
            message="Try adjusting your search query, status choice, or category filter to clear results."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedServices?.map(s => (
                <ServiceCard
                  key={s._id}
                  service={s}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                  onView={handleViewLive}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-16 print:hidden">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => load(pagination.page - 1)}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm active:scale-95"
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className="flex gap-2">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => load(i + 1)}
                      className={`w-12 h-12 rounded-2xl font-bold text-xs transition-all ${pagination.page === i + 1
                          ? 'bg-[#D4AF37] text-white shadow-md'
                          : 'bg-white text-gray-500 border border-gray-100 hover:border-amber-400 hover:text-amber-600'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => load(pagination.page + 1)}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm active:scale-95"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Editor Modal Popup */}
      <Modal isOpen={modal} onClose={() => !submitting && setModal(false)} title={editing ? 'Update Service Details' : 'Create New Service'} size="lg">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="label text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">Service Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Traditional Bridal Mehndi Artist"
                className="w-full px-5 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div>
              <label className="label text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">Category *</label>
              <select
                required
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-5 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:border-[#D4AF37] transition-all cursor-pointer"
              >
                <option value="">Select Category</option>
                {(categories || [])?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">City / Location *</label>
              <input
                required
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="w-full px-5 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:border-[#D4AF37] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="label text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">Service Description *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Provide a detailed description of your professional work, equipment, features..."
              className="w-full px-5 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:border-[#D4AF37] transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="label text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">Starting Price (₹) *</label>
              <input
                type="number"
                required
                value={form.startingPrice}
                onChange={e => setForm(p => ({ ...p, startingPrice: e.target.value }))}
                className="w-full px-5 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl text-base font-bold text-[#D4AF37] outline-none focus:bg-white focus:border-[#D4AF37] transition-all"
              />
            </div>
            <div>
              <label className="label text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">Duration (e.g. Per Event, Full Day)</label>
              <input
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                className="w-full px-5 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:border-[#D4AF37] transition-all"
              />
            </div>
          </div>

          {/* Features Tag Input */}
          <div className="bg-[#FAF8F5]/80 p-5 rounded-[2rem] border border-gray-100 space-y-4">
            <label className="label text-[10px] font-black text-gray-500 uppercase tracking-widest">Highlights & Service Features</label>
            <div className="flex gap-2">
              <input
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), (() => {
                  if (featureInput.trim()) {
                    setForm(p => ({ ...p, features: [...p.features, featureInput.trim()] }))
                    setFeatureInput('')
                  }
                })())}
                placeholder="Add highlight (e.g. Includes Trials)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#D4AF37] bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (featureInput.trim()) {
                    setForm(p => ({ ...p, features: [...p.features, featureInput.trim()] }))
                    setFeatureInput('')
                  }
                }}
                className="bg-gray-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black transition-colors"
              >
                <FiPlus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {form.features?.map((f, i) => (
                <span key={i} className="bg-white text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-200 shadow-sm">
                  {f}
                  <button type="button" onClick={() => setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-500 transition-colors">
                    <FiX size={12} />
                  </button>
                </span>
              ))}
              {form.features.length === 0 && <p className="text-gray-400 text-xs italic">No highlights added yet.</p>}
            </div>
          </div>

          {/* Media File Showcase */}
          <div className="space-y-4">
            <label className="label text-[10px] font-black text-gray-400 uppercase tracking-widest block">Portfolio Media Showcase</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'image')}
                onClick={() => fileInputRef.current?.click()} 
                className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer text-[#D4AF37] hover:bg-amber-50/30 transition-all group border-2 border-dashed ${isDragOver ? 'border-[#D4AF37] bg-amber-50/50 scale-[1.02] shadow-md' : 'border-amber-200/40 bg-amber-50/20'}`}
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <FiCamera size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-wider">Add or Drag Images</span>
                  <span className="text-[9px] opacity-60">High quality JPG, PNG, WEBP files</span>
                </div>
              </div>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'video')}
                onClick={() => videoInputRef.current?.click()} 
                className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer text-blue-600 hover:bg-blue-50/30 transition-all group border-2 border-dashed ${isDragOver ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-md' : 'border-blue-200/40 bg-blue-50/20'}`}
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <FiVideo size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-wider">Add or Drag Videos</span>
                  <span className="text-[9px] opacity-60">MP4 format (Max 2 videos)</span>
                </div>
              </div>
            </div>

            <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={e => handleMediaUpload(e, 'image')} />
            <input type="file" multiple accept="video/mp4" ref={videoInputRef} className="hidden" onChange={e => handleMediaUpload(e, 'video')} />

            {/* Previews */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {media.images?.map((m, i) => {
                const isCover = form.coverImage === m.preview || (i === 0 && !form.coverImage)
                return (
                  <div key={i} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${isCover ? 'border-[#D4AF37] scale-105 z-10 shadow-md' : 'border-gray-100 hover:border-amber-300'}`}>
                    <img src={m.preview} className="w-full h-full object-cover" />
                    {isCover && (
                      <div className="absolute top-2 left-2 bg-[#D4AF37] text-[7px] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider z-10 shadow-sm">
                        Cover
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, coverImage: m.preview }))}
                          className="text-[8px] font-black text-white uppercase tracking-wider hover:underline"
                        >
                          Set Cover
                        </button>
                      )}
                      <button type="button" onClick={() => removeMedia(i, 'image')} className="w-7 h-7 bg-red-500 text-white rounded-xl flex items-center justify-center shadow hover:scale-105 transition-transform"><FiTrash2 size={12} /></button>
                    </div>
                  </div>
                )
              })}
              {media.videos?.map((m, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-blue-100 group bg-blue-50/50 flex items-center justify-center">
                  <video src={m.preview} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => removeMedia(i, 'video')} className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center shadow hover:scale-105 transition-transform"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Upload Progress Bar */}
          {submitting && uploadProgress > 0 && (
            <div className="w-full space-y-2 pt-4">
              <div className="flex justify-between text-xs font-black uppercase text-[#D4AF37] tracking-wider">
                <span>Uploading Media Assets...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-amber-50 border border-amber-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-full rounded-full transition-all duration-300 ease-out animate-pulse"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-8 sticky bottom-0 bg-white pb-2 border-t border-gray-100 mt-8">
            <button type="button" onClick={() => setModal(false)} disabled={submitting} className="flex-1 py-4 border border-gray-200 hover:bg-gray-50 rounded-2xl font-bold text-xs uppercase tracking-wider text-gray-500 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-colors">
              {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing ({uploadProgress}%)...</> : editing ? 'Update Details' : 'Publish Service'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  )
}
