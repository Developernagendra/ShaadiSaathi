import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import { fetchMyVendorProfile, updateVendorProfile, uploadVendorCoverImage } from '../../store/slices/vendorSlice'
import { INDIAN_CITIES } from '../../utils/helpers'
import { FiCamera, FiUpload, FiCheck, FiMapPin, FiPhone, FiMail, FiGlobe, FiInstagram, FiFacebook, FiTrendingUp, FiAward } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function VendorProfilePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { myVendorProfile: vendor, fetchLoading: loading, actionLoading } = useSelector(s => s.vendor)
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadPreview, setUploadPreview] = useState(null)

  useEffect(() => { dispatch(fetchMyVendorProfile()) }, [dispatch])

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file')

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setUploadPreview(reader.result)
    reader.readAsDataURL(file)

    setIsUploading(true)
    const formData = new FormData()
    formData.append('coverImage', file)

    try {
      await dispatch(uploadVendorCoverImage(formData)).unwrap()
      toast.success('Cover photo updated!')
    } catch (err) {
      toast.error(err || 'Upload failed')
      setUploadPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  if (loading && !vendor) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Fetching your profile...</p>
    </div>
  )

  if (!vendor && !loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md mx-auto my-12">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🏪</div>
      <h2 className="font-display text-xl font-bold text-gray-900 mb-2">No Profile Found</h2>
      <p className="text-gray-500 mb-6 text-sm max-w-sm">Please set up your business profile to start managing services.</p>
      <button onClick={() => navigate('/vendor/profile')} className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold transition-colors">Setup Business Profile</button>
    </div>
  )

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-black text-gray-900 tracking-tight">Business Profile</h1>
            <p className="text-gray-500 mt-1 font-medium">Control how your business appears to potential clients.</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest ${vendor.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gold-100 text-gold-700'}`}>
            {vendor.approvalStatus === 'approved' ? '✓ Profile Verified' : '⌚ Awaiting Approval'}
          </div>
        </header>

        {/* Cover Image Upload Section */}
        <section className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative group">
          <div className="h-64 md:h-80 w-full bg-gray-100 relative">
            {(uploadPreview || vendor.coverImage?.url) ? (
              <img src={uploadPreview || vendor.coverImage.url} className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`} alt="Cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
                <FiCamera className="text-4xl text-gray-300 mb-2" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Cover Image</p>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                  <p className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Uploading...</p>
                </div>
              </div>
            )}

            <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${isUploading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
              >
                <FiUpload /> {vendor.coverImage?.url ? 'Change Cover' : 'Upload Cover'}
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCoverUpload}
            className="hidden"
            accept="image/*"
          />
          <div className="p-6 bg-white flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 -mt-16 border-4 border-white rounded-3xl bg-primary-100 shadow-xl flex items-center justify-center text-3xl overflow-hidden">
                {vendor.images?.[0]?.url ? <img src={vendor.images[0].url} className="w-full h-full object-cover" /> : vendor.category?.icon || '🏢'}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-xl">{vendor.businessName}</h2>
                <p className="text-sm text-gray-400 font-medium">{vendor.category?.name} • {vendor.location?.city}</p>
              </div>
            </div>
          </div>
        </section>

        <Formik
          initialValues={{
            businessName: vendor.businessName || '',
            tagline: vendor.tagline || '',
            description: vendor.description || '',
            phone: vendor.phone || '',
            email: vendor.email || '',
            city: vendor.location?.city || '',
            address: vendor.location?.address || '',
            state: vendor.location?.state || '',
            pincode: vendor.location?.pincode || '',
            yearsOfExperience: vendor.yearsOfExperience || 0,
            basePrice: vendor.basePrice || 0,
            responseTime: vendor.responseTime || 'Within 24 hours',
            instagram: vendor.socialLinks?.instagram || '',
            facebook: vendor.socialLinks?.facebook || '',
            website: vendor.socialLinks?.website || '',
          }}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await dispatch(updateVendorProfile(values)).unwrap();
              // toast.success is handled in slice
            } catch (err) {
              toast.error(err || 'Failed to update profile');
            } finally {
              setSubmitting(false);
            }
          }}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="space-y-8">
              {/* Basic Info */}
              <div className="bg-white rounded-3xl p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center"><FiTrendingUp /></span>
                  Brand Presence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
                    <Field name="businessName" className="input-field bg-gray-50 border-transparent focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tagline</label>
                    <Field name="tagline" placeholder="Ex: Crafting Cinematic Memories" className="input-field bg-gray-50 border-transparent focus:bg-white" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">About Business</label>
                    <Field as="textarea" name="description" rows={5} className="input-field bg-gray-50 border-transparent focus:bg-white resize-none" />
                  </div>
                </div>
              </div>

              {/* Contact & Pricing */}
              <div className="bg-white rounded-3xl p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><FiPhone /></span>
                  Contact & Economics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Primary Phone</label>
                    <Field name="phone" className="input-field bg-gray-50 border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Business Email</label>
                    <Field name="email" className="input-field bg-gray-50 border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Starting Price (₹)</label>
                    <Field type="number" name="basePrice" className="input-field bg-gray-50 border-transparent font-bold text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Industry Experience (Yrs)</label>
                    <Field type="number" name="yearsOfExperience" className="input-field bg-gray-50 border-transparent" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-3xl p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center"><FiMapPin /></span>
                  Operational Base
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                    <Field as="select" name="city" className="input-field bg-gray-50 border-transparent">
                      <option value="">Select City</option>
                      {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Field>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">State / Province</label>
                    <Field name="state" className="input-field bg-gray-50 border-transparent" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Address</label>
                    <Field name="address" className="input-field bg-gray-50 border-transparent" />
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="bg-white rounded-3xl p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center"><FiGlobe /></span>
                  Digital Presence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FiInstagram /> Instagram</label>
                    <Field name="instagram" placeholder="https://instagram.com/..." className="input-field bg-gray-50 border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FiFacebook /> Facebook</label>
                    <Field name="facebook" placeholder="https://facebook.com/..." className="input-field bg-gray-50 border-transparent" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Official Website</label>
                    <Field name="website" placeholder="https://yourbrand.com" className="input-field bg-gray-50 border-transparent" />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-6 z-30">
                <button
                  type="submit"
                  disabled={actionLoading || isSubmitting}
                  className="w-full py-6 bg-gradient-to-r from-primary-600 to-pink-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-primary-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Synchronizing Data...
                    </>
                  ) : (
                    <>
                      <FiCheck size={24} />
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
