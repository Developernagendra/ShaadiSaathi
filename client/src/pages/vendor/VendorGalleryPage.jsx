import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { uploadVendorImages, updateVendorProfile } from '../../store/slices/vendorSlice'
import { FiImage, FiPlus, FiX, FiUpload, FiCheck } from 'react-icons/fi'
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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-gray-900">Portfolio & Media</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your visual showcase to attract more clients.</p>
        </div>
        <div className="flex gap-4">
          <label className={`btn-outline flex items-center gap-2 cursor-pointer py-3 px-6 rounded-2xl ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Add Video'}
            <input type="file" accept="video/mp4" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />
          </label>
          <label className={`btn-primary flex items-center gap-2 cursor-pointer py-3 px-8 rounded-2xl ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <FiPlus size={20} /> {uploading ? 'Uploading...' : 'Upload Photos'}
            <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {vendor?.images?.map((img, i) => (
          <div key={img.publicId || i} className="group relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-sm border border-gray-100 bg-white">
            <img src={img.url} alt="Work" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
              <button 
                onClick={() => handleRemoveFile(img._id, 'image')}
                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
              >
                <FiX size={18} />
              </button>
            </div>
            {i === 0 && (
              <span className="absolute top-4 left-4 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                FEATURED
              </span>
            )}
          </div>
        ))}

        <label className="aspect-[4/5] rounded-[32px] border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-gray-400 hover:text-primary-600 group">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
            <FiPlus size={28} />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Add New</span>
          <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
        </label>
      </div>

      {/* Video Preview Section if exists */}
      {vendor?.video?.url && (
        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">🎬</span>
            Business Video
          </h2>
          <div className="max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative group">
            <video src={vendor.video.url} controls className="w-full h-full object-cover" />
            <button 
              onClick={() => handleRemoveFile('video', 'video')} 
              className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Helpful Tips */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">💡 Tips for Photos</h3>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li className="flex items-start gap-2"><FiCheck className="text-green-400 mt-1" /> Use high-resolution images (min 1080p).</li>
            <li className="flex items-start gap-2"><FiCheck className="text-green-400 mt-1" /> Showcase diverse work from different events.</li>
            <li className="flex items-start gap-2"><FiCheck className="text-green-400 mt-1" /> The first photo is your cover—make it count!</li>
          </ul>
        </div>
        <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100">
          <h3 className="text-xl font-bold text-primary-900 mb-3 flex items-center gap-2">🎥 Why Video?</h3>
          <p className="text-primary-700 text-sm leading-relaxed">
            Profiles with videos see a 60% higher engagement rate. A 30-second walkthrough or a montage of your best work builds immediate trust with couples.
          </p>
        </div>
      </div>
    </div>
  )
}
