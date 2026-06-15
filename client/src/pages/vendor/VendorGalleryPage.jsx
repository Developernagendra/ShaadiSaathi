import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { uploadVendorImages, updateVendorProfile } from '../../store/slices/vendorSlice'
import { FiPlus, FiX, FiUpload, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast'
import api from '../../utils/api'

export default function VendorGalleryPage() {
  const dispatch = useDispatch()
  const { myVendorProfile: vendor } = useSelector(s => s.vendor)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e, type = 'image') => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    const formData = new FormData()
    if (type === 'image') {
      files.forEach(file => formData.append('images', file))
    } else {
      formData.append('video', files[0])
    }

    setUploading(true)
    try {
      if (type === 'image') {
        await dispatch(uploadVendorImages(formData)).unwrap()
        toast.success('Images uploaded successfully!')
      } else {
        const res = await api.post('/vendors/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        dispatch(updateVendorProfile(res.data.vendor)) // Update local profile state
        toast.success('Video uploaded successfully!')
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.response?.data?.message || 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = async (id, type = 'image') => {
    if (!confirm('Are you sure you want to delete this?')) return
    try {
      if (type === 'image') {
        await api.delete(`/vendors/images/${id}`)
        toast.success('Image removed')
      } else {
        await api.delete('/vendors/video')
        toast.success('Video removed')
      }
      // Re-fetch profile to sync state
      await dispatch(updateVendorProfile({})) // Trigger a state refresh or manually update
      window.location.reload() // Quick fix for state sync
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className="pb-24 animate-fade-in relative max-w-7xl mx-auto px-4 md:px-8 pt-8">
      <div className="absolute inset-0 floral-pattern opacity-[0.02] pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
        <div>
          <div className="divider-luxe !justify-start mb-3 !gap-3">
            <div className="divider-line !bg-[#C2185B]/30 !w-8" />
            <span className="text-[#C2185B] text-[10px] font-black uppercase tracking-[0.4em] italic">Visual Identity</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Portfolio & Media</h1>
          <p className="text-gray-500 font-medium italic mt-2">Manage your visual showcase to attract high-end clients.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className={`bg-white/80 backdrop-blur-md border border-white shadow-sm hover:shadow-md text-gray-600 flex items-center gap-2 cursor-pointer py-4 px-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <FiUpload size={14} /> {uploading ? 'Uploading...' : 'Add Video'}
            <input type="file" accept="video/mp4" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />
          </label>
          <label className={`bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] text-white shadow-premium flex items-center gap-2 cursor-pointer py-4 px-8 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:shadow-xl ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <FiPlus size={16} /> {uploading ? 'Uploading...' : 'Upload Photos'}
            <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
          </label>
        </div>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6 relative z-10">
        <label className="block w-full aspect-square rounded-[3rem] border-2 border-dashed border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#FDFBF7] transition-all cursor-pointer text-gray-400 hover:text-[#D4AF37] group relative overflow-hidden shadow-sm hover:shadow-md mb-6 break-inside-avoid bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] transition-all shadow-sm">
            <FiPlus size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add New</span>
          <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
        </label>

        {vendor?.images?.map((img, i) => (
          <div key={img.publicId || i} className="group relative rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl border border-white bg-white break-inside-avoid mb-6 transition-all duration-500 hover:-translate-y-1">
            <img src={img.url} alt="Work" className="w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => handleRemoveFile(img._id, 'image')}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-[1rem] text-white hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
            {i === 0 && (
              <span className="absolute top-6 left-6 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] text-black text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-lg">
                Featured Cover
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Video Preview Section if exists */}
      {vendor?.video?.url && (
        <div className="mt-16 relative z-10">
          <h2 className="font-display text-2xl md:text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
            <span className="w-12 h-12 rounded-[1.2rem] bg-indigo-50/80 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm backdrop-blur-md">🎬</span>
            Business Showcase Video
          </h2>
          <div className="max-w-4xl aspect-video rounded-[3rem] overflow-hidden shadow-premium border-8 border-white relative group bg-black">
            <video src={vendor.video.url} controls className="w-full h-full object-contain" />
            <button 
              onClick={() => handleRemoveFile('video', 'video')} 
              className="absolute top-6 right-6 w-12 h-12 bg-black/40 backdrop-blur-md rounded-[1.2rem] text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Helpful Tips */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-[2.5rem] p-10 text-white shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-full blur-3xl pointer-events-none" />
          <h3 className="font-display text-2xl font-black mb-6 flex items-center gap-3"><span className="text-[#D4AF37]">💡</span> Curation Guidelines</h3>
          <ul className="space-y-4 text-gray-400 text-sm font-medium">
            <li className="flex items-start gap-3"><span className="p-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full mt-0.5"><FiCheck size={12} /></span> Use high-resolution images (min 1080p).</li>
            <li className="flex items-start gap-3"><span className="p-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full mt-0.5"><FiCheck size={12} /></span> Showcase diverse work from different events.</li>
            <li className="flex items-start gap-3"><span className="p-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full mt-0.5"><FiCheck size={12} /></span> The first photo is your cover—make it count!</li>
          </ul>
        </div>
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#C2185B]/10 to-transparent rounded-bl-full blur-3xl pointer-events-none" />
          <h3 className="font-display text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">🎥 Power of Video</h3>
          <p className="text-gray-500 font-medium leading-relaxed italic">
            Profiles with videos see a 60% higher engagement rate. A 30-second walkthrough or a montage of your best work builds immediate trust with couples.
          </p>
        </div>
      </div>
    </div>
  )
}
