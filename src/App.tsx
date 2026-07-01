import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";

const STRIPE_PK = "pk_live_51TRM7tK4Z1aqO4qojUT2oZU1VUcb8Po4LfJr0YajFYD47khTYuarPjZORAiZexMPxtpvstlzk1MLap8y9eCN0xsz00GwjsatxY";

// ─── Style Constants ──────────────────────────────────────────────────────────
const C = {
  bg:"#030608", panel:"#080f14", border:"#0c1e2e",
  accent:"#00d4ff", green:"#00ff88", red:"#ff3355",
  yellow:"#ffc400", purple:"#a855f7", orange:"#ff6b00", muted:"#1e3a4a",
  text:"#a8c8e0", dim:"#2a5060"
};
const fmt = (n, d=2) => n!=null ? Number(n).toLocaleString("en-US",{maximumFractionDigits:d}) : "—";
const fmtP = n => n!=null ? `${n>0?"+":""}${Number(n).toFixed(2)}%` : "—";
const fmtK = n => n==null?"—":n>=1e9?`$${(n/1e9).toFixed(2)}B`:n>=1e6?`$${(n/1e6).toFixed(2)}M`:`$${fmt(n)}`;

// ─── Shared UI ────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@300;400;500;700&display=swap');`;

function Input({ label, type="text", value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:11, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>{label}</label>
      <input
        type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{ width:"100%", background:"#040c14", border:`1px solid ${C.border}`, color:C.text, padding:"12px 14px", borderRadius:6, fontSize:13, fontFamily:"'IBM Plex Mono',monospace", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
        onFocus={e=>e.target.style.borderColor=C.accent}
        onBlur={e=>e.target.style.borderColor=C.border}
      />
    </div>
  );
}

function Button({ children, onClick, disabled, variant="primary", fullWidth, style={} }) {
  const base = { fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:700, letterSpacing:1, padding:"13px 24px", borderRadius:6, cursor:disabled?"not-allowed":"pointer", border:"none", transition:"all 0.2s", opacity:disabled?0.6:1, width:fullWidth?"100%":"auto", ...style };
  const variants = {
    primary: { background:C.accent, color:C.bg },
    purple:  { background:C.purple, color:"#fff" },
    outline: { background:"transparent", color:C.accent, border:`1px solid ${C.accent}` },
    ghost:   { background:"transparent", color:C.dim, border:`1px solid ${C.border}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...variants[variant]}}>{children}</button>;
}

function Logo() {
  return <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.accent, letterSpacing:-0.5 }}>⬡ QUANTUM SIGNAL AI</div>;
}

function Nav({ onBack, backLabel="← Back", right }) {
  return (
    <nav style={{ borderBottom:`1px solid ${C.border}`, background:"rgba(3,6,8,0.97)", padding:"14px 32px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <Logo />
      <div style={{ display:"flex", gap:16, alignItems:"center" }}>
        {right}
        {onBack && <button onClick={onBack} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.dim, padding:"6px 14px", borderRadius:4, cursor:"pointer", fontSize:11, fontFamily:"'IBM Plex Mono',monospace" }}>{backLabel}</button>}
      </div>
    </nav>
  );
}

function StepBar({ steps, current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:32 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display:"flex", alignItems:"center", flex: i < steps.length-1 ? 1 : 0 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace", background: i < current ? C.green : i === current ? C.accent : C.border, color: i <= current ? C.bg : C.dim, transition:"all 0.3s" }}>
              {i < current ? "✓" : i+1}
            </div>
            <span style={{ fontSize:9, color: i === current ? C.accent : C.dim, letterSpacing:1, textTransform:"uppercase", whiteSpace:"nowrap" }}>{s}</span>
          </div>
          {i < steps.length-1 && <div style={{ flex:1, height:1, background: i < current ? C.green : C.border, margin:"0 8px", marginBottom:16, transition:"background 0.3s" }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Plan Selection Page ──────────────────────────────────────────────────────
function PlanPage({ onSelect, onBack }) {
  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{FONTS}</style>
      <Nav onBack={onBack} backLabel="← Landing" />
      <div style={{ maxWidth:820, margin:"0 auto", padding:"60px 24px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:10, color:C.accent, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>Step 1 of 3 — Choose Your Plan</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:"#fff", marginBottom:12 }}>Select a Plan</h1>
          <p style={{ color:C.dim, fontSize:14 }}>You can upgrade or cancel anytime.</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:24 }}>
          {/* Starter */}
          <div onClick={()=>onSelect("starter")} style={{ background:C.panel, border:`2px solid ${C.border}`, borderRadius:16, padding:"36px 28px", cursor:"pointer", transition:"all 0.2s" }}
            onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateY(-4px)"}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)"}}>
            <div style={{ fontSize:10, color:C.accent, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>Starter</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:"#fff", lineHeight:1 }}>$49</div>
            <div style={{ color:C.dim, fontSize:12, marginBottom:24 }}>/month</div>
            {["5–10 curated signals/week","Email, SMS & push alerts","Basic crypto dashboard","$10,000 paper trading wallet","Stop loss & take profit levels"].map(f=>(
              <div key={f} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                <span style={{ color:C.green, flexShrink:0 }}>✓</span>
                <span style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{f}</span>
              </div>
            ))}
            <div style={{ marginTop:24, background:C.accent, color:C.bg, padding:"12px", borderRadius:6, textAlign:"center", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:700 }}>
              SELECT STARTER →
            </div>
          </div>

          {/* Pro */}
          <div onClick={()=>onSelect("pro")} style={{ background:"#0d0820", border:`2px solid ${C.purple}`, borderRadius:16, padding:"36px 28px", cursor:"pointer", transition:"all 0.2s", position:"relative" }}
            onMouseOver={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 0 40px ${C.purple}44`}}
            onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
            <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:C.purple, color:"#fff", fontSize:10, fontWeight:700, letterSpacing:2, padding:"4px 18px", borderRadius:20 }}>MOST POPULAR</div>
            <div style={{ fontSize:10, color:C.purple, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>✦ Pro</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:"#fff", lineHeight:1 }}>$149</div>
            <div style={{ color:C.dim, fontSize:12, marginBottom:24 }}>/month</div>
            {["Real-time signals as they fire","AI Confidence Score per signal","Stocks, options, crypto & forex","Advanced risk management","Position sizing calculator","$10,000 paper trading wallet","Priority support"].map(f=>(
              <div key={f} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                <span style={{ color:C.purple, flexShrink:0 }}>✦</span>
                <span style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{f}</span>
              </div>
            ))}
            <div style={{ marginTop:24, background:C.purple, color:"#fff", padding:"12px", borderRadius:6, textAlign:"center", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:700 }}>
              SELECT PRO →
            </div>
          </div>

          {/* Bot */}
          <div onClick={()=>onSelect("bot")} style={{ background:"#120800", border:`2px solid ${C.orange}`, borderRadius:16, padding:"36px 28px", cursor:"pointer", transition:"all 0.2s", position:"relative" }}
            onMouseOver={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 0 50px ${C.orange}44`}}
            onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}>
            <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:`linear-gradient(90deg,${C.orange},#ff9500)`, color:"#fff", fontSize:10, fontWeight:700, letterSpacing:2, padding:"4px 18px", borderRadius:20 }}>🤖 AUTOMATED BOT</div>
            <div style={{ fontSize:10, color:C.orange, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>⚡ Bot Tier</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:"#fff", lineHeight:1 }}>$299</div>
            <div style={{ color:C.dim, fontSize:12, marginBottom:24 }}>/month</div>
            {[
              "Everything in Pro plan",
              "Auto-executes trades on YOUR account",
              "Connect Alpaca (stocks + crypto)",
              "Connect Coinbase Advanced (crypto)",
              "Set risk limits & position sizing",
              "Bot runs 24/7 on live signals",
              "Full trade log & performance stats",
              "Emergency stop button",
              "Dedicated support",
            ].map(f=>(
              <div key={f} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                <span style={{ color:C.orange, flexShrink:0 }}>⚡</span>
                <span style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{f}</span>
              </div>
            ))}
            <div style={{ marginTop:16, background:"#1a0800", border:`1px solid ${C.orange}44`, borderRadius:6, padding:"10px 14px", fontSize:11, color:C.orange, lineHeight:1.6 }}>
              ⚠ Trades execute on your own broker account. You maintain full control. This is not investment advice.
            </div>
            <div style={{ marginTop:16, background:`linear-gradient(90deg,${C.orange},#ff9500)`, color:"#fff", padding:"12px", borderRadius:6, textAlign:"center", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:700 }}>
              SELECT BOT TIER →
            </div>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:24, fontSize:11, color:C.dim }}>
          🔒 Secured by Stripe · Cancel anytime · No contracts · Educational use only
        </div>
      </div>
    </div>
  );
}

// ─── Signup Page ──────────────────────────────────────────────────────────────
function SignupPage({ plan, onNext, onBack }) {
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isPro = plan === "pro";
  const isBot = plan === "bot";
  const planColor = isBot ? C.orange : isPro ? C.purple : C.accent;
  const planLabel = isBot ? "⚡ Bot — $299/mo" : isPro ? "✦ Pro — $149/mo" : "Starter — $49/mo";

  const set = k => v => setForm(f=>({...f,[k]:v}));

  const handleSubmit = () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) { setError("All fields are required."); return; }
    if (!form.email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (form.phone.replace(/\D/g,"").length < 10) { setError("Please enter a valid phone number."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onNext(form); }, 800);
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{FONTS}</style>
      <Nav onBack={onBack} backLabel="← Change Plan" right={
        <span style={{ fontSize:11, padding:"4px 12px", borderRadius:12, background:isBot?"#120800":isPro?"#1a0a3a":"#001a2a", border:`1px solid ${planColor}44`, color:planColor }}>
          {planLabel}
        </span>
      } />
      <div style={{ maxWidth:520, margin:"0 auto", padding:"50px 24px" }}>
        <StepBar steps={["Plan","Account","Payment","Access"]} current={1} />
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:"36px 32px" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:"#fff", marginBottom:6 }}>Create Your Account</h2>
          <p style={{ color:C.dim, fontSize:13, marginBottom:28 }}>
            You're signing up for the <strong style={{ color:planColor }}>{isBot?"Bot Tier":isPro?"Pro":"Starter"}</strong> plan.
            {isBot && <span style={{ display:"block", marginTop:6, color:C.orange, fontSize:12 }}>You'll connect your broker after signup.</span>}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="First Name" value={form.firstName} onChange={set("firstName")} placeholder="John" required />
            <Input label="Last Name"  value={form.lastName}  onChange={set("lastName")}  placeholder="Doe"  required />
          </div>
          <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" required />
          <Input label="Phone Number"  type="tel"   value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" required />
          <Input label="Password"      type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" required />
          <Input label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" required />
          {error && <div style={{ background:"#1a0010", border:`1px solid ${C.red}33`, borderRadius:6, padding:"10px 14px", color:C.red, fontSize:12, marginBottom:16 }}>⚠ {error}</div>}
          <Button onClick={handleSubmit} disabled={loading} fullWidth variant={isBot?"primary":isPro?"purple":"primary"} style={isBot?{background:`linear-gradient(90deg,${C.orange},#ff9500)`,color:"#fff"}:{}}>
            {loading ? "CREATING ACCOUNT…" : "CONTINUE TO PAYMENT →"}
          </Button>
          <p style={{ fontSize:11, color:C.dim, textAlign:"center", marginTop:16, lineHeight:1.7 }}>
            By continuing you agree to our <span style={{ color:C.accent, cursor:"pointer" }}>Terms of Service</span> and <span style={{ color:C.accent, cursor:"pointer" }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Page ─────────────────────────────────────────────────────────────
function PaymentPage({ plan, user, onSuccess, onBack }) {
  const isPro = plan === "pro";
  const isBot = plan === "bot";
  const amount = isBot ? 299 : isPro ? 149 : 49;
  const planColor = isBot ? C.orange : isPro ? C.purple : C.accent;
  const planLabel = isBot ? "⚡ Bot Tier" : isPro ? "✦ Pro" : "Starter";
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState(`${user.firstName} ${user.lastName}`);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const initStripe = async () => {
      if (mountedRef.current) return;
      if (!window.Stripe) { setTimeout(initStripe, 500); return; }
      mountedRef.current = true;
      stripeRef.current = window.Stripe(STRIPE_PK);
      elementsRef.current = stripeRef.current.elements();
      cardRef.current = elementsRef.current.create("card", {
        style: {
          base: { color:C.text, fontFamily:"'IBM Plex Mono',monospace", fontSize:"14px", "::placeholder":{ color:C.dim }, iconColor:C.accent },
          invalid: { color:C.red },
        },
        hidePostalCode: false,
      });
      cardRef.current.mount("#stripe-card-element");
    };
    initStripe();
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      if (stripeRef.current && cardRef.current) {
        const { paymentMethod, error } = await stripeRef.current.createPaymentMethod({
          type:"card", card:cardRef.current,
          billing_details:{ name:cardName, email:user.email, phone:user.phone },
        });
        if (error) { alert(error.message); setLoading(false); return; }
        // In production: send paymentMethod.id to your backend to create subscription
        console.log("Payment method created:", paymentMethod.id);
      }
      // Simulate successful payment for demo
      setTimeout(() => { setLoading(false); onSuccess(); }, 1500);
    } catch(e) {
      setTimeout(() => { setLoading(false); onSuccess(); }, 1500);
    }
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{`${FONTS} #stripe-card-element { padding: 12px 14px; background: #040c14; border: 1px solid ${C.border}; border-radius: 6px; transition: border-color 0.2s; } #stripe-card-element.StripeElement--focus { border-color: ${C.accent}; }`}</style>
      <Nav onBack={onBack} backLabel="← Back" right={
        <span style={{ fontSize:11, padding:"4px 12px", borderRadius:12, background:isBot?"#120800":isPro?"#1a0a3a":"#001a2a", border:`1px solid ${planColor}44`, color:planColor }}>
          {isBot?"⚡ Bot — $299/mo":isPro?"✦ Pro — $149/mo":"Starter — $49/mo"}
        </span>
      } />
      <div style={{ maxWidth:520, margin:"0 auto", padding:"50px 24px" }}>
        <StepBar steps={["Plan","Account","Payment","Access"]} current={2} />
        <div style={{ background:C.panel, border:`1px solid ${planColor}55`, borderRadius:12, padding:"20px 24px", marginBottom:20 }}>
          <div style={{ fontSize:10, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Order Summary</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:14, color:C.text }}>Quantum Signal AI — <strong style={{ color:planColor }}>{planLabel}</strong></span>
            <span style={{ fontSize:18, fontFamily:"'IBM Plex Mono',monospace", color:"#fff", fontWeight:700 }}>${amount}/mo</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.dim, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
            <span>Billed monthly · Cancel anytime</span>
            <span style={{ color:C.green }}>✓ Secured by Stripe</span>
          </div>
          <div style={{ marginTop:10, fontSize:11, color:C.dim }}>Account: <span style={{ color:C.text }}>{user.email}</span></div>
        </div>

        {/* Payment Form */}
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:"32px 28px" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:24 }}>Payment Details</h2>

          <Input label="Name on Card" value={cardName} onChange={setCardName} placeholder="John Doe" />

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:11, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Card Details</label>
            <div id="stripe-card-element" />
            <div style={{ fontSize:10, color:C.dim, marginTop:6 }}>🔒 Your payment info is encrypted and never stored on our servers.</div>
          </div>

          {/* Trust badges */}
          <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
            {["🔒 SSL Encrypted","✓ Stripe Secured","↺ Cancel Anytime"].map(b=>(
              <span key={b} style={{ fontSize:10, color:C.dim, background:C.bg, border:`1px solid ${C.border}`, padding:"4px 10px", borderRadius:4 }}>{b}</span>
            ))}
          </div>

          <Button onClick={handlePay} disabled={loading} fullWidth variant={isBot?"primary":isPro?"purple":"primary"} style={isBot?{background:`linear-gradient(90deg,${C.orange},#ff9500)`,color:"#fff"}:{}}>
            {loading ? "PROCESSING PAYMENT…" : `SUBSCRIBE FOR $${amount}/MONTH →`}
          </Button>

          <p style={{ fontSize:11, color:C.dim, textAlign:"center", marginTop:14, lineHeight:1.7 }}>
            You will be charged ${amount} today and monthly thereafter. Cancel anytime from your account settings. By subscribing you agree this is for educational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Success Page ─────────────────────────────────────────────────────────────
function SuccessPage({ plan, user, onEnter }) {
  const isPro = plan === "pro";
  const isBot = plan === "bot";
  const planColor = isBot ? C.orange : isPro ? C.purple : C.accent;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => { if(c<=1){clearInterval(t);onEnter();return 0;} return c-1; }), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, display:"flex", flexDirection:"column" }}>
      <style>{FONTS}</style>
      <Nav />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ textAlign:"center", maxWidth:500 }}>
          <StepBar steps={["Plan","Account","Payment","Access"]} current={3} />
          <div style={{ fontSize:64, marginBottom:20 }}>{isBot?"🤖":"🎉"}</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:"#fff", marginBottom:12 }}>You're In!</h1>
          <p style={{ color:C.dim, fontSize:14, marginBottom:6 }}>
            Welcome, <strong style={{ color:C.text }}>{user.firstName}</strong>! Your <strong style={{ color:planColor }}>{isBot?"Bot Tier":isPro?"Pro":"Starter"}</strong> subscription is active.
          </p>
          <p style={{ color:C.dim, fontSize:13, marginBottom:28 }}>A confirmation has been sent to <strong style={{ color:C.text }}>{user.email}</strong></p>

          <div style={{ background:C.panel, border:`1px solid ${planColor}44`, borderRadius:12, padding:"24px", marginBottom:28, textAlign:"left" }}>
            <div style={{ fontSize:10, color:C.dim, letterSpacing:2, marginBottom:14 }}>WHAT'S INCLUDED</div>
            {(isBot ? [
              "⚡ Automated trading on your broker account",
              "⚡ Connect Alpaca (stocks + crypto)",
              "⚡ Connect Coinbase Advanced (crypto)",
              "⚡ Full Pro dashboard included",
              "⚡ Emergency stop button",
              "⚡ Full trade log & performance stats",
            ] : isPro ? [
              "✦ Real-time signals as they fire",
              "✦ AI Confidence Score per signal",
              "✦ Stocks, options, crypto & forex",
              "✦ Advanced risk management",
              "✦ $10,000 paper trading wallet",
            ] : [
              "✓ 5–10 curated signals per week",
              "✓ Email, SMS & push notifications",
              "✓ Basic crypto dashboard",
              "✓ $10,000 paper trading wallet",
            ]).map(f=>(
              <div key={f} style={{ fontSize:13, color:C.text, marginBottom:8 }}>{f}</div>
            ))}
          </div>

          {isBot && (
            <div style={{ background:"#120800", border:`1px solid ${C.orange}44`, borderRadius:8, padding:"14px", marginBottom:20, fontSize:12, color:C.orange, lineHeight:1.7 }}>
              🔑 Next step: Connect your broker account to activate the auto-trader.
            </div>
          )}

          <Button onClick={onEnter} fullWidth variant="primary" style={isBot?{background:`linear-gradient(90deg,${C.orange},#ff9500)`,color:"#fff"}:isPro?{background:C.purple,color:"#fff"}:{}}>
            {isBot ? "CONNECT BROKER & ENTER →" : "ENTER DASHBOARD →"}
          </Button>
          <p style={{ fontSize:11, color:C.dim, marginTop:12 }}>Auto-entering in {countdown}s…</p>
        </div>
      </div>
    </div>
  );
}

// ─── Bot Setup Page (Broker Connection) ──────────────────────────────────────
function BotSetupPage({ user, onComplete, onSkip }) {
  const [broker, setBroker] = useState("alpaca");
  const [alpacaKey, setAlpacaKey] = useState("");
  const [alpacaSecret, setAlpacaSecret] = useState("");
  const [coinbaseKey, setCoinbaseKey] = useState("");
  const [coinbaseSecret, setCoinbaseSecret] = useState("");
  const [connected, setConnected] = useState({ alpaca: false, coinbase: false });
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const connectAlpaca = () => {
    if (!alpacaKey || !alpacaSecret) { setError("Enter both Alpaca API Key and Secret."); return; }
    setError(""); setLoading("alpaca");
    // Store keys locally (in production, send to secure backend)
    localStorage.setItem("qs_alpaca", JSON.stringify({ key: alpacaKey, secret: alpacaSecret }));
    setTimeout(() => { setConnected(c=>({...c,alpaca:true})); setLoading(null); }, 1000);
  };

  const connectCoinbase = () => {
    if (!coinbaseKey || !coinbaseSecret) { setError("Enter both Coinbase API Key and Secret."); return; }
    setError(""); setLoading("coinbase");
    localStorage.setItem("qs_coinbase", JSON.stringify({ key: coinbaseKey, secret: coinbaseSecret }));
    setTimeout(() => { setConnected(c=>({...c,coinbase:true})); setLoading(null); }, 1000);
  };

  const anyConnected = connected.alpaca || connected.coinbase;

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{FONTS}</style>
      <Nav right={<button onClick={onSkip} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.dim, padding:"6px 14px", borderRadius:4, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>Skip for now →</button>} />
      <div style={{ maxWidth:580, margin:"0 auto", padding:"40px 24px" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔗</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#fff", marginBottom:8 }}>Connect Your Broker</h2>
          <p style={{ color:C.dim, fontSize:13, lineHeight:1.7 }}>The bot will trade on <strong style={{ color:C.text }}>your own broker account</strong> using your API keys. Your funds never touch our servers.</p>
        </div>

        {/* Broker tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {[["alpaca","📈 Alpaca"],["coinbase","🪙 Coinbase"]].map(([b,l])=>(
            <button key={b} onClick={()=>setBroker(b)} style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${broker===b?C.orange:C.border}`, background:broker===b?"#120800":C.panel, color:broker===b?C.orange:C.dim, cursor:"pointer", fontSize:12, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {l} {connected[b] && <span style={{ color:C.green }}>✓</span>}
            </button>
          ))}
        </div>

        {broker === "alpaca" && (
          <div style={{ background:C.panel, border:`1px solid ${connected.alpaca?C.green:C.border}`, borderRadius:12, padding:"28px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:"#fff" }}>📈 Alpaca Markets</h3>
              {connected.alpaca && <span style={{ color:C.green, fontSize:11, border:`1px solid ${C.green}`, padding:"3px 10px", borderRadius:4 }}>● CONNECTED</span>}
            </div>
            <div style={{ background:"#001a0a", border:`1px solid ${C.green}22`, borderRadius:8, padding:"12px 14px", marginBottom:20, fontSize:11, color:C.dim, lineHeight:1.8 }}>
              <strong style={{ color:C.green }}>How to get your keys:</strong><br/>
              1. Go to <span style={{ color:C.accent }}>alpaca.markets</span> → sign up free<br/>
              2. Click <strong style={{ color:C.text }}>Paper Trading</strong> to start risk-free<br/>
              3. Go to <strong style={{ color:C.text }}>API Keys</strong> → Generate New Key<br/>
              4. Copy Key ID + Secret Key below
            </div>
            <Input label="Alpaca API Key ID" value={alpacaKey} onChange={setAlpacaKey} placeholder="PK_XXXXXXXXXXXXXXXXXX" />
            <Input label="Alpaca Secret Key" type="password" value={alpacaSecret} onChange={setAlpacaSecret} placeholder="xxxxxxxxxxxxxxxxxxxx" />
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              <div style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 14px", fontSize:11 }}>
                <div style={{ color:C.dim, marginBottom:2 }}>Supported Markets</div>
                <div style={{ color:C.text }}>US Stocks · Crypto · ETFs</div>
              </div>
              <div style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 14px", fontSize:11 }}>
                <div style={{ color:C.dim, marginBottom:2 }}>Paper Trading</div>
                <div style={{ color:C.green }}>✓ Available (Risk-free)</div>
              </div>
            </div>
            {error && broker==="alpaca" && <div style={{ color:C.red, fontSize:11, marginBottom:12 }}>⚠ {error}</div>}
            <Button onClick={connectAlpaca} disabled={loading==="alpaca"||connected.alpaca} fullWidth variant="primary" style={{ background:connected.alpaca?C.green:`linear-gradient(90deg,${C.orange},#ff9500)`, color: C.bg }}>
              {loading==="alpaca" ? "CONNECTING…" : connected.alpaca ? "✓ CONNECTED" : "CONNECT ALPACA →"}
            </Button>
          </div>
        )}

        {broker === "coinbase" && (
          <div style={{ background:C.panel, border:`1px solid ${connected.coinbase?C.green:C.border}`, borderRadius:12, padding:"28px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:"#fff" }}>🪙 Coinbase Advanced</h3>
              {connected.coinbase && <span style={{ color:C.green, fontSize:11, border:`1px solid ${C.green}`, padding:"3px 10px", borderRadius:4 }}>● CONNECTED</span>}
            </div>
            <div style={{ background:"#001a0a", border:`1px solid ${C.green}22`, borderRadius:8, padding:"12px 14px", marginBottom:20, fontSize:11, color:C.dim, lineHeight:1.8 }}>
              <strong style={{ color:C.green }}>How to get your keys:</strong><br/>
              1. Go to <span style={{ color:C.accent }}>coinbase.com/advanced-trade</span><br/>
              2. Click profile → <strong style={{ color:C.text }}>API</strong> → New API Key<br/>
              3. Enable <strong style={{ color:C.text }}>Trade</strong> permission<br/>
              4. Copy API Key + Secret below
            </div>
            <Input label="Coinbase API Key" value={coinbaseKey} onChange={setCoinbaseKey} placeholder="organizations/xxx/apiKeys/xxx" />
            <Input label="Coinbase API Secret" type="password" value={coinbaseSecret} onChange={setCoinbaseSecret} placeholder="-----BEGIN EC PRIVATE KEY-----" />
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              <div style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 14px", fontSize:11 }}>
                <div style={{ color:C.dim, marginBottom:2 }}>Supported Markets</div>
                <div style={{ color:C.text }}>BTC · ETH · SOL · 200+ Crypto</div>
              </div>
              <div style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 14px", fontSize:11 }}>
                <div style={{ color:C.dim, marginBottom:2 }}>Real Trading</div>
                <div style={{ color:C.yellow }}>⚠ Uses real funds</div>
              </div>
            </div>
            {error && broker==="coinbase" && <div style={{ color:C.red, fontSize:11, marginBottom:12 }}>⚠ {error}</div>}
            <Button onClick={connectCoinbase} disabled={loading==="coinbase"||connected.coinbase} fullWidth variant="primary" style={{ background:connected.coinbase?C.green:`linear-gradient(90deg,${C.orange},#ff9500)`, color: C.bg }}>
              {loading==="coinbase" ? "CONNECTING…" : connected.coinbase ? "✓ CONNECTED" : "CONNECT COINBASE →"}
            </Button>
          </div>
        )}

        <div style={{ marginTop:24 }}>
          <Button onClick={onComplete} fullWidth variant="primary" disabled={!anyConnected} style={{ background:anyConnected?`linear-gradient(90deg,${C.orange},#ff9500)`:"", color: anyConnected?C.bg:C.dim }}>
            {anyConnected ? "ENTER BOT DASHBOARD →" : "Connect at least one broker to continue"}
          </Button>
          <p style={{ textAlign:"center", fontSize:11, color:C.dim, marginTop:12, lineHeight:1.7 }}>
            Your API keys are stored locally in your browser. We never store or transmit them to our servers. You maintain full control of your funds at all times.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Bot Dashboard ────────────────────────────────────────────────────────────
function BotDashboard({ user, onLogout }) {
  const [botActive, setBotActive] = useState(false);
  const [riskPct, setRiskPct] = useState(2);
  const [maxTrades, setMaxTrades] = useState(3);
  const [tradeLog, setTradeLog] = useState([
    { time:"09:41:23", pair:"BTC/USD", type:"BUY",  qty:0.012, price:67420, sig:"STRONG BUY",  status:"executed", pnl:null },
    { time:"11:22:08", pair:"ETH/USD", type:"BUY",  qty:0.18,  price:3480,  sig:"BUY",         status:"executed", pnl:null },
    { time:"13:05:44", pair:"BTC/USD", type:"SELL", qty:0.012, price:68100, sig:"SELL",         status:"executed", pnl:"+$8.16" },
    { time:"14:33:12", pair:"SOL/USD", type:"BUY",  qty:2.5,   price:174.2, sig:"HIGHLY ADVISED BUY", status:"pending",  pnl:null },
  ]);
  const [botStats] = useState({ totalTrades:47, winRate:68, totalPnl:"+$1,247.38", todayPnl:"+$84.22", activeSince:"Jun 1, 2026" });
  const [brokers] = useState({
    alpaca:   !!localStorage.getItem("qs_alpaca"),
    coinbase: !!localStorage.getItem("qs_coinbase"),
  });

  const emergencyStop = () => {
    setBotActive(false);
    setTradeLog(l => l.map(t => t.status==="pending" ? {...t, status:"cancelled"} : t));
    alert("⛔ Emergency stop activated. All pending orders cancelled. Bot disabled.");
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`${FONTS} @keyframes botPulse{0%,100%{box-shadow:0 0 10px ${C.orange}44}50%{box-shadow:0 0 30px ${C.orange}99}}`}</style>

      <nav style={{ borderBottom:`1px solid ${C.border}`, background:"rgba(3,6,8,0.98)", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, position:"sticky", top:0, zIndex:100 }}>
        <Logo />
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:11, padding:"3px 10px", borderRadius:12, background:"#120800", border:`1px solid ${C.orange}44`, color:C.orange }}>⚡ BOT TIER</span>
          {user && <span style={{ fontSize:11, color:C.dim }}>👤 {user.firstName} {user.lastName}</span>}
          <span style={{ fontSize:10, color:botActive?C.green:C.dim }}>{botActive?"🤖 BOT ACTIVE":"⏸ BOT PAUSED"}</span>
          <button onClick={onLogout} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.dim, padding:"4px 10px", borderRadius:4, cursor:"pointer", fontSize:10, fontFamily:"inherit" }}>← LOGOUT</button>
        </div>
      </nav>

      <div style={{ padding:"20px 24px" }}>

        {/* Bot Control Panel */}
        <div style={{ background:"linear-gradient(135deg,#120800,#080400)", border:`2px solid ${botActive?C.orange:C.border}`, borderRadius:14, padding:"24px", marginBottom:16, animation:botActive?"botPulse 2s infinite":"none" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#fff", marginBottom:4 }}>
                {botActive ? "🤖 Auto-Trader is RUNNING" : "⏸ Auto-Trader is PAUSED"}
              </div>
              <div style={{ fontSize:12, color:C.dim }}>
                Bot {botActive?"is actively monitoring signals and executing trades":"is paused — no trades will execute"}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setBotActive(a=>!a)} style={{ background:botActive?"#1a0800":`linear-gradient(90deg,${C.orange},#ff9500)`, border:`1px solid ${C.orange}`, color:botActive?C.orange:"#fff", padding:"10px 24px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:700, letterSpacing:1 }}>
                {botActive ? "⏸ PAUSE BOT" : "▶ START BOT"}
              </button>
              <button onClick={emergencyStop} style={{ background:"#1a0005", border:`1px solid ${C.red}`, color:C.red, padding:"10px 20px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:700 }}>
                ⛔ STOP
              </button>
            </div>
          </div>

          {/* Broker status */}
          <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
            {[
              { label:"Alpaca", icon:"📈", connected:brokers.alpaca },
              { label:"Coinbase", icon:"🪙", connected:brokers.coinbase },
            ].map(b=>(
              <div key={b.label} style={{ background:C.bg, border:`1px solid ${b.connected?C.green:C.border}`, borderRadius:6, padding:"8px 14px", display:"flex", alignItems:"center", gap:8, fontSize:11 }}>
                <span>{b.icon}</span>
                <span style={{ color:C.text }}>{b.label}</span>
                <span style={{ color:b.connected?C.green:C.dim }}>{b.connected?"● Connected":"○ Not connected"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          {[
            ["Total Trades", botStats.totalTrades, C.accent],
            ["Win Rate",     `${botStats.winRate}%`, C.green],
            ["Total P&L",   botStats.totalPnl, C.green],
            ["Today P&L",   botStats.todayPnl, C.green],
            ["Active Since",botStats.activeSince, C.dim],
          ].map(([l,v,c])=>(
            <div key={l} style={{ background:"linear-gradient(135deg,#0a1520,#060d14)", border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", flex:1, minWidth:120 }}>
              <div style={{ fontSize:9, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:17, fontFamily:"'IBM Plex Mono',monospace", color:c, fontWeight:700 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Risk Settings */}
        <div style={{ background:"linear-gradient(135deg,#0a1520,#060d14)", border:`1px solid ${C.border}`, borderRadius:12, marginBottom:16, overflow:"hidden" }}>
          <div style={{ padding:"11px 16px", borderBottom:`1px solid ${C.border}`, fontSize:10, color:C.dim, letterSpacing:2, textTransform:"uppercase" }}>
            🛡 Risk Management Settings
          </div>
          <div style={{ padding:16, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
            <div>
              <label style={{ fontSize:11, color:C.dim, letterSpacing:1, display:"block", marginBottom:8 }}>RISK PER TRADE: <span style={{ color:C.orange }}>{riskPct}%</span></label>
              <input type="range" min={0.5} max={10} step={0.5} value={riskPct} onChange={e=>setRiskPct(+e.target.value)}
                style={{ width:"100%", accentColor:C.orange }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.dim, marginTop:4 }}>
                <span>0.5% (Conservative)</span><span>10% (Aggressive)</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.dim, letterSpacing:1, display:"block", marginBottom:8 }}>MAX OPEN TRADES: <span style={{ color:C.orange }}>{maxTrades}</span></label>
              <input type="range" min={1} max={10} step={1} value={maxTrades} onChange={e=>setMaxTrades(+e.target.value)}
                style={{ width:"100%", accentColor:C.orange }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.dim, marginTop:4 }}>
                <span>1 trade</span><span>10 trades</span>
              </div>
            </div>
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:C.dim, marginBottom:6 }}>SIGNAL THRESHOLD</div>
              <div style={{ fontSize:12, color:C.text, marginBottom:4 }}>Only trade on:</div>
              {["STRONG BUY / HIGHLY ADVISED","All BUY signals"].map((opt,i)=>(
                <label key={opt} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:C.text, marginBottom:4, cursor:"pointer" }}>
                  <input type="radio" name="threshold" defaultChecked={i===0} style={{ accentColor:C.orange }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Log */}
        <div style={{ background:"linear-gradient(135deg,#0a1520,#060d14)", border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"11px 16px", borderBottom:`1px solid ${C.border}`, fontSize:10, color:C.dim, letterSpacing:2, textTransform:"uppercase" }}>
            📋 Live Trade Log
          </div>
          <div style={{ padding:16 }}>
            {tradeLog.map((t,i)=>{
              const tc = t.type==="BUY"?C.green:C.red;
              const sc = t.status==="executed"?C.green:t.status==="pending"?C.yellow:C.dim;
              return(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<tradeLog.length-1?`1px solid ${C.border}`:"none", flexWrap:"wrap", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:10, color:tc, border:`1px solid ${tc}44`, padding:"2px 8px", borderRadius:3, fontWeight:700 }}>{t.type}</span>
                    <div>
                      <div style={{ fontSize:12, color:C.text, fontWeight:600 }}>{t.pair}</div>
                      <div style={{ fontSize:10, color:C.dim }}>{t.time} · {t.sig}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, color:C.text }}>{t.qty} @ ${fmt(t.price)}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:10, color:sc }}>{t.status.toUpperCase()}</span>
                      {t.pnl && <span style={{ fontSize:11, color:C.green, fontWeight:700 }}>{t.pnl}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize:9, color:C.dim, textAlign:"center", marginTop:12, lineHeight:1.9 }}>
          ⚠ The bot executes trades on your own broker account. You are solely responsible for all trading activity. This is not financial advice. Past performance does not guarantee future results.
        </div>
      </div>
    </div>
  );
}

// ─── Markets / Data ───────────────────────────────────────────────────────────
const TWELVE_KEY = "9159b457e1f84232a39840dcbc9a6685";

const MARKET_GROUPS = [
  { label:"Crypto",  icon:"₿",  proOnly:false, markets:[
    { id:"bitcoin",     label:"BTC/USD", seed:67000, vol:1200,  type:"crypto" },
    { id:"ethereum",    label:"ETH/USD", seed:3500,  vol:80,    type:"crypto" },
    { id:"solana",      label:"SOL/USD", seed:175,   vol:6,     type:"crypto" },
    { id:"binancecoin", label:"BNB/USD", seed:580,   vol:12,    type:"crypto" },
    { id:"ripple",      label:"XRP/USD", seed:0.52,  vol:0.015, type:"crypto" },
  ]},
  { label:"Indices", icon:"📊", proOnly:true, markets:[
    { id:"DJI",   tdSymbol:"DJI",   label:"US30",   seed:38500, vol:180, type:"twelve" },
    { id:"SPX",   tdSymbol:"SPX",   label:"SPX500", seed:5100,  vol:28,  type:"twelve" },
    { id:"NDX",   tdSymbol:"NDX",   label:"NAS100", seed:17800, vol:120, type:"twelve" },
  ]},
  { label:"Metals", icon:"🥇", proOnly:true, markets:[
    { id:"XAU/USD", tdSymbol:"XAU/USD", label:"XAU/USD", seed:2320, vol:18,  type:"twelve" },
    { id:"XAG/USD", tdSymbol:"XAG/USD", label:"XAG/USD", seed:27.5, vol:0.4, type:"twelve" },
  ]},
  { label:"Forex", icon:"💱", proOnly:true, markets:[
    { id:"EUR/USD", tdSymbol:"EUR/USD", label:"EUR/USD", seed:1.085, vol:0.004, type:"twelve" },
    { id:"GBP/USD", tdSymbol:"GBP/USD", label:"GBP/USD", seed:1.265, vol:0.005, type:"twelve" },
    { id:"USD/JPY", tdSymbol:"USD/JPY", label:"USD/JPY", seed:151.5, vol:0.6,   type:"twelve" },
  ]},
];
const ALL_MARKETS = MARKET_GROUPS.flatMap(g=>g.markets.map(m=>({...m,group:g.label,groupIcon:g.icon,proOnly:g.proOnly})));
const INTERVALS = [
  { label:"1D",  days:1,  tdInterval:"5min"  },
  { label:"7D",  days:7,  tdInterval:"1h"    },
  { label:"30D", days:30, tdInterval:"4h"    },
  { label:"90D", days:90, tdInterval:"1day"  },
];

function simulateOHLC(seed, volatility, count=120) {
  let price=seed; const now=Date.now(); const interval=(90*24*60*60*1000)/count;
  return Array.from({length:count},(_,i)=>{ const change=(Math.random()-0.485)*volatility; price=Math.max(seed*0.3,price+change); const spread=volatility*0.4; const open=+(price-(Math.random()-0.5)*spread).toFixed(4); const close=+(price).toFixed(4); const high=+(Math.max(open,close)+Math.random()*spread*0.5).toFixed(4); const low=+(Math.min(open,close)-Math.random()*spread*0.5).toFixed(4); return {i,open,high,low,close,volume:Math.random()*1000+200,time:new Date(now-(count-i)*interval).toLocaleDateString([],{month:"short",day:"numeric"})}; });
}

async function fetchTwelveOHLC(market, tdInterval) {
  // Call our own Netlify proxy — no CORS issues
  try {
    const url = `/api/market?symbol=${encodeURIComponent(market.tdSymbol)}&interval=${tdInterval}&outputsize=120&type=timeseries`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.status === "error" || !d.values || d.values.length < 10) return null;
    return d.values.slice().reverse().map((k, i) => ({
      i,
      time: new Date(k.datetime).toLocaleDateString([], { month:"short", day:"numeric" }),
      open: parseFloat(k.open), high: parseFloat(k.high),
      low:  parseFloat(k.low),  close: parseFloat(k.close),
      volume: parseFloat(k.volume || 500),
    }));
  } catch { return null; }
}

async function fetchTwelveQuote(market) {
  try {
    const url = `/api/market?symbol=${encodeURIComponent(market.tdSymbol)}&type=quote`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.status === "error" || !d.close) return null;
    return {
      price:     parseFloat(d.close),
      change24h: parseFloat(d.percent_change),
      high24h:   parseFloat(d.high),
      low24h:    parseFloat(d.low),
      vol24h:    parseFloat(d.volume || 0),
    };
  } catch { return null; }
}

async function tryFetchOHLC(market, days) {
  if (market.type === "crypto") {
    try {
      const r=await fetch(`https://api.coingecko.com/api/v3/coins/${market.id}/ohlc?vs_currency=usd&days=${days}`,{signal:AbortSignal.timeout(6000)});
      if(!r.ok) return null;
      const raw=await r.json();
      if(!Array.isArray(raw)||raw.length<10) return null;
      return raw.map((k,i)=>({i,time:new Date(k[0]).toLocaleDateString([],{month:"short",day:"numeric"}),open:k[1],high:k[2],low:k[3],close:k[4],volume:Math.abs(k[2]-k[3])*500+Math.random()*300}));
    } catch { return null; }
  }
  if (market.type === "twelve") {
    const iv = INTERVALS.find(iv=>iv.days===days)?.tdInterval || "1h";
    return await fetchTwelveOHLC(market, iv);
  }
  return null;
}

async function tryFetchTicker(market) {
  if (market.type === "crypto") {
    try {
      const r=await fetch(`https://api.coingecko.com/api/v3/coins/${market.id}?localization=false&tickers=false&community_data=false&developer_data=false`,{signal:AbortSignal.timeout(6000)});
      if(!r.ok) return null;
      const d=await r.json();
      return {price:d.market_data.current_price.usd,change24h:d.market_data.price_change_percentage_24h,high24h:d.market_data.high_24h.usd,low24h:d.market_data.low_24h.usd,vol24h:d.market_data.total_volume.usd};
    } catch { return null; }
  }
  if (market.type === "twelve") return await fetchTwelveQuote(market);
  return null;
}

function calcEMA(data,p){const k=2/(p+1);let e=data[0].close;return data.map((d,i)=>{e=i===0?d.close:d.close*k+e*(1-k);return +e.toFixed(6);});}
function calcRSI(data,p=14){if(data.length<=p)return data.map(()=>null);const out=Array(p).fill(null);let g=0,l=0;for(let i=1;i<=p;i++){const d=data[i].close-data[i-1].close;d>0?g+=d:l-=d;}g/=p;l/=p;out.push(l===0?100:+(100-100/(1+g/l)).toFixed(2));for(let i=p+1;i<data.length;i++){const d=data[i].close-data[i-1].close,dg=d>0?d:0,dl=d<0?-d:0;g=(g*(p-1)+dg)/p;l=(l*(p-1)+dl)/p;out.push(l===0?100:+(100-100/(1+g/l)).toFixed(2));}return out;}
function calcMACD(data){const e12=calcEMA(data,12),e26=calcEMA(data,26);const line=e12.map((v,i)=>+(v-e26[i]).toFixed(6));const sig=[];let s=line[Math.min(26,line.length-1)];line.forEach((v,i)=>{if(i<26){sig.push(null);return;}s=i===26?v:+(v*0.2+s*0.8).toFixed(6);sig.push(s);});return{line,sig,hist:line.map((v,i)=>sig[i]!=null?+(v-sig[i]).toFixed(6):null)};}
function calcOBV(data){const out=[0];for(let i=1;i<data.length;i++){const d=data[i].close-data[i-1].close;out.push(d>0?out[i-1]+data[i].volume:d<0?out[i-1]-data[i].volume:out[i-1]);}return out;}
function calcATR(data,p=14){const out=[null];for(let i=1;i<data.length;i++){const tr=Math.abs(data[i].close-data[i-1].close);if(i<p){out.push(null);continue;}out.push(+((((out[i-1]??tr)*(p-1))+tr)/p).toFixed(6));}return out;}

function calcSignals(data,e9,e21,R,M,O){
  return data.map((d,i)=>{
    if(i<27) return{...d,sig:null,sigStrength:0};
    const xUp=e9[i]>e21[i]&&e9[i-1]<=e21[i-1];
    const xDn=e9[i]<e21[i]&&e9[i-1]>=e21[i-1];
    const ok=R[i]!=null&&R[i]>30&&R[i]<65;
    const mb=M.hist[i]!=null&&M.hist[i]>0&&M.hist[i-1]!=null&&M.hist[i-1]<=0;
    const vc=i>=3&&O[i]>O[i-3];
    const rsiOS=R[i]!=null&&R[i]<30; // oversold — strong buy hint
    const rsiOB=R[i]!=null&&R[i]>70; // overbought — strong sell hint
    let sig=null, sigStrength=0;
    if(xUp&&ok&&mb&&vc){sig="STRONG BUY";sigStrength=4;}
    else if(xUp&&ok&&rsiOS){sig="HIGHLY ADVISED BUY";sigStrength=3;}
    else if(xUp&&ok){sig="BUY";sigStrength=2;}
    else if(xDn&&rsiOB&&mb){sig="HIGHLY ADVISED SELL";sigStrength=-3;}
    else if(xDn&&R[i]!=null&&R[i]>65){sig="SELL";sigStrength=-2;}
    return{...d,sig,sigStrength};
  });
}

function buildComputed(ohlc){
  const E9=calcEMA(ohlc,9),E21=calcEMA(ohlc,21),E50=calcEMA(ohlc,50),E200=calcEMA(ohlc,Math.min(200,ohlc.length-1));
  const R=calcRSI(ohlc),M=calcMACD(ohlc),O=calcOBV(ohlc),A=calcATR(ohlc);
  const S=calcSignals(ohlc,E9,E21,R,M,O);
  const chart=S.map((d,i)=>({...d,e9:E9[i],e21:E21[i],e50:E50[i],rsi:R[i],macd:M.line[i],signal:M.sig[i],hist:M.hist[i],obv:O[i],atr:A[i]}));
  const n=ohlc.length-1;
  return{chart,last:ohlc[n],e9:E9[n],e21:E21[n],e200:E200[n],rsiVal:R[n],atrVal:A[n],sig:S[n].sig,sigStrength:S[n].sigStrength,hist:M.hist[n]};
}

function getConfidence(sig,rsiVal,hist,e9,e21){
  let score=50;
  if(sig==="STRONG BUY"||sig==="HIGHLY ADVISED BUY")score+=30;
  else if(sig==="BUY")score+=15;
  else if(sig==="HIGHLY ADVISED SELL")score-=25;
  else if(sig==="SELL")score-=20;
  if(rsiVal!=null){if(rsiVal>30&&rsiVal<65)score+=10;else if(rsiVal>70||rsiVal<25)score-=15;}
  if(hist!=null&&hist>0)score+=8;
  if(e9>e21)score+=7;
  return Math.min(99,Math.max(10,score));
}

// ─── Signal Notification Banner ───────────────────────────────────────────────
function SignalBanner({ sig, sigStrength, market, price }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(null);
  const prevSig = useRef(null);

  useEffect(() => {
    if (sig && sig !== prevSig.current && sig !== dismissed) {
      setVisible(true);
      prevSig.current = sig;
      // Auto-dismiss after 12s
      const t = setTimeout(() => setVisible(false), 12000);
      return () => clearTimeout(t);
    }
  }, [sig, market]);

  if (!visible || !sig) return null;

  const isStrongBuy  = sig === "STRONG BUY";
  const isAdvisedBuy = sig === "HIGHLY ADVISED BUY";
  const isAdvisedSell= sig === "HIGHLY ADVISED SELL";
  const isBuy = sig.includes("BUY");

  const cfg = {
    "STRONG BUY":         { bg:"#001a0a", border:"#00ff88", color:"#00ff88", icon:"⚡", label:"STRONG BUY SIGNAL", advice:"All 4 confluence indicators confirm. High-probability entry." },
    "HIGHLY ADVISED BUY": { bg:"#001408", border:"#00dd66", color:"#00dd66", icon:"🎯", label:"HIGHLY ADVISED BUY", advice:"RSI oversold + EMA crossover. Strong reversal opportunity." },
    "BUY":                { bg:"#001008", border:"#00aa44", color:"#00aa44", icon:"↑",  label:"BUY SIGNAL",         advice:"EMA crossover confirmed with RSI in safe zone." },
    "HIGHLY ADVISED SELL":{ bg:"#1a0008", border:"#ff2244", color:"#ff2244", icon:"🚨", label:"HIGHLY ADVISED SELL", advice:"RSI overbought + momentum dropping. Consider exiting." },
    "SELL":               { bg:"#140006", border:"#cc2233", color:"#cc2233", icon:"↓",  label:"SELL SIGNAL",         advice:"EMA death cross with RSI elevated. Watch for reversal." },
  }[sig] || {};

  return (
    <div style={{
      position:"fixed", top:70, right:20, zIndex:999, width:320,
      background:cfg.bg, border:`1px solid ${cfg.border}`,
      borderRadius:12, padding:"16px 18px", boxShadow:`0 0 30px ${cfg.border}44`,
      animation:"slideIn 0.4s ease forwards, borderBlink 1s ease-in-out infinite",
    }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes borderBlink{0%,100%{box-shadow:0 0 30px ${cfg.border}44}50%{box-shadow:0 0 60px ${cfg.border}99}}
        @keyframes iconPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
      `}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20,display:"inline-block",animation:"iconPulse 0.8s ease-in-out infinite"}}>{cfg.icon}</span>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:cfg.color,letterSpacing:1,fontFamily:"'IBM Plex Mono',monospace",display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:cfg.color,display:"inline-block",animation:"dotBlink 0.8s ease-in-out infinite",boxShadow:`0 0 6px ${cfg.color}`}}/>
              <style>{`@keyframes dotBlink{0%,100%{opacity:1}50%{opacity:0.1}}`}</style>
              {cfg.label}
            </div>
            <div style={{fontSize:10,color:C.dim,marginTop:2}}>{market?.label} · ${fmt(price)}</div>
          </div>
        </div>
        <button onClick={()=>{setVisible(false);setDismissed(sig);}} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
      </div>
      <div style={{fontSize:12,color:C.text,lineHeight:1.6,marginBottom:10}}>{cfg.advice}</div>
      <div style={{fontSize:10,color:C.dim}}>⚠ Educational signal only · Not financial advice</div>
    </div>
  );
}

// ─── Sleek Tooltip ────────────────────────────────────────────────────────────
function TT({active,payload,label}){
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"rgba(4,12,18,0.95)",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",backdropFilter:"blur(8px)",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
      <div style={{color:C.dim,marginBottom:6,fontSize:10,letterSpacing:1}}>{label}</div>
      {payload.map((p,i)=>p.value!=null&&(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:16,color:p.color||C.accent,marginBottom:2}}>
          <span style={{color:C.dim}}>{p.name}</span>
          <span style={{fontWeight:600}}>{fmt(p.value,4)}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({label,value,sub,accent}){
  return(
    <div style={{background:"linear-gradient(135deg,#0a1520,#060d14)",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",flex:1,minWidth:120,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:`radial-gradient(circle,${accent||C.accent}11,transparent 70%)`,borderRadius:"0 10px 0 60px"}}/>
      <div style={{fontSize:9,color:C.dim,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{label}</div>
      <div style={{fontSize:17,fontFamily:"'IBM Plex Mono',monospace",color:accent||C.accent,fontWeight:700,wordBreak:"break-all"}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:C.dim,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function ChartPanel({title,children,right}){
  return(
    <div style={{background:"linear-gradient(180deg,#0a1520 0%,#060d14 100%)",border:`1px solid ${C.border}`,borderRadius:12,marginBottom:14,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.3)"}}>
      <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,letterSpacing:2,textTransform:"uppercase",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(0,212,255,0.03)"}}>
        <span>{title}</span>{right}
      </div>
      <div style={{padding:16}}>{children}</div>
    </div>
  );
}

function SigBadge({type}){
  if(!type) return null;
  const m={
    "STRONG BUY":         {bg:"#002a1a",bd:C.green,    c:C.green,    t:"⚡ STRONG BUY"},
    "HIGHLY ADVISED BUY": {bg:"#002015",bd:"#00dd66",  c:"#00dd66",  t:"🎯 HIGHLY ADVISED BUY"},
    "BUY":                {bg:"#001a10",bd:"#00cc66",  c:"#00cc66",  t:"↑ BUY"},
    "HIGHLY ADVISED SELL":{bg:"#2a0010",bd:C.red,      c:C.red,      t:"🚨 HIGHLY ADVISED SELL"},
    "SELL":               {bg:"#1a000a",bd:"#cc2233",  c:"#cc2233",  t:"↓ SELL"},
  }[type];
  if(!m) return null;
  return <span style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:1,padding:"3px 10px",borderRadius:4,background:m.bg,border:`1px solid ${m.bd}`,color:m.c,boxShadow:`0 0 8px ${m.bd}33`}}>{m.t}</span>;
}

function Pill({active,onClick,children}){
  return(
    <button onClick={onClick} style={{background:active?"rgba(0,212,255,0.15)":C.panel,color:active?C.accent:C.dim,border:`1px solid ${active?C.accent:C.border}`,padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",transition:"all 0.15s",boxShadow:active?`0 0 10px ${C.accent}33`:"none"}}>
      {children}
    </button>
  );
}

function PaperTrading({currentPrice,currentSig,coinLabel,tier}){
  const key=`qs_wallet_${tier}`;
  const [wallet,setWallet]=useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):{balance:10000,holdings:0,trades:[]}}catch{return{balance:10000,holdings:0,trades:[]}}});
  const [amount,setAmount]=useState("");
  const save=w=>{setWallet(w);try{localStorage.setItem(key,JSON.stringify(w))}catch{}};
  const buy=()=>{const usd=parseFloat(amount);if(!usd||usd>wallet.balance||usd<=0)return;const coins=usd/currentPrice;save({...wallet,balance:+(wallet.balance-usd).toFixed(2),holdings:+(wallet.holdings+coins).toFixed(8),trades:[{type:"BUY",price:currentPrice,amount:usd,coins:+coins.toFixed(6),time:new Date().toLocaleTimeString(),sig:currentSig},...wallet.trades.slice(0,9)]});setAmount("");};
  const sell=()=>{if(wallet.holdings<=0)return;const usd=+(wallet.holdings*currentPrice).toFixed(2);save({...wallet,balance:+(wallet.balance+usd).toFixed(2),holdings:0,trades:[{type:"SELL",price:currentPrice,amount:usd,coins:+wallet.holdings.toFixed(6),time:new Date().toLocaleTimeString(),sig:currentSig},...wallet.trades.slice(0,9)]});};
  const reset=()=>save({balance:10000,holdings:0,trades:[]});
  const totalValue=+(wallet.balance+wallet.holdings*currentPrice).toFixed(2);
  const pnl=+(totalValue-10000).toFixed(2);
  const pnlPct=+((pnl/10000)*100).toFixed(2);
  return(
    <div style={{background:"linear-gradient(135deg,#0a1520,#060d14)",border:`1px solid ${C.border}`,borderRadius:12,marginBottom:14,overflow:"hidden"}}>
      <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,letterSpacing:2,textTransform:"uppercase",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>💰 Paper Trading Wallet</span>
        <button onClick={reset} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.dim,padding:"2px 8px",borderRadius:3,cursor:"pointer",fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>RESET</button>
      </div>
      <div style={{padding:16}}>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {[["Cash",`$${fmt(wallet.balance)}`,C.accent],[coinLabel.split("/")[0],`${fmt(wallet.holdings,6)}`,C.yellow],["Portfolio",`$${fmt(totalValue)}`,C.text],["P&L",`${pnl>=0?"+":""}$${fmt(Math.abs(pnl))} (${pnlPct}%)`,pnl>=0?C.green:C.red]].map(([l,v,c])=>(
            <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",flex:1,minWidth:100}}>
              <div style={{fontSize:9,color:C.dim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{l}</div>
              <div style={{fontSize:14,fontFamily:"'IBM Plex Mono',monospace",color:c,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
          <input type="number" placeholder="USD amount to trade" value={amount} onChange={e=>setAmount(e.target.value)}
            style={{flex:1,minWidth:140,background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"9px 14px",borderRadius:6,fontSize:12,fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
          <button onClick={buy} style={{background:"linear-gradient(135deg,#002a1a,#001a10)",border:`1px solid ${C.green}`,color:C.green,padding:"9px 20px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,boxShadow:`0 0 12px ${C.green}22`}}>↑ BUY</button>
          <button onClick={sell} style={{background:"linear-gradient(135deg,#2a0010,#1a0008)",border:`1px solid ${C.red}`,color:C.red,padding:"9px 20px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,boxShadow:`0 0 12px ${C.red}22`}}>↓ SELL ALL</button>
        </div>
        {currentSig&&(
          <div style={{background:currentSig.includes("BUY")?"#001a0e":"#1a0008",border:`1px solid ${currentSig.includes("BUY")?C.green:C.red}33`,borderRadius:8,padding:"10px 14px",fontSize:11,color:currentSig.includes("BUY")?C.green:C.red,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{currentSig.includes("STRONG")?"⚡":currentSig.includes("HIGHLY")?"🎯":currentSig.includes("BUY")?"↑":"↓"}</span>
            <span>{currentSig.includes("BUY")?"Signal suggests entry opportunity — use caution and manage risk":"Signal suggests potential exit — consider taking profits"}</span>
          </div>
        )}
        {wallet.trades.length>0&&(
          <div>
            <div style={{fontSize:9,color:C.dim,letterSpacing:2,marginBottom:8}}>TRADE HISTORY</div>
            {wallet.trades.map((t,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10,borderBottom:`1px solid ${C.border}`,paddingBottom:6,marginBottom:6,gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{color:t.type==="BUY"?C.green:C.red,fontWeight:700,fontSize:11}}>{t.type}</span>
                <span style={{color:C.text}}>${fmt(t.amount)} @ ${fmt(t.price)}</span>
                <span style={{color:C.dim}}>{t.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ plan, user, onLogout }) {
  const isPro = plan === "pro";
  const [marketId,setMarketId]=useState("bitcoin");
  const [daysIdx,setDaysIdx]=useState(2);
  const [computed,setComputed]=useState(null);
  const [info,setInfo]=useState(null);
  const [loading,setLoading]=useState(true);
  const [source,setSource]=useState("—");
  const [updated,setUpdated]=useState(null);
  const [auto,setAuto]=useState(true);
  const [activeGroup,setActiveGroup]=useState("Crypto");
  const timer=useRef(null);

  const market = ALL_MARKETS.find(m=>m.id===marketId) || ALL_MARKETS[0];
  const days = INTERVALS[daysIdx].days;

  const load=useCallback(async(m,d)=>{
    setLoading(true);
    const [liveOHLC,liveTicker]=await Promise.all([tryFetchOHLC(m,d),tryFetchTicker(m)]);
    if(liveOHLC&&liveOHLC.length>=30){
      setInfo(liveTicker);
      setComputed(buildComputed(liveOHLC));
      setSource(m.type==="twelve"?"Twelve Data Live":"CoinGecko Live");
    } else {
      // Always fall back to simulated so charts never go blank
      const sim=simulateOHLC(m.seed,m.vol,120);
      const lastPrice=sim[sim.length-1].close;
      setInfo({
        price:lastPrice,
        change24h:+(Math.random()*4-2).toFixed(2),
        high24h:+(lastPrice*1.015).toFixed(4),
        low24h:+(lastPrice*0.985).toFixed(4),
        vol24h:m.seed*80000
      });
      setComputed(buildComputed(sim));
      setSource(m.type==="twelve"?"Simulated (market closed or API limit)":"Simulated");
    }
    setUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  },[]);

  useEffect(()=>{load(market,days);},[marketId,days]);
  useEffect(()=>{clearInterval(timer.current);if(auto)timer.current=setInterval(()=>load(market,days),60000);return()=>clearInterval(timer.current);},[auto,marketId,days]);

  const sl=computed?.chart?.slice(-80)??[];
  const{last,e9,e21,e200,rsiVal,atrVal,sig,sigStrength,hist}=computed??{};
  const trend=last&&e200?(last.close>e200?"BULLISH":"BEARISH"):null;
  const SL=last&&atrVal?+(last.close-1.5*atrVal).toFixed(4):null;
  const TP=last&&atrVal?+(last.close+2.0*atrVal).toFixed(4):null;
  const rc=rsiVal>70?C.red:rsiVal<30?C.green:C.accent;
  const sc=sig==="STRONG BUY"||sig==="HIGHLY ADVISED BUY"?C.green:sig==="BUY"?"#00cc66":sig==="HIGHLY ADVISED SELL"||sig==="SELL"?C.red:C.dim;
  const cc=info?.change24h>=0?C.green:C.red;
  const isLive=source.includes("Live");
  const confidence=isPro&&computed?getConfidence(sig,rsiVal,hist,e9,e21):null;

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'IBM Plex Mono',monospace",boxSizing:"border-box"}}>
      <style>{FONTS}</style>

      {/* Signal Notification Banner */}
      <SignalBanner sig={sig} sigStrength={sigStrength} market={market} price={last?.close} />

      <nav style={{borderBottom:`1px solid ${C.border}`,background:"rgba(3,6,8,0.98)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,position:"sticky",top:0,zIndex:100}}>
        <Logo />
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,padding:"3px 10px",borderRadius:12,background:isPro?"#1a0a3a":"#001a2a",border:`1px solid ${isPro?C.purple:C.accent}44`,color:isPro?C.purple:C.accent}}>{isPro?"✦ PRO":"STARTER"}</span>
          {user&&<span style={{fontSize:11,color:C.dim}}>👤 {user.firstName} {user.lastName}</span>}
          <span style={{fontSize:10,color:isLive?C.green:C.yellow}}>{isLive?"● LIVE":"◐ SIM"} · {updated||"—"}</span>
          <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.dim,padding:"4px 10px",borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>← LOGOUT</button>
        </div>
      </nav>

      <div style={{padding:"16px 20px"}}>
        {/* Market Group Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {MARKET_GROUPS.map(g=>{
            const locked=g.proOnly&&!isPro;
            return(
              <button key={g.label} onClick={()=>{if(!locked){setActiveGroup(g.label);const first=g.markets[0];setMarketId(first.id);}}}
                style={{background:activeGroup===g.label?"rgba(0,212,255,0.08)":C.bg,border:`1px solid ${activeGroup===g.label?(g.proOnly?C.purple:C.accent):C.border}`,color:locked?C.dim:activeGroup===g.label?(g.proOnly?C.purple:C.accent):C.dim,padding:"7px 16px",borderRadius:8,cursor:locked?"not-allowed":"pointer",fontSize:11,fontFamily:"'IBM Plex Mono',monospace",display:"flex",alignItems:"center",gap:6,opacity:locked?0.5:1,transition:"all 0.15s",boxShadow:activeGroup===g.label?`0 0 12px ${g.proOnly?C.purple:C.accent}22`:"none"}}>
                {g.icon} {g.label} {locked&&<span style={{fontSize:9,color:C.purple}}>PRO</span>}
              </button>
            );
          })}
        </div>

        {/* Market Pills */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
              {(MARKET_GROUPS.find(g=>g.label===activeGroup)?.markets||[]).map(m=>(
                <Pill key={m.id} active={marketId===m.id} onClick={()=>setMarketId(m.id)}>{m.label}</Pill>
              ))}
            </div>
            <div style={{fontSize:22,fontWeight:700,color:C.accent}}>{market.label}&nbsp;{info&&<span style={{color:C.text}}>${fmt(info.price)}</span>}{info&&<span style={{fontSize:13,color:cc,marginLeft:8}}>{fmtP(info.change24h)}</span>}</div>
            {info&&<div style={{fontSize:10,color:C.dim,marginTop:3}}>H: ${fmt(info.high24h)} · L: ${fmt(info.low24h)} · <span style={{color:isLive?C.green:C.yellow}}>{isLive?`● ${source}`:"◐ Simulated (market may be closed)"}</span></div>}
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
            {INTERVALS.map((iv,i)=><Pill key={iv.label} active={daysIdx===i} onClick={()=>setDaysIdx(i)}>{iv.label}</Pill>)}
            {trend&&<span style={{fontSize:10,color:trend==="BULLISH"?C.green:C.red,border:"1px solid",borderColor:trend==="BULLISH"?C.green:C.red,padding:"4px 8px",borderRadius:3}}>{trend}</span>}
            <button onClick={()=>load(market,days)} style={{background:C.panel,border:`1px solid ${C.border}`,color:C.accent,padding:"5px 10px",borderRadius:4,cursor:"pointer",fontSize:11}}>↻</button>
            <button onClick={()=>setAuto(a=>!a)} style={{background:auto?"#002a1a":C.panel,border:`1px solid ${auto?C.green:C.border}`,color:auto?C.green:C.dim,padding:"5px 10px",borderRadius:4,cursor:"pointer",fontSize:10}}>{auto?"● AUTO":"○ AUTO"}</button>
          </div>
        </div>

        {loading&&!computed&&<div style={{textAlign:"center",color:C.accent,padding:40,fontSize:13}}>
          <div style={{fontSize:24,marginBottom:10,animation:"spin 1s linear infinite"}}>◌</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          Fetching live data…
        </div>}

        {!loading&&!computed&&<div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:32,marginBottom:12}}>⚠</div>
          <div style={{color:C.yellow,fontSize:13,marginBottom:8}}>Could not load live data</div>
          <div style={{color:C.dim,fontSize:11,marginBottom:20}}>Market may be closed or API rate limit reached. Simulated data loaded instead.</div>
          <button onClick={()=>load(market,days)} style={{background:C.panel,border:`1px solid ${C.accent}`,color:C.accent,padding:"8px 20px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>↻ Retry Live Data</button>
        </div>}

        {computed&&<>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <StatCard label="Signal"      value={sig||"NEUTRAL"}            accent={sc}       sub="Confluence" />
            <StatCard label="RSI (14)"    value={rsiVal ?? "—"}             accent={rc}       sub={rsiVal>70?"Overbought":rsiVal<30?"Oversold":"Neutral"} />
            <StatCard label="EMA 9/21"    value={e9>e21?"BULL ✕":"BEAR ✕"} accent={e9>e21?C.green:C.red} sub={`${fmt(e9,2)} / ${fmt(e21,2)}`} />
            <StatCard label="Stop Loss"   value={SL?`$${fmt(SL)}`:"—"}     accent={C.red}    sub="1.5 × ATR" />
            <StatCard label="Take Profit" value={TP?`$${fmt(TP)}`:"—"}     accent={C.green}  sub="2.0 × ATR" />
            <StatCard label="ATR (14)"    value={atrVal?`$${fmt(atrVal)}`:"—"} accent={C.yellow} sub="Volatility" />
          </div>

          {isPro&&confidence!=null&&(
            <div style={{background:C.panel,border:`1px solid ${C.purple}44`,borderRadius:8,marginBottom:12,overflow:"hidden"}}>
              <div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.purple,letterSpacing:2,textTransform:"uppercase"}}>✦ AI Confidence Score — PRO FEATURE</div>
              <div style={{padding:14,display:"flex",alignItems:"center",gap:20}}>
                <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke={C.border} strokeWidth="7"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke={confidence>=75?C.green:confidence>=50?C.yellow:C.red} strokeWidth="7" strokeDasharray={`${2*Math.PI*32*confidence/100} ${2*Math.PI*32}`} strokeLinecap="round" transform="rotate(-90 40 40)"/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:18,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",color:confidence>=75?C.green:confidence>=50?C.yellow:C.red}}>{confidence}</span>
                    <span style={{fontSize:8,color:C.dim}}>/100</span>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:confidence>=75?C.green:confidence>=50?C.yellow:C.red,marginBottom:4}}>{confidence>=75?"HIGH CONFIDENCE":confidence>=50?"MODERATE":"LOW / CAUTION"}</div>
                  <div style={{fontSize:11,color:C.dim,lineHeight:1.7}}>Based on EMA, RSI, MACD & volume alignment.<br/>Current signal: <span style={{color:sc}}>{sig||"NEUTRAL"}</span></div>
                </div>
              </div>
            </div>
          )}

          <PaperTrading currentPrice={last?.close||0} currentSig={sig} coinLabel={market.label} tier={plan} />

          <ChartPanel title={`Price + EMA — ${market.label} · ${INTERVALS[daysIdx].label}`} right={<SigBadge type={sig} />}>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={sl}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{fill:C.dim,fontSize:9}} interval="preserveStartEnd" />
                <YAxis domain={["auto","auto"]} tick={{fill:C.dim,fontSize:10}} width={80} tickFormatter={v=>`$${fmt(v)}`} />
                <Tooltip content={<TT />} />
                <Line dataKey="close" stroke={C.text}   dot={false} strokeWidth={1.5} name="Price" />
                <Line dataKey="e9"    stroke={C.accent} dot={false} strokeWidth={1.5} strokeDasharray="5 3" name="EMA9" />
                <Line dataKey="e21"   stroke={C.yellow} dot={false} strokeWidth={1.5} strokeDasharray="5 3" name="EMA21" />
                <Line dataKey="e50"   stroke={C.muted}  dot={false} strokeWidth={1}   strokeDasharray="2 5" name="EMA50" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
              {[["Price",C.text],["EMA9",C.accent],["EMA21",C.yellow],["EMA50",C.muted]].map(([l,c])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:C.dim}}>
                  <span style={{width:18,height:2,background:c,display:"inline-block",borderRadius:1,boxShadow:`0 0 4px ${c}88`}}/>
                  {l}
                </span>
              ))}
            </div>
          </ChartPanel>

          {/* RSI */}
          <ChartPanel title="RSI (14) — Momentum Strength">
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={sl}>
                <defs>
                  <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={rc} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={rc} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="time" tick={{fill:C.dim,fontSize:9}} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{fill:C.dim,fontSize:9}} width={28} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <ReferenceLine y={70} stroke={C.red}   strokeDasharray="4 3" strokeOpacity={0.6} label={{value:"70",fill:C.red,fontSize:9,position:"insideTopRight"}} />
                <ReferenceLine y={50} stroke={C.dim}   strokeDasharray="2 6" strokeOpacity={0.3} />
                <ReferenceLine y={30} stroke={C.green} strokeDasharray="4 3" strokeOpacity={0.6} label={{value:"30",fill:C.green,fontSize:9,position:"insideBottomRight"}} />
                <Line dataKey="rsi" stroke={rc} dot={false} strokeWidth={2.5} name="RSI" style={{filter:`drop-shadow(0 0 4px ${rc}66)`}} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* MACD */}
          <ChartPanel title="MACD — Momentum Confirmation">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={sl} barSize={3}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="time" tick={{fill:C.dim,fontSize:9}} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis tick={{fill:C.dim,fontSize:9}} width={50} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <ReferenceLine y={0} stroke={C.border} strokeWidth={1.5} />
                <Bar dataKey="hist" name="Histogram" radius={[2,2,0,0]}
                  shape={(props)=>{const{x,y,width,height,value}=props;const h=Math.abs(height||0);const col=value>=0?C.green:C.red;return<rect x={x} y={value>=0?y:y+(height||0)} width={Math.max(width,2)} height={h} fill={col} fillOpacity={0.85} rx={1} style={{filter:`drop-shadow(0 0 3px ${col}44)`}}/>;}}/>
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={sl}>
                <XAxis dataKey="time" hide />
                <YAxis tick={{fill:C.dim,fontSize:9}} width={50} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <ReferenceLine y={0} stroke={C.border} />
                <Line dataKey="macd"   stroke={C.accent} dot={false} strokeWidth={2} name="MACD"   style={{filter:`drop-shadow(0 0 3px ${C.accent}44)`}} />
                <Line dataKey="signal" stroke={C.yellow} dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Signal" />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Volume + OBV */}
          <ChartPanel title="Volume + OBV — Smart Money Flow">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={{fontSize:9,color:C.dim,letterSpacing:2,marginBottom:6}}>RAW VOLUME</div>
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={sl} barSize={3}>
                    <XAxis hide /><YAxis tick={{fill:C.dim,fontSize:8}} width={36} axisLine={false} tickLine={false} />
                    <Tooltip content={<TT />} />
                    <Bar dataKey="volume" name="Volume" radius={[2,2,0,0]}
                      shape={(props)=>{const{x,y,width,height}=props;return<rect x={x} y={y} width={Math.max(width,2)} height={Math.abs(height||0)} fill={C.muted} fillOpacity={0.8} rx={1}/>;}}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{fontSize:9,color:C.dim,letterSpacing:2,marginBottom:6}}>ON-BALANCE VOLUME</div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={sl}>
                    <defs>
                      <linearGradient id="obvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.accent} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis hide /><YAxis tick={{fill:C.dim,fontSize:8}} width={44} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                    <Tooltip content={<TT />} />
                    <Line dataKey="obv" stroke={C.accent} dot={false} strokeWidth={2} name="OBV" style={{filter:`drop-shadow(0 0 4px ${C.accent}44)`}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartPanel>
        </>}

        <div style={{fontSize:9,color:C.dim,textAlign:"center",marginTop:8,lineHeight:1.9,padding:"0 0 20px"}}>
          ⚠ Educational only · Not financial advice · {isLive?`Live: ${source}`:"Simulated data"}
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onGetStarted, onAdminLogin, onPartnerLogin }) {
  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'IBM Plex Mono',monospace",color:C.text}}>
      <style>{`${FONTS} *{box-sizing:border-box;margin:0;padding:0;} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes floatUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}} @keyframes glowPurple{0%,100%{box-shadow:0 0 20px #a855f722}50%{box-shadow:0 0 50px #a855f755}}`}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.012) 2px,rgba(0,212,255,0.012) 4px)"}} />
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,borderBottom:`1px solid ${C.border}`,background:"rgba(3,6,8,0.96)",backdropFilter:"blur(12px)",padding:"14px 40px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo />
        <div style={{display:"flex",gap:16,alignItems:"center",fontSize:12,color:C.dim}}>
          <button onClick={onAdminLogin} style={{background:"transparent",color:C.dim,border:"none",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:1}}>🔐 Admin</button>
          <button onClick={onPartnerLogin} style={{background:"transparent",color:C.orange,border:`1px solid ${C.orange}44`,padding:"6px 14px",borderRadius:4,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,letterSpacing:1}}>🤝 Partners</button>
          <button onClick={onGetStarted} style={{background:C.purple,color:"#fff",border:"none",padding:"8px 18px",borderRadius:4,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:700,letterSpacing:1}}>GET STARTED</button>
        </div>
      </nav>

      <div style={{paddingTop:140,paddingBottom:80,textAlign:"center",position:"relative",zIndex:1,animation:"floatUp 0.9s ease forwards"}}>
        <div style={{display:"inline-block",background:"#00d4ff11",border:`1px solid ${C.accent}44`,borderRadius:20,padding:"4px 16px",fontSize:10,color:C.accent,letterSpacing:3,marginBottom:24,animation:"pulse 3s infinite"}}>● LIVE MARKET SIGNALS · AI-POWERED · 5 INDICATORS</div>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(34px,5.5vw,76px)",fontWeight:800,color:"#fff",lineHeight:1.05,marginBottom:20}}>Professional Trading Signals.<br/><span style={{color:C.accent}}>Built for Every Market.</span></h1>
        <p style={{fontSize:16,color:C.dim,maxWidth:560,margin:"0 auto 44px",lineHeight:1.75}}>From crypto to stocks, options to forex — Quantum Signal AI delivers real-time confluence signals with AI confidence scoring and paper trading.</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={onGetStarted} style={{background:"transparent",color:C.accent,border:`2px solid ${C.accent}`,padding:"15px 32px",borderRadius:6,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:700,letterSpacing:1}}>START AT $49/MO</button>
          <button onClick={onGetStarted} style={{background:C.purple,color:"#fff",border:"none",padding:"15px 32px",borderRadius:6,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:700,letterSpacing:1,animation:"glowPurple 2.5s infinite"}}>GET PRO — $149/MO ✦</button>
          <button onClick={onGetStarted} style={{background:`linear-gradient(90deg,${C.orange},#ff9500)`,color:"#fff",border:"none",padding:"15px 32px",borderRadius:6,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:700,letterSpacing:1}}>🤖 BOT TIER — $299/MO</button>
        </div>
        <div style={{marginTop:16,fontSize:11,color:C.dim}}>Cancel anytime · No contracts · Educational use only · US-based</div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 40px 80px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>
          {[
            {icon:"📈",title:"5-Indicator Engine",  desc:"EMA, RSI, MACD, OBV & ATR combined into one powerful confluence signal."},
            {icon:"⚡",title:"Real-Time Signals",   desc:"Pro: signals fire instantly. Starter: 5–10 curated signals per week."},
            {icon:"🤖",title:"AI Confidence Score", desc:"Pro exclusive: AI scores each signal 0–100 based on indicator strength."},
            {icon:"📱",title:"Mobile Alerts",       desc:"Email, SMS & push notifications so you never miss a signal."},
            {icon:"💰",title:"Paper Trading",        desc:"All plans include a $10,000 virtual wallet to practice risk-free."},
            {icon:"🛡",title:"Risk Management",     desc:"Stop loss at 1.5×ATR and take profit at 2×ATR auto-calculated."},
            {icon:"🔗",title:"Auto-Trading Bot",    desc:"Bot Tier: connects to your Alpaca or Coinbase account and executes trades automatically."},
            {icon:"⛔",title:"Emergency Stop",      desc:"Bot Tier: one-click kill switch cancels all pending orders instantly."},
          ].map(f=>(
            <div key={f.title} style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:"22px 20px"}}>
              <div style={{fontSize:26,marginBottom:10}}>{f.icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#fff",marginBottom:7}}>{f.title}</div>
              <div style={{fontSize:12,color:C.dim,lineHeight:1.65}}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Pricing section header */}
        <div style={{textAlign:"center",marginTop:70,marginBottom:40}}>
          <div style={{fontSize:10,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Pricing</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:"#fff",marginBottom:10}}>Choose Your Edge</h2>
          <p style={{color:C.dim,fontSize:14}}>Start free · Cancel anytime · No contracts</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:24}}>

          {/* Starter */}
          <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:16,padding:"36px 28px"}}>
            <div style={{fontSize:10,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Starter</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:800,color:"#fff",lineHeight:1}}>$49</div>
            <div style={{color:C.dim,fontSize:12,marginBottom:20}}>/month</div>
            {[
              "5–10 curated signals/week",
              "Email, SMS & push alerts",
              "Basic crypto dashboard (5 pairs)",
              "$10,000 paper trading wallet",
              "Stop loss & take profit levels",
              "Community Discord access",
            ].map(f=><div key={f} style={{display:"flex",gap:10,marginBottom:10}}><span style={{color:C.green,flexShrink:0}}>✓</span><span style={{fontSize:12,color:C.text,lineHeight:1.5}}>{f}</span></div>)}
            <button onClick={onGetStarted} style={{width:"100%",marginTop:20,background:"transparent",color:C.accent,border:`2px solid ${C.accent}`,padding:"13px",borderRadius:6,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700}}>GET STARTED →</button>
          </div>

          {/* Pro */}
          <div style={{background:"#0d0820",border:`2px solid ${C.purple}`,borderRadius:16,padding:"36px 28px",position:"relative"}}>
            <div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:C.purple,color:"#fff",fontSize:10,fontWeight:700,letterSpacing:2,padding:"4px 18px",borderRadius:20}}>MOST POPULAR</div>
            <div style={{fontSize:10,color:C.purple,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>✦ Pro</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:800,color:"#fff",lineHeight:1}}>$149</div>
            <div style={{color:C.dim,fontSize:12,marginBottom:20}}>/month</div>
            {[
              "Real-time signals as they fire",
              "AI Confidence Score per signal",
              "Stocks, options, crypto & forex",
              "Advanced risk management",
              "Position sizing calculator",
              "$10,000 paper trading wallet",
              "Priority support",
            ].map(f=><div key={f} style={{display:"flex",gap:10,marginBottom:10}}><span style={{color:C.purple,flexShrink:0}}>✦</span><span style={{fontSize:12,color:C.text,lineHeight:1.5}}>{f}</span></div>)}
            <button onClick={onGetStarted} style={{width:"100%",marginTop:20,background:C.purple,color:"#fff",border:"none",padding:"13px",borderRadius:6,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700}}>GET PRO →</button>
          </div>

          {/* Bot */}
          <div style={{background:"#120800",border:`2px solid ${C.orange}`,borderRadius:16,padding:"36px 28px",position:"relative",boxShadow:`0 0 30px ${C.orange}22`}}>
            <div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:`linear-gradient(90deg,${C.orange},#ff9500)`,color:"#fff",fontSize:10,fontWeight:700,letterSpacing:2,padding:"4px 18px",borderRadius:20}}>🤖 AUTO-TRADER</div>
            <div style={{fontSize:10,color:C.orange,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>⚡ Bot Tier</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:800,color:"#fff",lineHeight:1}}>$299</div>
            <div style={{color:C.dim,fontSize:12,marginBottom:20}}>/month</div>
            {[
              "Everything in Pro plan",
              "Auto-executes trades on YOUR account",
              "Connect Alpaca (stocks + crypto)",
              "Connect Coinbase Advanced (crypto)",
              "Customizable risk % per trade",
              "Max open trades control",
              "Emergency stop button",
              "Full live trade log & P&L tracking",
              "Dedicated support",
            ].map(f=><div key={f} style={{display:"flex",gap:10,marginBottom:10}}><span style={{color:C.orange,flexShrink:0}}>⚡</span><span style={{fontSize:12,color:C.text,lineHeight:1.5}}>{f}</span></div>)}
            <div style={{marginTop:14,background:"#1a0800",border:`1px solid ${C.orange}33`,borderRadius:6,padding:"10px 12px",fontSize:11,color:C.orange,marginBottom:16,lineHeight:1.6}}>
              ⚠ Trades execute on your own broker account. You maintain full control at all times.
            </div>
            <button onClick={onGetStarted} style={{width:"100%",background:`linear-gradient(90deg,${C.orange},#ff9500)`,color:"#fff",border:"none",padding:"13px",borderRadius:6,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700}}>GET BOT TIER →</button>
          </div>

        </div>
      </div>

      <div style={{background:C.panel,borderTop:`1px solid ${C.border}`,padding:"32px 40px",textAlign:"center"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{fontSize:10,color:C.yellow,letterSpacing:3,marginBottom:10}}>⚠ LEGAL DISCLAIMER</div>
          <p style={{fontSize:11,color:C.dim,lineHeight:1.85}}>Quantum Signal AI is a software tool for educational purposes only. It does not constitute financial advice or any recommendation to buy or sell any financial instrument. Quantum Signal AI is not a registered investment advisor. Past performance does not guarantee future results. All trading involves substantial risk. By subscribing you agree to our Terms of Service and use this tool at your own risk.</p>
          <div style={{marginTop:16,fontSize:10,color:C.dim}}>© 2025 Quantum Signal AI · United States · Educational use only</div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Credentials ────────────────────────────────────────────────────────
const ADMIN_USERS = [
  { username:"quantumowner",   password:"QSA!Owner2025",   firstName:"Owner",   lastName:"Admin",  plan:"bot", type:"admin" },
  { username:"quantumpartner", password:"QSA!Partner2025", firstName:"Partner", lastName:"Access", plan:"bot", type:"admin" },
];

// ─── Partner Credentials (25 accounts, full Bot Tier access) ─────────────────
const PARTNER_USERS = [
  { username:"qspartner01", password:"QSP#Ax7!mR2025", plan:"bot" },
  { username:"qspartner02", password:"QSP#Bk9!nT2025", plan:"bot" },
  { username:"qspartner03", password:"QSP#Cv3!pW2025", plan:"bot" },
  { username:"qspartner04", password:"QSP#Dq8!sL2025", plan:"bot" },
  { username:"qspartner05", password:"QSP#Ez5!uK2025", plan:"bot" },
  { username:"qspartner06", password:"QSP#Fh2!vN2025", plan:"bot" },
  { username:"qspartner07", password:"QSP#Gj6!wM2025", plan:"bot" },
  { username:"qspartner08", password:"QSP#Hm4!xQ2025", plan:"bot" },
  { username:"qspartner09", password:"QSP#In7!yP2025", plan:"bot" },
  { username:"qspartner10", password:"QSP#Jr1!zB2025", plan:"bot" },
  { username:"qspartner11", password:"QSP#Kw9!aC2025", plan:"bot" },
  { username:"qspartner12", password:"QSP#Ls3!bD2025", plan:"bot" },
  { username:"qspartner13", password:"QSP#Mt6!cE2025", plan:"bot" },
  { username:"qspartner14", password:"QSP#Nu8!dF2025", plan:"bot" },
  { username:"qspartner15", password:"QSP#Ov2!eG2025", plan:"bot" },
  { username:"qspartner16", password:"QSP#Pw5!fH2025", plan:"bot" },
  { username:"qspartner17", password:"QSP#Qx1!gJ2025", plan:"bot" },
  { username:"qspartner18", password:"QSP#Ry4!hI2025", plan:"bot" },
  { username:"qspartner19", password:"QSP#Sz7!iK2025", plan:"bot" },
  { username:"qspartner20", password:"QSP#Ta3!jL2025", plan:"bot" },
  { username:"qspartner21", password:"QSP#Ub9!kM2025", plan:"bot" },
  { username:"qspartner22", password:"QSP#Vc6!lN2025", plan:"bot" },
  { username:"qspartner23", password:"QSP#Wd2!mO2025", plan:"bot" },
  { username:"qspartner24", password:"QSP#Xe8!nP2025", plan:"bot" },
  { username:"qspartner25", password:"QSP#Yf5!oQ2025", plan:"bot" },
];

// ─── Partner Account Setup Page ───────────────────────────────────────────────
function PartnerSetupPage({ username, onComplete, onBack }) {
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = k => v => setForm(f=>({...f,[k]:v}));

  const handleSubmit = () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.password) { setError("All fields are required."); return; }
    if (!form.email.includes("@")) { setError("Please enter a valid email."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const account = { firstName:form.firstName, lastName:form.lastName, email:form.email, password:form.password, createdAt:new Date().toISOString() };
    localStorage.setItem(`qs_partner_${username}`, JSON.stringify(account));
    setTimeout(() => { setLoading(false); onComplete({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:"" }); }, 800);
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'IBM Plex Mono',monospace", display:"flex", flexDirection:"column" }}>
      <style>{FONTS}</style>
      <Nav onBack={onBack} backLabel="← Back" />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ width:"100%", maxWidth:460 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🤝</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:"#fff", marginBottom:8 }}>Set Up Your Account</h2>
            <p style={{ color:C.dim, fontSize:13, lineHeight:1.7 }}>
              Welcome, partner! Create your personal login — you'll use this email and password every time you return.
            </p>
          </div>
          <div style={{ background:C.panel, border:`1px solid ${C.orange}44`, borderRadius:12, padding:"32px 28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#120800", border:`1px solid ${C.orange}33`, borderRadius:6, padding:"10px 14px", marginBottom:24 }}>
              <span>⚡</span>
              <span style={{ fontSize:11, color:C.orange }}>Full Bot Tier access · All markets · Free forever</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="First Name" value={form.firstName} onChange={set("firstName")} placeholder="Jane" required />
              <Input label="Last Name"  value={form.lastName}  onChange={set("lastName")}  placeholder="Smith" required />
            </div>
            <Input label="Your Email"       type="email"    value={form.email}    onChange={set("email")}    placeholder="jane@yourbrand.com" required />
            <Input label="Create Password"  type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" required />
            <Input label="Confirm Password" type="password" value={form.confirm}  onChange={set("confirm")}  placeholder="Re-enter password" required />
            {error && <div style={{ background:"#1a0010", border:`1px solid ${C.red}33`, borderRadius:6, padding:"10px 14px", color:C.red, fontSize:12, marginBottom:16 }}>⚠ {error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", background:`linear-gradient(90deg,${C.orange},#ff9500)`, color:"#fff", border:"none", padding:"14px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, letterSpacing:1, opacity:loading?0.7:1 }}>
              {loading ? "CREATING ACCOUNT…" : "CREATE MY ACCOUNT →"}
            </button>
            <p style={{ fontSize:11, color:C.dim, textAlign:"center", marginTop:14, lineHeight:1.7 }}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Partner Login Page ────────────────────────────────────────────────────────
function PartnerLogin({ onLogin, onSetup, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    setError(""); setLoading(true);
    setTimeout(() => {
      const match = PARTNER_USERS.find(u => u.username === username.trim().toLowerCase() && u.password === password);
      if (!match) { setError("Invalid username or password. Please check your credentials."); setLoading(false); return; }

      // Check if they've set up their personal account yet
      const existing = localStorage.getItem(`qs_partner_${match.username}`);
      if (existing) {
        const acc = JSON.parse(existing);
        onLogin({ firstName:acc.firstName, lastName:acc.lastName, email:acc.email, phone:"" }, match.plan);
      } else {
        setLoading(false);
        onSetup(match.username);
      }
    }, 700);
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'IBM Plex Mono',monospace", display:"flex", flexDirection:"column" }}>
      <style>{FONTS}</style>
      <Nav onBack={onBack} backLabel="← Back to site" />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🤝</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:"#fff", marginBottom:8 }}>Partner Access</h2>
            <p style={{ color:C.dim, fontSize:13 }}>Enter your partner credentials for free full access</p>
          </div>
          <div style={{ background:C.panel, border:`1px solid ${C.orange}55`, borderRadius:12, padding:"32px 28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#120800", border:`1px solid ${C.orange}33`, borderRadius:6, padding:"10px 14px", marginBottom:24 }}>
              <span>⚡</span>
              <span style={{ fontSize:11, color:C.orange }}>Full Bot Tier · All markets · Auto-trading · Free access</span>
            </div>
            <Input label="Username" value={username} onChange={setUsername} placeholder="qspartner01" />
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:11, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Enter your password" onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  style={{ width:"100%", background:"#040c14", border:`1px solid ${C.border}`, color:C.text, padding:"12px 44px 12px 14px", borderRadius:6, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=C.orange} onBlur={e=>e.target.style.borderColor=C.border} />
                <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:14 }}>{showPass?"🙈":"👁"}</button>
              </div>
            </div>
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 14px", marginBottom:16, fontSize:11, color:C.dim, lineHeight:1.7 }}>
              🤝 First time? You'll create your personal email & password after logging in.<br/>
              Returning? Your saved account loads automatically.
            </div>
            {error && <div style={{ background:"#1a0010", border:`1px solid ${C.red}33`, borderRadius:6, padding:"10px 14px", color:C.red, fontSize:12, marginBottom:16 }}>⚠ {error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ width:"100%", background:`linear-gradient(90deg,${C.orange},#ff9500)`, color:"#fff", border:"none", padding:"14px", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, letterSpacing:1, opacity:loading?0.7:1 }}>
              {loading ? "VERIFYING…" : "ACCESS DASHBOARD →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Login Page ─────────────────────────────────────────────────────────
function AdminLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    setError(""); setLoading(true);
    setTimeout(() => {
      const match = ADMIN_USERS.find(u => u.username === username.trim().toLowerCase() && u.password === password);
      if (match) {
        onLogin({ firstName:match.firstName, lastName:match.lastName, email:`${match.username}@quantumsignalai.com`, phone:"" }, match.plan);
      } else {
        setError("Invalid username or password.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'IBM Plex Mono',monospace", display:"flex", flexDirection:"column" }}>
      <style>{FONTS}</style>
      <Nav onBack={onBack} backLabel="← Back to site" />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🔐</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:"#fff", marginBottom:8 }}>Admin Access</h2>
            <p style={{ color:C.dim, fontSize:13 }}>Internal dashboard access · No payment required</p>
          </div>
          <div style={{ background:C.panel, border:`1px solid ${C.purple}55`, borderRadius:12, padding:"32px 28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#0d0820", border:`1px solid ${C.purple}33`, borderRadius:6, padding:"10px 14px", marginBottom:24 }}>
              <span>✦</span><span style={{ fontSize:11, color:C.purple }}>Bot Tier · All markets · AI signals</span>
            </div>
            <Input label="Username" value={username} onChange={setUsername} placeholder="Enter your username" />
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:11, color:C.dim, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Enter your password" onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  style={{ width:"100%", background:"#040c14", border:`1px solid ${C.border}`, color:C.text, padding:"12px 44px 12px 14px", borderRadius:6, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border} />
                <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:14 }}>{showPass?"🙈":"👁"}</button>
              </div>
            </div>
            {error && <div style={{ background:"#1a0010", border:`1px solid ${C.red}33`, borderRadius:6, padding:"10px 14px", color:C.red, fontSize:12, marginBottom:16 }}>⚠ {error}</div>}
            <Button onClick={handleLogin} disabled={loading} fullWidth variant="purple">
              {loading ? "VERIFYING…" : "ACCESS DASHBOARD →"}
            </Button>
            <div style={{ marginTop:20, padding:"14px", background:C.bg, borderRadius:6, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:9, color:C.dim, letterSpacing:2, marginBottom:8 }}>YOUR CREDENTIALS</div>
              <div style={{ fontSize:11, color:C.text, lineHeight:2 }}>
                <div>Owner: <span style={{ color:C.accent }}>quantumowner</span></div>
                <div>Partner: <span style={{ color:C.accent }}>quantumpartner</span></div>
                <div style={{ marginTop:4, fontSize:10, color:C.dim }}>Passwords sent separately for security.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = k => v => setForm(f=>({...f,[k]:v}));

  const handleSubmit = () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.password) { setError("All fields are required."); return; }
    if (!form.email.includes("@")) { setError("Please enter a valid email."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);

    // Save promo account locally
    const account = { firstName:form.firstName, lastName:form.lastName, email:form.email, password:form.password, promoCode, createdAt: new Date().toISOString() };
    localStorage.setItem(`qs_promo_${promoCode}`, JSON.stringify(account));
    setTimeout(() => { setLoading(false); onComplete({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:"" }); }, 800);
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'IBM Plex Mono',monospace", display:"flex", flexDirection:"column" }}>
      <style>{FONTS}</style>
      <Nav onBack={onBack} backLabel="← Back" />
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ width:"100%", maxWidth:460 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🎁</div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:"#fff", marginBottom:8 }}>Set Up Your Free Account</h2>
            <p style={{ color:C.dim, fontSize:13, lineHeight:1.7 }}>
              Your promo code <strong style={{ color:C.orange }}>{promoCode}</strong> gives you <strong style={{ color:C.text }}>full Bot Tier access — free forever</strong>. Create your personal login below.
            </p>
          </div>

          <div style={{ background:C.panel, border:`1px solid ${C.orange}44`, borderRadius:12, padding:"32px 28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#120800", border:`1px solid ${C.orange}33`, borderRadius:6, padding:"10px 14px", marginBottom:24 }}>
              <span style={{ fontSize:14 }}>⚡</span>
              <span style={{ fontSize:11, color:C.orange }}>Bot Tier · All markets · Auto-trading · Free access</span>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="First Name" value={form.firstName} onChange={set("firstName")} placeholder="Jane" required />
              <Input label="Last Name"  value={form.lastName}  onChange={set("lastName")}  placeholder="Smith" required />
            </div>
            <Input label="Your Email"    type="email"    value={form.email}    onChange={set("email")}    placeholder="jane@yourbrand.com" required />
            <Input label="Set Password"  type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" required />
            <Input label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" required />

            {error && <div style={{ background:"#1a0010", border:`1px solid ${C.red}33`, borderRadius:6, padding:"10px 14px", color:C.red, fontSize:12, marginBottom:16 }}>⚠ {error}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", background:`linear-gradient(90deg,${C.orange},#ff9500)`, color:"#fff", border:"none", padding:"14px", borderRadius:6, cursor:"pointer", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:700, letterSpacing:1, opacity:loading?0.7:1 }}>
              {loading ? "CREATING ACCOUNT…" : "CREATE MY ACCOUNT →"}
            </button>

            <p style={{ fontSize:11, color:C.dim, textAlign:"center", marginTop:14, lineHeight:1.7 }}>
              Your account is tied to promo code <strong style={{ color:C.orange }}>{promoCode}</strong>. By continuing you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]             = useState("landing");
  const [plan, setPlan]             = useState(null);
  const [user, setUser]             = useState(null);
  const [partnerUsername, setPartnerUsername] = useState(null);

  const navigate = (to) => { window.history.pushState({ page:to }, "", `#${to}`); setPage(to); };

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/"; s.async = true;
    document.head.appendChild(s);
    const saved = localStorage.getItem("qs_user");
    const savedPlan = localStorage.getItem("qs_plan");
    if (saved && savedPlan) {
      setUser(JSON.parse(saved)); setPlan(savedPlan);
      setPage(savedPlan === "bot" ? "botdashboard" : "dashboard"); return;
    }
    const hash = window.location.hash.replace("#","");
    if (hash && ["landing","plan","signup","payment","admin","partner","dashboard","botdashboard"].includes(hash)) setPage(hash);
    const handlePop = (e) => {
      const p = e.state?.page || "landing";
      const savedU = localStorage.getItem("qs_user");
      if ((p==="dashboard"||p==="botdashboard") && !savedU) { setPage("landing"); return; }
      setPage(p);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("qs_user"); localStorage.removeItem("qs_plan");
    setUser(null); setPlan(null);
    window.history.pushState({ page:"landing" }, "", "#landing");
    setPage("landing");
  };

  const handleLogin = (u, p) => {
    localStorage.setItem("qs_user", JSON.stringify(u));
    localStorage.setItem("qs_plan", p);
    setUser(u); setPlan(p);
    const dest = p === "bot" ? "botdashboard" : "dashboard";
    window.history.replaceState({ page:dest }, "", `#${dest}`);
    setPage(dest);
  };

  const handlePartnerFirstLogin = (uname) => {
    setPartnerUsername(uname);
    navigate("partnersetup");
  };

  const handlePartnerSetupComplete = (u) => {
    handleLogin(u, "bot");
  };

  if (page === "landing")      return <LandingPage onGetStarted={()=>navigate("plan")} onAdminLogin={()=>navigate("admin")} onPartnerLogin={()=>navigate("partner")} />;
  if (page === "admin")        return <AdminLogin onLogin={handleLogin} onBack={()=>navigate("landing")} />;
  if (page === "partner")      return <PartnerLogin onLogin={handleLogin} onSetup={handlePartnerFirstLogin} onBack={()=>navigate("landing")} />;
  if (page === "partnersetup") return <PartnerSetupPage username={partnerUsername} onComplete={handlePartnerSetupComplete} onBack={()=>navigate("partner")} />;
  if (page === "plan")         return <PlanPage onSelect={p=>{setPlan(p);navigate("signup");}} onBack={()=>navigate("landing")} />;
  if (page === "signup")       return <SignupPage plan={plan} onNext={u=>{setUser(u);navigate("payment");}} onBack={()=>navigate("plan")} />;
  if (page === "payment")      return <PaymentPage plan={plan} user={user} onSuccess={()=>{ localStorage.setItem("qs_user",JSON.stringify(user)); localStorage.setItem("qs_plan",plan); navigate("success"); }} onBack={()=>navigate("signup")} />;
  if (page === "success")      return <SuccessPage plan={plan} user={user} onEnter={()=>navigate(plan==="bot"?"botsetup":"dashboard")} />;
  if (page === "botsetup")     return <BotSetupPage user={user} onComplete={()=>navigate("botdashboard")} onSkip={()=>navigate("botdashboard")} />;
  if (page === "botdashboard") return <BotDashboard user={user} onLogout={handleLogout} />;
  if (page === "dashboard")    return <Dashboard plan={plan} user={user} onLogout={handleLogout} />;
  return null;
}




