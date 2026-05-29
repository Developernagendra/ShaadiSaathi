import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateVendorProfile } from '../../store/slices/vendorSlice'
import { FiPlus, FiTrash2, FiTag, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function VendorPackagesPage() {
  const dispatch = useDispatch()
  const { myVendorProfile: vendor } = useSelector(s => s.vendor)
  const [packages, setPackages] = useState([])

  useEffect(() => {
    if (vendor?.packages) setPackages(vendor.packages)
  }, [vendor])

  const handleAddPackage = () => {
    setPackages([...packages, { name: '', description: '', price: '', advancePercentage: 50, features: [''], isPopular: false }])
  }


  const handleRemovePackage = (index) => {
    setPackages(packages.filter((_, i) => i !== index))
  }

  const handlePackageChange = (index, field, value) => {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  const handleFeatureChange = (pIndex, fIndex, value) => {
    const updated = [...packages]
    const updatedFeatures = [...updated[pIndex].features]
    updatedFeatures[fIndex] = value
    updated[pIndex] = { ...updated[pIndex], features: updatedFeatures }
    setPackages(updated)
  }

  const handleAddFeature = (pIndex) => {
    const updated = [...packages]
    updated[pIndex] = { ...updated[pIndex], features: [...updated[pIndex].features, ''] }
    setPackages(updated)
  }

  const handleSave = async () => {
    try {
      await dispatch(updateVendorProfile({ packages }))
      toast.success('Packages updated successfully!')
    } catch (err) {
      toast.error('Failed to update packages')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Service Packages</h1>
          <p className="text-gray-500 mt-1">Manage your pricing plans and features</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddPackage} className="btn-outline py-2 px-4 flex items-center gap-2">
            <FiPlus /> Add Package
          </button>
          <button onClick={handleSave} className="btn-primary py-2 px-6">
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg, pi) => (
          <div key={pi} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group">
            <button
              onClick={() => handleRemovePackage(pi)}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
            >
              <FiTrash2 size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 text-xl">
                <FiTag />
              </div>
              <div className="flex-1">
                <input
                  value={pkg.name}
                  onChange={e => handlePackageChange(pi, 'name', e.target.value)}
                  placeholder="Package Name (e.g. Gold)"
                  className="font-bold text-lg text-gray-800 bg-transparent border-b border-transparent focus:border-primary-200 outline-none w-full"
                />
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-primary-600 font-bold">
                    <span>₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pkg.price}
                      onChange={e => handlePackageChange(pi, 'price', e.target.value)}
                      placeholder="Price"
                      className="bg-transparent border-b border-transparent focus:border-primary-200 outline-none w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 font-bold">
                    <span className="text-[10px] uppercase">Advance</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={pkg.advancePercentage || 50}
                      onChange={e => handlePackageChange(pi, 'advancePercentage', e.target.value)}
                      placeholder="50"
                      className="bg-transparent border-b border-transparent focus:border-primary-200 outline-none w-10 text-primary-600"
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description</label>
              <textarea
                value={pkg.description}
                onChange={e => handlePackageChange(pi, 'description', e.target.value)}
                placeholder="What's included in this package..."
                className="w-full text-sm text-gray-600 bg-gray-50 rounded-xl p-3 resize-none border-none focus:ring-1 focus:ring-primary-200 outline-none"
                rows={3}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Features</label>
              <div className="space-y-2">
                {pkg.features.map((feat, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <FiCheck className="text-green-500 flex-shrink-0" size={14} />
                    <input
                      value={feat}
                      onChange={e => handleFeatureChange(pi, fi, e.target.value)}
                      placeholder="Add a feature..."
                      className="flex-1 text-sm text-gray-600 bg-transparent border-b border-transparent focus:border-primary-200 outline-none"
                    />
                  </div>
                ))}
                <button
                  onClick={() => handleAddFeature(pi)}
                  className="text-xs text-primary-600 font-bold hover:underline mt-2 flex items-center gap-1"
                >
                  <FiPlus size={12} /> Add Feature
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-2">
              <input
                type="checkbox"
                checked={pkg.isPopular}
                onChange={e => handlePackageChange(pi, 'isPopular', e.target.checked)}
                id={`popular-${pi}`}
                className="accent-primary-600"
              />
              <label htmlFor={`popular-${pi}`} className="text-xs font-semibold text-gray-500 cursor-pointer">
                Mark as Most Popular
              </label>
            </div>
          </div>
        ))}

        {packages.length === 0 && (
          <div className="md:col-span-2 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 mb-4">No packages added yet</p>
            <button onClick={handleAddPackage} className="btn-primary py-2 px-6">Add Your First Package</button>
          </div>
        )}
      </div>
    </div>
  )
}
