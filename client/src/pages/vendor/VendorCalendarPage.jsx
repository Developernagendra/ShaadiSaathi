import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchVendorAvailability, 
  updateAvailability, 
  bulkUpdateAvailability 
} from '../../store/slices/availabilitySlice'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns'
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiPlus, 
  FiX, 
  FiLock, 
  FiUnlock, 
  FiClock, 
  FiUsers, 
  FiSave 
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../../components/common/Modal'

export default function VendorCalendarPage() {
  const dispatch = useDispatch()
  const { vendorAvailability, loading } = useSelector(s => s.availability)
  
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const [editForm, setEditForm] = useState({
    maxBookings: 1,
    isBlocked: false,
    blockReason: '',
    slots: []
  })

  useEffect(() => {
    dispatch(fetchVendorAvailability({
      month: currentMonth.getMonth() + 1,
      year: currentMonth.getFullYear()
    }))
  }, [dispatch, currentMonth])

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
        <p className="text-gray-500">Manage your slots and blocked dates</p>
      </div>
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <FiChevronLeft size={20} />
        </button>
        <span className="font-bold text-lg min-w-[140px] text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          const availability = vendorAvailability.find(a => isSameDay(new Date(a.date), day))
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, monthStart)
          
          let bgColor = 'bg-white'
          let textColor = 'text-gray-900'
          let statusLabel = ''

          if (availability) {
            if (availability.isBlocked) {
              bgColor = 'bg-gray-100'
              statusLabel = 'Blocked'
            } else if (availability.status === 'booked') {
              bgColor = 'bg-red-50'
              textColor = 'text-red-700'
              statusLabel = 'Full'
            } else if (availability.status === 'partially_booked') {
              bgColor = 'bg-yellow-50'
              textColor = 'text-yellow-700'
              statusLabel = `${availability.bookedCount}/${availability.maxBookings}`
            } else {
              bgColor = 'bg-green-50'
              textColor = 'text-green-700'
              statusLabel = 'Available'
            }
          }

          if (!isCurrentMonth) {
            textColor = 'text-gray-300'
            bgColor = 'bg-gray-50/50'
          }

          return (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={idx}
              onClick={() => handleDateClick(day, availability)}
              className={`relative h-24 md:h-32 p-3 border rounded-2xl transition-all text-left flex flex-col justify-between ${
                isSelected ? 'ring-2 ring-primary-500 border-primary-500' : 'border-gray-100'
              } ${bgColor}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-bold ${isToday(day) ? 'bg-primary-600 text-white w-7 h-7 flex items-center justify-center rounded-full -mt-1 -ml-1 shadow-md' : textColor}`}>
                  {format(day, 'd')}
                </span>
                {availability?.isBlocked && <FiLock size={12} className="text-gray-400" />}
              </div>
              
              {isCurrentMonth && statusLabel && (
                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg self-start ${
                  availability?.status === 'booked' ? 'bg-red-100 text-red-700' :
                  availability?.status === 'partially_booked' ? 'bg-yellow-100 text-yellow-700' :
                  availability?.isBlocked ? 'bg-gray-200 text-gray-600' :
                  'bg-green-100 text-green-700'
                }`}>
                  {statusLabel}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    )
  }

  const handleDateClick = (day, availability) => {
    setSelectedDate(day)
    if (availability) {
      setEditForm({
        maxBookings: availability.maxBookings || 1,
        isBlocked: availability.isBlocked || false,
        blockReason: availability.blockReason || '',
        slots: availability.slots || []
      })
    } else {
      setEditForm({
        maxBookings: 1,
        isBlocked: false,
        blockReason: '',
        slots: []
      })
    }
    setIsEditModalOpen(true)
  }

  const handleAddSlot = () => {
    setEditForm(prev => ({
      ...prev,
      slots: [...prev.slots, { name: 'Morning', startTime: '09:00', endTime: '12:00', maxBookings: 1 }]
    }))
  }

  const handleRemoveSlot = (index) => {
    setEditForm(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }))
  }

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...editForm.slots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setEditForm(prev => ({ ...prev, slots: newSlots }))
  }

  const handleSave = () => {
    dispatch(updateAvailability({
      date: selectedDate,
      ...editForm
    }))
    setIsEditModalOpen(false)
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {renderHeader()}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Legend & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded-md" />
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded-md" />
                <span className="text-sm text-gray-600">Partially Booked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded-md" />
                <span className="text-sm text-gray-600">Fully Booked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded-md" />
                <span className="text-sm text-gray-600">Blocked / Leave</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-3xl shadow-lg text-white">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  const today = new Date();
                  const next30Days = Array.from({length: 30}, (_, i) => addDays(today, i));
                  dispatch(bulkUpdateAvailability({
                    dates: next30Days.map(d => format(d, 'yyyy-MM-dd')),
                    action: 'available'
                  }))
                }}
                className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FiUnlock size={16} /> Mark Next 30 Days Available
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          {renderDays()}
          {renderCells()}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title={selectedDate ? `Manage: ${format(selectedDate, 'do MMMM yyyy')}` : ''}
        size="lg"
      >
        <div className="p-6 space-y-6">
          {/* Top Toggles */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${editForm.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {editForm.isBlocked ? <FiLock size={20} /> : <FiUnlock size={20} />}
              </div>
              <div>
                <p className="font-bold text-gray-900">{editForm.isBlocked ? 'Date is Blocked' : 'Date is Available'}</p>
                <p className="text-xs text-gray-500">Toggle status for this specific date</p>
              </div>
            </div>
            <button 
              onClick={() => setEditForm(prev => ({ ...prev, isBlocked: !prev.isBlocked }))}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                editForm.isBlocked 
                ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                : 'bg-red-600 text-white shadow-lg shadow-red-200'
              }`}
            >
              {editForm.isBlocked ? 'Mark Available' : 'Block Date'}
            </button>
          </div>

          {!editForm.isBlocked ? (
            <>
              {/* Capacity */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Daily Booking Capacity</label>
                  <div className="flex items-center gap-3">
                    <FiUsers className="text-primary-500" />
                    <input 
                      type="number" 
                      min="1" 
                      value={editForm.maxBookings}
                      onChange={(e) => setEditForm(prev => ({ ...prev, maxBookings: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Slots */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <FiClock className="text-primary-500" /> Time Slots (Optional)
                  </h4>
                  <button 
                    onClick={handleAddSlot}
                    className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:underline"
                  >
                    <FiPlus /> Add Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {editForm.slots.map((slot, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                      <input 
                        placeholder="Slot Name (e.g. Morning)" 
                        value={slot.name}
                        onChange={(e) => handleSlotChange(i, 'name', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <input 
                        type="time" 
                        value={slot.startTime}
                        onChange={(e) => handleSlotChange(i, 'startTime', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <input 
                        type="time" 
                        value={slot.endTime}
                        onChange={(e) => handleSlotChange(i, 'endTime', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          placeholder="Capacity" 
                          value={slot.maxBookings}
                          onChange={(e) => handleSlotChange(i, 'maxBookings', parseInt(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                        <button onClick={() => handleRemoveSlot(i)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))}
                  {editForm.slots.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No specific slots defined. User will book for the full day.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Block Reason (Internal)</label>
              <textarea 
                value={editForm.blockReason}
                onChange={(e) => setEditForm(prev => ({ ...prev, blockReason: e.target.value }))}
                placeholder="e.g. Personal vacation, Offline booking at venue..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none"
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all"
            >
              <FiSave /> Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
