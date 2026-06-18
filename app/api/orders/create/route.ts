import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase-admin'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      shopId, filePath, fileName,
      copies, colorMode, sides,
      pages, amount, platformFee, userId
    } = body

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    // Create order in database first
    const { data: dbOrder, error } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        shop_id: shopId,
        file_path: filePath,
        file_name: fileName,
        copies,
        color_mode: colorMode,
        sides,
        pages,
        amount,
        platform_fee: platformFee,
        status: 'pending',
        payment_status: 'pending',
        otp
      })
      .select()
      .single()

    if (error) throw error

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: dbOrder.id,
    })

    return NextResponse.json({
      dbOrderId: dbOrder.id,
      razorpayOrderId: razorpayOrder.id,
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}