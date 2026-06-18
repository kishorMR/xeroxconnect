'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Printer, ChevronRight, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
interface ShopTimings {
  open: string
  close: string
}

interface ShopPrices {
  bw: number
  color?: number
}

interface Shop {
  id: string
  name: string
  address: string
  prices: ShopPrices
  timings: ShopTimings
  is_active: boolean
  is_verified: boolean
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null)
    })
  }, [])

  async function searchShops(query: string) {
    setLoading(true)
    setSearched(true)

    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .eq('is_verified', true)
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)

    if (!error) setShops(data || [])
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) searchShops(searchQuery.trim())
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Printer size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: '600', fontSize: '17px', letterSpacing: '-0.3px' }}>
            XeroxConnect
          </span>
        </div>

        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0f0ec',
            borderRadius: '20px',
            padding: '6px 12px',
            cursor: 'pointer'
          }}>
            <User size={15} color="#555" />
            <span style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>
              {user ? (user.user_metadata?.name?.split(' ')[0] || 'Profile') : 'Guest'}
            </span>
          </div>
        </Link>
      </nav>

      {/* Hero Section */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '48px 20px 56px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#2a2a2a',
          borderRadius: '20px',
          padding: '6px 14px',
          marginBottom: '20px'
        }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: '#4ade80', borderRadius: '50%' }} />
          <span style={{ fontSize: '12px', color: '#aaa' }}>Instant printing near you</span>
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#fff',
          lineHeight: '1.2',
          marginBottom: '10px',
          letterSpacing: '-0.5px'
        }}>
          Print anything,<br />collect in minutes
        </h1>
        <p style={{ fontSize: '15px', color: '#888', marginBottom: '32px' }}>
          Upload your document, pay online, walk in and collect
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#fff',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '16px',
              flexShrink: 0
            }}>
              <Search size={18} color="#888" />
            </div>
            <input
              type="text"
              placeholder="Search by shop name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '16px 12px',
                fontSize: '15px',
                backgroundColor: 'transparent',
                color: '#1a1a1a'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: 'none',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div style={{ padding: '24px 20px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e8e8e4',
              borderTop: '3px solid #1a1a1a',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px'
            }} />
            <p style={{ color: '#888', fontSize: '14px' }}>Finding shops near you...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* No results */}
        {!loading && searched && shops.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontWeight: '600', marginBottom: '6px' }}>No shops found</p>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Try searching by area name like "Koramangala" or "Indiranagar"
            </p>
          </div>
        )}

        {/* Default state */}
        {!loading && !searched && (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <MapPin size={32} color="#ccc" style={{ marginBottom: '12px' }} />
            <p style={{ color: '#888', fontSize: '14px' }}>
              Search for a xerox shop by name or area to get started
            </p>
          </div>
        )}

        {/* Shop Cards */}
        {!loading && shops.length > 0 && (
          <div>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
              {shops.length} shop{shops.length > 1 ? 's' : ''} found
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shops.map(shop => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ShopCard({ shop }: { shop: Shop }) {
  const prices = shop.prices || {}

  return (
    <Link href={`/shop/${shop.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid #e8e8e4',
          cursor: 'pointer',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>

            {/* Shop name + verified badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a1a1a' }}>
                {shop.name}
              </span>
              <span style={{
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 7px',
                borderRadius: '10px',
                border: '1px solid #bbf7d0'
              }}>
                ✓ Verified
              </span>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
              <MapPin size={12} color="#888" />
              <span style={{ fontSize: '13px', color: '#888' }}>{shop.address}</span>
            </div>

            {/* Price pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <PricePill label="B&W" value={`₹${prices.bw || 1}/page`} />
              {prices.color && <PricePill label="Color" value={`₹${prices.color}/page`} />}
              {shop.timings && (
                <PricePill label="Open" value={`${shop.timings.open} - ${shop.timings.close}`} />
              )}
            </div>
          </div>

          <ChevronRight size={18} color="#ccc" style={{ marginTop: '4px', flexShrink: 0 }} />
        </div>
      </div>
    </Link>
  )
}

function PricePill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: '#f8f8f6',
      border: '1px solid #e8e8e4',
      borderRadius: '8px',
      padding: '4px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span style={{ fontSize: '11px', color: '#888' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>{value}</span>
    </div>
  )
}