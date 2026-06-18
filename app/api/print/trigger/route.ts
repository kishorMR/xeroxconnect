import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    // Fetch order with shop details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        shops (
          name,
          printnode_printer_id
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If shop has no printer linked yet — mark as paid and stop
    // Shopkeeper will see it on dashboard and print manually
    if (!order.shops?.printnode_printer_id) {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)

      return NextResponse.json({
        success: true,
        mode: 'manual',
        message: 'No printer linked — shopkeeper will print manually'
      })
    }

    // Get signed URL for the file (valid for 10 minutes)
    const { data: signedUrl, error: urlError } = await supabaseAdmin
      .storage
      .from('documents')
      .createSignedUrl(order.file_path, 600)

    if (urlError || !signedUrl) {
      throw new Error('Could not generate file URL')
    }

    // Send print job to PrintNode
    const printJobRes = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.PRINTNODE_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printerId: parseInt(order.shops.printnode_printer_id),
        title: `XeroxConnect - Order ${orderId.slice(0, 8)}`,
        contentType: 'pdf_uri',
        content: signedUrl.signedUrl,
        source: 'XeroxConnect',
        options: {
          copies: order.copies,
          duplex: order.sides === 'double' ? 'two-sided-long-edge' : 'one-sided',
          color: order.color_mode === 'color' ? 'color' : 'gray',
          media: 'A4'
        }
      })
    })

    if (!printJobRes.ok) {
      throw new Error('PrintNode job failed')
    }

    // Update order status to printing
    await supabaseAdmin
      .from('orders')
      .update({ status: 'printing' })
      .eq('id', orderId)

    // Schedule file deletion after 15 minutes
    setTimeout(async () => {
      await supabaseAdmin
        .storage
        .from('documents')
        .remove([order.file_path])
    }, 15 * 60 * 1000)

    return NextResponse.json({ success: true, mode: 'auto' })

  } catch (err) {
    console.error('Print trigger error:', err)

    // Don't fail the order — just leave it as paid
    // Shopkeeper dashboard will show it
    return NextResponse.json({
      success: true,
      mode: 'manual',
      message: 'Auto print failed — fallback to manual'
    })
  }
}