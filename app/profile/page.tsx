'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  User, LogOut, Store,
  FileText, ChevronRight,
  ArrowLeft, Printer
} from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  amount: number
  file_name: string
  created_at: string
  shops: {
    name: string
  } | {
    name: string
  }[] | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [hasShop, setHasShop] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // Check if user owns a shop
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      setHasShop(!!shop)

      // Fetch past orders
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id, status, amount, file_name, created_at,
          shops ( name )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setOrders(orderData || [])
    }

    setLoading(false)
  }

  async function handleGoogleLogin() {
    setSigningIn(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`
      }
    })
    if (error) {
      alert('Login failed. Please try again.')
      setSigningIn(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setOrders([])
    setHasShop(false)
  }

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
        backgroundColor: '#fff',
        borderBottom: '1px solid #e8e8e4',
        padding: '0 20px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ color: '#1a1a1a', display: 'flex' }}>
            <ArrowLeft size={20} />
          </Link>
          <span style={{ fontWeight: '600', fontSize: '15px' }}>Profile</span>
        </div>
        {user && (
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#888',
              fontSize: '13px'
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        )}
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>

        {/* Not logged in */}
        {!user && (
          <div>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              border: '1px solid #e8e8e4',
              padding: '40px 24px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#f0f0ec',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <User size={28} color="#888" />
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Sign in to XeroxConnect
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#888',
                marginBottom: '28px',
                lineHeight: '1.5'
              }}>
                Save your order history and register your shop
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={signingIn}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  backgroundColor: '#fff',
                  border: '1.5px solid #e8e8e4',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: signingIn ? 'not-allowed' : 'pointer',
                  color: '#1a1a1a',
                  marginBottom: '12px'
                }}
              >
                {/* Google Logo SVG */}
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
                </svg>
                {signingIn ? 'Signing in...' : 'Continue with Google'}
              </button>

              <p style={{ fontSize: '12px', color: '#aaa' }}>
                You can also use XeroxConnect without signing in
              </p>
            </div>

            {/* Shop owner CTA */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '10px',
                padding: '10px',
                flexShrink: 0
              }}>
                <Store size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '600',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '2px'
                }}>
                  Are you a shop owner?
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Sign in to register your xerox shop
                </div>
              </div>
              <ChevronRight size={18} color="#555" />
            </div>
          </div>
        )}

        {/* Logged in */}
        {user && (
          <div>
            {/* User Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              border: '1px solid #e8e8e4',
              padding: '20px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '52px',
                  height: '52px',
                  backgroundColor: '#f0f0ec',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={24} color="#888" />
                </div>
              )}
              <div>
                <div style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '2px'
                }}>
                  {user.user_metadata?.name || 'User'}
                </div>
                <div style={{ fontSize: '13px', color: '#888' }}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* Shop owner section */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              border: '1px solid #e8e8e4',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #f0f0ec',
                fontWeight: '600',
                fontSize: '15px'
              }}>
                Shop
              </div>

              {hasShop ? (
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      backgroundColor: '#f0f0ec',
                      borderRadius: '8px',
                      padding: '8px'
                    }}>
                      <Printer size={18} color="#555" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1a1a1a'
                      }}>
                        Go to Shop Dashboard
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        View orders and earnings
                      </div>
                    </div>
                    <ChevronRight size={18} color="#ccc" />
                  </div>
                </Link>
              ) : (
                <Link href="/register-shop" style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      backgroundColor: '#f0f0ec',
                      borderRadius: '8px',
                      padding: '8px'
                    }}>
                      <Store size={18} color="#555" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1a1a1a'
                      }}>
                        Register Your Shop
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        Start accepting online print orders
                      </div>
                    </div>
                    <ChevronRight size={18} color="#ccc" />
                  </div>
                </Link>
              )}
            </div>

            {/* Order History */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              border: '1px solid #e8e8e4',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #f0f0ec',
                fontWeight: '600',
                fontSize: '15px'
              }}>
                Order History
              </div>

              {orders.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#888',
                  fontSize: '14px'
                }}>
                  <FileText size={28} color="#ddd"
                    style={{ marginBottom: '10px' }} />
                  <p>No orders yet</p>
                </div>
              ) : (
                orders.map((order, index) => (
                  <Link
                    key={order.id}
                    href={`/order/${order.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      padding: '14px 16px',
                      borderBottom: index < orders.length - 1
                        ? '1px solid #f0f0ec' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        backgroundColor: '#f8f8f6',
                        borderRadius: '8px',
                        padding: '8px',
                        flexShrink: 0
                      }}>
                        <FileText size={16} color="#888" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1a1a1a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {order.file_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          {Array.isArray(order.shops) ? order.shops[0]?.name : order.shops?.name} •{' '}
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>
                          ₹{Number(order.amount).toFixed(0)}
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    paid: { color: '#f59e0b', label: 'Confirmed' },
    printing: { color: '#3b82f6', label: 'Printing' },
    ready: { color: '#22c55e', label: 'Ready' },
    collected: { color: '#888', label: 'Collected' },
    pending: { color: '#f59e0b', label: 'Pending' },
  }
  const info = map[status] || map.pending

  return (
    <div style={{
      fontSize: '11px',
      fontWeight: '600',
      color: info.color,
      marginTop: '2px'
    }}>
      {info.label}
    </div>
  )
}