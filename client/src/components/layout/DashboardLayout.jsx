import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { FiMenu, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import ErrorBoundary from '../common/ErrorBoundary'

export default function DashboardLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex bg-gray-50 min-h-screen pt-20 font-sans">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary-600 to-pink-600 text-white rounded-full shadow-xl shadow-primary-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <FiMenu size={26} />
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 shadow-2xl shadow-gray-200/50 transition-all duration-300 ease-in-out transform pt-16 md:pt-0
        w-[85%] max-w-[300px] md:max-w-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}
      `}>
        <Sidebar closeSidebar={() => setSidebarOpen(false)} isCollapsed={isCollapsed} />
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-100 shadow-md rounded-full items-center justify-center text-gray-500 hover:text-primary-600 hover:scale-110 transition-all z-50"
        >
          {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>

      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

