'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (isRegister) {
        // Register Account
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        if (signUpError) throw signUpError
        setSuccessMsg('Pendaftaran berhasil! Silakan periksa email Anda (jika konfirmasi email aktif) atau silakan masuk.')
      } else {
        // Login
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (loginError) throw loginError
        router.refresh()
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative clean light orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none" />

      {/* Brand Icon or Name */}
      <div className="flex flex-col items-center mb-8 text-center relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-neutral-900/10 mb-3 hover:scale-105 transition-transform duration-200">
          A
        </div>
        <h1 className="text-2xl font-bold text-brand-primary tracking-tight">Allnext</h1>
        <p className="text-xs text-brand-muted mt-1 max-w-xs">Mengatur tugas, keuangan, kebiasaan, dan jadwal kerja dalam satu tempat.</p>
      </div>

      {/* Login Card */}
      <Card variant="glass" className="w-full max-w-md p-8 relative z-10 border border-brand-border/60">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-brand-secondary" />
          <h2 className="text-lg font-bold text-brand-primary">
            {isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {isRegister && (
            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Masukkan nama lengkap Anda"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User size={16} />}
              disabled={loading}
              required
            />
          )}

          <Input
            label="Alamat Email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} />}
            disabled={loading}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            disabled={loading}
            required
          />

          {error && (
            <div className="text-xs text-brand-danger bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-left leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="text-xs text-brand-success bg-emerald-55/10 border border-brand-success/20 rounded-xl px-4 py-3 text-left leading-relaxed">
              {error || successMsg} {/* Backup penanganan pesan */}
            </div>
          )}

          {/* Pastikan komponen Button mendukung prop disabled atau isLoading */}
          <Button type="submit" disabled={loading} className="w-full mt-2 cursor-pointer">
            {loading ? 'Mohon tunggu...' : isRegister ? 'Daftar' : 'Masuk'}
          </Button>
        </form>

        {/* Toggle link */}
        <div className="text-center mt-6 pt-6 border-t border-brand-border">
          <p className="text-xs text-brand-muted">
            {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError(null)
                setSuccessMsg(null)
              }}
              disabled={loading}
              className="text-brand-secondary font-semibold hover:underline bg-transparent border-none outline-none cursor-pointer disabled:opacity-50"
            >
              {isRegister ? 'Masuk Sekarang' : 'Daftar Sekarang'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}