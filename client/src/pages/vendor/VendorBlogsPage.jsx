import { useState, useEffect } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiGlobe, FiFileText, FiSearch, FiImage, FiLoader, FiClock } from 'react-icons/fi'
import { formatDateShort, optimizeImage } from '../../utils/helpers'
import Modal from '../../components/common/Modal'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function VendorBlogsPage() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('edit')
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({ 
    title: '', 
    excerpt: '',
    content: '', 
    category: '', 
    tags: '', 
    isPublished: false, 
    coverImage: '' 
  })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/vendors/blogs')
      setBlogs(data.blogs || [])
    } catch (err) { 
      console.error(err)
      toast.error('Failed to load your blogs') 
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filteredBlogs = (blogs || []).filter(b => 
    (b?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (b?.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  const handleEdit = (blog) => {
    if (!blog) return
    setEditingBlog(blog)
    setForm({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || '',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
      isPublished: !!blog.isPublished,
      coverImage: blog.coverImage || ''
    })
    setActiveTab('edit')
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this article?')) return
    try {
      await api.delete(`/vendors/blogs/${id}`)
      setBlogs(prev => prev.filter(b => b._id !== id))
      toast.success('Article removed')
    } catch (err) { toast.error('Delete failed') }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const { data } = await api.post('/features/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm({ ...form, coverImage: data.url })
      toast.success('Image uploaded!')
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e, forcePublish = null) => {
    if (e) e.preventDefault()
    const isPublishedValue = forcePublish !== null ? forcePublish : form.isPublished

    if (!form.title || !form.content) {
      return toast.error('Title and content are required')
    }

    const payload = {
      ...form,
      id: editingBlog?._id,
      isPublished: isPublishedValue,
      tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }

    try {
      const { data } = await api.post('/vendors/blogs', payload)
      if (editingBlog) {
        setBlogs(prev => prev.map(b => b._id === data.blog._id ? data.blog : b))
      } else {
        setBlogs([data.blog, ...blogs])
      }
      toast.success(isPublishedValue ? 'Article Published!' : 'Draft Saved!')
      setIsModalOpen(false)
    } catch (err) { toast.error('Saving failed') }
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display text-3xl font-black text-gray-900">Your <span className="text-primary-600">Journal</span></h1>
          <p className="text-gray-500 text-sm italic mt-1 font-medium">Share your wedding expertise and inspirations with couples.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group flex-1 md:flex-none">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-primary-200 transition-all w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => { 
              setEditingBlog(null); 
              setForm({ title: '', excerpt: '', content: '', category: '', tags: '', isPublished: false, coverImage: '' }); 
              setActiveTab('edit');
              setIsModalOpen(true) 
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <FiPlus size={16} /> New Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-gray-50 animate-pulse rounded-3xl" />
          ))
        ) : filteredBlogs.map(b => (
          <div key={b?._id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="h-48 overflow-hidden relative">
              {b?.coverImage ? (
                <img src={optimizeImage(b.coverImage, 400)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 italic font-medium">No cover image</div>
              )}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${b?.isPublished ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {b?.isPublished ? 'Live' : 'Draft'}
              </div>
            </div>
            <div className="p-8">
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3 block">{b?.category || 'General'}</span>
              <h3 className="font-display text-xl font-black text-gray-900 mb-6 line-clamp-2 leading-tight">{b?.title || 'Untitled'}</h3>
              
              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                  <span>{b?.createdAt ? formatDateShort(b.createdAt) : 'Recent'}</span>
                  <span className="flex items-center gap-1"><FiEye /> {b?.views || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(b)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-500 rounded-xl transition-colors"><FiEdit2 size={16} /></button>
                  <button onClick={() => handleDelete(b._id)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"><FiTrash2 size={16} /></button>
                  <Link to={`/blog/${b?.slug}`} className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary-600 rounded-xl transition-colors"><FiEye size={16} /></Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filteredBlogs.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-5xl mb-4">✍️</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Ready to share your wisdom?</h3>
          <p className="text-gray-400 text-sm italic mb-8">Click 'New Post' to start writing your first article.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBlog ? 'Edit Post' : 'New Inspiration'} size="4xl">
        {/* Tabs */}
        <div className="flex items-center gap-8 px-12 border-b border-gray-100 bg-gray-50/30 relative z-10">
          <button 
            onClick={() => setActiveTab('edit')}
            className={`py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'edit' ? 'text-primary-600' : 'text-gray-400'}`}
          >
            Editor
            {activeTab === 'edit' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600" />}
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'preview' ? 'text-primary-600' : 'text-gray-400'}`}
          >
            Preview
            {activeTab === 'preview' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600" />}
          </button>
        </div>

        <div className="p-8 relative z-10 overflow-y-auto max-h-[70vh]">
          {activeTab === 'edit' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic ml-1">Title</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-display text-lg font-black shadow-inner" placeholder="Your amazing title..." />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic ml-1">Excerpt</label>
                  <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-bold shadow-inner" placeholder="Short description..." />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic ml-1">Category</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-bold shadow-inner" placeholder="Planning, Fashion..." />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic ml-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-bold shadow-inner" placeholder="trends, guide, inspiration" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic ml-1">Cover Image</label>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative group">
                      <div className={`w-full h-40 rounded-2xl border-2 border-dashed ${form.coverImage ? 'border-primary-200' : 'border-gray-200'} flex flex-col items-center justify-center overflow-hidden bg-gray-50/50 transition-all`}>
                        {form.coverImage ? (
                          <img src={form.coverImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="text-center p-6">
                            <FiImage size={32} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Image</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/*"
                        />
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <FiLoader className="animate-spin text-primary-600" size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-1/2">
                      <input 
                        value={form.coverImage}
                        onChange={e => setForm({ ...form, coverImage: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[10px] font-bold text-gray-500 focus:ring-2 focus:ring-primary-500 transition-all shadow-inner"
                        placeholder="Or paste URL..."
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic ml-1">Content</label>
                  <div className="quill-container">
                    <ReactQuill 
                      theme="snow"
                      value={form.content}
                      onChange={val => setForm({ ...form, content: val })}
                      modules={quillModules}
                      className="bg-white rounded-2xl overflow-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[2rem]">
                <div className="relative inline-flex items-center cursor-pointer group" onClick={() => setForm({ ...form, isPublished: !form.isPublished })}>
                  <div className={`w-14 h-8 rounded-full transition-all duration-300 relative ${form.isPublished ? 'bg-[#27ae60]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${form.isPublished ? 'translate-x-6' : 'translate-x-0'} shadow-sm`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 italic uppercase tracking-widest">Public Visibility</p>
                  <p className="text-[10px] text-gray-400 font-bold italic uppercase tracking-widest mt-1">Make visible to everyone</p>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-12 animate-fade-in">
              <div className="relative h-[300px] rounded-[2rem] overflow-hidden shadow-xl">
                <img src={form.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80'} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h2 className="font-display text-3xl font-black text-white leading-tight">
                    {form.title || 'Untitled Article'}
                  </h2>
                </div>
              </div>
              <div className="max-w-2xl mx-auto">
                <p className="text-xl text-gray-500 font-medium italic mb-8 border-l-4 border-primary-500 pl-6 py-2">
                  {form.excerpt || 'No excerpt.'}
                </p>
                <div 
                  className="prose prose-pink max-w-none text-gray-700 leading-loose"
                  dangerouslySetInnerHTML={{ __html: form.content || '<p className="text-gray-400 italic">No content yet...</p>' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-12 py-6 border-t border-gray-100 flex gap-4 bg-white/50 relative z-10">
          <button type="button" onClick={() => handleSubmit(null, false)} disabled={uploading} className="flex-1 py-5 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all italic disabled:opacity-50">Save Draft</button>
          <button type="button" onClick={() => handleSubmit(null, true)} disabled={uploading} className="flex-[2] py-5 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all italic flex items-center justify-center gap-2 disabled:opacity-50">
            {uploading ? <FiLoader className="animate-spin" /> : <FiGlobe />} {editingBlog ? 'Update' : 'Publish'}
          </button>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .quill-container .ql-container {
          min-height: 250px;
          font-family: 'Lato', sans-serif;
          font-size: 16px;
          border-color: transparent !important;
          background: #f9fafb;
        }
        .quill-container .ql-toolbar {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border-color: #f3f4f6 !important;
          background: white;
        }
        .quill-container .ql-container {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
        }
      `}} />
    </div>
  )
}
