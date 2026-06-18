'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  MapPin, ArrowLeft, Copy, Check
} from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  otp: string
  queue_position: number
  copies: number
  color_mode: string
  sides: string
  pages: number
  amount: number
  file_name: string
  created_at: string
  shop_id: string
  shops: {
    name: string
    address: string
    phone: string
    lat: number
    lng: number
  }
}

const STATUS_STEPS = ['paid', 'printing', 'ready', 'collected']

const STATUS_LABELS: Record<string, string> = {
  paid: 'Order confirmed',
  printing: 'Printing now',
  ready: 'Ready to collect',
  collected: 'Collected'
}

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [orderId])

  async function fetchOrder() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, shops (name, address, phone, lat, lng)')
      .eq('id', orderId)
      .single()

    if (error || !data) {
      router.push('/')
      return
    }

    setOrder(data)
    setLoading(false)

    if (data.status === 'paid' || data.status === 'printing') {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', data.shop_id)
        .in('status', ['paid', 'printing'])
        .lt('created_at', data.created_at)

      setQueueCount(count || 0)
    }
  }

  function copyOTP() {
    if (!order) return
    navigator.clipboard.writeText(order.otp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openMaps() {
    if (!order?.shops) return
    const { lat, lng, name } = order.shops
    if (lat && lng) {
      window.open(
        'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng,
        '_blank'
      )
    } else {
      window.open(
        'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name),
        '_blank'
      )
    }
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
          width: '32px',
          height: '32px',
          border: '3px solid #e8e8e4',
          borderTop: '3px solid #1a1a1a',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!order) return null

  const currentStatusIndex = STATUS_STEPS.indexOf(order.status)
  const isReady = order.status === 'ready'

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
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Link href="/" style={{ color: '#1a1a1a', display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>Order Status</span>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* OTP Card */}
        <div style={{
          backgroundColor: isReady ? '#1a1a1a' : '#fff',
          borderRadius: '20px',
          padding: '28px 20px',
          border: isReady ? 'none' : '1px solid #e8e8e4',
          marginBottom: '16px',
          textAlign: 'center',
          transition: 'background-color 0.3s'
        }}>
          {isReady && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#22c55e',
              borderRadius: '20px',
              padding: '4px 12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#fff',
                borderRadius: '50%'
              }} />
              <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>
                Ready to collect!
              </span>
            </div>
          )}

          <div style={{
            fontSize: '13px',
            color: isReady ? '#aaa' : '#888',
            marginBottom: '8px'
          }}>
            Show this OTP at the shop
          </div>

          <div style={{
            fontSize: '52px',
            fontWeight: '800',
            letterSpacing: '12px',
            color: isReady ? '#fff' : '#1a1a1a',
            marginBottom: '16px',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {order.otp}
          </div>

          <button
            onClick={copyOTP}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isReady ? '#2a2a2a' : '#f0f0ec',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              color: isReady ? '#fff' : '#555',
              fontWeight: '500'
            }}
          >
            {copied
              ? <><Check size={14} /> Copied!</>
              : <><Copy size={14} /> Copy OTP</>
            }
          </button>
        </div>

        {/* Status Progress */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          border: '1px solid #e8e8e4',
          padding: '20px 16px',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '20px' }}>
            Order Progress
          </div>

          <div style={{ position: 'relative' }}>
            {STATUS_STEPS.map((step, index) => {
              const isDone = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex

              return (
                <div key={step} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  position: 'relative'
                }}>
                  {index < STATUS_STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '11px',
                      top: '24px',
                      width: '2px',
                      height: '36px',
                      backgroundColor: index < currentStatusIndex ? '#1a1a1a' : '#e8e8e4',
                      transition: 'background-color 0.3s'
                    }} />
                  )}

                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isDone ? '#1a1a1a' : '#f0f0ec',
                    border: '2px solid ' + (isDone ? '#1a1a1a' : '#e8e8e4'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s',
                    zIndex: 1
                  }}>
                    {isDone && <Check size={12} color="#fff" />}
                  </div>

                  <div style={{ paddingBottom: '36px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: isCurrent ? '600' : '400',
                      color: isDone ? '#1a1a1a' : '#aaa'
                    }}>
                      {STATUS_LABELS[step]}
                    </div>
                    {isCurrent && step === 'paid' && queueCount > 0 && (
                      <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>
                        {queueCount} order{queueCount > 1 ? 's' : ''} ahead of you
                      </div>
                    )}
                    {isCurrent && step === 'paid' && queueCount === 0 && (
                      <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '2px' }}>
                        Your order is next!
                      </div>
                    )}
                    {isCurrent && step === 'printing' && (
                      <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                        Printing in progress...
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Details */}
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
            Order Details
          </div>
          <div style={{
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px'
          }}>
            <DetailItem label="Document" value={order.file_name} />
            <DetailItem label="Pages" value={String(order.pages)} />
            <DetailItem label="Copies" value={String(order.copies)} />
            <DetailItem
              label="Type"
              value={order.color_mode === 'bw' ? 'Black & White' : 'Color'}
            />
            <DetailItem
              label="Sides"
              value={order.sides === 'single' ? 'Single' : 'Double'}
            />
            <DetailItem
              label="Amount paid"
              value={'Rs.' + Number(order.amount).toFixed(2)}
            />
          </div>
        </div>

        {/* Shop Details */}
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
            Shop Details
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{
              fontWeight: '600',
              fontSize: '15px',
              marginBottom: '4px'
            }}>
              {order.shops?.name}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px'
            }}>
              <MapPin size={13} color="#888" />
              <span style={{ fontSize: '13px', color: '#888' }}>
                {order.shops?.address}
              </span>
            </div>

            {/* Map Button */}
            <div
              onClick={openMaps}
              style={{
                backgroundColor: '#f0f0ec',
                borderRadius: '12px',
                height: '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: '8px',
                border: '1px solid #e8e8e4'
              }}
            >
              <MapPin size={24} color="#888" />
              <span style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>
                Tap to open directions in Google Maps
              </span>
            </div>

            {/* Call Shop */}
            
            {order.shops?.phone && (
                <a
                href={'tel:' + order.shops.phone}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f8f6',
                  border: '1px solid #e8e8e4',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: '#1a1a1a',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📞 Call {order.shops.name}
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '14px',
        fontWeight: '500',
        wordBreak: 'break-word'
      }}>
        {value}
      </div>
    </div>
  )
}