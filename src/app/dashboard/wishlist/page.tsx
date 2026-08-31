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
  Heart,
  ShoppingCart,
  Star,
  ExternalLink,
  Check,
  Package,
  Tag,
  Search,
  Filter,
  ArrowUpDown,
  ImageIcon,
  StickyNote,
  CircleDollarSign,
  Sparkles,
} from 'lucide-react'

// Types
interface WishlistItem {
  id: string
  user_id: string
  name: string
  price: number | null
  priority: 'low' | 'medium' | 'high'
  category: string
  image_url: string | null
  notes: string | null
  link_url: string | null
  is_purchased: boolean
  created_at: string
}

const CATEGORIES = [
  { value: 'elektronik', label: '🖥️ Elektronik' },
  { value: 'fashion', label: '👗 Fashion' },
  { value: 'buku', label: '📚 Buku' },
  { value: 'hobi', label: '🎮 Hobi & Game' },
  { value: 'rumah', label: '🏠 Rumah & Dekorasi' },
  { value: 'kesehatan', label: '💪 Kesehatan & Olahraga' },
  { value: 'makanan', label: '🍕 Makanan & Minuman' },
  { value: 'perjalanan', label: '✈️ Perjalanan' },
  { value: 'lainnya', label: '📦 Lainnya' },
]

const PRIORITY_CONFIG = {
  high: { label: 'Tinggi', color: 'text-rose-600 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  medium: { label: 'Sedang', color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  low: { label: 'Rendah', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
}

const getCategoryEmoji = (cat: string) => {
  const found = CATEGORIES.find(c => c.value === cat)
  return found ? found.label.split(' ')[0] : '📦'
}

const getCategoryLabel = (cat: string) => {
  const found = CATEGORIES.find(c => c.value === cat)
  return found ? found.label.split(' ').slice(1).join(' ') : cat
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function WishlistPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Data
  const [items, setItems] = useState<WishlistItem[]>([])

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('semua')
  const [filterPriority, setFilterPriority] = useState('semua')
  const [showPurchased, setShowPurchased] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'priority'>('newest')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    priority: 'medium',
    category: 'lainnya',
    image_url: '',
    notes: '',
    link_url: '',
  })

  // Fetch data
  const fetchData = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setItems(data)
    } catch (err) {
      console.error('Error fetching wishlist:', JSON.stringify(err, null, 2))
      console.error('Error details:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchData(user.id)
      }
    }
    init()
  }, [supabase, fetchData])

  // Open modal for create
  const openCreateModal = () => {
    setEditingItem(null)
    setForm({
      name: '',
      price: '',
      priority: 'medium',
      category: 'lainnya',
      image_url: '',
      notes: '',
      link_url: '',
    })
    setIsModalOpen(true)
  }

  // Open modal for edit
  const openEditModal = (item: WishlistItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      price: item.price?.toString() || '',
      priority: item.priority,
      category: item.category,
      image_url: item.image_url || '',
      notes: item.notes || '',
      link_url: item.link_url || '',
    })
    setIsModalOpen(true)
  }

  // Save (create or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const payload = {
      user_id: user.id,
      name: form.name,
      price: form.price ? Number(form.price) : null,
      priority: form.priority,
      category: form.category,
      image_url: form.image_url || null,
      notes: form.notes || null,
      link_url: form.link_url || null,
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('wishlists')
          .update(payload)
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert(payload)
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchData(user.id)
    } catch (err) {
      alert('Gagal menyimpan item wishlist')
    }
  }

  // Delete
  const handleDelete = async (id: string) => {
    if (!user) return
    if (!confirm('Hapus item ini dari wishlist?')) return
    try {
      setItems(prev => prev.filter(i => i.id !== id))
      const { error } = await supabase.from('wishlists').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      alert('Gagal menghapus item')
      fetchData(user.id)
    }
  }

  // Toggle purchased
  const handleTogglePurchased = async (item: WishlistItem) => {
    if (!user) return
    const newValue = !item.is_purchased
    try {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_purchased: newValue } : i))
      const { error } = await supabase
        .from('wishlists')
        .update({ is_purchased: newValue })
        .eq('id', item.id)
      if (error) throw error
    } catch (err) {
      alert('Gagal memperbarui status')
      fetchData(user.id)
    }
  }

  // Filtered & sorted items
  const filteredItems = items
    .filter(item => {
      if (!showPurchased && item.is_purchased) return false
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterCategory !== 'semua' && item.category !== filterCategory) return false
      if (filterPriority !== 'semua' && item.priority !== filterPriority) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0)
        case 'price-desc':
          return (b.price || 0) - (a.price || 0)
        case 'priority': {
          const order = { high: 0, medium: 1, low: 2 }
          return order[a.priority] - order[b.priority]
        }
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  // Stats
  const totalItems = items.filter(i => !i.is_purchased).length
  const totalValue = items.filter(i => !i.is_purchased).reduce((sum, i) => sum + (i.price || 0), 0)
  const purchasedCount = items.filter(i => i.is_purchased).length
  const highPriorityCount = items.filter(i => !i.is_purchased && i.priority === 'high').length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-brand-primary tracking-tight">Wishlist</h2>
          <p className="text-sm text-brand-muted mt-1">Simpan dan kelola daftar barang impianmu di satu tempat.</p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="self-start cursor-pointer">
          <Plus size={16} className="mr-1.5" /> Tambah Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Heart size={16} className="text-violet-500" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase font-semibold text-brand-muted">Total Item</p>
              <p className="text-lg font-bold text-brand-primary">{totalItems}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <CircleDollarSign size={16} className="text-blue-500" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase font-semibold text-brand-muted">Estimasi Total</p>
              <p className="text-lg font-bold text-brand-primary">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star size={16} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase font-semibold text-brand-muted">Prioritas Tinggi</p>
              <p className="text-lg font-bold text-brand-primary">{highPriorityCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShoppingCart size={16} className="text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-[11px] uppercase font-semibold text-brand-muted">Sudah Dibeli</p>
              <p className="text-lg font-bold text-brand-primary">{purchasedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border-brand-border">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari item wishlist..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border text-sm bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="w-full md:w-44">
            <Select
              options={[
                { value: 'semua', label: 'Semua Kategori' },
                ...CATEGORIES.map(c => ({ value: c.value, label: c.label })),
              ]}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            />
          </div>

          {/* Priority filter */}
          <div className="w-full md:w-40">
            <Select
              options={[
                { value: 'semua', label: 'Semua Prioritas' },
                { value: 'high', label: '🔴 Tinggi' },
                { value: 'medium', label: '🟡 Sedang' },
                { value: 'low', label: '🟢 Rendah' },
              ]}
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div className="w-full md:w-44">
            <Select
              options={[
                { value: 'newest', label: 'Terbaru' },
                { value: 'price-asc', label: 'Harga Terendah' },
                { value: 'price-desc', label: 'Harga Tertinggi' },
                { value: 'priority', label: 'Prioritas' },
              ]}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            />
          </div>

          {/* Show purchased toggle */}
          <button
            onClick={() => setShowPurchased(!showPurchased)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer shrink-0
              ${showPurchased
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-neutral-50 border-brand-border text-brand-muted hover:bg-neutral-100'
              }
            `}
          >
            <ShoppingCart size={14} />
            Dibeli
          </button>
        </div>
      </Card>

      {/* Items List */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-2">💫</span>
          <p className="text-sm text-brand-muted mb-4">
            {items.length === 0
              ? 'Wishlist kamu masih kosong. Mulai tambahkan barang impianmu!'
              : 'Tidak ada item yang cocok dengan filter.'}
          </p>
          {items.length === 0 && (
            <Button onClick={openCreateModal} size="sm" className="cursor-pointer">
              Tambah Item Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const priorityConf = PRIORITY_CONFIG[item.priority]

            return (
              <Card
                key={item.id}
                className={`p-0 bg-white border-brand-border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md
                  ${item.is_purchased ? 'opacity-60' : ''}
                `}
              >
                {/* Image area */}
                {item.image_url ? (
                  <div className="relative w-full h-40 bg-neutral-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    {item.is_purchased && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <Check size={20} className="text-emerald-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-28 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
                    <span className="text-4xl">{getCategoryEmoji(item.category)}</span>
                    {item.is_purchased && (
                      <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <Check size={20} className="text-emerald-600" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 text-left">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={`font-bold text-sm text-brand-primary leading-tight ${item.is_purchased ? 'line-through' : ''}`}>
                      {item.name}
                    </h4>
                    <Badge className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${priorityConf.color}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${priorityConf.dot}`} />
                      {priorityConf.label}
                    </Badge>
                  </div>

                  {/* Category */}
                  <span className="text-xs text-brand-muted flex items-center gap-1 mb-3">
                    <Tag size={11} />
                    {getCategoryLabel(item.category)}
                  </span>

                  {/* Price */}
                  {item.price != null && (
                    <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl px-3.5 py-2.5 mb-3">
                      <span className="text-[10px] uppercase font-semibold text-brand-muted block">Estimasi Harga</span>
                      <span className="text-sm font-bold text-brand-primary">{formatCurrency(item.price)}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-xs text-brand-muted leading-relaxed mb-3 line-clamp-2">
                      {item.notes}
                    </p>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                    <Button
                      onClick={() => handleTogglePurchased(item)}
                      variant={item.is_purchased ? 'outline' : 'secondary'}
                      size="sm"
                      className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                    >
                      {item.is_purchased ? (
                        <>
                          <Package size={13} /> Sudah Dibeli
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={13} /> Tandai Dibeli
                        </>
                      )}
                    </Button>

                    {item.link_url && (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-brand-border text-neutral-400 hover:bg-neutral-50 hover:text-brand-primary transition-all duration-200"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-lg border border-brand-border text-neutral-400 hover:bg-neutral-50 hover:text-brand-primary transition-all duration-200 cursor-pointer"
                    >
                      <StickyNote size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg border border-brand-border text-neutral-400 hover:bg-red-50 hover:text-brand-danger transition-all duration-200 cursor-pointer"
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item Wishlist' : 'Tambah Item Wishlist'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          <Input
            label="Nama Barang"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: MacBook Pro M4, Sepatu Nike Air Max"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimasi Harga (Rp)"
              type="number"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="Contoh: 15000000"
            />
            <Select
              label="Prioritas"
              options={[
                { value: 'high', label: '🔴 Tinggi' },
                { value: 'medium', label: '🟡 Sedang' },
                { value: 'low', label: '🟢 Rendah' },
              ]}
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            />
          </div>

          <Select
            label="Kategori"
            options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          />

          <Input
            label="Link Produk (opsional)"
            value={form.link_url}
            onChange={e => setForm({ ...form, link_url: e.target.value })}
            placeholder="https://tokopedia.com/..."
          />

          <Input
            label="URL Gambar (opsional)"
            value={form.image_url}
            onChange={e => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://example.com/gambar.jpg"
          />

          <div>
            <label className="block text-sm font-medium text-brand-primary mb-1.5">Catatan (opsional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan tambahan tentang barang ini..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 resize-none"
            />
          </div>

          <Button type="submit" className="w-full mt-2 cursor-pointer">
            {editingItem ? 'Simpan Perubahan' : 'Tambah ke Wishlist'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
