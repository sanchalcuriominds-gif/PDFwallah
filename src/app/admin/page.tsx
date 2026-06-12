'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  LayoutDashboard,
  Upload,
  FileText,
  ShoppingCart,
  LogOut,
  Loader2,
  AlertCircle,
  Tag,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import dynamic from 'next/dynamic'

// Lazy-load admin tab components — splits the admin bundle so each tab loads on demand
// This keeps heavy deps like recharts (dashboard) out of the initial admin page bundle
function TabSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  )
}

const DashboardTab = dynamic(
  () => import('@/components/admin/dashboard-tab').then((mod) => mod.DashboardTab),
  { loading: () => <TabSkeleton /> }
)
const CategoriesTab = dynamic(
  () => import('@/components/admin/categories-tab').then((mod) => mod.CategoriesTab),
  { loading: () => <TabSkeleton /> }
)
const UploadTab = dynamic(
  () => import('@/components/admin/upload-tab').then((mod) => mod.UploadTab),
  { loading: () => <TabSkeleton /> }
)
const ManagePdfsTab = dynamic(
  () => import('@/components/admin/manage-pdfs-tab').then((mod) => mod.ManagePdfsTab),
  { loading: () => <TabSkeleton /> }
)
const OrdersTab = dynamic(
  () => import('@/components/admin/orders-tab').then((mod) => mod.OrdersTab),
  { loading: () => <TabSkeleton /> }
)
const NoteTypesTab = dynamic(
  () => import('@/components/admin/note-types-tab').then((mod) => mod.NoteTypesTab),
  { loading: () => <TabSkeleton /> }
)

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated === true)
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsCheckingAuth(false))
  }, [])

  const handleLogin = async () => {
    setIsLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setIsAuthenticated(true)
      } else {
        setLoginError(data.error || 'Invalid password')
      }
    } catch {
      setLoginError('Login failed')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setIsAuthenticated(false)
    setPassword('')
  }

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">Admin Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </p>
              )}
              <Button
                onClick={handleLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Default password: admin123
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage your PDF store</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cats</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Upload</span>
            <span className="sm:hidden">Add</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <FileText className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">PDFs</span>
            <span className="sm:hidden">PDFs</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Orders</span>
            <span className="sm:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="note-types" className="gap-2">
            <Tag className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Note Types</span>
            <span className="sm:hidden">Types</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="upload">
          <UploadTab onUploaded={() => setActiveTab('manage')} />
        </TabsContent>
        <TabsContent value="manage">
          <ManagePdfsTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="note-types">
          <NoteTypesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
