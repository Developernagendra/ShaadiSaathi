import { motion } from 'framer-motion';
import { LuCheck as Check, LuStar as Star, LuZap as Zap, LuCrown as Crown } from 'react-icons/lu';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { fetchMyVendorProfile } from '../store/slices/vendorSlice';

const plans = [
  {
    name: 'Free',
    price: 0,
    icon: <Star className="text-gray-400" />,
    features: ['Basic Listing', 'Limited Inquiries', 'Standard Support'],
    color: 'gray'
  },
  {
    name: 'Silver',
    price: 4999,
    icon: <Zap className="text-blue-500" />,
    features: ['Featured Listing (7 days)', 'Priority Support', '50 Lead Access', 'Basic Analytics'],
    color: 'blue',
    popular: false
  },
  {
    name: 'Gold',
    price: 9999,
    icon: <Crown className="text-[#f59e0b]" />,
    features: ['Featured Listing (30 days)', 'Top Search Results', 'Unlimited Leads', 'Advanced Analytics', 'SMS Notifications'],
    color: 'amber',
    popular: true
  },
  {
    name: 'Platinum',
    price: 19999,
    icon: <Crown className="text-[#c41e6b]" />,
    features: ['Always Featured', 'Top Priority in City', 'Direct Lead Booking', 'Custom Branding', 'Account Manager'],
    color: 'pink',
    popular: false
  }
];

const VendorSubscriptionPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { myVendorProfile: vendor } = useSelector(s => s.vendor);

  const handleUpgrade = async (plan) => {
    try {
      const { data } = await api.post('/vendors/activate-subscription', {
        planName: plan.name
      });
      toast.success(`Welcome to ${plan.name}!`);
      dispatch(fetchMyVendorProfile());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate subscription plan');
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Grow Your <span className="text-[#c41e6b]">Business</span> with ShaadiSaathi
          </h1>
          {vendor?.subscription?.isActive && (
            <div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl inline-block font-bold mb-4">
              Current Plan: <span className="uppercase">{vendor.subscription.plan}</span> (Expires: {new Date(vendor.subscription.expiryDate).toLocaleDateString()})
            </div>
          )}
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose a plan that fits your business needs. Upgrade anytime to get more leads and visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative rounded-3xl p-8 border ${
                plan.popular ? 'border-[#c41e6b] shadow-2xl shadow-pink-100 scale-105 z-10' : 'border-gray-100 shadow-sm'
              } flex flex-col ${vendor?.subscription?.plan === plan.name.toLowerCase() ? 'ring-4 ring-primary-200' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#c41e6b] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 ml-1">/year</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check size={18} className="text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleUpgrade(plan)}
                disabled={plan.price === 0 || vendor?.subscription?.plan === plan.name.toLowerCase()}
                className={`w-full py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                plan.popular 
                ? 'bg-[#c41e6b] text-white hover:bg-[#a01857] shadow-lg shadow-pink-200' 
                : 'bg-gray-900 text-white hover:bg-black'
              }`}>
                {vendor?.subscription?.plan === plan.name.toLowerCase() ? 'Current Plan' : `Choose ${plan.name}`}
              </button>
            </motion.div>
          ))}
        </div>
        <div className="mt-20 bg-pink-50 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#c41e6b] mb-4">Need a Custom Plan?</h2>
            <p className="text-gray-700 font-medium">
              Are you a large hotel chain or a premium event management company? We offer custom solutions tailored to your scale.
            </p>
          </div>
          <button className="whitespace-nowrap bg-white text-[#c41e6b] px-8 py-4 rounded-2xl font-bold border-2 border-[#c41e6b] hover:bg-pink-100 transition-all">
            Contact Sales Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorSubscriptionPage;
