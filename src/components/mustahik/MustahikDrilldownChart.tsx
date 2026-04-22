'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DrilldownItem {
  wilayah: string
  jumlahMustahik: number
}

interface Props {
  title: string
  data: DrilldownItem[]
}

export default function MustahikDrilldownChart({ title, data }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-md">
      <h3 className="mb-4 text-lg font-bold text-slate-800">{title}</h3>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 24, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="wilayah"
              width={140}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#334155' }}
            />
            <Tooltip />
            <Bar dataKey="jumlahMustahik" fill="#2563eb" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}