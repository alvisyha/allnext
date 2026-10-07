'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare,
  Wallet,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Briefcase,
  Circle,
  CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/dashboard/StatsCard'

import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { MiniFinanceChart } from '@/components/dashboard/MiniFinanceChart'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Card } from '@/components/ui/Card'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  // App states
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Dashboard indicators
  const [stats, setStats] = useState({
    activeTasks: 0,
    perdinCount: 0,
    balance: 0,
    eventsToday: 0
  })

  const [chartData, setChartData] = useState<any[]>([])

  // To-do list (active tasks)
  const [activeTasks, setActiveTasks] = useState<any[]>([])

  // Modal control states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isPerdinModalOpen, setIsPerdinModalOpen] = useState(false)

  // Form states
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', dueDate: '' })
  const [txForm, setTxForm] = useState({ type: 'expense', amount: '', category: 'Makanan', description: '' })
  const [eventForm, setEventForm] = useState({ title: '', date: '', startTime: '09:00', endTime: '10:00', type: 'work' })
  const defaultPerdinForm = { title: '', sppd_number: '', destination: '', purpose: '', start_date: '', end_date: '', transportation: 'Mobil Dinas', allowance_amount: '', notes: '' }
  const [perdinForm, setPerdinForm] = useState(defaultPerdinForm)

  // Transaction category options
  const txCategories = {
    income: [
      { value: 'Gaji', label: 'Gaji' },
      { value: 'Freelance', label: 'Freelance' },
      { value: 'Investasi', label: 'Investasi' },
      { value: 'Lainnya', label: 'Lainnya' }
    ],
    expense: [
      { value: 'Makanan', label: 'Makanan' },
      { value: 'Minuman', label: 'Minuman' },
      { value: 'Bensin', label: 'Bensin' },
      { value: 'Belanja', label: 'Belanja' },
      { value: 'Online', label: 'Online' },
      { value: 'Tagihan', label: 'Tagihan' },
      { value: 'Hiburan', label: 'Hiburan' },
      { value: 'Lainnya', label: 'Lainnya' }
    ]
  }

  // Fetch Dashboard core data
  const fetchDashboardData = useCallback(async (userId: string) => {
    try {
      setLoading(true)

      // 1. Fetch active tasks count
      const { count: activeTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', false)

      // 2. Fetch perdin count from Supabase perdin_history (fallback to localStorage if error/offline)
      let perdinCount = 0
      if (userId) {
        const { count: dbPerdinCount, error: perdinErr } = await supabase
          .from('perdin_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        if (!perdinErr && dbPerdinCount !== null) {
          perdinCount = dbPerdinCount
        } else {
          try {
            const stored = localStorage.getItem('allnext_perdin_history')
            if (stored) perdinCount = JSON.parse(stored).length
          } catch {}
        }
      } else {
        try {
          const stored = localStorage.getItem('allnext_perdin_history')
          if (stored) perdinCount = JSON.parse(stored).length
        } catch {}
      }

      // 3. Fetch active tasks for to-do list
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(8)
      setActiveTasks(tasksData || [])

      // 4. Fetch net balance (income - expense)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)

      let balance = 0
      if (transactions) {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0)
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0)
        balance = totalIncome - totalExpense
      }

      // 5. Fetch events today
      const startOfToday = startOfDay(new Date()).toISOString()
      const endOfToday = endOfDay(new Date()).toISOString()
      const { count: eventsTodayCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', startOfToday)
        .lte('start_time', endOfToday)

      setStats({
        activeTasks: activeTasksCount || 0,
        perdinCount,
        balance,
        eventsToday: eventsTodayCount || 0
      })

      // 5. Generate 7 Days Cashflow Chart Data
      const chartPoints = []
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const displayStr = format(d, 'dd MMM')

        let dailyIncome = 0
        let dailyExpense = 0
        if (transactions) {
          const dailyTxs = transactions.filter(t => t.date === dateStr)
          dailyIncome = dailyTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0)
          dailyExpense = dailyTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0)
        }

        chartPoints.push({
          date: displayStr,
          pemasukan: dailyIncome,
          pengeluaran: dailyExpense
        })
      }
      setChartData(chartPoints)

    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial authentication check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchDashboardData(user.id)
      } else {
        router.push('/login')
      }
    }
    checkUser()
  }, [supabase, router, fetchDashboardData])

  // Form Submissions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: taskForm.title,
        priority: taskForm.priority,
        due_date: taskForm.dueDate || null
      })
      if (error) throw error
      setIsTaskModalOpen(false)
      setTaskForm({ title: '', priority: 'medium', dueDate: '' })
      fetchDashboardData(user.id)
    } catch (err) {
      alert('Gagal membuat tugas. Silakan coba lagi.')
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: txForm.type,
        amount: Number(txForm.amount),
        category: txForm.category,
        description: txForm.description || null
      })
      if (error) throw error
      setIsTxModalOpen(false)
      setTxForm({ type: 'expense', amount: '', category: 'Makanan', description: '' })
      fetchDashboardData(user.id)
    } catch (err) {
      alert('Gagal menyimpan transaksi. Pastikan nominal dan kategori terisi.')
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const startDateTimeString = `${eventForm.date}T${eventForm.startTime}:00`
      const endDateTimeString = eventForm.endTime ? `${eventForm.date}T${eventForm.endTime}:00` : null

      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title: eventForm.title,
        start_time: new Date(startDateTimeString).toISOString(),
        end_time: endDateTimeString ? new Date(endDateTimeString).toISOString() : null,
        type: eventForm.type
      })
      if (error) throw error
      setIsEventModalOpen(false)
      setEventForm({ title: '', date: '', startTime: '09:00', endTime: '10:00', type: 'work' })
      fetchDashboardData(user.id)
    } catch (err) {
      alert('Gagal menjadwalkan agenda. Pastikan judul, tanggal, dan jam terisi.')
    }
  }

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!user) return
    try {
      const { error } = await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', taskId)
      if (error) throw error
      setActiveTasks(prev => prev.filter(t => t.id !== taskId))
      setStats(prev => ({ ...prev, activeTasks: Math.max(0, prev.activeTasks - 1) }))
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const handleCreatePerdin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        title: perdinForm.title,
        sppd_number: perdinForm.sppd_number || `SPPD/${format(new Date(), 'yyyy/MM')}/${Math.floor(100 + Math.random() * 900)}`,
        destination: perdinForm.destination,
        purpose: perdinForm.purpose,
        start_date: perdinForm.start_date,
        end_date: perdinForm.end_date,
        transportation: perdinForm.transportation,
        allowance_amount: Number(perdinForm.allowance_amount) || 0,
        notes: perdinForm.notes
      }

      if (user) {
        const { error } = await supabase.from('perdin_history').insert({
          user_id: user.id,
          ...payload
        })
        if (error) console.error('Failed to insert perdin to Supabase:', error)
      }

      // Sync to local storage
      const stored = localStorage.getItem('allnext_perdin_history')
      const existing = stored ? JSON.parse(stored) : []
      const newEntry = {
        id: crypto.randomUUID(),
        user_id: user?.id,
        ...payload,
        created_at: new Date().toISOString()
      }
      const updated = [newEntry, ...existing]
      localStorage.setItem('allnext_perdin_history', JSON.stringify(updated))

      if (user) {
        const { count } = await supabase
          .from('perdin_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        if (count !== null) setStats(prev => ({ ...prev, perdinCount: count }))
      } else {
        setStats(prev => ({ ...prev, perdinCount: updated.length }))
      }

      setIsPerdinModalOpen(false)
      setPerdinForm(defaultPerdinForm)
    } catch (err) {
      alert('Gagal menyimpan riwayat perdin.')
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val)
  }

  if (loading && !user) {
    return (
      <div className="flex-1 min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-brand-primary tracking-tight">Halo, Selamat Datang</h2>
          <p className="text-sm text-brand-muted mt-1">Inilah ringkasan kegiatan, finansial, dan to-do list Anda hari ini.</p>
        </div>
        <div className="flex items-center gap-2 self-start py-1.5 px-3 bg-neutral-100 border border-brand-border rounded-xl text-xs font-semibold text-brand-primary">
          <Sparkles className="w-3.5 h-3.5 text-brand-secondary animate-pulse" />
          <span>Produktivitas Maksimal</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Tugas Aktif"
              value={stats.activeTasks}
              subtext="Menunggu untuk diselesaikan"
              icon={<CheckSquare size={20} />}
              variant="primary"
              onQuickAction={() => setIsTaskModalOpen(true)}
              quickActionLabel="Tambah Tugas"
            />

            <StatsCard
              title="Saldo Finansial"
              value={formatRupiah(stats.balance)}
              subtext="Total sisa kas Anda"
              icon={<Wallet size={20} />}
              variant="success"
              onQuickAction={() => setIsTxModalOpen(true)}
              quickActionLabel="Catat Keuangan"
            />
            <StatsCard
              title="Jadwal Hari Ini"
              value={stats.eventsToday}
              subtext="Agenda kerja & pertemuan"
              icon={<Calendar size={20} />}
              variant="secondary"
              onQuickAction={() => setIsEventModalOpen(true)}
              quickActionLabel="Agenda Baru"
            />
            <StatsCard
              title="Total Perdin"
              value={stats.perdinCount}
              subtext="Riwayat perjalanan dinas"
              icon={<Briefcase size={20} />}
              variant="warning"
              onQuickAction={() => setIsPerdinModalOpen(true)}
              quickActionLabel="Catat Perdin"
            />
          </div>

          {/* Calendar + To-Do List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MiniCalendar />
            </div>

            {/* To-Do List */}
            <Card className="p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-brand-primary flex items-center gap-2">
                  <CheckSquare size={16} className="text-brand-secondary" />
                  To-Do List
                </h3>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="text-[10px] font-semibold text-brand-secondary hover:underline cursor-pointer"
                >
                  + Tambah
                </button>
              </div>
              {activeTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center py-8">
                  <p className="text-xs text-brand-muted">Tidak ada tugas aktif. 🎉</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[320px]">
                  {activeTasks.map(task => {
                    const priorityColors: Record<string, string> = {
                      high: 'text-brand-danger',
                      medium: 'text-brand-warning',
                      low: 'text-brand-success'
                    }
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleToggleTask(task.id, task.is_completed)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:bg-neutral-50/60 transition-colors text-left cursor-pointer group"
                      >
                        <Circle size={16} className="text-neutral-300 group-hover:text-brand-secondary shrink-0 transition-colors" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-primary truncate">{task.title}</p>
                          {task.due_date && (
                            <span className="text-[10px] text-brand-muted">
                              Tenggat: {format(new Date(task.due_date), 'dd MMM yyyy')}
                            </span>
                          )}
                        </div>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[task.priority] || 'text-brand-muted'} bg-current`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Arus Kas section */}
          <div className="grid grid-cols-1 gap-6">
            <MiniFinanceChart data={chartData} />
          </div>
        </>
      )}

      {/* ================================================
          1. MODAL TAMBAH TUGAS (Task Modal)
          ================================================ */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Tambah Tugas Baru">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4 text-left">
          <Input
            label="Keterangan Tugas"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Contoh: Menyelesaikan presentasi laporan"
            required
          />
          <Select
            label="Prioritas"
            options={[
              { value: 'low', label: 'Rendah (Green)' },
              { value: 'medium', label: 'Sedang (Orange)' },
              { value: 'high', label: 'Tinggi (Red)' }
            ]}
            value={taskForm.priority}
            onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
          />
          <Input
            label="Tenggat Waktu (Opsional)"
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
          />
          <Button type="submit" className="w-full mt-2 cursor-pointer">Simpan Tugas</Button>
        </form>
      </Modal>



      {/* ================================================
          3. MODAL CATAT KEUANGAN (Transaction Modal)
          ================================================ */}
      <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="Catat Transaksi Baru">
        <form onSubmit={handleCreateTransaction} className="flex flex-col gap-4 text-left">
          <Select
            label="Jenis Transaksi"
            options={[
              { value: 'expense', label: 'Pengeluaran (Expense)' },
              { value: 'income', label: 'Pemasukan (Income)' }
            ]}
            value={txForm.type}
            onChange={(e) => {
              const newType = e.target.value
              setTxForm({
                ...txForm,
                type: newType,
                category: newType === 'income' ? 'Gaji' : 'Makanan'
              })
            }}
          />
          <Input
            label="Nominal Rupiah (Rp)"
            type="number"
            value={txForm.amount}
            onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
            placeholder="Masukkan angka tanpa titik/koma"
            required
          />
          <Select
            label="Kategori"
            options={txForm.type === 'income' ? txCategories.income : txCategories.expense}
            value={txForm.category}
            onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
          />
          <Input
            label="Deskripsi / Catatan"
            value={txForm.description}
            onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
            placeholder="Contoh: Warung makan siang, Gaji Bulanan"
          />
          <Button type="submit" className="w-full mt-2 cursor-pointer">Simpan Transaksi</Button>
        </form>
      </Modal>

      {/* ================================================
          4. MODAL AGENDA BARU (Event Modal)
          ================================================ */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Jadwalkan Agenda Baru">
        <form onSubmit={handleCreateEvent} className="flex flex-col gap-4 text-left">
          <Input
            label="Nama Agenda"
            value={eventForm.title}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
            placeholder="Contoh: Meeting Proyek, Temu Klien"
            required
          />
          <Input
            label="Tanggal Agenda"
            type="date"
            value={eventForm.date}
            onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jam Mulai"
              type="time"
              value={eventForm.startTime}
              onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
              required
            />
            <Input
              label="Jam Selesai"
              type="time"
              value={eventForm.endTime}
              onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
            />
          </div>
          <Select
            label="Tipe Agenda"
            options={[
              { value: 'work', label: 'Pekerjaan (Work)' },
              { value: 'meeting', label: 'Pertemuan (Meeting)' },
              { value: 'personal', label: 'Pribadi (Personal)' },
              { value: 'other', label: 'Lainnya' }
            ]}
            value={eventForm.type}
            onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
          />
          <Button type="submit" className="w-full mt-2 cursor-pointer">Jadwalkan</Button>
        </form>
      </Modal>

      {/* ================================================
          5. MODAL CATAT PERDIN (Perdin Modal)
          ================================================ */}
      <Modal isOpen={isPerdinModalOpen} onClose={() => setIsPerdinModalOpen(false)} title="Catat Riwayat Perjalanan Dinas">
        <form onSubmit={handleCreatePerdin} className="flex flex-col gap-4 text-left">
          <Input
            label="Judul Perjalanan Dinas"
            value={perdinForm.title}
            onChange={(e) => setPerdinForm({ ...perdinForm, title: e.target.value })}
            placeholder="Judul Perjalanan Dinas"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nomor SPPD"
              value={perdinForm.sppd_number}
              onChange={(e) => setPerdinForm({ ...perdinForm, sppd_number: e.target.value })}
              placeholder="1/KU.03.2-SPt/3279/2025"
            />
            <Input
              label="Kota / Lokasi Tujuan"
              value={perdinForm.destination}
              onChange={(e) => setPerdinForm({ ...perdinForm, destination: e.target.value })}
              placeholder="Bandung, Jawa Barat"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Berangkat"
              type="date"
              value={perdinForm.start_date}
              onChange={(e) => setPerdinForm({ ...perdinForm, start_date: e.target.value })}
              required
            />
            <Input
              label="Tanggal Kembali"
              type="date"
              value={perdinForm.end_date}
              onChange={(e) => setPerdinForm({ ...perdinForm, end_date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Moda Transportasi"
              options={[
                { value: 'Mobil Dinas', label: '🚗 Mobil Dinas' },
                { value: 'Kendaraan Pribadi', label: '🏍️ Kendaraan Pribadi' },
                { value: 'Pesawat', label: '✈️ Pesawat' },
                { value: 'Kereta', label: '🚆 Kereta' },
                { value: 'Lainnya', label: '🧭 Lainnya' }
              ]}
              value={perdinForm.transportation}
              onChange={(e) => setPerdinForm({ ...perdinForm, transportation: e.target.value })}
            />
            <Input
              label="Biaya / Uang Saku (Rp)"
              type="number"
              value={perdinForm.allowance_amount}
              onChange={(e) => setPerdinForm({ ...perdinForm, allowance_amount: e.target.value })}
              placeholder="Contoh: 150000"
            />
          </div>
          <Button type="submit" className="w-full mt-2 cursor-pointer">Simpan Riwayat Perdin</Button>
        </form>
      </Modal>
    </div>
  )
}
