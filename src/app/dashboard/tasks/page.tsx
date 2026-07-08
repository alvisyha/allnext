'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertCircle,
  Bell,
  Clock,
  CheckCircle,
  FolderDot
} from 'lucide-react'
import { format, isBefore, startOfDay } from 'date-fns'

export default function TasksPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Data states
  const [tasks, setTasks] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])

  // Filters & sorts
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [taskSort, setTaskSort] = useState<'created' | 'due' | 'priority'>('created')

  // Modals controller
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)

  // Forms
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' })
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', remindAt: '' })

  const fetchTasksAndReminders = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (tasksData) setTasks(tasksData)

      // Fetch reminders
      const { data: remindersData } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('remind_at', { ascending: true })

      if (remindersData) setReminders(remindersData)
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
        fetchTasksAndReminders(user.id)
      }
    }
    init()
  }, [supabase, fetchTasksAndReminders])

  // --- TASK ACTIONS ---
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority,
        due_date: taskForm.dueDate || null,
        is_completed: false
      })
      if (error) throw error
      setIsTaskModalOpen(false)
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '' })
      fetchTasksAndReminders(user.id)
    } catch (err) {
      alert('Gagal menambahkan tugas')
    }
  }

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!user) return
    try {
      // Optimistic state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !isCompleted } : t))
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !isCompleted })
        .eq('id', taskId)

      if (error) throw error
      fetchTasksAndReminders(user.id)
    } catch (err) {
      alert('Gagal memperbarui status tugas')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return
    if (!confirm('Hapus tugas ini?')) return
    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== taskId))
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
      fetchTasksAndReminders(user.id)
    } catch (err) {
      alert('Gagal menghapus tugas')
    }
  }

  // --- REMINDER ACTIONS ---
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('reminders').insert({
        user_id: user.id,
        title: reminderForm.title,
        description: reminderForm.description || null,
        remind_at: new Date(reminderForm.remindAt).toISOString(),
        is_done: false
      })
      if (error) throw error
      setIsReminderModalOpen(false)
      setReminderForm({ title: '', description: '', remindAt: '' })
      fetchTasksAndReminders(user.id)
    } catch (err) {
      alert('Gagal menambahkan pengingat')
    }
  }

  const handleToggleReminder = async (reminderId: string, isDone: boolean) => {
    if (!user) return
    try {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, is_done: !isDone } : r))
      const { error } = await supabase
        .from('reminders')
        .update({ is_done: !isDone })
        .eq('id', reminderId)

      if (error) throw error
      fetchTasksAndReminders(user.id)
    } catch (err) {
      alert('Gagal merubah status pengingat')
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!user) return
    if (!confirm('Hapus pengingat ini?')) return
    try {
      setReminders(prev => prev.filter(r => r.id !== reminderId))
      const { error } = await supabase.from('reminders').delete().eq('id', reminderId)
      if (error) throw error
      fetchTasksAndReminders(user.id)
    } catch (err) {
      alert('Gagal menghapus pengingat')
    }
  }

  // Filter & Sort Tasks
  const getProcessedTasks = () => {
    let result = [...tasks]

    // Status filter
    if (taskFilter === 'pending') {
      result = result.filter(t => !t.is_completed)
    } else if (taskFilter === 'completed') {
      result = result.filter(t => t.is_completed)
    }

    // Sort order
    if (taskSort === 'created') {
      result.sort((a, b) => b.created_at.localeCompare(a.created_at))
    } else if (taskSort === 'due') {
      result.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      })
    } else if (taskSort === 'priority') {
      const order = { high: 1, medium: 2, low: 3 }
      result.sort((a, b) => {
        const keyA = a.priority as 'high' | 'medium' | 'low'
        const keyB = b.priority as 'high' | 'medium' | 'low'
        return order[keyA] - order[keyB]
      })
    }

    return result
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'neutral'
      default: return 'neutral'
    }
  }

  const isTaskOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    const today = startOfDay(new Date())
    const taskDue = startOfDay(new Date(dueDate))
    return isBefore(taskDue, today)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-brand-primary tracking-tight">Daftar Tugas & Pengingat</h2>
          <p className="text-sm text-brand-muted mt-1">Atur prioritas pekerjaan Anda dan atur alarm visual Anda di sini.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button onClick={() => setIsTaskModalOpen(true)} size="sm" className="cursor-pointer">
            <Plus size={16} className="mr-1.5" /> Tugas Baru
          </Button>
          <Button onClick={() => setIsReminderModalOpen(true)} variant="outline" size="sm" className="cursor-pointer">
            <Bell size={16} className="mr-1.5" /> Pengingat Baru
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TO-DO LIST PANEL (Left, 2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="p-6 flex flex-col">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border mb-4">
                <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                  <FolderDot size={18} className="text-brand-secondary" />
                  Papan Tugas
                </h3>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={taskFilter}
                    onChange={(e: any) => setTaskFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Status' },
                      { value: 'pending', label: 'Belum Selesai' },
                      { value: 'completed', label: 'Selesai' }
                    ]}
                    className="py-1 px-3 text-xs w-[140px]"
                  />
                  <Select
                    value={taskSort}
                    onChange={(e: any) => setTaskSort(e.target.value)}
                    options={[
                      { value: 'created', label: 'Urut: Terbaru' },
                      { value: 'due', label: 'Urut: Tenggat' },
                      { value: 'priority', label: 'Urut: Prioritas' }
                    ]}
                    className="py-1 px-3 text-xs w-[140px]"
                  />
                </div>
              </div>

              {/* Tasks List */}
              {getProcessedTasks().length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-2">📋</span>
                  <p className="text-sm text-brand-muted">Tidak ada tugas yang ditemukan.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {getProcessedTasks().map((task) => (
                    <div 
                      key={task.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border border-brand-border transition-all duration-200 text-left
                        ${task.is_completed ? 'bg-neutral-50/50' : 'bg-white hover:bg-neutral-50/40'}
                      `}
                    >
                      {/* Checkbox */}
                      <button 
                        onClick={() => handleToggleTask(task.id, task.is_completed)}
                        className="text-neutral-400 hover:text-brand-primary outline-none focus:outline-none shrink-0 mt-0.5 cursor-pointer"
                      >
                        {task.is_completed ? (
                          <CheckCircle2 size={18} className="text-brand-success" />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>

                      {/* Info Area */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold leading-relaxed truncate
                          ${task.is_completed ? 'line-through text-brand-muted/80 font-normal' : 'text-brand-primary'}
                        `}>
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className={`text-xs mt-1 leading-relaxed
                            ${task.is_completed ? 'text-brand-muted/60' : 'text-brand-muted'}
                          `}>
                            {task.description}
                          </p>
                        )}

                        {/* Badges details */}
                        <div className="flex flex-wrap items-center gap-2 mt-3.5">
                          <Badge variant={getPriorityBadgeVariant(task.priority)}>
                            {task.priority === 'high' ? 'Penting' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                          </Badge>
                          
                          {task.due_date && (
                            <span className={`text-[10px] font-semibold flex items-center gap-1
                              ${isTaskOverdue(task.due_date) && !task.is_completed 
                                ? 'text-brand-danger bg-red-50 px-2 py-0.5 rounded-lg border border-red-100' 
                                : 'text-brand-muted'
                              }
                            `}>
                              <Calendar size={11} />
                              {isTaskOverdue(task.due_date) && !task.is_completed 
                                ? `Telat: ${format(new Date(task.due_date), 'dd MMM yyyy')}` 
                                : format(new Date(task.due_date), 'dd MMM yyyy')
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deletes */}
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded-lg text-neutral-450 hover:bg-neutral-100 hover:text-brand-danger transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* REMINDERS PANEL (Right, 1 Col) */}
          <div className="flex flex-col gap-4">
            <Card className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
                <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                  <Bell size={18} className="text-brand-secondary" />
                  Pengingat Alarm
                </h3>
              </div>

              {reminders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <span className="text-2xl mb-2">🔔</span>
                  <p className="text-sm text-brand-muted">Belum ada pengingat visual.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
                  {reminders.map((rem) => (
                    <div 
                      key={rem.id}
                      className={`p-4 rounded-xl border border-brand-border transition-all text-left flex items-start gap-3
                        ${rem.is_done ? 'bg-neutral-50/50' : 'bg-white hover:bg-neutral-50/30'}
                      `}
                    >
                      <button
                        onClick={() => handleToggleReminder(rem.id, rem.is_done)}
                        className="text-neutral-400 hover:text-brand-primary shrink-0 mt-0.5 cursor-pointer"
                      >
                        {rem.is_done ? (
                          <CheckCircle size={16} className="text-brand-success" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate
                          ${rem.is_done ? 'line-through text-brand-muted/70' : 'text-brand-primary'}
                        `}>
                          {rem.title}
                        </p>
                        {rem.description && (
                          <p className={`text-xs mt-0.5 truncate
                            ${rem.is_done ? 'text-brand-muted/50' : 'text-brand-muted'}
                          `}>
                            {rem.description}
                          </p>
                        )}
                        <span className="text-[10px] font-semibold text-brand-secondary mt-2 flex items-center gap-1">
                          <Clock size={10} />
                          {format(new Date(rem.remind_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="p-1 rounded-lg text-neutral-450 hover:bg-neutral-100 hover:text-brand-danger transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* --- ADD TASK MODAL --- */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Tambah Tugas Baru">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4 text-left">
          <Input
            label="Keterangan Tugas"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Tulis tugas baru Anda..."
            required
          />
          <Input
            label="Detil / Catatan Tambahan (Opsional)"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Materi presentasi, tautan penting, dsb."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prioritas"
              options={[
                { value: 'low', label: 'Rendah (Low)' },
                { value: 'medium', label: 'Sedang (Medium)' },
                { value: 'high', label: 'Tinggi (High)' }
              ]}
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
            />
            <Input
              label="Tenggat Tanggal"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full mt-2 cursor-pointer">Simpan Tugas</Button>
        </form>
      </Modal>

      {/* --- ADD REMINDER MODAL --- */}
      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Tambah Pengingat Baru">
        <form onSubmit={handleCreateReminder} className="flex flex-col gap-4 text-left">
          <Input
            label="Judul Alarm / Pengingat"
            value={reminderForm.title}
            onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
            placeholder="Contoh: Ambil pakaian laundry, Telepon klien..."
            required
          />
          <Input
            label="Deskripsi Pendek"
            value={reminderForm.description}
            onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
            placeholder="Keterangan tambahan alarm"
          />
          <Input
            label="Tanggal & Waktu Pengingat"
            type="datetime-local"
            value={reminderForm.remindAt}
            onChange={(e) => setReminderForm({ ...reminderForm, remindAt: e.target.value })}
            required
          />
          <Button type="submit" className="w-full mt-2 cursor-pointer">Pasang Pengingat</Button>
        </form>
      </Modal>
    </div>
  )
}
