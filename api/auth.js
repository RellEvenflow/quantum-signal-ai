import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const resend = new Resend(process.env.RESEND_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, firstName, lastName, phone, plan } = req.body;

  // ─── SIGNUP ───────────────────────────────────────────────────────────────
  if (action === 'signup') {
    try {
      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) return res.status(400).json({ error: 'Email already registered. Please log in.' });

      // Hash password (simple for now — use bcrypt in production)
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          plan: plan || 'starter',
          password_hash: hashedPassword,
          active: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Send welcome email
      await resend.emails.send({
        from: 'Quantum Signal AI <noreply@quantumsignalai.com>',
        to: email,
        subject: '🤖 Welcome to Quantum Signal AI!',
        html: `
          <div style="background:#030608;color:#a8c8e0;font-family:monospace;padding:40px;max-width:600px;margin:0 auto;">
            <h1 style="color:#00d4ff;font-size:24px;margin-bottom:16px;">⬡ QUANTUM SIGNAL AI</h1>
            <h2 style="color:#fff;margin-bottom:16px;">Welcome, ${firstName}! 🎉</h2>
            <p style="line-height:1.8;margin-bottom:20px;">Your account has been created successfully. Complete your payment to activate your <strong style="color:#ff6b00;">${plan?.toUpperCase()}</strong> plan and start trading.</p>
            <div style="background:#080f14;border:1px solid #0c1e2e;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0;color:#3a6070;font-size:12px;">ACCOUNT DETAILS</p>
              <p style="margin:8px 0;color:#fff;">Email: <strong>${email}</strong></p>
              <p style="margin:0;color:#fff;">Plan: <strong style="color:#ff6b00;">${plan?.toUpperCase()}</strong></p>
            </div>
            <p style="color:#2a5060;font-size:11px;line-height:1.8;">⚠ This is an educational trading tool. Not financial advice. All trading involves risk.</p>
          </div>
        `,
      });

      return res.status(200).json({ success: true, user: { id: user.id, email, firstName, lastName, plan } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  if (action === 'login') {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) return res.status(401).json({ error: 'Invalid email or password.' });

      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          plan: user.plan,
          active: user.active,
          botActive: user.bot_active,
          telegramChatId: user.telegram_chat_id,
        }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}

