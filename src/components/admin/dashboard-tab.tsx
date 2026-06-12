'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Package, DollarSign, Users, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminStats } from './types'

// Lazy-load DashboardChart — keeps recharts out of the initial bundle
function DashboardChartSkeleton() {
  return (
    <div className="min-h-[200px] w-full flex items-center justify-center bg-muted/30 rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading chart...</p>
      </div>
    </div>
  )
}

const DashboardChart = dynamic(
  () => import('./dashboard-chart').then((mod) => mod.DashboardChart),
  {
    ssr: false,
    loading: () => <DashboardChartSkeleton />,
  }
)

export function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center text-muted-foreground py-20">Failed to load stats</p>
  }

  const statCards = [
    {
      label: 'Total PDFs',
      value: stats.totalPdfs,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900',
    },
    {
      label: 'Total Sales',
      value: stats.paidOrders,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Overview Chart (lazy-loaded — recharts is ~200KB) */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Stats Overview</h3>
          <DashboardChart
            totalPdfs={stats.totalPdfs}
            publishedPdfs={stats.publishedPdfs}
            paidOrders={stats.paidOrders}
            totalOrders={stats.totalOrders}
            totalRevenue={stats.totalRevenue}
          />
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          {stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDF</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {order.pdf.title}
                      </TableCell>
                      <TableCell>₹{order.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={order.status === 'paid' ? 'default' : 'secondary'}
                          className={
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : ''
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
