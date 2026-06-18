'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Store, Clock, IndianRupee, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function RegisterShopPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    upi_id: '',
    open_time: '9:00 AM',
    close_time: '9:00 PM',
    bw_price: '1',
    color_price: '5',
    has_color: true,
    has_double_sided: true,
    has_binding: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/profile')
      return
    }

    // Check if already has a shop
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (shop) {
      router.push('/dashboard')
      return
    }

    setUser(user)
    setLoading(false)
  }

  function update(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function validateStep1() {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Shop name is required'
    if (!form.address.trim()) newErrors.address = 'Address is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^[6-9]\d{9}$/.test(form.phone)) newErrors.phone = 'Enter valid 10 digit Indian mobile number'
    if (!form.upi_id.trim()) newErrors.upi_id = 'UPI ID is required'
    else if (!form.upi_id.includes('@')) newErrors.upi_id = 'Enter valid UPI ID (e.g. shop@upi)'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep2() {
    const newErrors: Record<string, string> = {}
    if (!form.bw_price || isNaN(Number(form.bw_price)) || Number(form.bw_price) <= 0)
      newErrors.bw_price = 'Enter valid B&W price'
    if (form.has_color && (!form.color_price || isNaN(Number(form.color_price)) || Number(form.color_price) <= 0))
      newErrors.color_price = 'Enter valid color price'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validateStep2()) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('shops')
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          upi_id: form.upi_id.trim(),
          timings: {
            open: form.open_time,
            close: form.close_time
          },
          prices: {
            bw: Number(form.bw_price),
            ...(form.has_color && { color: Number(form.color_price) })
          },
          capabilities: {
            color: form.has_color,
            double_sided: form.has_double_sided,
            binding: form.has_binding
          },
          is_verified: false,
          is_active: true
        })

      if (error) throw error

      // Go to success step
      setStep(3)

    } catch (err) {
      console.error(err)
      alert('Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
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

  // Success Screen
  if (step === 3) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f8f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          border: '1px solid #e8e8e4',
          padding: '40px 24px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#f0fdf4',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '28px'
          }}>
            🎉
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '10px'
          }}>
            Shop Registered!
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#888',
            marginBottom: '8px',
            lineHeight: '1.6'
          }}>
            Your shop has been submitted for verification.
          </p>
          <p style={{
            fontSize: '13px',
            color: '#aaa',
            marginBottom: '28px',
            lineHeight: '1.6'
          }}>
            We'll review and verify your shop within 24 hours.
            Once verified, students can find and place orders at your shop.
          </p>

          <div style={{
            backgroundColor: '#f8f8f6',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#555',
            textAlign: 'left',
            lineHeight: '1.8'
          }}>
            <div>✅ Shop details saved</div>
            <div>⏳ Verification pending (24hrs)</div>
            <div>🖨️ Install PrintNode on your shop PC</div>
            <div>💰 Connect your UPI to receive payments</div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#888',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
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
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button
          onClick={() => step === 1 ? router.back() : setStep(1)}
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
        <span style={{ fontWeight: '600', fontSize: '15px' }}>
          Register Shop
        </span>

        {/* Step indicator */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <StepDot active={step >= 1} />
          <StepDot active={step >= 2} />
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Step 1 — Shop Info */}
        {step === 1 && (
          <div>
            <SectionHeader
              icon={<Store size={18} color="#555" />}
              title="Shop Information"
              subtitle="Basic details about your xerox shop"
            />

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              border: '1px solid #e8e8e4',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <FormField
                label="Shop Name"
                placeholder="e.g. Sri Vinayaka Xerox"
                value={form.name}
                onChange={v => update('name', v)}
                error={errors.name}
                icon={<Store size={15} color="#888" />}
              />
              <FormField
                label="Full Address"
                placeholder="e.g. 12, 5th Block, Koramangala, Bengaluru"
                value={form.address}
                onChange={v => update('address', v)}
                error={errors.address}
                icon={<MapPin size={15} color="#888" />}
                divider
              />
              <FormField
                label="Phone Number"
                placeholder="10 digit mobile number"
                value={form.phone}
                onChange={v => update('phone', v)}
                error={errors.phone}
                icon={<Phone size={15} color="#888" />}
                type="tel"
                divider
              />
              <FormField
                label="UPI ID"
                placeholder="e.g. shopname@upi or 9876543210@ybl"
                value={form.upi_id}
                onChange={v => update('upi_id', v)}
                error={errors.upi_id}
                icon={<IndianRupee size={15} color="#888" />}
                divider
              />
            </div>

            {/* Timings */}
            <SectionHeader
              icon={<Clock size={18} color="#555" />}
              title="Shop Timings"
              subtitle="When is your shop open?"
            />

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              border: '1px solid #e8e8e4',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: '12px',
                  color: '#888',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Opening Time
                </label>
                <select
                  value={form.open_time}
                  onChange={e => update('open_time', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e4',
                    fontSize: '14px',
                    backgroundColor: '#f8f8f6',
                    color: '#1a1a1a',
                    outline: 'none'
                  }}
                >
                  {generateTimeOptions()}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: '12px',
                  color: '#888',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Closing Time
                </label>
                <select
                  value={form.close_time}
                  onChange={e => update('close_time', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e4',
                    fontSize: '14px',
                    backgroundColor: '#f8f8f6',
                    color: '#1a1a1a',
                    outline: 'none'
                  }}
                >
                  {generateTimeOptions()}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Pricing & Capabilities */}
        {step === 2 && (
          <div>
            <SectionHeader
              icon={<IndianRupee size={18} color="#555" />}
              title="Pricing"
              subtitle="Set your per page prices"
            />

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              border: '1px solid #e8e8e4',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <FormField
                label="B&W Price per page (₹)"
                placeholder="e.g. 1"
                value={form.bw_price}
                onChange={v => update('bw_price', v)}
                error={errors.bw_price}
                type="number"
              />
              {form.has_color && (
                <FormField
                  label="Color Price per page (₹)"
                  placeholder="e.g. 5"
                  value={form.color_price}
                  onChange={v => update('color_price', v)}
                  error={errors.color_price}
                  type="number"
                  divider
                />
              )}
            </div>

            <SectionHeader
              icon={<Store size={18} color="#555" />}
              title="Capabilities"
              subtitle="What services does your shop offer?"
            />

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              border: '1px solid #e8e8e4',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <ToggleRow
                label="Color Printing"
                description="Can your shop print in color?"
                value={form.has_color}
                onChange={v => update('has_color', v)}
              />
              <ToggleRow
                label="Double Sided Printing"
                description="Can your shop print on both sides?"
                value={form.has_double_sided}
                onChange={v => update('has_double_sided', v)}
                divider
              />
              <ToggleRow
                label="Binding"
                description="Do you offer binding services?"
                value={form.has_binding}
                onChange={v => update('has_binding', v)}
                divider
              />
            </div>

            {/* Platform fee note */}
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '13px',
              color: '#1d4ed8',
              lineHeight: '1.6'
            }}>
              ℹ️ XeroxConnect charges ₹0.10 per page as platform fee.
              This is collected from students separately — your earnings are not affected.
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTop: '1px solid #e8e8e4',
        padding: '12px 16px'
      }}>
        {step === 1 && (
          <button
            onClick={() => { if (validateStep1()) setStep(2) }}
            style={{
              width: '100%',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Next — Pricing & Services
          </button>
        )}
        {step === 2 && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              backgroundColor: submitting ? '#ccc' : '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Registering...' : 'Register Shop'}
          </button>
        )}
      </div>
    </div>
  )
}

function generateTimeOptions() {
  const times = []
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h % 12 === 0 ? 12 : h % 12
      const ampm = h < 12 ? 'AM' : 'PM'
      const minute = m === 0 ? '00' : '30'
      const label = `${hour}:${minute} ${ampm}`
      times.push(<option key={label} value={label}>{label}</option>)
    }
  }
  return times
}

function SectionHeader({
  icon, title, subtitle
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px'
    }}>
      <div style={{
        backgroundColor: '#f0f0ec',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: '600', fontSize: '15px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>{subtitle}</div>
      </div>
    </div>
  )
}

function FormField({
  label, placeholder, value, onChange,
  error, icon, type = 'text', divider = false
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  icon?: React.ReactNode
  type?: string
  divider?: boolean
}) {
  return (
    <div style={{
      borderTop: divider ? '1px solid #f0f0ec' : 'none',
      padding: '14px 16px'
    }}>
      <label style={{
        fontSize: '12px',
        color: '#888',
        display: 'block',
        marginBottom: '6px'
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            backgroundColor: 'transparent',
            color: '#1a1a1a'
          }}
        />
      </div>
      {error && (
        <div style={{
          fontSize: '12px',
          color: '#ef4444',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  label, description, value, onChange, divider = false
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  divider?: boolean
}) {
  return (
    <div style={{
      borderTop: divider ? '1px solid #f0f0ec' : 'none',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: value ? '#1a1a1a' : '#e8e8e4',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 0.2s',
          flexShrink: 0
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          transition: 'left 0.2s'
        }} />
      </button>
    </div>
  )
}

function StepDot({ active }: { active: boolean }) {
  return (
    <div style={{
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: active ? '#1a1a1a' : '#e8e8e4',
      transition: 'background-color 0.2s'
    }} />
  )
}