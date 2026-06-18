'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Printer, Shield } from 'lucide-react'
import Link from 'next/link'

interface OrderDetails {
  shopId: string
  shopName: string
  filePath: string
  fileName: string
  copies: number
  colorMode: string
  sides: string
  pages: number
  amount: number
  platformFee: number
  printCost: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [paying, setPaying] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get order details from sessionStorage
    const stored = sessionStorage.getItem('pendingOrder')
    if (!stored) {
      router.push('/')
      return
    }
    setOrder(JSON.parse(stored))

    // Get current user if logged in
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null)
    })

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  async function handlePayment() {
    if (!order) return
    setPaying(true)

    try {
      // Create order on our backend
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: order.shopId,
          filePath: order.filePath,
          fileName: order.fileName,
          copies: order.copies,
          colorMode: order.colorMode,
          sides: order.sides,
          pages: order.pages,
          amount: order.amount,
          platformFee: order.platformFee,
          userId: user?.id || null
        })
      })

      const { orderId, razorpayOrderId, dbOrderId } = await res.json()

      // Open Razorpay payment modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(order.amount * 100), // in paise
        currency: 'INR',
        name: 'XeroxConnect',
        description: `Print at ${order.shopName}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          // Payment successful — verify and confirm
          const verifyRes = await fetch('/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId
            })
          })

          const result = await verifyRes.json()

          if (result.success) {
            sessionStorage.removeItem('pendingOrder')
            router.push(`/order/${dbOrderId}`)
          } else {
            alert('Payment verification failed. Please contact support.')
            setPaying(false)
          }
        },
        prefill: {
          name: user?.user_metadata?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#1a1a1a' },
        modal: {
          ondismiss: () => setPaying(false)
        }
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()

    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  if (!order) return null

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
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            padding: 0
          }}
        >
          <ArrowLeft size={20} color="#1a1a1a" />
        </button>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>Checkout</span>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Order Summary */}
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
            Order Summary
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Shop */}
            <SummaryRow
              icon={<Printer size={15} color="#555" />}
              label="Shop"
              value={order.shopName}
            />

            {/* File */}
            <SummaryRow
              icon={<FileText size={15} color="#555" />}
              label="Document"
              value={order.fileName}
            />

            {/* Specs */}
            <div style={{ backgroundColor: '#f8f8f6', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', fontWeight: '500' }}>
                PRINT SETTINGS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <SpecItem label="Pages" value={String(order.pages)} />
                <SpecItem label="Copies" value={String(order.copies)} />
                <SpecItem label="Type" value={order.colorMode === 'bw' ? 'Black & White' : 'Color'} />
                <SpecItem label="Sides" value={order.sides === 'single' ? 'Single sided' : 'Double sided'} />
              </div>
            </div>

          </div>
        </div>

        {/* Price Breakdown */}
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
            Payment Details
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <PriceRow label="Print charges" value={`₹${order.printCost.toFixed(2)}`} />
            <PriceRow label="Platform fee" value={`₹${order.platformFee.toFixed(2)}`} />
            <div style={{
              borderTop: '1px solid #f0f0ec',
              paddingTop: '10px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>Total</span>
              <span style={{ fontWeight: '700', fontSize: '20px' }}>₹{order.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Trust Note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <Shield size={16} color="#15803d" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#15803d' }}>
            Secure payment via Razorpay. Print charges go directly to the shop.
          </span>
        </div>

      </div>

      {/* Bottom Pay Button */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTop: '1px solid #e8e8e4',
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Total amount</div>
          <div style={{ fontWeight: '700', fontSize: '20px' }}>₹{order.amount.toFixed(2)}</div>
        </div>
        <button
          onClick={handlePayment}
          disabled={paying}
          style={{
            backgroundColor: paying ? '#ccc' : '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: paying ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s'
          }}
        >
          {paying ? 'Processing...' : `Pay ₹${order.amount.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

function SummaryRow({
  icon, label, value
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{
        backgroundColor: '#f0f0ec',
        borderRadius: '8px',
        padding: '6px',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>{label}</div>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          wordBreak: 'break-all'
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '500' }}>{value}</div>
    </div>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: '#555' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '500' }}>{value}</span>
    </div>
  )
}