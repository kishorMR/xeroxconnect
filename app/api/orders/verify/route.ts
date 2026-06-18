import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId
    } = await req.json()

    console.log('Verifying payment for order:', dbOrderId)
    console.log('razorpay_order_id:', razorpay_order_id)
    console.log('razorpay_payment_id:', razorpay_payment_id)
    console.log('razorpay_signature:', razorpay_signature)

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    console.log('Expected:', expectedSignature)
    console.log('Received:', razorpay_signature)
    console.log('Match:', expectedSignature === razorpay_signature)

    if (expectedSignature !== razorpay_signature) {
      console.log('Signature mismatch!')
      return NextResponse.json({ success: false, error: 'Invalid signature' })
    }

    // Update order status to paid
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_id: razorpay_payment_id,
        payment_status: 'paid',
        status: 'paid'
      })
      .eq('id', dbOrderId)

    if (error) {
      console.log('DB update error:', error)
      throw error
    }

    console.log('Order updated successfully')

    // Trigger print job
    await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/print/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: dbOrderId })
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
  }
}