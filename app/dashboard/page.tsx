'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Printer, LogOut, CheckCircle,
  Clock, Package, IndianRupee,
  RefreshCw, ChevronRight
} from 'lucide-react'

interface Order {
  id: string
  status: string
  otp: string
  copies: number
  color_mode: string
  sides: string
  pages: number
  amount: number
  platform_fee: number
  file_name: string
  created_at: string
}

interface Shop {
  id: string
  name: string
  address: string
  is_active: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [shop, setShop] = useState<Shop | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoad()

    // Auto refresh every 30 seconds
    const interval = setInterval(() => fetchOrders(shop?.id || ''), 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Find shop owned by this user
    const { data: shopData, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (error || !shopData) {
      router.push('/register-shop')
      return
    }

    setShop(shopData)
    await fetchOrders(shopData.id)
    setLoading(false)
  }

  async function fetchOrders(shopId: string) {
    if (!shopId) return
    setRefreshing(true)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (!error) setOrders(data || [])
    setRefreshing(false)
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      // If marking as collected — delete file
      if (newStatus === 'collected') {
        await fetch('/api/orders/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        })
      }
      fetchOrders(shop?.id || '')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const activeOrders = orders.filter(o =>
    ['paid', 'printing', 'ready'].includes(o.status)
  )
  const completedOrders = orders.filter(o =>
    o.status === 'collected'
  )

  const todayEarnings = orders
    .filter(o => o.status !== 'pending')
    .reduce((sum, o) => sum + (Number(o.amount) - Number(o.platform_fee)), 0)

  const todayOrders = orders.filter(o => o.status !== 'pending').length

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f8f6'
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid #e8e8e4',
          borderTop: '3px solid #1a1a1a',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f6' }}>

      {/* Navbar */}
      <nav style={{
        backgroundColor: '#1a1a1a',
        padding: '0 20px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={18} color="#fff" />
          <span style={{ fontWeight: '600', fontSize: '15px', color: '#fff' }}>
            {shop?.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => fetchOrders(shop?.id || '')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px'
            }}
          >
            <RefreshCw
              size={18}
              color="#aaa"
              style={{
                animation: refreshing ? 'spin 0.8s linear infinite' : 'none'
              }}
            />
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px'
            }}
          >
            <LogOut size={18} color="#aaa" />
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <StatCard
            label="Today's earnings"
            value={`₹${todayEarnings.toFixed(0)}`}
            icon={<IndianRupee size={18} color="#22c55e" />}
            color="#f0fdf4"
          />
          <StatCard
            label="Orders today"
            value={String(todayOrders)}
            icon={<Package size={18} color="#3b82f6" />}
            color="#eff6ff"
          />
        </div>

        {/* Active Orders Alert */}
        {activeOrders.length > 0 && (
          <div style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={16} color="#ca8a04" />
            <span style={{ fontSize: '13px', color: '#ca8a04', fontWeight: '500' }}>
              {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''} need your attention
            </span>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f0f0ec',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '16px'
        }}>
          <TabButton
            label={`Active (${activeOrders.length})`}
            active={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
          />
          <TabButton
            label={`Completed (${completedOrders.length})`}
            active={activeTab === 'completed'}
            onClick={() => setActiveTab('completed')}
          />
        </div>

        {/* Orders List */}
        {activeTab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeOrders.length === 0 ? (
              <EmptyState message="No active orders right now" />
            ) : (
              activeOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completedOrders.length === 0 ? (
              <EmptyState message="No completed orders today" />
            ) : (
              completedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                />
              ))
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function OrderCard({
  order,
  onUpdateStatus
}: {
  order: Order
  onUpdateStatus: (id: string, status: string) => void
}) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: '#fefce8', text: '#ca8a04', label: 'Confirmed' },
    printing: { bg: '#eff6ff', text: '#2563eb', label: 'Printing' },
    ready: { bg: '#f0fdf4', text: '#16a34a', label: 'Ready' },
    collected: { bg: '#f8f8f6', text: '#888', label: 'Collected' },
  }

  const statusInfo = statusColors[order.status] || statusColors.paid

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '14px',
      border: '1px solid #e8e8e4',
      overflow: 'hidden'
    }}>
      {/* Order Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #f0f0ec',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px'
          }}>
            {order.file_name}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* OTP Badge */}
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '4px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '1px' }}>OTP</div>
            <div style={{
              fontSize: '16px',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '3px'
            }}>
              {order.otp}
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            backgroundColor: statusInfo.bg,
            color: statusInfo.text,
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 10px',
            borderRadius: '8px'
          }}>
            {statusInfo.label}
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        gap: '16px',
        fontSize: '13px',
        color: '#555'
      }}>
        <span>{order.pages} pages</span>
        <span>{order.copies} {order.copies > 1 ? 'copies' : 'copy'}</span>
        <span>{order.color_mode === 'bw' ? 'B&W' : 'Color'}</span>
        <span>{order.sides === 'single' ? 'Single' : 'Double'} sided</span>
        <span style={{ marginLeft: 'auto', fontWeight: '600', color: '#1a1a1a' }}>
          ₹{(Number(order.amount) - Number(order.platform_fee)).toFixed(0)}
        </span>
      </div>

      {/* Action Buttons */}
      {order.status !== 'collected' && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #f0f0ec',
          display: 'flex',
          gap: '8px'
        }}>
          {order.status === 'paid' && (
            <ActionButton
              label="Mark as Printing"
              color="#3b82f6"
              onClick={() => onUpdateStatus(order.id, 'printing')}
            />
          )}
          {order.status === 'printing' && (
            <ActionButton
              label="Mark as Ready"
              color="#22c55e"
              onClick={() => onUpdateStatus(order.id, 'ready')}
            />
          )}
          {order.status === 'ready' && (
            <ActionButton
              label="Mark as Collected ✓"
              color="#1a1a1a"
              onClick={() => onUpdateStatus(order.id, 'collected')}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label, color, onClick
}: {
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        backgroundColor: color,
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '10px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  )
}

function StatCard({
  label, value, icon, color
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '14px',
      border: '1px solid #e8e8e4',
      padding: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px'
      }}>
        <div style={{
          backgroundColor: color,
          borderRadius: '8px',
          padding: '6px',
          display: 'flex'
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#888' }}>{label}</div>
    </div>
  )
}

function TabButton({
  label, active, onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: active ? '#fff' : 'transparent',
        color: active ? '#1a1a1a' : '#888',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.15s'
      }}
    >
      {label}
    </button>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 20px',
      color: '#888',
      fontSize: '14px'
    }}>
      <Package size={32} color="#ddd" style={{ marginBottom: '12px' }} />
      <p>{message}</p>
    </div>
  )
}