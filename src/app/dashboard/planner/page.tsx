'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { 
  Plus, 
  Trash2, 
  CalendarDays, 
  Clock, 
  Briefcase, 
  PhoneCall, 
  User, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday 
} from 'date-fns'

export default function PlannerPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Current month reference
  const [currentDate, setCurrentDate] = useState(new Date())
  // Currently clicked day for detail view
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Data states
  const [events, setEvents] = useState<any[]>([])

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'work',
    color: '#6c63ff'
  })

  // Core data fetch
  const fetchEvents = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
      
      if (error) throw error
      if (data) setEvents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchEvents(user.id)
      }
    }
    init()
  }, [supabase, fetchEvents])

  // --- ACTIONS ---
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const activeDateStr = format(selectedDate, 'yyyy-MM-dd')
      const startDateTime = new Date(`${activeDateStr}T${form.startTime}:00`).toISOString()
      const endDateTime = form.endTime ? new Date(`${activeDateStr}T${form.endTime}:00`).toISOString() : null

      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title: form.title,
        description: form.description || null,
        start_time: startDateTime,
        end_time: endDateTime,
        type: form.type,
        color: form.color
      })

      if (error) throw error
      setIsModalOpen(false)
      setForm({
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        type: 'work',
        color: '#6c63ff'
      })
      fetchEvents(user.id)
    } catch (err) {
      alert('Gagal menjadwalkan agenda baru')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return
    if (!confirm('Hapus jadwal pertemuan ini?')) return
    try {
      setEvents(prev => prev.filter(e => e.id !== eventId))
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      fetchEvents(user.id)
    } catch (err) {
      alert('Gagal menghapus agenda')
    }
  }

  // --- CALENDAR GENERATORS ---
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Find daily events count/list
  const getEventsForDay = (day: Date) => {
    return events.filter(e => isSameDay(new Date(e.start_time), day))
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'work': return <Briefcase size={13} className="text-zinc-650" />
      case 'meeting': return <PhoneCall size={13} className="text-blue-650" />
      case 'personal': return <User size={13} className="text-emerald-650" />
      default: return <Sparkles size={13} className="text-neutral-550" />
    }
  }

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'work': return 'Pekerjaan'
      case 'meeting': return 'Rapat/Meeting'
      case 'personal': return 'Pribadi'
      default: return 'Lainnya'
    }
  }

  // Navigation handlers
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-brand-primary tracking-tight">Planner & Kalender</h2>
          <p className="text-sm text-brand-muted mt-1">Kelola agenda kerja, jadwal meeting, dan acara personal Anda dalam kalender terpadu.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm" className="self-start cursor-pointer">
          <Plus size={16} className="mr-1.5" /> Agenda Baru
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid Section (Left, 2 cols) */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Calendar control bar */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-border">
                <h3 className="font-bold text-base text-brand-primary uppercase">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={prevMonth}
                    className="p-2 rounded-lg border border-brand-border hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="p-2 rounded-lg border border-brand-border hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                  <span key={day} className="text-xs font-bold text-brand-muted py-2">
                    {day}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day)
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                  const isDaySelected = isSameDay(day, selectedDate)
                  const isDayToday = isToday(day)

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      style={{ minHeight: '80px' }}
                      className={`p-2 border rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-200 text-left
                        ${isCurrentMonth ? 'text-brand-primary' : 'text-neutral-300'}
                        ${isDaySelected ? 'border-brand-primary ring-2 ring-brand-primary/10' : 'border-brand-border'}
                        ${isDayToday ? 'bg-indigo-50/20' : 'bg-white hover:bg-neutral-50/40'}
                      `}
                    >
                      <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full
                        ${isDayToday ? 'bg-brand-primary text-white font-black' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      
                      {/* Event dots container */}
                      <div className="flex flex-wrap gap-1 mt-1 pr-0.5">
                        {dayEvents.slice(0, 3).map((evt) => (
                          <span 
                            key={evt.id} 
                            style={{ backgroundColor: evt.color || '#6c63ff' }}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            title={evt.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] font-black text-brand-muted leading-none">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Day Detail Sidebar (Right, 1 col) */}
          <div>
            <Card className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
                <div className="text-left">
                  <h3 className="font-bold text-sm text-brand-primary">Agenda Harian</h3>
                  <span className="text-xs text-brand-muted block mt-0.5">
                    {format(selectedDate, 'dd MMMM yyyy')}
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 px-3 border border-brand-border rounded-lg text-xs font-bold hover:bg-neutral-50 text-brand-primary transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={11} /> Baru
                </button>
              </div>

              {/* Selected Day Events List */}
              {getEventsForDay(selectedDate).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <ClipboardList size={22} className="text-neutral-400 mb-2" />
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Tidak ada agenda untuk tanggal ini.<br />
                    Klik "Baru" untuk menambahkan.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[460px]">
                  {getEventsForDay(selectedDate).map((evt) => (
                    <div 
                      key={evt.id}
                      className="p-4 rounded-xl border border-brand-border hover:bg-neutral-50/30 transition-all text-left relative flex flex-col gap-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span 
                            style={{ backgroundColor: evt.color || '#6c63ff' }}
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                          />
                          <h4 className="text-sm font-semibold text-brand-primary truncate pr-4">
                            {evt.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-danger shrink-0 transition-colors absolute right-2 top-3 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {evt.description && (
                        <p className="text-xs text-brand-muted leading-relaxed">
                          {evt.description}
                        </p>
                      )}

                      {/* Event Details */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 pt-2 border-t border-brand-border/60">
                        <span className="text-[10px] font-semibold text-brand-muted flex items-center gap-1">
                          <Clock size={11} />
                          {format(new Date(evt.start_time), 'HH:mm')} 
                          {evt.end_time ? ` - ${format(new Date(evt.end_time), 'HH:mm')}` : ''}
                        </span>
                        <Badge variant="neutral" className="text-[9px] py-0 px-2 leading-tight">
                          {getEventTypeName(evt.type)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* --- ADD EVENT MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Agenda untuk ${format(selectedDate, 'dd MMM yyyy')}`}>
        <form onSubmit={handleCreateEvent} className="flex flex-col gap-4 text-left">
          <Input
            label="Nama Agenda"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Contoh: Meeting evaluasi bulanan, Laundry..."
            required
          />
          <Input
            label="Detil Deskripsi (Opsional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Ketik catatan tambahan..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jam Mulai"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
            <Input
              label="Jam Selesai (Opsional)"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipe Agenda"
              options={[
                { value: 'work', label: 'Pekerjaan (Work)' },
                { value: 'meeting', label: 'Pertemuan (Meeting)' },
                { value: 'personal', label: 'Pribadi (Personal)' },
                { value: 'other', label: 'Lainnya' }
              ]}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <Input
              label="Warna Penanda Tag"
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full mt-2 cursor-pointer">Simpan Kegiatan</Button>
        </form>
      </Modal>
    </div>
  )
}
