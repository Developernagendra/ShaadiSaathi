export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-3xl">💒</span>
      </div>
      <p className="mt-6 font-display text-2xl text-primary-700 font-semibold">ShaadiSaathi</p>
      <p className="text-gray-400 text-sm mt-1 animate-pulse">Loading your wedding world…</p>
    </div>
  )
}
