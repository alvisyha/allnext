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
  Sparkles, 
  Flame, 
  Award,
  Check,
  CalendarDays,
  Target
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'

export default function HabitsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Data states
  const [habits, setHabits] = useState<any[]>([])
  const [habitLogs, setHabitLogs] = useState<any[]>([])

  // Modal
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [habitForm, setHabitForm] = useState({ name: '', icon: '💪', color: '#6c63ff', target: '5' })

  // Core fetch
  const fetchHabitsData = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      // Fetch habits
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (habitsData) setHabits(habitsData)

      // Fetch habit logs of past 30 days
      const { data: logsData } = await supabase
        .from('habit_logs')
        .select('*, habits(user_id)')
        .gte('completed_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))

      const filteredLogs = logsData?.filter(log => log.habits && log.habits.user_id === userId) || []
      setHabitLogs(filteredLogs)
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
        fetchHabitsData(user.id)
      }
    }
    init()
  }, [supabase, fetchHabitsData])

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        name: habitForm.name,
        icon: habitForm.icon,
        color: habitForm.color,
        target_per_week: Number(habitForm.target)
      })
      if (error) throw error
      setIsHabitModalOpen(false)
      setHabitForm({ name: '', icon: '💪', color: '#6c63ff', target: '5' })
      fetchHabitsData(user.id)
    } catch (err) {
      alert('Gagal menyimpan habit baru')
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return
    if (!confirm('Hapus Kebiasaan ini beserta seluruh catatan riwayatnya?')) return
    try {
      setHabits(prev => prev.filter(h => h.id !== habitId))
      const { error } = await supabase.from('habits').delete().eq('id', habitId)
      if (error) throw error
      fetchHabitsData(user.id)
    } catch (err) {
      alert('Gagal menghapus habit')
    }
  }

  // Checkin action toggle
  const handleToggleCheckin = async (habitId: string, dateStr: string) => {
    if (!user) return
    const logExists = habitLogs.find(l => l.habit_id === habitId && l.completed_date === dateStr)
    
    try {
      if (logExists) {
        // Remove check-in
        setHabitLogs(prev => prev.filter(l => l.id !== logExists.id))
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', logExists.id)
        if (error) throw error
      } else {
        // Add check-in
        const { data, error } = await supabase
          .from('habit_logs')
          .insert({ habit_id: habitId, completed_date: dateStr })
          .select()
        if (error) throw error
        if (data) setHabitLogs(prev => [...prev, data[0]])
      }
      fetchHabitsData(user.id)
    } catch (err) {
      alert('Gagal memperbarui riwayat check-in')
      fetchHabitsData(user.id)
    }
  }

  // Calculate streaks
  const calculateStreak = (habitId: string) => {
    let currentStreak = 0
    let dateToCheck = new Date()

    // Sort logs descending
    const logsOfHabit = habitLogs
      .filter(l => l.habit_id === habitId)
      .map(l => l.completed_date)

    // Check if user completed today
    const todayStr = format(dateToCheck, 'yyyy-MM-dd')
    const yesterdayStr = format(subDays(dateToCheck, 1), 'yyyy-MM-dd')
    
    const hasToday = logsOfHabit.includes(todayStr)
    const hasYesterday = logsOfHabit.includes(yesterdayStr)

    if (!hasToday && !hasYesterday) {
      return 0
    }

    if (!hasToday && hasYesterday) {
      dateToCheck = subDays(dateToCheck, 1)
    }

    while (true) {
      const checkStr = format(dateToCheck, 'yyyy-MM-dd')
      if (logsOfHabit.includes(checkStr)) {
        currentStreak++
        dateToCheck = subDays(dateToCheck, 1)
      } else {
        break
      }
    }

    return currentStreak
  }

  // Completed rate past 30 days
  const getCompletionStats = (habitId: string) => {
    const logsCount = habitLogs.filter(l => l.habit_id === habitId).length
    return {
      total: logsCount,
      percentage: Math.round((logsCount / 30) * 100)
    }
  }

  // Heatmap helper list (Past 28 Days)
  const getHeatmapDays = () => {
    const arr = []
    for (let i = 27; i >= 0; i--) {
      arr.push(subDays(new Date(), i))
    }
    return arr
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-brand-primary tracking-tight">Pelacak Kebiasaan (Habit Tracker)</h2>
          <p className="text-sm text-brand-muted mt-1">Konsisten adalah kunci. Bangun kebiasaan harian Anda dan penuhi target mingguan.</p>
        </div>
        <Button onClick={() => setIsHabitModalOpen(true)} size="sm" className="self-start cursor-pointer">
          <Plus size={16} className="mr-1.5" /> Kebiasaan Baru
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {habits.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 py-16 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">🔥</span>
              <p className="text-sm text-brand-muted mb-4">Kamu belum memiliki habit terdaftar.</p>
              <Button onClick={() => setIsHabitModalOpen(true)} size="sm" className="cursor-pointer">
                Mulai Kebiasaan Pertama
              </Button>
            </div>
          ) : (
            habits.map((habit) => {
              const streak = calculateStreak(habit.id)
              const stats = getCompletionStats(habit.id)
              const isCheckedToday = habitLogs.some(
                (log) => log.habit_id === habit.id && log.completed_date === todayStr
              )

              return (
                <Card key={habit.id} className="p-6 flex flex-col justify-between h-full bg-white relative border-brand-border">
                  {/* Card head */}
                  <div className="flex items-start justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-100 text-lg">
                        {habit.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-brand-primary">
                          {habit.name}
                        </h4>
                        <span className="text-xs text-brand-muted block mt-0.5">
                          Target: {habit.target_per_week} hari / minggu
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1 text-neutral-450 hover:bg-neutral-100 hover:text-brand-danger rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Highlights info */}
                  <div className="grid grid-cols-3 gap-2 my-5 text-left bg-neutral-50/70 border border-neutral-100 p-3.5 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-brand-muted">Streak</span>
                      <span className="text-sm font-bold text-brand-primary flex items-center gap-1 mt-0.5">
                        <Flame size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                        {streak} Hari
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-brand-muted">30 Hari</span>
                      <span className="text-sm font-bold text-brand-primary mt-0.5">
                        {stats.total} Kali
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-brand-muted">Rasio</span>
                      <span className="text-sm font-bold text-brand-primary mt-0.5">
                        {stats.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Heatmap graph visualization */}
                  <div className="mb-5 text-left">
                    <span className="text-[10px] font-bold text-brand-muted block mb-2 uppercase tracking-wide">
                      Kalender Check-In (4 Minggu Terakhir)
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                      {getHeatmapDays().map((day, idx) => {
                        const dayStr = format(day, 'yyyy-MM-dd')
                        const isDone = habitLogs.some(
                          (l) => l.habit_id === habit.id && l.completed_date === dayStr
                        )
                        return (
                          <div 
                            key={idx}
                            onClick={() => handleToggleCheckin(habit.id, dayStr)}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-bold cursor-pointer transition-all duration-200 hover:scale-110
                              ${isDone 
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs' 
                                : 'bg-neutral-50 border-brand-border text-neutral-400 hover:border-neutral-300'
                              }
                            `}
                            title={format(day, 'dd MMM yyyy')}
                          >
                            {format(day, 'd')}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Toggle button */}
                  <Button
                    onClick={() => handleToggleCheckin(habit.id, todayStr)}
                    variant={isCheckedToday ? 'outline' : 'secondary'}
                    size="sm"
                    className="w-full cursor-pointer mt-auto flex items-center justify-center gap-1.5"
                  >
                    {isCheckedToday ? (
                      <>
                        <Check size={14} className="text-brand-success" />
                        Sudah Ceklis Hari Ini
                      </>
                    ) : (
                      'Ceklis Hari Ini'
                    )}
                  </Button>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* --- HABIT CREATOR MODAL --- */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title="Kebiasaan Baru">
        <form onSubmit={handleCreateHabit} className="flex flex-col gap-4 text-left">
          <Input
            label="Nama Kebiasaan"
            value={habitForm.name}
            onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
            placeholder="Contoh: Olahraga Pagi, Membaca Buku"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Icon / Emoji"
              value={habitForm.icon}
              onChange={(e) => setHabitForm({ ...habitForm, icon: e.target.value })}
              placeholder="Contoh: 🏃‍♂️, 📚, 💧"
              required
            />
            <Select
              label="Target Mingguan"
              options={[
                { value: '1', label: '1 Hari / minggu' },
                { value: '2', label: '2 Hari / minggu' },
                { value: '3', label: '3 Hari / minggu' },
                { value: '4', label: '4 Hari / minggu' },
                { value: '5', label: '5 Hari / minggu' },
                { value: '6', label: '6 Hari / minggu' },
                { value: '7', label: '7 Hari / minggu' }
              ]}
              value={habitForm.target}
              onChange={(e) => setHabitForm({ ...habitForm, target: e.target.value })}
            />
          </div>
          <Input
            label="Warna Background Tag"
            type="color"
            value={habitForm.color}
            onChange={(e) => setHabitForm({ ...habitForm, color: e.target.value })}
          />
          <Button type="submit" className="w-full mt-2 cursor-pointer">Mulai Kebiasaan</Button>
        </form>
      </Modal>
    </div>
  )
}
