'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts'

interface ChartDataPoint {
  date: string
  pemasukan: number
  pengeluaran: number
}

interface MiniFinanceChartProps {
  data: ChartDataPoint[]
}

export const MiniFinanceChart: React.FC<MiniFinanceChartProps> = ({ data }) => {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val)
  }

  return (
    <Card className="p-6 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col text-left">
          <h3 className="font-bold text-base text-brand-primary">Arus Kas (7 Hari Terakhir)</h3>
          <span className="text-xs text-brand-muted mt-0.5">Perjalanan pemasukan dan pengeluaran Anda</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span className="text-brand-muted">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            <span className="text-brand-muted">Pengeluaran</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-brand-muted">
            Belum ada transaksi dalam 7 hari terakhir.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `Rp ${val / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1px solid #e9ecef',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }}
                formatter={(val: any) => [formatRupiah(Number(val || 0)), '']}
              />
              <Area 
                type="monotone" 
                dataKey="pemasukan" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
              <Area 
                type="monotone" 
                dataKey="pengeluaran" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
