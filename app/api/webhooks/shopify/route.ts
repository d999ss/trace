import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  const hash = hmac.digest('base64');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify the webhook signature
    if (!verifyWebhook(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(body);
    
    console.log('Received Shopify webhook:', topic);
    console.log('Order ID:', order.id);

    // Handle different webhook topics
    switch (topic) {
      case 'orders/paid':
        await handleOrderPaid(order);
        break;
      case 'orders/cancelled':
        await handleOrderCancelled(order);
        break;
      default:
        console.log('Unhandled webhook topic:', topic);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleOrderPaid(order: Record<string, unknown>) {
  console.log('Processing paid order:', order.id);
  
  // Extract custom attributes from the order
  const customAttributes = Array.isArray(order.note_attributes) ? order.note_attributes : [];
  let activityId = null;
  let theme = 'light';
  let title = '';
  let subtitle = '';
  let coordinates = null;

  for (const attr of customAttributes) {
    const attribute = attr as { name?: string; value?: string };
    if (!attribute.name || !attribute.value) continue;
    
    switch (attribute.name) {
      case 'activity_id':
        activityId = attribute.value;
        break;
      case 'theme':
        theme = attribute.value;
        break;
      case 'title':
        title = attribute.value;
        break;
      case 'subtitle':
        subtitle = attribute.value;
        break;
      case 'coordinates':
        try {
          coordinates = JSON.parse(attribute.value);
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }
        break;
    }
  }

  if (!coordinates) {
    console.error('No coordinates found in order attributes');
    return;
  }

  // TODO: Generate the high-resolution print file
  // TODO: Send to Printify API for fulfillment
  // TODO: Store order details in database

  console.log('Order details extracted:', {
    activityId,
    theme,
    title,
    subtitle,
    coordinatesCount: coordinates?.length || 0
  });

  // For now, just log the order processing
  console.log('Order processed successfully for activity:', activityId);
}

async function handleOrderCancelled(order: Record<string, unknown>) {
  console.log('Processing cancelled order:', order.id);
  
  // TODO: Cancel any pending Printify orders
  // TODO: Update order status in database
  
  console.log('Cancelled order processed:', order.id);
}