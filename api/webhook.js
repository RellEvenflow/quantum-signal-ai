import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const resend = new Resend(process.env.RESEND_KEY);
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

async function sendTelegram(chatId, message) {
  if (!chatId) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const raw = await getRawBody(req);
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(raw.toString());
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // ─── Payment succeeded ────────────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const plan = session.metadata?.plan || 'starter';

    if (email) {
      // Activate user account
      const { data: user } = await supabase
        .from('users')
        .update({
          active: true,
          plan,
          stripe_customer_id: session.customer,
        })
        .eq('email', email)
        .select()
        .single();

      // Send activation email
      await resend.emails.send({
        from: 'Quantum Signal AI <noreply@quantumsignalai.com>',
        to: email,
        subject: '✅ Your Quantum Signal AI account is ACTIVE!',
        html: `
          <div style="background:#030608;color:#a8c8e0;font-family:monospace;padding:40px;max-width:600px;margin:0 auto;">
            <h1 style="color:#00d4ff;">⬡ QUANTUM SIGNAL AI</h1>
            <h2 style="color:#00ff88;">✅ Payment Confirmed — You're Live!</h2>
            <p style="line-height:1.8;">Your <strong style="color:#ff6b00;">${plan.toUpperCase()}</strong> subscription is now active. The bot is ready to trade for you.</p>
            <div style="background:#080f14;border:1px solid #0c1e2e;border-radius:8px;padding:20px;margin:20px 0;">
              <p style="color:#3a6070;font-size:11px;margin:0 0 8px;">NEXT STEPS</p>
              <p style="margin:4px 0;">1. Log in to your dashboard</p>
              <p style="margin:4px 0;">2. Connect your broker (Alpaca or Coinbase)</p>
              <p style="margin:4px 0;">3. Set your risk level</p>
              <p style="margin:4px 0;">4. Activate the bot — it trades 24/7</p>
            </div>
            ${plan === 'bot' ? `<p style="color:#ff6b00;">🤖 You have the Bot Tier — your bot will auto-execute trades and notify you via Telegram + Email on every trade.</p>` : ''}
            <p style="color:#2a5060;font-size:11px;">⚠ Educational tool only. Not financial advice.</p>
          </div>
        `,
      });

      // Send Telegram if connected
      if (user?.telegram_chat_id) {
        await sendTelegram(user.telegram_chat_id, `
✅ <b>QUANTUM SIGNAL AI</b>
Payment confirmed! Your ${plan.toUpperCase()} account is now ACTIVE.
${plan === 'bot' ? '🤖 Bot is ready — connect your broker to start auto-trading.' : '📊 Log in to access your dashboard.'}
        `);
      }
    }
  }

  // ─── Subscription cancelled ───────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await supabase
      .from('users')
      .update({ active: false, bot_active: false })
      .eq('stripe_customer_id', sub.customer);
  }

  res.status(200).json({ received: true });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export const config = { api: { bodyParser: false } };

