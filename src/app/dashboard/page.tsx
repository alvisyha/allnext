'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare,
  Flame,
  Wallet,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity'
import { MiniFinanceChart } from '@/components/dashboard/MiniFinanceChart'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  // App states
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Dashboard indicators
  const [stats, setStats] = useState({
    activeTasks: 0,
    habitsCompletedToday: 0,
    balance: 0,
    eventsToday: 0
  })

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  // Modal control states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)

  // Form states
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', dueDate: '' })
  const [txForm, setTxForm] = useState({ type: 'expense', amount: '', category: 'Makanan', description: '' })
  const [eventForm, setEventForm] = useState({ title: '', date: '', startTime: '09:00', endTime: '10:00', type: 'work' })
  const [habitForm, setHabitForm] = useState({ name: '', icon: '✅', color: '#6c63ff', target: '7' })

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
      { value: 'Transport', label: 'Transport' },
      { value: 'Belanja', label: 'Belanja' },
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

      // 2. Fetch habits logged today
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const { data: habitLogsToday } = await supabase
        .from('habit_logs')
        .select('*, habits(user_id)')
        .eq('completed_date', todayStr)

      const loggedTodayCount = habitLogsToday?.filter(log => log.habits && log.habits.user_id === userId).length || 0

      // 3. Fetch net balance (income - expense)
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

      // 4. Fetch events today
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
        habitsCompletedToday: loggedTodayCount,
        balance,
        eventsToday: eventsTodayCount || 0
      })

      // 5. Generate recent activities feed based on latest items
      const activitiesList: ActivityItem[] = []

      // Task activities
      const { data: latestTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      latestTasks?.forEach(t => {
        activitiesList.push({
          id: `task-${t.id}`,
          title: t.is_completed ? `Menyelesaikan tugas: ${t.title}` : `Menambahkan tugas: ${t.title}`,
          description: `Prioritas: ${t.priority.toUpperCase()}`,
          time: format(new Date(t.created_at), 'dd MMM yyyy, HH:mm'),
          type: 'task'
        })
      })

      // Transaction activities
      const { data: latestTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      latestTransactions?.forEach(t => {
        activitiesList.push({
          id: `tx-${t.id}`,
          title: t.type === 'income' ? `Menerima pemasukan` : `Mencatat pengeluaran`,
          description: `${t.category} - Rp ${Number(t.amount).toLocaleString('id-ID')}`,
          time: format(new Date(t.created_at), 'dd MMM yyyy, HH:mm'),
          type: 'finance'
        })
      })

      // Event activities
      const { data: latestEvents } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      latestEvents?.forEach(e => {
        activitiesList.push({
          id: `evt-${e.id}`,
          title: `Agenda dijadwalkan: ${e.title}`,
          description: `Tipe: ${e.type}`,
          time: format(new Date(e.created_at), 'dd MMM yyyy, HH:mm'),
          type: 'event'
        })
      })

      // Sort activities by date desc
      activitiesList.sort((a, b) => b.time.localeCompare(a.time))
      setRecentActivities(activitiesList.slice(0, 5))

      // 6. Generate 7 Days Cashflow Chart Data
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
      setHabitForm({ name: '', icon: '✅', color: '#6c63ff', target: '7' })
      fetchDashboardData(user.id)
    } catch (err) {
      alert('Gagal menyimpan kebiasaan baru.')
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
            />

            <StatsCard
              title="Saldo Finansial"
              value={formatRupiah(stats.balance)}
              subtext="Total sisa kas Anda"
              icon={<Wallet size={20} />}
              variant="success"
            />
            <StatsCard
              title="Jadwal Hari Ini"
              value={stats.eventsToday}
              subtext="Agenda kerja & pertemuan"
              icon={<Calendar size={20} />}
              variant="secondary"
            />
            <StatsCard
              title="Habit Hari Ini"
              value={stats.habitsCompletedToday}
              subtext="Sudah diceklis hari ini"
              icon={<Flame size={20} />}
              variant="warning"
            />
          </div>

          {/* Grid Layout for Charts & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-2">
              <MiniFinanceChart data={chartData} />
            </div>

            {/* Quick Actions Component */}
            <div>
              <QuickActions
                onAddTask={() => setIsTaskModalOpen(true)}
                onAddTransaction={() => setIsTxModalOpen(true)}
                onAddEvent={() => setIsEventModalOpen(true)}
                onAddHabit={() => setIsHabitModalOpen(true)}
              />
            </div>
          </div>

          {/* Recent activities section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <RecentActivity activities={recentActivities} />
            </div>
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
          2. MODAL KEBIASAAN BARU (Habit Modal)
          ================================================ */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title="Buat Kebiasaan Baru">
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
              label="Target per Minggu"
              options={[
                { value: '1', label: '1 Hari' },
                { value: '2', label: '2 Hari' },
                { value: '3', label: '3 Hari' },
                { value: '4', label: '4 Hari' },
                { value: '5', label: '5 Hari' },
                { value: '6', label: '6 Hari' },
                { value: '7', label: '7 Hari' }
              ]}
              value={habitForm.target}
              onChange={(e) => setHabitForm({ ...habitForm, target: e.target.value })}
            />
          </div>
          <Input
            label="Warna Tag (Hex)"
            type="color"
            value={habitForm.color}
            onChange={(e) => setHabitForm({ ...habitForm, color: e.target.value })}
          />
          <Button type="submit" className="w-full mt-2 cursor-pointer">Mulai Kebiasaan</Button>
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
    </div>
  )
}
