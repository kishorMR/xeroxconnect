'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, MapPin, Clock, Upload, X,
  FileText, Printer, ChevronDown
} from 'lucide-react'
import Link from 'next/link'

interface Shop {
  id: string
  name: string
  address: string
  phone: string
  timings: { open: string; close: string }
  prices: { bw: number; color?: number }
  capabilities: { color: boolean; double_sided: boolean; binding: boolean }
  is_active: boolean
}

interface PrintSpecs {
  copies: number
  colorMode: 'bw' | 'color'
  sides: 'single' | 'double'
  pages: number
}

export default function ShopPage() {
  const params = useParams()
  const router = useRouter()
  const shopId = params.id as string

  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [specs, setSpecs] = useState<PrintSpecs>({
    copies: 1,
    colorMode: 'bw',
    sides: 'single',
    pages: 1
  })

  useEffect(() => {
    fetchShop()
  }, [shopId])

  async function fetchShop() {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single()

    if (error || !data) {
      router.push('/')
      return
    }
    setShop(data)
    setLoading(false)
  }

  function handleFileSelect(selectedFile: File) {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]
    if (!allowed.includes(selectedFile.type)) {
      alert('Only PDF, Word documents, JPG and PNG files are allowed')
      return
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      alert('File size must be under 20MB')
      return
    }
    setFile(selectedFile)
  }

  function calculatePrice() {
    if (!shop) return 0
    const pricePerPage = specs.colorMode === 'color'
      ? (shop.prices.color || 5)
      : shop.prices.bw
    const totalPages = specs.pages * (specs.sides === 'double' ? 1 : 1)
    const printCost = pricePerPage * totalPages * specs.copies
    const platformFee = totalPages * specs.copies * 0.10
    return { printCost, platformFee, total: printCost + platformFee }
  }

  async function handleProceedToPayment() {
    if (!file) {
      alert('Please upload a document first')
      return
    }
    setUploading(true)

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `orders/${shopId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Store order details in sessionStorage to use on payment page
      const pricing = calculatePrice()
      const orderDetails = {
        shopId,
        shopName: shop?.name,
        filePath,
        fileName: file.name,
        copies: specs.copies,
        colorMode: specs.colorMode,
        sides: specs.sides,
        pages: specs.pages,
        amount: pricing ? pricing.total : 0,
        platformFee: pricing ? pricing.platformFee : 0,
        printCost: pricing ? pricing.printCost : 0,
      }

      sessionStorage.setItem('pendingOrder', JSON.stringify(orderDetails))
      router.push('/checkout')

    } catch (err) {
      console.error(err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const pricing = calculatePrice()

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

  if (!shop) return null

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
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', lineHeight: 1.2 }}>
            {shop.name}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>{shop.address}</div>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Shop Info Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid #e8e8e4',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              backgroundColor: '#f0f0ec',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Printer size={20} color="#555" />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '2px' }}>
                {shop.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="#888" />
                <span style={{ fontSize: '13px', color: '#888' }}>{shop.address}</span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #f0f0ec'
          }}>
            <InfoPill icon={<Clock size={12} />}
              text={`${shop.timings?.open || '9 AM'} - ${shop.timings?.close || '8 PM'}`} />
            <InfoPill text={`B&W ₹${shop.prices?.bw || 1}/page`} />
            {shop.prices?.color && (
              <InfoPill text={`Color ₹${shop.prices.color}/page`} />
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          border: '1px solid #e8e8e4',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0ec' }}>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>Upload Document</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
              PDF, Word, JPG or PNG — max 20MB
            </div>
          </div>

          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const dropped = e.dataTransfer.files[0]
                if (dropped) handleFileSelect(dropped)
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
              style={{
                margin: '16px',
                border: `2px dashed ${dragOver ? '#1a1a1a' : '#e8e8e4'}`,
                borderRadius: '12px',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: dragOver ? '#f8f8f6' : 'transparent',
                transition: 'all 0.15s'
              }}
            >
              <Upload size={28} color="#ccc" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>
                Tap to upload or drag and drop
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                Your document is deleted after printing
              </div>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />
            </div>
          ) : (
            <div style={{
              margin: '16px',
              backgroundColor: '#f8f8f6',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FileText size={20} color="#555" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '500',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#888'
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Print Specifications */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          border: '1px solid #e8e8e4',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0ec' }}>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>Print Settings</div>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Pages */}
            <SpecRow label="Number of pages">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CounterButton
                  onClick={() => setSpecs(s => ({ ...s, pages: Math.max(1, s.pages - 1) }))}
                  label="−"
                />
                <span style={{ fontWeight: '600', fontSize: '16px', minWidth: '24px', textAlign: 'center' }}>
                  {specs.pages}
                </span>
                <CounterButton
                  onClick={() => setSpecs(s => ({ ...s, pages: s.pages + 1 }))}
                  label="+"
                />
              </div>
            </SpecRow>

            {/* Copies */}
            <SpecRow label="Number of copies">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CounterButton
                  onClick={() => setSpecs(s => ({ ...s, copies: Math.max(1, s.copies - 1) }))}
                  label="−"
                />
                <span style={{ fontWeight: '600', fontSize: '16px', minWidth: '24px', textAlign: 'center' }}>
                  {specs.copies}
                </span>
                <CounterButton
                  onClick={() => setSpecs(s => ({ ...s, copies: s.copies + 1 }))}
                  label="+"
                />
              </div>
            </SpecRow>

            {/* Color mode */}
            <SpecRow label="Print type">
              <div style={{ display: 'flex', gap: '8px' }}>
                <ToggleChip
                  label="B&W"
                  active={specs.colorMode === 'bw'}
                  onClick={() => setSpecs(s => ({ ...s, colorMode: 'bw' }))}
                />
                {shop.capabilities?.color && (
                  <ToggleChip
                    label="Color"
                    active={specs.colorMode === 'color'}
                    onClick={() => setSpecs(s => ({ ...s, colorMode: 'color' }))}
                  />
                )}
              </div>
            </SpecRow>

            {/* Sides */}
            <SpecRow label="Sides">
              <div style={{ display: 'flex', gap: '8px' }}>
                <ToggleChip
                  label="Single sided"
                  active={specs.sides === 'single'}
                  onClick={() => setSpecs(s => ({ ...s, sides: 'single' }))}
                />
                {shop.capabilities?.double_sided && (
                  <ToggleChip
                    label="Double sided"
                    active={specs.sides === 'double'}
                    onClick={() => setSpecs(s => ({ ...s, sides: 'double' }))}
                  />
                )}
              </div>
            </SpecRow>

          </div>
        </div>

        {/* Price Breakdown */}
        {pricing && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '14px',
            border: '1px solid #e8e8e4',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '12px' }}>
              Price Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <PriceRow
                label={`${specs.pages} pages × ${specs.copies} ${specs.copies > 1 ? 'copies' : 'copy'} × ₹${specs.colorMode === 'color' ? shop.prices.color || 5 : shop.prices.bw}/page`}
                value={`₹${pricing.printCost.toFixed(2)}`}
              />
              <PriceRow
                label={`Platform fee (₹0.10 × ${specs.pages * specs.copies} pages)`}
                value={`₹${pricing.platformFee.toFixed(2)}`}
              />
              <div style={{
                borderTop: '1px solid #f0f0ec',
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>Total</span>
                <span style={{ fontWeight: '700', fontSize: '20px' }}>
                  ₹{pricing.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

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
          <div style={{ fontWeight: '700', fontSize: '20px' }}>
            ₹{pricing ? pricing.total.toFixed(2) : '0.00'}
          </div>
        </div>
        <button
          onClick={handleProceedToPayment}
          disabled={!file || uploading}
          style={{
            backgroundColor: !file || uploading ? '#ccc' : '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: !file || uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.15s'
          }}
        >
          {uploading ? 'Uploading...' : 'Proceed to Pay'}
        </button>
      </div>
    </div>
  )
}

function InfoPill({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#f8f8f6',
      border: '1px solid #e8e8e4',
      borderRadius: '8px',
      padding: '4px 10px'
    }}>
      {icon}
      <span style={{ fontSize: '12px', color: '#555' }}>{text}</span>
    </div>
  )
}

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '14px', color: '#555', flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  )
}

function CounterButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: '1px solid #e8e8e4',
        backgroundColor: '#f8f8f6',
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a1a1a',
        fontWeight: '400'
      }}
    >
      {label}
    </button>
  )
}

function ToggleChip({ label, active, onClick }: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: `1px solid ${active ? '#1a1a1a' : '#e8e8e4'}`,
        backgroundColor: active ? '#1a1a1a' : '#fff',
        color: active ? '#fff' : '#555',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
    >
      {label}
    </button>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '500' }}>{value}</span>
    </div>
  )
}