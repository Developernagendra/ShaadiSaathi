import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { registerUser } from '../../store/slices/authSlice'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiCheckCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const RegisterSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Min 2 chars')
    .max(50, 'Max 50 chars')
    .required('Name is required'),

  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),

  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter valid Indian mobile number')
    .required('Phone is required'),

  password: Yup.string()
    .min(6, 'Min 6 characters')
    .required('Password is required'),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password'),

  agreeTerms: Yup.boolean().oneOf([true], 'Accept terms'),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((s) => s.auth)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const { t } = useTranslation()

  const handleSubmit = async (values) => {
    const { confirmPassword, agreeTerms, ...data } = values
    const payload = { ...data, role: 'user' }
    const result = await dispatch(registerUser(payload))

    if (!result.error) {
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      {/* Left Side: Premium Banner (Hidden on Mobile) */}
      <div className="hidden lg:flex w-5/12 relative overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1920&q=80"
          alt="Luxury Wedding"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full bg-[#C2185B]/10 mix-blend-overlay" />

        <div className="absolute bottom-16 left-12 right-12 z-10 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-6">
              <span className="text-yellow-400">✨</span> <span className="text-[10px] font-black uppercase tracking-widest">Premium Platform</span>
            </div>
            
            <h2 className="font-display text-5xl xl:text-6xl font-black mb-4 tracking-tighter leading-tight drop-shadow-2xl">
              Craft Your <br /><span className="text-[#D4AF37] italic">Legacy</span>
            </h2>
            <p className="text-lg text-white/80 font-medium italic max-w-md">
              Join India's most trusted premium wedding platform. Plan, book, and celebrate your forever.
            </p>

            <div className="mt-8 space-y-3">
              {['Access to exclusive premium vendors', 'Personalized wedding planning tools', 'Secure & transparent bookings'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <FiCheckCircle className="text-[#D4AF37]" />
                  <span className="text-sm font-medium text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        {/* Soft Glow Elements */}
        <div className="fixed top-0 right-0 w-64 h-64 bg-pink-100 rounded-full blur-[100px] opacity-60 pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-64 h-64 bg-gold-100 rounded-full blur-[100px] opacity-60 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 sm:p-10 shadow-premium border border-white relative z-10"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#C2185B] to-[#8E244D] rounded-2xl mb-6 shadow-[0_0_30px_rgba(194,24,91,0.3)] hover:scale-105 transition-transform">
              <span className="text-3xl text-white">💍</span>
            </Link>
            <h1 className="font-display text-3xl font-black text-gray-900 mb-2">Join as User</h1>
            <p className="text-gray-500 font-medium italic text-sm">Create your account to start planning your perfect wedding.</p>
          </div>


          <Formik
            initialValues={{
              name: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              agreeTerms: false,
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                
                {/* Full Name */}
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-2">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C2185B] transition-colors" />
                    <Field
                      name="name"
                      placeholder="Enter your full name"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-5 text-sm font-medium outline-none focus:border-[#C2185B] focus:ring-4 focus:ring-pink-50 focus:bg-white transition-all"
                    />
                  </div>
                  <ErrorMessage name="name" component="p" className="text-red-500 text-[10px] font-bold mt-2 pl-2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Email */}
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-2">Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C2185B] transition-colors" />
                      <Field
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-5 text-sm font-medium outline-none focus:border-[#C2185B] focus:ring-4 focus:ring-pink-50 focus:bg-white transition-all"
                      />
                    </div>
                    <ErrorMessage name="email" component="p" className="text-red-500 text-[10px] font-bold mt-2 pl-2" />
                  </div>

                  {/* Phone */}
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-2">Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C2185B] transition-colors" />
                      <Field
                        name="phone"
                        placeholder="10-digit mobile"
                        maxLength="10"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-5 text-sm font-medium outline-none focus:border-[#C2185B] focus:ring-4 focus:ring-pink-50 focus:bg-white transition-all"
                      />
                    </div>
                    <ErrorMessage name="phone" component="p" className="text-red-500 text-[10px] font-bold mt-2 pl-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Password */}
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-2">Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C2185B] transition-colors" />
                      <Field
                        name="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Min. 6 chars"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium outline-none focus:border-[#C2185B] focus:ring-4 focus:ring-pink-50 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C2185B] transition-colors outline-none"
                      >
                        {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="p" className="text-red-500 text-[10px] font-bold mt-2 pl-2" />
                  </div>

                  {/* Confirm Password */}
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-2">Confirm Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C2185B] transition-colors" />
                      <Field
                        name="confirmPassword"
                        type={showConfirmPass ? 'text' : 'password'}
                        placeholder="Match password"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium outline-none focus:border-[#C2185B] focus:ring-4 focus:ring-pink-50 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C2185B] transition-colors outline-none"
                      >
                        {showConfirmPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    <ErrorMessage name="confirmPassword" component="p" className="text-red-500 text-[10px] font-bold mt-2 pl-2" />
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Field type="checkbox" name="agreeTerms" className="w-5 h-5 rounded border-gray-300 text-[#C2185B] focus:ring-[#C2185B]" />
                    <span className="text-xs font-medium text-gray-500">
                      I agree to the <Link to="/terms" className="text-[#C2185B] hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#C2185B] hover:underline">Privacy Policy</Link>
                    </span>
                  </label>
                  <ErrorMessage name="agreeTerms" component="p" className="text-red-500 text-[10px] font-bold mt-2 pl-2" />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="w-full py-4 rounded-[1.5rem] bg-gradient-to-r from-[#C2185B] to-[#8E244D] text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(194,24,91,0.3)] hover:shadow-[0_0_50px_rgba(194,24,91,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-3"
                  >
                    {loading || isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Creating Account...
                      </>
                    ) : t('auth.createAccount', 'Create Account')}
                  </button>
                </div>

                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    {t('auth.hasAccount', 'Already have an account?')} {' '}
                    <Link to="/login" className="text-[#C2185B] hover:text-[#8E244D] underline underline-offset-4 transition-colors">
                      {t('nav.login', 'Log In')}
                    </Link>
                  </p>
                </div>

              </Form>
            )}
          </Formik>
        </motion.div>
      </div>
    </div>
  )
}