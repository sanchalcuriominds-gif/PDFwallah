'use client'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface DashboardChartProps {
  totalPdfs: number
  publishedPdfs: number
  paidOrders: number
  totalOrders: number
  totalRevenue: number
}

const chartConfig = {
  value: {
    label: 'Count',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function DashboardChart({
  totalPdfs,
  publishedPdfs,
  paidOrders,
  totalOrders,
}: DashboardChartProps) {
  const data = [
    { name: 'PDFs', value: totalPdfs },
    { name: 'Published', value: publishedPdfs },
    { name: 'Orders', value: totalOrders },
    { name: 'Paid', value: paidOrders },
  ]

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart data={data} accessibilityLayer>
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={8}
          maxBarSize={60}
        />
      </BarChart>
    </ChartContainer>
  )
}
