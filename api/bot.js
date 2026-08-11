import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, userId } = req.method === 'GET' ? req.query : req.body;

  // ─── GET TRADES ───────────────────────────────────────────────────────────
  if (req.method === 'GET' && action === 'trades') {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return res.status(200).json({ trades: data || [] });
  }

  // ─── GET USER ─────────────────────────────────────────────────────────────
  if (req.method === 'GET' && action === 'user') {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return res.status(200).json({ user: data });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { botActive, riskPct, maxTrades, alpacaKey, alpacaSecret, coinbaseKey, coinbaseSecret, telegramChatId } = req.body;

  // ─── START / STOP BOT ────────────────────────────────────────────────────
  if (action === 'toggleBot') {
    const { data: user } = await supabase
      .from('users')
      .update({ bot_active: botActive })
      .eq('id', userId)
      .select()
      .single();

    if (user?.telegram_chat_id) {
      await sendTelegram(user.telegram_chat_id,
        botActive
          ? `🤖 <b>QUANTUM SIGNAL AI</b>\n✅ Bot ACTIVATED — now monitoring markets 24/7.\nRisk: ${user.risk_pct}% per trade · Max trades: ${user.max_trades}`
          : `⏸ <b>QUANTUM SIGNAL AI</b>\nBot PAUSED — no new trades will execute.`
      );
    }
    return res.status(200).json({ success: true, botActive });
  }

  // ─── EMERGENCY STOP ──────────────────────────────────────────────────────
  if (action === 'emergencyStop') {
    await supabase.from('users').update({ bot_active: false }).eq('id', userId);
    await supabase.from('trades').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'pending');

    const { data: user } = await supabase.from('users').select('telegram_chat_id').eq('id', userId).single();
    if (user?.telegram_chat_id) {
      await sendTelegram(user.telegram_chat_id,
        `⛔ <b>QUANTUM SIGNAL AI — EMERGENCY STOP</b>\nAll pending orders cancelled. Bot disabled immediately.`
      );
    }
    return res.status(200).json({ success: true });
  }

  // ─── UPDATE SETTINGS ─────────────────────────────────────────────────────
  if (action === 'updateSettings') {
    const updates = {};
    if (riskPct !== undefined) updates.risk_pct = riskPct;
    if (maxTrades !== undefined) updates.max_trades = maxTrades;
    if (alpacaKey) updates.alpaca_key = alpacaKey;
    if (alpacaSecret) updates.alpaca_secret = alpacaSecret;
    if (coinbaseKey) updates.coinbase_key = coinbaseKey;
    if (coinbaseSecret) updates.coinbase_secret = coinbaseSecret;
    if (telegramChatId) updates.telegram_chat_id = telegramChatId;

    await supabase.from('users').update(updates).eq('id', userId);
    return res.status(200).json({ success: true });
  }

  // ─── CONNECT TELEGRAM ────────────────────────────────────────────────────
  if (action === 'connectTelegram') {
    await supabase.from('users').update({ telegram_chat_id: telegramChatId }).eq('id', userId);
    await sendTelegram(telegramChatId,
      `✅ <b>QUANTUM SIGNAL AI</b>\nTelegram connected successfully!\nYou'll receive instant notifications for every trade the bot executes.`
    );
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}

