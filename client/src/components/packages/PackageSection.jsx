import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import { fetchPackages } from '../../store/slices/packageSlice';
import PackageCard from './PackageCard';
import PackageSkeleton from './PackageSkeleton';
import PackageDetailsModal from './PackageDetailsModal';
import QuoteFormModal from './QuoteFormModal';

export default function PackageSection() {
  const dispatch = useDispatch();
  const { packages, loading, error } = useSelector(state => state.packages);

  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => {
    // Only fetch if empty to avoid unnecessary network requests on re-renders
    if (packages.length === 0) {
      dispatch(fetchPackages());
    }
  }, [dispatch, packages.length]);

  return (
    <section className="py-10 md:py-16 px-4 bg-[#FFF8FA] overflow-hidden" id="wedding-packages">
      <div className="max-w-7xl mx-auto relative">

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-gradient-to-b from-[#C2185B]/5 to-transparent blur-[100px] pointer-events-none" />

        {/* Section Header */}
        <div className="text-center mb-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-[#C2185B]/10 px-4 py-1.5 rounded-full mb-4 shadow-sm"
          >
            <span className="text-[10px] font-black text-[#C2185B] uppercase tracking-[0.2em]">✨ Curated Wedding Experiences</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl md:text-4xl font-bold text-[#18181B] tracking-tight"
          >
            Choose Your Dream Wedding Package
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-gray-500 max-w-xl mx-auto mt-3 font-sans"
          >
            Everything you need for your perfect wedding — beautifully bundled into one seamless experience.
          </motion.p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-center text-sm font-bold mb-6 border border-red-100">
            {error} - Please try refreshing the page.
          </div>
        )}

        {/* Pricing Cards */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch gap-6 pb-12 pt-6 relative z-10 px-4 md:px-0">
          {loading && packages.length === 0 ? (
            <>
              <PackageSkeleton />
              <PackageSkeleton />
              <PackageSkeleton />
              <PackageSkeleton />
            </>
          ) : packages.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[24px] border border-gray-100 shadow-sm text-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-tr from-[#FFF8FA] to-white flex items-center justify-center border border-[#C2185B]/10 shadow-inner">
                <FiCheck className="text-[#C2185B] text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-serif mb-2">Packages Coming Soon</h3>
              <p className="text-gray-500 max-w-sm">We are currently curating premium wedding packages. Please check back later!</p>
            </div>
          ) : (
            packages.map((pkg, idx) => (
              <PackageCard
                key={pkg._id}
                pkg={pkg}
                onOpenDetails={setSelectedDetails}
                onOpenQuote={setSelectedQuote}
              />
            ))
          )}
        </div>

        {/* Bottom Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-6 mt-4 relative z-10"
        >
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {[
              'Verified Vendors',
              'Transparent Pricing',
              'WhatsApp Support',
              'Secure Booking'
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
                <FiCheck className="text-[#C2185B]" size={14} /> {text}
              </div>
            ))}
          </div>

        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedDetails && (
          <PackageDetailsModal
            pkg={selectedDetails}
            onClose={() => setSelectedDetails(null)}
            onQuote={(pkg) => {
              setSelectedDetails(null);
              setSelectedQuote(pkg);
            }}
          />
        )}
        {selectedQuote && (
          <QuoteFormModal
            pkg={selectedQuote}
            onClose={() => setSelectedQuote(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
