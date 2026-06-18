import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    // Get order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('file_path, status')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Delete file from storage
    const { error: deleteError } = await supabaseAdmin
      .storage
      .from('documents')
      .remove([order.file_path])

    if (deleteError) {
      console.error('File deletion error:', deleteError)
    }

    // Mark order as collected
    await supabaseAdmin
      .from('orders')
      .update({ status: 'collected' })
      .eq('id', orderId)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 })
  }
}