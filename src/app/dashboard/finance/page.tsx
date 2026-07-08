'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Filter, 
  FolderPlus,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieIcon
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts'
import { format, subDays } from 'date-fns'

export default function FinancePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Data states
  const [transactions, setTransactions] = useState<any[]>([])

  // Filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: 'Makanan',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  })

  // Categories helper lists
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

  // Soft minimalist colors for spending charts
  const COLORS = ['#6c63ff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const fetchTransactions = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setTransactions(data)
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
        fetchTransactions(user.id)
      }
    }
    init()
  }, [supabase, fetchTransactions])

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        description: form.description || null,
        date: form.date
      })
      if (error) throw error
      setIsModalOpen(false)
      setForm({
        type: 'expense',
        amount: '',
        category: 'Makanan',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      })
      fetchTransactions(user.id)
    } catch (err) {
      alert('Gagal mencatat transaksi. Silakan coba lagi.')
    }
  }

  const handleDeleteTransaction = async (txId: string) => {
    if (!user) return
    if (!confirm('Hapus pencatatan transaksi ini?')) return
    try {
      setTransactions(prev => prev.filter(t => t.id !== txId))
      const { error } = await supabase.from('transactions').delete().eq('id', txId)
      if (error) throw error
      fetchTransactions(user.id)
    } catch (err) {
      alert('Gagal menghapus transaksi')
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val)
  }

  // --- STATS CALCULATIONS ---
  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0)
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0)
  const netBalance = incomeTotal - expenseTotal

  // Filtered transactions list
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const isMatch = typeFilter === 'all' || t.type === typeFilter
      const isCatMatch = categoryFilter === 'all' || t.category === categoryFilter
      return isMatch && isCatMatch
    })
  }

  // Category breakdown for Pie Chart
  const getCategoryBreakdown = () => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const categoryTotals: { [key: string]: number } = {}
    
    expenses.forEach(ex => {
      categoryTotals[ex.category] = (categoryTotals[ex.category] || 0) + Number(ex.amount)
    })

    return Object.keys(categoryTotals).map(catName => ({
      name: catName,
      value: categoryTotals[catName]
    }))
  }

  // 14 Days Cashflow Chart Data generator
  const getChartData = () => {
    const points = []
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const displayStr = format(d, 'dd MMM')
      
      const dailyTransactions = transactions.filter(t => t.date === dateStr)
      const dailyIncome = dailyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0)
      const dailyExpense = dailyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0)

      points.push({
        date: displayStr,
        Pemasukan: dailyIncome,
        Pengeluaran: dailyExpense
      })
    }
    return points
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-brand-primary tracking-tight">Manajemen Finansial</h2>
          <p className="text-sm text-brand-muted mt-1">Pantau arus kas harian Anda, kelola pengeluaran, dan catat pemasukan Anda secara praktis.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm" className="self-start cursor-pointer">
          <Plus size={16} className="mr-1.5" /> Catat Transaksi
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Balance Net */}
            <Card className="p-6 border-brand-border bg-white flex items-center justify-between hover:shadow-xs transition-shadow">
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Sisa Saldo Kas</span>
                <span className="text-2xl font-bold text-brand-primary mt-1">{formatRupiah(netBalance)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <DollarSign size={18} />
              </div>
            </Card>

            {/* Income */}
            <Card className="p-6 border-brand-border bg-white flex items-center justify-between hover:shadow-xs transition-shadow">
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Total Pemasukan</span>
                <span className="text-xl font-bold text-brand-success mt-1">{formatRupiah(incomeTotal)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-brand-success">
                <ArrowDownLeft size={18} />
              </div>
            </Card>

            {/* Expense */}
            <Card className="p-6 border-brand-border bg-white flex items-center justify-between hover:shadow-xs transition-shadow">
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Total Pengeluaran</span>
                <span className="text-xl font-bold text-brand-danger mt-1">{formatRupiah(expenseTotal)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-brand-danger">
                <ArrowUpRight size={18} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Transaction logs history (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card className="p-6 flex flex-col h-full">
                {/* Header list of transactions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border mb-4">
                  <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                    <DollarSign size={18} className="text-brand-secondary" />
                    Riwayat Transaksi
                  </h3>

                  {/* Filter tools bar */}
                  <div className="flex items-center gap-2 self-start">
                    <Select
                      value={typeFilter}
                      onChange={(e: any) => setTypeFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Semua Transaksi' },
                        { value: 'income', label: 'Pemasukan' },
                        { value: 'expense', label: 'Pengeluaran' }
                      ]}
                      className="py-1 px-3 text-xs w-[140px]"
                    />
                    <Select
                      value={categoryFilter}
                      onChange={(e: any) => setCategoryFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Semua Kategori' },
                        ...txCategories.income.map(i => ({ value: i.value, label: i.label })),
                        ...txCategories.expense.map(e => ({ value: e.value, label: e.label }))
                      ]}
                      className="py-1 px-3 text-xs w-[140px]"
                    />
                  </div>
                </div>

                {/* Table or logs list */}
                {getFilteredTransactions().length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-2">💸</span>
                    <p className="text-sm text-brand-muted">Belum ada catatan keuangan yang cocok.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px]">
                    {getFilteredTransactions().map((t) => (
                      <div 
                        key={t.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-brand-border hover:bg-neutral-50/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Indicator badge */}
                          <div className={`p-2.5 rounded-xl border shrink-0
                            ${t.type === 'income' ? 'bg-emerald-50 border-emerald-100 text-brand-success' : 'bg-red-50 border-red-100 text-brand-danger'}
                          `}>
                            {t.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-brand-primary truncate">
                              {t.description || t.category}
                            </h4>
                            <span className="text-xs text-brand-muted mt-0.5 block">
                              {t.category} • {format(new Date(t.date), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`text-sm font-bold
                            ${t.type === 'income' ? 'text-brand-success' : 'text-brand-danger'}
                          `}>
                            {t.type === 'income' ? '+' : '-'} {formatRupiah(Number(t.amount))}
                          </span>
                          
                          <button 
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-brand-danger transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Visual analytics */}
            <div className="flex flex-col gap-6">
              {/* Cashflow Trends */}
              <Card className="p-6">
                <h4 className="font-bold text-sm text-brand-primary text-left mb-4">Tren 14 Hari</h4>
                <div className="h-[180px] w-full">
                  {getChartData().length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-brand-muted">Belum ada riwayat casflow</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" fill="#10b981" fillOpacity={0.06} strokeWidth={2} />
                        <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fill="#ef4444" fillOpacity={0.06} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Pie breakdown of categories */}
              <Card className="p-6 flex flex-col justify-between">
                <h4 className="font-bold text-sm text-brand-primary text-left mb-4 flex items-center gap-1.5">
                  <PieIcon size={16} className="text-brand-secondary" />
                  Alokasi Pengeluaran
                </h4>
                
                <div className="h-[200px] w-full flex items-center justify-center">
                  {getCategoryBreakdown().length === 0 ? (
                    <div className="text-xs text-brand-muted align-center">Belum ada data pengeluaran terdaftar.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoryBreakdown()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getCategoryBreakdown().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatRupiah(Number(value || 0))} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* --- ADD TRANSACTION MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mencatat Transaksi Baru">
        <form onSubmit={handleCreateTransaction} className="flex flex-col gap-4 text-left">
          <Select
            label="Jenis Transaksi"
            options={[
              { value: 'expense', label: 'Pengeluaran (Expense)' },
              { value: 'income', label: 'Pemasukan (Income)' }
            ]}
            value={form.type}
            onChange={(e) => {
              const newType = e.target.value
              setForm({ 
                ...form, 
                type: newType, 
                category: newType === 'income' ? 'Gaji' : 'Makanan'
              })
            }}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nominal Transaksi (Rp)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Contoh: 50000"
              required
            />
            <Input
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <Select
            label="Kategori"
            options={form.type === 'income' ? txCategories.income : txCategories.expense}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            label="Deskripsi Transaksi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Keterangan tambahan"
          />
          <Button type="submit" className="w-full mt-2 cursor-pointer">Simpan Catatan</Button>
        </form>
      </Modal>
    </div>
  )
}
