'use client'

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import type { SpatialItem } from '@/types/spatial'

interface Props {
    title: string
    data: SpatialItem[]
}

const BAR_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

export default function MustahikDrilldownChart({ title, data }: Props) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow-md">
            <h3 className="mb-1 text-lg font-bold text-slate-800">{title}</h3>
            <p className="mb-4 text-xs text-slate-400">{data.length} wilayah</p>

            {data.length === 0 ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                    Tidak ada data untuk ditampilkan
                </div>
            ) : (
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 8, right: 16, left: 24, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="wilayah"
                                width={140}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#334155' }}
                            />
                            <Tooltip
                                formatter={(value) => {
                                    const val = value ? Number(value) : 0;
                                    return [val, 'Jumlah Mustahik'];
                                }} contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                            />
                            <Bar dataKey="jumlahMustahik" radius={[0, 8, 8, 0]}>
                                {data.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}