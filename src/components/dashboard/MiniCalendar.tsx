'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Clock,
  Briefcase,
  PhoneCall,
  User,
  Sparkles,
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
import { createClient } from '@/lib/supabase/client'

export const MiniCalendar: React.FC = () => {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      if (data) setEvents(data)
    } catch (err) {
      console.error('Error fetching calendar events:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Calendar date computations
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const getEventsForDay = (day: Date) => {
    return events.filter(e => isSameDay(new Date(e.start_time), day))
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'work': return <Briefcase size={11} className="text-zinc-600" />
      case 'meeting': return <PhoneCall size={11} className="text-blue-600" />
      case 'personal': return <User size={11} className="text-emerald-600" />
      default: return <Sparkles size={11} className="text-neutral-500" />
    }
  }

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'work': return 'Kerja'
      case 'meeting': return 'Meeting'
      case 'personal': return 'Pribadi'
      default: return 'Lainnya'
    }
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const selectedDayEvents = getEventsForDay(selectedDate)

  return (
    <Card className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col text-left">
          <h3 className="font-bold text-base text-brand-primary">Kalender</h3>
          <span className="text-xs text-brand-muted mt-0.5">Lihat agenda & jadwal Anda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-brand-border hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-bold text-brand-primary px-2 min-w-[100px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-brand-border hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-primary" />
        </div>
      ) : (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
              <span key={day} className="text-[10px] font-bold text-brand-muted py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isDaySelected = isSameDay(day, selectedDate)
              const isDayToday = isToday(day)

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`relative p-1 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 min-h-[36px]
                    ${isCurrentMonth ? 'text-brand-primary' : 'text-neutral-300'}
                    ${isDaySelected
                      ? 'bg-brand-primary text-white shadow-sm'
                      : isDayToday
                        ? 'bg-indigo-50 ring-1 ring-brand-secondary/30'
                        : 'hover:bg-neutral-50'
                    }
                  `}
                >
                  <span className={`text-[11px] font-semibold leading-none
                    ${isDaySelected ? 'text-white font-bold' : ''}
                    ${isDayToday && !isDaySelected ? 'text-brand-secondary font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <span
                          key={evt.id}
                          style={{ backgroundColor: isDaySelected ? '#ffffff' : (evt.color || '#6c63ff') }}
                          className="w-1 h-1 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Selected day events detail */}
          <div className="mt-4 pt-3 border-t border-brand-border flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-brand-secondary" />
                <span className="text-xs font-bold text-brand-primary">
                  {format(selectedDate, 'dd MMMM yyyy')}
                </span>
              </div>
              {selectedDayEvents.length > 0 && (
                <span className="text-[10px] font-semibold text-brand-muted bg-neutral-100 px-2 py-0.5 rounded-full">
                  {selectedDayEvents.length} agenda
                </span>
              )}
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <ClipboardList size={18} className="text-neutral-300 mb-1.5" />
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Tidak ada agenda<br />untuk tanggal ini.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[120px] pr-1">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg border border-brand-border/60 hover:bg-neutral-50/50 transition-colors text-left"
                  >
                    <span
                      style={{ backgroundColor: evt.color || '#6c63ff' }}
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-brand-primary truncate leading-tight">
                        {evt.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-brand-muted flex items-center gap-0.5">
                          <Clock size={9} />
                          {format(new Date(evt.start_time), 'HH:mm')}
                          {evt.end_time ? ` - ${format(new Date(evt.end_time), 'HH:mm')}` : ''}
                        </span>
                        <span className="text-[9px] text-brand-muted flex items-center gap-0.5">
                          {getEventIcon(evt.type)}
                          {getEventTypeName(evt.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
