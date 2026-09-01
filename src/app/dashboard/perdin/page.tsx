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
  Plane,
  Train,
  Car,
  Bus,
  Ship,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  FileText,
  Edit3,
  Eye,
  Briefcase,
  Navigation,
  Sparkles
} from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'

// Type Definition for Perjalanan Dinas History
export interface OfficialTravel {
  id: string
  user_id?: string
  title: string
  sppd_number: string
  destination: string
  purpose: string
  start_date: string
  end_date: string
  transportation: 'Pesawat' | 'Kereta' | 'Mobil Dinas' | 'Travel' | 'Kapal' | 'Lainnya'
  allowance_amount: number
  notes: string
  created_at?: string
}

const STORAGE_KEY = 'allnext_perdin_history'

// Initial Sample Travels (Historical Trips Done)
const INITIAL_SAMPLE_TRAVELS: OfficialTravel[] = [
  {
    id: 'sample-1',
    title: 'Audit Operasional Cabang Jawa Timur',
    sppd_number: 'SPPD/2026/08/042',
    destination: 'Surabaya, Jawa Timur',
    purpose: 'Melakukan peninjauan dan evaluasi standar operasional cabang regional Jawa Timur.',
    start_date: '2026-08-10',
    end_date: '2026-08-14',
    transportation: 'Pesawat',
    allowance_amount: 3800000,
    notes: 'Audit berjalan lancar. Laporan temuan telah diserahkan ke Kepala Cabang. Seluruh target evaluasi terpenuhi.',
    created_at: new Date('2026-08-15').toISOString()
  },
  {
    id: 'sample-2',
    title: 'Rapat Koordinasi Nasional (Rakornas)',
    sppd_number: 'SPPD/2026/07/019',
    destination: 'Bandung, Jawa Barat',
    purpose: 'Menghadiri rapat penyusunan strategi kuartal III dan penyelarasan KPI antar divisi.',
    start_date: '2026-07-20',
    end_date: '2026-07-22',
    transportation: 'Kereta',
    allowance_amount: 2100000,
    notes: 'Diskusi mengenai ekspansi bisnis berhasil disepakati. Notulensi rapat disetujui oleh Direksi.',
    created_at: new Date('2026-07-23').toISOString()
  },
  {
    id: 'sample-3',
    title: 'Negosiasi Kontrak Klien Strategis',
    sppd_number: 'SPPD/2026/06/008',
    destination: 'Denpasar, Bali',
    purpose: 'Finalisasi adendum perjanjian kerja sama dengan PT Nusantara Tech.',
    start_date: '2026-06-05',
    end_date: '2026-06-08',
    transportation: 'Pesawat',
    allowance_amount: 4500000,
    notes: 'Kontrak senilai Rp 1.2M berhasil ditandatangani. Berkas fisik telah disimpan oleh tim legal.',
    created_at: new Date('2026-06-09').toISOString()
  },
  {
    id: 'sample-4',
    title: 'Supervisi Lapangan Proyek Server',
    sppd_number: 'SPPD/2026/05/012',
    destination: 'Semarang, Jawa Tengah',
    purpose: 'Pemeriksaan progres fisik pengadaan infrastruktur server cabang.',
    start_date: '2026-05-12',
    end_date: '2026-05-15',
    transportation: 'Mobil Dinas',
    allowance_amount: 1800000,
    notes: 'Pemasangan server dan pengujian sistem jaringan telah rampung 100%.',
    created_at: new Date('2026-05-16').toISOString()
  }
]

const TRANSPORTATION_ICONS = {
  Pesawat: Plane,
  Kereta: Train,
  'Mobil Dinas': Car,
  Travel: Bus,
  Kapal: Ship,
  Lainnya: Navigation
}

export default function OfficialTravelHistoryPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [travels, setTravels] = useState<OfficialTravel[]>([])

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [transportFilter, setTransportFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration' | 'cost'>('newest')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingTravel, setEditingTravel] = useState<OfficialTravel | null>(null)
  const [selectedTravel, setSelectedTravel] = useState<OfficialTravel | null>(null)

  // Form State
  const [form, setForm] = useState({
    title: '',
    sppd_number: '',
    destination: '',
    purpose: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    transportation: 'Mobil Dinas' as OfficialTravel['transportation'],
    allowance_amount: '',
    notes: ''
  })

  // Format Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val)
  }

  // Durasi Perjalanan Dinas
  const calculateDays = (startStr: string, endStr: string) => {
    try {
      const start = parseISO(startStr)
      const end = parseISO(endStr)
      const days = differenceInDays(end, start) + 1
      return days > 0 ? days : 1
    } catch {
      return 1
    }
  }

  const saveToLocalStorage = (data: OfficialTravel[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save to local storage', e)
    }
  }

  // Fetch Data (Supabase with LocalStorage Fallback)
  const fetchTravels = useCallback(async (userId: string | null) => {
    setLoading(true)
    let fetchedFromSupabase = false

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('official_travels')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false })

        if (!error && data) {
          setTravels(data)
          saveToLocalStorage(data)
          fetchedFromSupabase = true
        }
      } catch (err) {
        console.warn('Supabase fetch notice: using local state fallback', err)
      }
    }

    if (!fetchedFromSupabase) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          setTravels(JSON.parse(saved))
        } catch {
          setTravels(INITIAL_SAMPLE_TRAVELS)
          saveToLocalStorage(INITIAL_SAMPLE_TRAVELS)
        }
      } else {
        setTravels(INITIAL_SAMPLE_TRAVELS)
        saveToLocalStorage(INITIAL_SAMPLE_TRAVELS)
      }
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchTravels(user.id)
      } else {
        fetchTravels(null)
      }
    }
    init()
  }, [supabase, fetchTravels])

  // Open Create Modal
  const openCreateModal = () => {
    setEditingTravel(null)
    setForm({
      title: '',
      sppd_number: '',
      destination: '',
      purpose: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      transportation: 'Mobil Dinas',
      allowance_amount: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (travel: OfficialTravel) => {
    setEditingTravel(travel)
    setForm({
      title: travel.title,
      sppd_number: travel.sppd_number || '',
      destination: travel.destination,
      purpose: travel.purpose || '',
      start_date: travel.start_date,
      end_date: travel.end_date,
      transportation: travel.transportation,
      allowance_amount: travel.allowance_amount ? travel.allowance_amount.toString() : '',
      notes: travel.notes || ''
    })
    setIsModalOpen(true)
  }

  // Open Detail Modal
  const openDetailModal = (travel: OfficialTravel) => {
    setSelectedTravel(travel)
    setIsDetailModalOpen(true)
  }

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: Partial<OfficialTravel> = {
      title: form.title,
      sppd_number: form.sppd_number || `SPPD/${format(new Date(), 'yyyy/MM')}/${Math.floor(100 + Math.random() * 900)}`,
      destination: form.destination,
      purpose: form.purpose,
      start_date: form.start_date,
      end_date: form.end_date,
      transportation: form.transportation,
      allowance_amount: form.allowance_amount ? Number(form.allowance_amount) : 0,
      notes: form.notes
    }

    let updatedList: OfficialTravel[] = []

    if (editingTravel) {
      updatedList = travels.map(t => t.id === editingTravel.id ? { ...t, ...payload } as OfficialTravel : t)
      setTravels(updatedList)
      saveToLocalStorage(updatedList)

      if (user) {
        try {
          await supabase.from('official_travels').update(payload).eq('id', editingTravel.id)
        } catch (err) {
          console.error('Error updating travel in Supabase', err)
        }
      }
    } else {
      const newTravel: OfficialTravel = {
        id: `perdin-${Date.now()}`,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        ...(payload as Omit<OfficialTravel, 'id'>)
      }

      updatedList = [newTravel, ...travels]
      setTravels(updatedList)
      saveToLocalStorage(updatedList)

      if (user) {
        try {
          const { data } = await supabase.from('official_travels').insert({
            user_id: user.id,
            ...payload
          }).select()

          if (data && data.length > 0) {
            fetchTravels(user.id)
          }
        } catch (err) {
          console.error('Error inserting travel to Supabase', err)
        }
      }
    }

    setIsModalOpen(false)
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Hapus riwayat perjalanan dinas ini?')) return

    const updatedList = travels.filter(t => t.id !== id)
    setTravels(updatedList)
    saveToLocalStorage(updatedList)

    if (user) {
      try {
        await supabase.from('official_travels').delete().eq('id', id)
      } catch (err) {
        console.error('Error deleting travel from Supabase', err)
      }
    }
  }

  // Filter & Sort
  const filteredTravels = travels
    .filter(t => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        t.title.toLowerCase().includes(query) ||
        t.destination.toLowerCase().includes(query) ||
        (t.sppd_number && t.sppd_number.toLowerCase().includes(query)) ||
        (t.purpose && t.purpose.toLowerCase().includes(query))

      const matchesTransport = transportFilter === 'all' || t.transportation === transportFilter

      return matchesSearch && matchesTransport
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      if (sortBy === 'oldest') return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      if (sortBy === 'duration') return calculateDays(b.start_date, b.end_date) - calculateDays(a.start_date, a.end_date)
      if (sortBy === 'cost') return b.allowance_amount - a.allowance_amount
      return 0
    })

  // Summary Stats
  const totalTrips = travels.length
  const totalDaysSpent = travels.reduce((sum, t) => sum + calculateDays(t.start_date, t.end_date), 0)
  const totalBudgetSpent = travels.reduce((sum, t) => sum + (t.allowance_amount || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-brand-primary tracking-tight">Riwayat Perjalanan Dinas</h2>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              SPPD
            </Badge>
          </div>
          <p className="text-sm text-brand-muted mt-1">
            Daftar dan dokumentasi riwayat perjalanan dinas yang telah dilaksanakan.
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="self-start sm:self-center cursor-pointer">
          <Plus size={16} className="mr-1.5" /> Catat Perdin
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border-brand-border hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Briefcase size={18} className="text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase font-bold text-brand-muted tracking-wider">Total Perjalanan Dinas</p>
              <p className="text-xl font-bold text-brand-primary mt-0.5">{totalTrips} Perjalanan</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-brand-border hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase font-bold text-brand-muted tracking-wider">Total Durasi Perdin</p>
              <p className="text-xl font-bold text-brand-primary mt-0.5">{totalDaysSpent} Hari</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-brand-border hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase font-bold text-brand-muted tracking-wider">Total Biaya / Uang Saku</p>
              <p className="text-lg font-bold text-brand-primary mt-0.5 truncate">{formatRupiah(totalBudgetSpent)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="p-4 bg-white border-brand-border">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul, tujuan kota, no SPPD, atau maksud..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-border text-xs sm:text-sm bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
            />
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
            {/* Transport Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={transportFilter}
                onChange={e => setTransportFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Semua Transportasi' },
                  { value: 'Pesawat', label: '✈️ Pesawat' },
                  { value: 'Kereta', label: '🚆 Kereta' },
                  { value: 'Mobil Dinas', label: '🚗 Mobil Dinas' },
                  { value: 'Travel', label: '🚌 Travel' },
                  { value: 'Kapal', label: '🚢 Kapal' },
                  { value: 'Lainnya', label: '🧭 Lainnya' }
                ]}
                className="text-xs py-1.5"
              />
            </div>

            {/* Sort Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                options={[
                  { value: 'newest', label: 'Tanggal Terbaru' },
                  { value: 'oldest', label: 'Tanggal Terlama' },
                  { value: 'duration', label: 'Durasi Terpanjang' },
                  { value: 'cost', label: 'Biaya Tertinggi' }
                ]}
                className="text-xs py-1.5"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Content List */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
        </div>
      ) : filteredTravels.length === 0 ? (
        <Card className="py-16 px-6 bg-white border-brand-border flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
            <Plane size={32} />
          </div>
          <h3 className="text-base font-bold text-brand-primary mb-1">Belum Ada Riwayat Perjalanan Dinas</h3>
          <p className="text-xs text-brand-muted max-w-md mb-4">
            {travels.length === 0
              ? 'Belum ada riwayat perjalanan dinas yang dicatat. Klik tombol di bawah untuk menambahkan riwayat perdin.'
              : 'Tidak ada riwayat perjalanan dinas yang sesuai dengan kriteria pencarian.'}
          </p>
          {travels.length === 0 && (
            <Button onClick={openCreateModal} size="sm" className="cursor-pointer">
              <Plus size={16} className="mr-1.5" /> Catat Perdin
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTravels.map(travel => {
            const TransportIcon = TRANSPORTATION_ICONS[travel.transportation] || Navigation
            const durationDays = calculateDays(travel.start_date, travel.end_date)

            return (
              <Card
                key={travel.id}
                className="p-5 bg-white border-brand-border flex flex-col justify-between hover:shadow-md transition-all duration-200 text-left relative overflow-hidden group"
              >
                <div>
                  {/* Card Header: SPPD & Transport Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {travel.sppd_number ? (
                      <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-semibold">
                        {travel.sppd_number}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                        SPPD
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-100 text-brand-primary text-xs font-medium">
                      <TransportIcon size={14} className="text-indigo-500" />
                      <span>{travel.transportation}</span>
                    </div>
                  </div>

                  {/* Title & Destination */}
                  <h3 className="font-bold text-base text-brand-primary mb-1 group-hover:text-indigo-600 transition-colors">
                    {travel.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-3">
                    <MapPin size={14} className="shrink-0 text-indigo-500" />
                    <span>{travel.destination}</span>
                  </div>

                  {/* Purpose summary */}
                  {travel.purpose && (
                    <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">Maksud: </span>
                      {travel.purpose}
                    </p>
                  )}

                  {/* Date & Expense Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="flex flex-col bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-100">
                      <span className="text-[10px] uppercase font-bold text-brand-muted flex items-center gap-1 mb-0.5">
                        <Calendar size= {11} /> Tanggal & Durasi
                      </span>
                      <span className="font-semibold text-brand-primary">
                        {format(parseISO(travel.start_date), 'dd MMM yyyy')}
                        {travel.start_date !== travel.end_date && ` - ${format(parseISO(travel.end_date), 'dd MMM yyyy')}`}
                      </span>
                      <span className="text-[11px] text-indigo-600 font-bold mt-0.5">
                        ({durationDays} Hari Perjalanan)
                      </span>
                    </div>

                    <div className="flex flex-col bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-100">
                      <span className="text-[10px] uppercase font-bold text-brand-muted flex items-center gap-1 mb-0.5">
                        <DollarSign size={11} /> Biaya / Uang Saku
                      </span>
                      <span className="font-bold text-emerald-600">
                        {travel.allowance_amount ? formatRupiah(travel.allowance_amount) : 'Rp 0'}
                      </span>
                      <span className="text-[10px] text-brand-muted mt-0.5">
                        Rekapitulasi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 gap-2">
                  <Button
                    onClick={() => openDetailModal(travel)}
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye size={13} /> Detail Laporan
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(travel)}
                      className="p-2 rounded-lg border border-brand-border text-neutral-400 hover:bg-neutral-50 hover:text-brand-primary transition-all duration-200 cursor-pointer"
                      title="Edit Perdin"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(travel.id)}
                      className="p-2 rounded-lg border border-brand-border text-neutral-400 hover:bg-red-50 hover:text-brand-danger transition-all duration-200 cursor-pointer"
                      title="Hapus Catatan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTravel ? 'Edit Riwayat Perjalanan Dinas' : 'Catat Riwayat Perjalanan Dinas'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          <Input
            label="Judul Perjalanan Dinas / Agenda"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Contoh: Audit Operasional Cabang Surabaya"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor SPPD / Surat Tugas"
              value={form.sppd_number}
              onChange={e => setForm({ ...form, sppd_number: e.target.value })}
              placeholder="Contoh: SPPD/2026/08/042"
            />
            <Input
              label="Kota / Lokasi Tujuan"
              value={form.destination}
              onChange={e => setForm({ ...form, destination: e.target.value })}
              placeholder="Contoh: Surabaya, Jawa Timur"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1.5">Maksud & Tujuan Perdin</label>
            <textarea
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              placeholder="Jelaskan secara singkat maksud dan tujuan perjalanan dinas ini..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Berangkat"
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              required
            />
            <Input
              label="Tanggal Kembali / Selesai"
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Moda Transportasi"
              options={[
                { value: 'Pesawat', label: '✈️ Pesawat' },
                { value: 'Kereta', label: '🚆 Kereta' },
                { value: 'Mobil Dinas', label: '🚗 Mobil Dinas' },
                { value: 'Travel', label: '🚌 Travel' },
                { value: 'Kapal', label: '🚢 Kapal' },
                { value: 'Lainnya', label: '🧭 Lainnya' }
              ]}
              value={form.transportation}
              onChange={e => setForm({ ...form, transportation: e.target.value as any })}
            />
            <Input
              label="Biaya / Uang Saku (Rp)"
              type="number"
              value={form.allowance_amount}
              onChange={e => setForm({ ...form, allowance_amount: e.target.value })}
              placeholder="Contoh: 3500000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1.5">Laporan Hasil / Catatan Ringkas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Catat ringkasan hasil perjalanan dinas, temuan penting, atau rekomendasi..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 resize-none"
            />
          </div>

          <Button type="submit" className="w-full mt-2 cursor-pointer">
            {editingTravel ? 'Simpan Perubahan' : 'Simpan Riwayat Perdin'}
          </Button>
        </form>
      </Modal>

      {/* --- DETAIL REPORT MODAL --- */}
      {selectedTravel && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detail Riwayat Perjalanan Dinas"
        >
          <div className="flex flex-col gap-4 text-left">
            {/* Header Info */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                  {selectedTravel.sppd_number || 'SPPD Perdin'}
                </span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Riwayat
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-brand-primary mb-1">{selectedTravel.title}</h3>
              <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                <MapPin size={13} /> {selectedTravel.destination}
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-brand-muted block">Jadwal Perjalanan</span>
                <span className="font-semibold text-brand-primary block mt-0.5">
                  {format(parseISO(selectedTravel.start_date), 'dd MMMM yyyy')} - {format(parseISO(selectedTravel.end_date), 'dd MMMM yyyy')}
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">
                  {calculateDays(selectedTravel.start_date, selectedTravel.end_date)} Hari Perjalanan
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-brand-muted block">Transportasi & Biaya</span>
                <span className="font-semibold text-brand-primary block mt-0.5">
                  {selectedTravel.transportation}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">
                  {selectedTravel.allowance_amount ? formatRupiah(selectedTravel.allowance_amount) : 'Rp 0'}
                </span>
              </div>
            </div>

            {/* Purpose */}
            {selectedTravel.purpose && (
              <div className="p-3.5 bg-neutral-50 border border-neutral-100 rounded-xl">
                <h4 className="text-xs font-bold text-brand-primary mb-1 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-500" />
                  Maksud & Tujuan Perjalanan Dinas
                </h4>
                <p className="text-xs text-brand-muted leading-relaxed whitespace-pre-line">
                  {selectedTravel.purpose}
                </p>
              </div>
            )}

            {/* Notes / Report */}
            <div className="p-3.5 bg-neutral-50 border border-neutral-100 rounded-xl">
              <h4 className="text-xs font-bold text-brand-primary mb-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Laporan Hasil & Catatan Ringkas
              </h4>
              <p className="text-xs text-brand-muted leading-relaxed whitespace-pre-line">
                {selectedTravel.notes || 'Belum ada catatan laporan hasil perjalanan.'}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-neutral-100">
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  openEditModal(selectedTravel)
                }}
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                <Edit3 size={14} className="mr-1.5" /> Edit Data
              </Button>
              <Button
                onClick={() => setIsDetailModalOpen(false)}
                size="sm"
                className="cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
