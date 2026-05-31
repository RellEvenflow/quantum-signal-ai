import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";

const STRIPE_PK = "pk_live_51TRM7tK4Z1aqO4qojUT2oZU1VUcb8Po4LfJr0YajFYD47khTYuarPjZORAiZexMPxtpvstlzk1MLap8y9eCN0xsz00GwjsatxY";

const COINS = [
  { id:"bitcoin",     label:"BTC/USD", seed:67000, vol:1200 },
  { id:"ethereum",    label:"ETH/USD", seed:3500,  vol:80   },
  { id:"solana",      label:"SOL/USD", seed:175,   vol:6    },
  { id:"binancecoin", label:"BNB/USD", seed:580,   vol:12   },
  { id:"ripple",      label:"XRP/USD", seed:0.52,  vol:0.015},
];
const INTERVALS = [
  { label:"1D", days:1 },{ label:"7D", days:7 },
  { label:"30D", days:30 },{ label:"90D", days:90 },
];

// ─── Simulate OHLC ───────────────────────────────────────────────────────────
function simulateOHLC(seed, volatility, count = 120) {
  let price = seed;
  const now = Date.now();
  const interval = (90 * 24 * 60 * 60 * 1000) / count;
  return Array.from({ length: count }, (_, i) => {
    const change = (Math.random() - 0.485) * volatility;
    price = Math.max(seed * 0.3, price + change);
    const spread = volatility * 0.4;
    const open  = +(price - (Math.random() - 0.5) * spread).toFixed(4);
    const close = +(price).toFixed(4);
    const high  = +(Math.max(open, close) + Math.random() * spread * 0.5).toFixed(4);
    const low   = +(Math.min(open, close) - Math.random() * spread * 0.5).toFixed(4);
    return { i, open, high, low, close, volume: Math.random() * 1000 + 200,
      time: new Date(now - (count - i) * interval).toLocaleDateString([], { month:"short", day:"numeric" }) };
  });
}

async function tryFetchOHLC(coinId, days) {
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const raw = await r.json();
    if (!Array.isArray(raw) || raw.length < 10) return null;
    return raw.map((k, i) => ({ i, time: new Date(k[0]).toLocaleDateString([], { month:"short", day:"numeric" }), open:k[1], high:k[2], low:k[3], close:k[4], volume: Math.abs(k[2]-k[3])*500+Math.random()*300 }));
  } catch { return null; }
}

async function tryFetchTicker(coinId) {
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const d = await r.json();
    return { price:d.market_data.current_price.usd, change24h:d.market_data.price_change_percentage_24h, high24h:d.market_data.high_24h.usd, low24h:d.market_data.low_24h.usd, vol24h:d.market_data.total_volume.usd, cap:d.market_data.market_cap.usd };
  } catch { return null; }
}

// ─── Indicators ──────────────────────────────────────────────────────────────
function calcEMA(data, p) { const k=2/(p+1); let e=data[0].close; return data.map((d,i)=>{ e=i===0?d.close:d.close*k+e*(1-k); return +e.toFixed(6); }); }
function calcRSI(data, p=14) {
  if (data.length<=p) return data.map(()=>null);
  const out=Array(p).fill(null); let g=0,l=0;
  for (let i=1;i<=p;i++) { const d=data[i].close-data[i-1].close; d>0?g+=d:l-=d; }
  g/=p; l/=p; out.push(l===0?100:+(100-100/(1+g/l)).toFixed(2));
  for (let i=p+1;i<data.length;i++) { const d=data[i].close-data[i-1].close,dg=d>0?d:0,dl=d<0?-d:0; g=(g*(p-1)+dg)/p; l=(l*(p-1)+dl)/p; out.push(l===0?100:+(100-100/(1+g/l)).toFixed(2)); }
  return out;
}
function calcMACD(data) {
  const e12=calcEMA(data,12),e26=calcEMA(data,26);
  const line=e12.map((v,i)=>+(v-e26[i]).toFixed(6));
  const sig=[]; let s=line[Math.min(26,line.length-1)];
  line.forEach((v,i)=>{ if(i<26){sig.push(null);return;} s=i===26?v:+(v*0.2+s*0.8).toFixed(6); sig.push(s); });
  return { line, sig, hist:line.map((v,i)=>sig[i]!=null?+(v-sig[i]).toFixed(6):null) };
}
function calcOBV(data) { const out=[0]; for(let i=1;i<data.length;i++){const d=data[i].close-data[i-1].close;out.push(d>0?out[i-1]+data[i].volume:d<0?out[i-1]-data[i].volume:out[i-1]);} return out; }
function calcATR(data, p=14) { const out=[null]; for(let i=1;i<data.length;i++){const tr=Math.abs(data[i].close-data[i-1].close);if(i<p){out.push(null);continue;}out.push(+((((out[i-1]??tr)*(p-1))+tr)/p).toFixed(6));}return out; }
function calcSignals(data,e9,e21,R,M,O) {
  return data.map((d,i)=>{
    if(i<27) return {...d,sig:null};
    const xUp=e9[i]>e21[i]&&e9[i-1]<=e21[i-1],xDn=e9[i]<e21[i]&&e9[i-1]>=e21[i-1];
    const ok=R[i]!=null&&R[i]>30&&R[i]<65,mb=M.hist[i]!=null&&M.hist[i]>0&&M.hist[i-1]!=null&&M.hist[i-1]<=0,vc=i>=3&&O[i]>O[i-3];
    let sig=null;
    if(xUp&&ok&&mb&&vc) sig="STRONG BUY"; else if(xUp&&ok) sig="BUY"; else if(xDn&&R[i]!=null&&R[i]>65) sig="SELL";
    return {...d,sig};
  });
}
function buildComputed(ohlc) {
  const E9=calcEMA(ohlc,9),E21=calcEMA(ohlc,21),E50=calcEMA(ohlc,50),E200=calcEMA(ohlc,Math.min(200,ohlc.length-1));
  const R=calcRSI(ohlc),M=calcMACD(ohlc),O=calcOBV(ohlc),A=calcATR(ohlc);
  const S=calcSignals(ohlc,E9,E21,R,M,O);
  const chart=S.map((d,i)=>({...d,e9:E9[i],e21:E21[i],e50:E50[i],rsi:R[i],macd:M.line[i],signal:M.sig[i],hist:M.hist[i],obv:O[i],atr:A[i]}));
  const n=ohlc.length-1;
  return {chart,last:ohlc[n],e9:E9[n],e21:E21[n],e200:E200[n],rsiVal:R[n],atrVal:A[n],sig:S[n].sig,hist:M.hist[n]};
}

// ─── AI Confidence Score (Pro) ────────────────────────────────────────────────
function getConfidence(sig, rsiVal, hist, e9, e21) {
  let score = 50;
  if (sig === "STRONG BUY") score += 30;
  else if (sig === "BUY") score += 15;
  else if (sig === "SELL") score -= 20;
  if (rsiVal != null) { if (rsiVal > 30 && rsiVal < 65) score += 10; else if (rsiVal > 70 || rsiVal < 25) score -= 15; }
  if (hist != null && hist > 0) score += 8;
  if (e9 > e21) score += 7;
  return Math.min(99, Math.max(10, score));
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const C = { bg:"#030608", panel:"#080f14", border:"#0c1e2e", accent:"#00d4ff", green:"#00ff88", red:"#ff3355", yellow:"#ffc400", purple:"#a855f7", muted:"#1e3a4a", text:"#a8c8e0", dim:"#2a5060" };
const fmt = (n,d=2) => n!=null?Number(n).toLocaleString("en-US",{maximumFractionDigits:d}):"—";
const fmtP = n => n!=null?`${n>0?"+":""}${Number(n).toFixed(2)}%`:"—";
const fmtK = n => n==null?"—":n>=1e9?`$${(n/1e9).toFixed(2)}B`:n>=1e6?`$${(n/1e6).toFixed(2)}M`:`$${fmt(n)}`;

function TT({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return <div style={{background:"#040c12",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:11,fontFamily:"monospace"}}><div style={{color:C.dim,marginBottom:4}}>{label}</div>{payload.map((p,i)=>p.value!=null&&<div key={i} style={{color:p.color||C.accent}}>{p.name}: {fmt(p.value,4)}</div>)}</div>;
}
function StatCard({label,value,sub,accent}) {
  return <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,padding:"12px 14px",flex:1,minWidth:120}}><div style={{fontSize:9,color:C.dim,letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>{label}</div><div style={{fontSize:18,fontFamily:"monospace",color:accent||C.accent,fontWeight:700,wordBreak:"break-all"}}>{value}</div>{sub&&<div style={{fontSize:10,color:C.dim,marginTop:3}}>{sub}</div>}</div>;
}
function Panel({title,children,right}) {
  return <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:12,overflow:"hidden"}}><div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,letterSpacing:2,textTransform:"uppercase",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{title}</span>{right}</div><div style={{padding:14}}>{children}</div></div>;
}
function SigBadge({type}) {
  if(!type) return null;
  const m={"STRONG BUY":{bg:"#002a1a",bd:C.green,c:C.green,t:"⚡ STRONG BUY"},"BUY":{bg:"#001a10",bd:"#00cc66",c:"#00cc66",t:"↑ BUY"},"SELL":{bg:"#2a0010",bd:C.red,c:C.red,t:"↓ SELL"}}[type];
  if(!m) return null;
  return <span style={{fontSize:10,fontFamily:"monospace",letterSpacing:1,padding:"3px 9px",borderRadius:3,background:m.bg,border:`1px solid ${m.bd}`,color:m.c}}>{m.t}</span>;
}
function Pill({active,onClick,children}) {
  return <button onClick={onClick} style={{background:active?C.accent:C.panel,color:active?C.bg:C.dim,border:`1px solid ${active?C.accent:C.border}`,padding:"5px 11px",borderRadius:4,cursor:"pointer",fontSize:11,fontFamily:"monospace",transition:"all 0.15s"}}>{children}</button>;
}

// ─── AI Confidence Widget (Pro only) ─────────────────────────────────────────
function ConfidenceScore({ score, sig }) {
  const color = score >= 75 ? C.green : score >= 50 ? C.yellow : C.red;
  const label = score >= 75 ? "HIGH CONFIDENCE" : score >= 50 ? "MODERATE" : "LOW / CAUTION";
  return (
    <div style={{background:C.panel,border:`1px solid ${C.purple}44`,borderRadius:8,marginBottom:12,overflow:"hidden"}}>
      <div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.purple,letterSpacing:2,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
        <span>✦ AI Confidence Score</span><span style={{fontSize:9,color:C.dim}}>PRO FEATURE</span>
      </div>
      <div style={{padding:14,display:"flex",alignItems:"center",gap:20}}>
        <div style={{position:"relative",width:90,height:90,flexShrink:0}}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none" stroke={C.border} strokeWidth="8"/>
            <circle cx="45" cy="45" r="38" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${2*Math.PI*38*score/100} ${2*Math.PI*38}`}
              strokeLinecap="round" transform="rotate(-90 45 45)" style={{transition:"stroke-dasharray 1s ease"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:22,fontWeight:700,fontFamily:"monospace",color}}>{score}</span>
            <span style={{fontSize:8,color:C.dim}}>/ 100</span>
          </div>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color,marginBottom:6,fontFamily:"monospace"}}>{label}</div>
          <div style={{fontSize:11,color:C.dim,lineHeight:1.7}}>
            Based on EMA alignment, RSI zone,<br/>MACD momentum & volume confirmation.<br/>
            <span style={{color:C.text}}>Current signal: </span><span style={{color: sig==="STRONG BUY"?C.green:sig==="BUY"?"#00cc66":sig==="SELL"?C.red:C.dim}}>{sig||"NEUTRAL"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Paper Trading ────────────────────────────────────────────────────────────
function PaperTrading({ currentPrice, currentSig, coinLabel, tier }) {
  const key = `qs_wallet_${tier}`;
  const [wallet, setWallet] = useState(()=>{ try{const s=localStorage.getItem(key);return s?JSON.parse(s):{balance:10000,holdings:0,trades:[]}}catch{return{balance:10000,holdings:0,trades:[]}}});
  const [amount, setAmount] = useState("");
  const save = w => { setWallet(w); try{localStorage.setItem(key,JSON.stringify(w))}catch{} };
  const buy = () => { const usd=parseFloat(amount); if(!usd||usd>wallet.balance||usd<=0) return; const coins=usd/currentPrice; save({...wallet,balance:+(wallet.balance-usd).toFixed(2),holdings:+(wallet.holdings+coins).toFixed(8),trades:[{type:"BUY",price:currentPrice,amount:usd,coins:+coins.toFixed(6),time:new Date().toLocaleTimeString(),sig:currentSig},...wallet.trades.slice(0,9)]}); setAmount(""); };
  const sell = () => { if(wallet.holdings<=0) return; const usd=+(wallet.holdings*currentPrice).toFixed(2); save({...wallet,balance:+(wallet.balance+usd).toFixed(2),holdings:0,trades:[{type:"SELL",price:currentPrice,amount:usd,coins:+wallet.holdings.toFixed(6),time:new Date().toLocaleTimeString(),sig:currentSig},...wallet.trades.slice(0,9)]}); };
  const reset = () => save({balance:10000,holdings:0,trades:[]});
  const totalValue = +(wallet.balance + wallet.holdings * currentPrice).toFixed(2);
  const pnl = +(totalValue - 10000).toFixed(2);
  const pnlPct = +((pnl/10000)*100).toFixed(2);
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:12,overflow:"hidden"}}>
      <div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,letterSpacing:2,textTransform:"uppercase",display:"flex",justifyContent:"space-between"}}>
        <span>💰 Paper Trading Wallet</span>
        <button onClick={reset} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.dim,padding:"2px 8px",borderRadius:3,cursor:"pointer",fontSize:9,fontFamily:"monospace"}}>RESET</button>
      </div>
      <div style={{padding:14}}>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {[["Cash",`$${fmt(wallet.balance)}`,C.accent],[`${coinLabel.split("/")[0]}`,`${fmt(wallet.holdings,6)}`,C.yellow],["Portfolio",`$${fmt(totalValue)}`,C.text],["P&L",`${pnl>=0?"+":""}$${fmt(Math.abs(pnl))} (${pnlPct}%)`,pnl>=0?C.green:C.red]].map(([l,v,c])=>(
            <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 12px",flex:1,minWidth:100}}>
              <div style={{fontSize:9,color:C.dim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{l}</div>
              <div style={{fontSize:14,fontFamily:"monospace",color:c,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
          <input type="number" placeholder="USD amount" value={amount} onChange={e=>setAmount(e.target.value)} style={{flex:1,minWidth:130,background:C.bg,border:`1px solid ${C.border}`,color:C.text,padding:"8px 12px",borderRadius:4,fontSize:12,fontFamily:"monospace",outline:"none"}}/>
          <button onClick={buy} style={{background:"#002a1a",border:`1px solid ${C.green}`,color:C.green,padding:"8px 18px",borderRadius:4,cursor:"pointer",fontSize:12,fontFamily:"monospace",fontWeight:700}}>↑ BUY</button>
          <button onClick={sell} style={{background:"#2a0010",border:`1px solid ${C.red}`,color:C.red,padding:"8px 18px",borderRadius:4,cursor:"pointer",fontSize:12,fontFamily:"monospace",fontWeight:700}}>↓ SELL ALL</button>
        </div>
        {currentSig&&<div style={{background:currentSig.includes("BUY")?"#001a0e":"#1a0008",border:`1px solid ${currentSig.includes("BUY")?C.green:C.red}33`,borderRadius:6,padding:"8px 12px",fontSize:11,color:currentSig.includes("BUY")?C.green:C.red,marginBottom:10}}>{currentSig.includes("BUY")?"⚡ Signal: BUY opportunity detected":"↓ Signal: Consider taking profits"}</div>}
        {wallet.trades.length>0&&<div>{wallet.trades.map((t,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10,borderBottom:`1px solid ${C.border}`,paddingBottom:5,marginBottom:5,gap:6,flexWrap:"wrap"}}>
            <span style={{color:t.type==="BUY"?C.green:C.red,fontWeight:700}}>{t.type}</span>
            <span style={{color:C.text}}>${fmt(t.amount)} @ ${fmt(t.price)}</span>
            <span style={{color:C.dim}}>{t.time}</span>
          </div>
        ))}</div>}
      </div>
    </div>
  );
}

// ─── Risk Management Panel (Pro) ──────────────────────────────────────────────
function RiskManagement({ last, atrVal, rsiVal, sig }) {
  const price = last?.close;
  const sl15 = price && atrVal ? +(price - 1.5*atrVal).toFixed(2) : null;
  const sl2  = price && atrVal ? +(price - 2.0*atrVal).toFixed(2) : null;
  const tp2  = price && atrVal ? +(price + 2.0*atrVal).toFixed(2) : null;
  const tp3  = price && atrVal ? +(price + 3.0*atrVal).toFixed(2) : null;
  const riskLevel = rsiVal > 70 ? "HIGH RISK" : rsiVal < 30 ? "OVERSOLD CAUTION" : sig === "STRONG BUY" ? "FAVORABLE" : "MODERATE";
  const riskColor = rsiVal > 70 ? C.red : rsiVal < 30 ? C.yellow : sig === "STRONG BUY" ? C.green : C.text;
  return (
    <div style={{background:C.panel,border:`1px solid ${C.purple}44`,borderRadius:8,marginBottom:12,overflow:"hidden"}}>
      <div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.purple,letterSpacing:2,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>
        <span>🛡 Risk Management Guidance</span><span style={{fontSize:9,color:C.dim}}>PRO FEATURE</span>
      </div>
      <div style={{padding:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 14px",background:C.bg,borderRadius:6,border:`1px solid ${riskColor}33`}}>
          <span style={{fontSize:20}}>{ riskLevel==="FAVORABLE"?"🟢":riskLevel==="HIGH RISK"?"🔴":"🟡"}</span>
          <div><div style={{fontSize:13,fontWeight:700,color:riskColor,fontFamily:"monospace"}}>{riskLevel}</div><div style={{fontSize:11,color:C.dim}}>Current market risk assessment</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            ["Conservative SL (1.5×ATR)", sl15?`$${fmt(sl15)}`:"—", C.red, "Tighter stop, less room"],
            ["Standard SL (2×ATR)",       sl2?`$${fmt(sl2)}`:"—",  C.red, "Recommended stop loss"],
            ["Target 1 (2×ATR)",          tp2?`$${fmt(tp2)}`:"—",  C.green, "First take profit level"],
            ["Target 2 (3×ATR)",          tp3?`$${fmt(tp3)}`:"—",  C.green, "Extended profit target"],
          ].map(([l,v,c,d])=>(
            <div key={l} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 12px"}}>
              <div style={{fontSize:9,color:C.dim,letterSpacing:1,marginBottom:4}}>{l}</div>
              <div style={{fontSize:16,fontFamily:"monospace",color:c,fontWeight:700}}>{v}</div>
              <div style={{fontSize:9,color:C.dim,marginTop:2}}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:11,color:C.dim,lineHeight:1.8,padding:"10px",background:C.bg,borderRadius:6}}>
          💡 <strong style={{color:C.text}}>Rule of thumb:</strong> Never risk more than 1–2% of your portfolio on a single trade. Position size = (Portfolio × Risk%) ÷ (Entry − Stop Loss)
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Signals Feed (Starter) ───────────────────────────────────────────
function WeeklySignals({ sig, coinLabel, price }) {
  const signals = [
    { time:"Today 09:41", pair:coinLabel, type:sig||"BUY", price:`$${fmt(price)}`, note:"EMA crossover confirmed" },
    { time:"Yesterday 14:22", pair:"ETH/USD", type:"SELL", price:"$3,421", note:"RSI overbought at 74" },
    { time:"May 28 11:05", pair:"SOL/USD", type:"STRONG BUY", price:"$168.40", note:"All 4 confluences met" },
    { time:"May 27 08:30", pair:"BTC/USD", type:"BUY", price:"$66,200", note:"MACD bullish crossover" },
    { time:"May 26 16:10", pair:"XRP/USD", type:"SELL", price:"$0.51", note:"Death cross formed" },
  ];
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:12,overflow:"hidden"}}>
      <div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,letterSpacing:2,textTransform:"uppercase",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>📡 Weekly Signals (5–10/week)</span>
        <span style={{fontSize:9,color:C.green}}>● LIVE</span>
      </div>
      <div style={{padding:14}}>
        {signals.map((s,i)=>{
          const sc=s.type==="STRONG BUY"?C.green:s.type==="BUY"?"#00cc66":C.red;
          return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<signals.length-1?`1px solid ${C.border}`:"none",flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:10,fontFamily:"monospace",padding:"2px 8px",borderRadius:3,background:sc+"22",border:`1px solid ${sc}44`,color:sc}}>{s.type}</span>
              <span style={{fontSize:12,color:C.text,fontWeight:600}}>{s.pair}</span>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,color:C.accent,fontFamily:"monospace"}}>{s.price}</div>
              <div style={{fontSize:10,color:C.dim}}>{s.note}</div>
              <div style={{fontSize:9,color:C.dim}}>{s.time}</div>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ tier, onLogout }) {
  const isPro = tier === "pro";
  const [coinIdx, setCoinIdx] = useState(0);
  const [daysIdx, setDaysIdx] = useState(2);
  const [computed, setComputed] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("—");
  const [updated, setUpdated] = useState(null);
  const [auto, setAuto] = useState(true);
  const timer = useRef(null);
  const coin = COINS[coinIdx], days = INTERVALS[daysIdx].days;

  const load = useCallback(async (c, d) => {
    setLoading(true);
    const [liveOHLC, liveTicker] = await Promise.all([tryFetchOHLC(c.id, d), tryFetchTicker(c.id)]);
    if (liveOHLC && liveOHLC.length >= 30) {
      setInfo(liveTicker); setComputed(buildComputed(liveOHLC)); setSource("CoinGecko Live");
    } else {
      const sim = simulateOHLC(c.seed, c.vol, 120);
      setInfo({ price:sim[sim.length-1].close, change24h:+(Math.random()*6-3).toFixed(2), high24h:+(sim[sim.length-1].close*1.02).toFixed(4), low24h:+(sim[sim.length-1].close*0.98).toFixed(4), vol24h:c.seed*80000, cap:c.seed*19000000 });
      setComputed(buildComputed(sim)); setSource("Simulated");
    }
    setUpdated(new Date().toLocaleTimeString()); setLoading(false);
  }, []);

  useEffect(() => { load(coin, days); }, [coin.id, days]);
  useEffect(() => { clearInterval(timer.current); if(auto) timer.current=setInterval(()=>load(coin,days),60000); return ()=>clearInterval(timer.current); }, [auto,coin.id,days]);

  const sl = computed?.chart?.slice(-80) ?? [];
  const { last, e9, e21, e200, rsiVal, atrVal, sig, hist } = computed ?? {};
  const trend = last && e200 ? (last.close > e200 ? "BULLISH" : "BEARISH") : null;
  const SL = last && atrVal ? +(last.close - 1.5*atrVal).toFixed(4) : null;
  const TP = last && atrVal ? +(last.close + 2.0*atrVal).toFixed(4) : null;
  const rc = rsiVal > 70 ? C.red : rsiVal < 30 ? C.green : C.accent;
  const sc = sig==="STRONG BUY"?C.green:sig==="BUY"?"#00cc66":sig==="SELL"?C.red:C.dim;
  const cc = info?.change24h >= 0 ? C.green : C.red;
  const isLive = source.includes("Live");
  const confidence = isPro && computed ? getConfidence(sig, rsiVal, hist, e9, e21) : null;

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"monospace",boxSizing:"border-box"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');`}</style>
      <nav style={{borderBottom:`1px solid ${C.border}`,background:"rgba(3,6,8,0.98)",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"'Syne',monospace",fontSize:15,fontWeight:800,color:C.accent}}>⬡ QUANTUM SIGNAL AI</div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:10,padding:"3px 10px",borderRadius:12,background:isPro?"#1a0a3a":"#001a2a",border:`1px solid ${isPro?C.purple:C.accent}44`,color:isPro?C.purple:C.accent}}>{isPro?"✦ PRO":"STARTER"}</span>
          <span style={{fontSize:10,color:isLive?C.green:C.yellow}}>{isLive?"● LIVE":"◐ SIM"} · {updated||"—"}</span>
          <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.dim,padding:"4px 10px",borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:"monospace"}}>← EXIT</button>
        </div>
      </nav>

      <div style={{padding:"16px 20px"}}>
        {/* Controls */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:C.accent}}>
              {coin.label}&nbsp;
              {info&&<span style={{color:C.text}}>${fmt(info.price)}</span>}
              {info&&<span style={{fontSize:13,color:cc,marginLeft:8}}>{fmtP(info.change24h)}</span>}
            </div>
            {info&&<div style={{fontSize:10,color:C.dim,marginTop:3}}>H: ${fmt(info.high24h)} · L: ${fmt(info.low24h)} · Vol: {fmtK(info.vol24h)}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
            <div style={{display:"flex",gap:5}}>{COINS.map((c,i)=><Pill key={c.id} active={coinIdx===i} onClick={()=>setCoinIdx(i)}>{c.label.split("/")[0]}</Pill>)}</div>
            <div style={{display:"flex",gap:5,alignItems:"center"}}>
              {INTERVALS.map((iv,i)=><Pill key={iv.label} active={daysIdx===i} onClick={()=>setDaysIdx(i)}>{iv.label}</Pill>)}
              {trend&&<span style={{fontSize:10,color:trend==="BULLISH"?C.green:C.red,border:"1px solid",borderColor:trend==="BULLISH"?C.green:C.red,padding:"4px 8px",borderRadius:3}}>{trend}</span>}
              <button onClick={()=>load(coin,days)} style={{background:C.panel,border:`1px solid ${C.border}`,color:C.accent,padding:"5px 10px",borderRadius:4,cursor:"pointer",fontSize:11}}>↻</button>
              <button onClick={()=>setAuto(a=>!a)} style={{background:auto?"#002a1a":C.panel,border:`1px solid ${auto?C.green:C.border}`,color:auto?C.green:C.dim,padding:"5px 10px",borderRadius:4,cursor:"pointer",fontSize:10}}>{auto?"● AUTO":"○ AUTO"}</button>
            </div>
          </div>
        </div>

        {loading && !computed && <div style={{textAlign:"center",color:C.accent,padding:40,fontSize:13}}>Loading…</div>}

        {computed && <>
          {/* Stat Cards */}
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <StatCard label="Signal"      value={sig||"NEUTRAL"}            accent={sc}       sub="Confluence" />
            <StatCard label="RSI (14)"    value={rsiVal ?? "—"}             accent={rc}       sub={rsiVal>70?"Overbought":rsiVal<30?"Oversold":"Neutral"} />
            <StatCard label="EMA 9/21"    value={e9>e21?"BULL ✕":"BEAR ✕"} accent={e9>e21?C.green:C.red} sub={`${fmt(e9,2)} / ${fmt(e21,2)}`} />
            <StatCard label="Stop Loss"   value={SL?`$${fmt(SL)}`:"—"}     accent={C.red}    sub="1.5 × ATR" />
            <StatCard label="Take Profit" value={TP?`$${fmt(TP)}`:"—"}     accent={C.green}  sub="2.0 × ATR" />
            <StatCard label="ATR (14)"    value={atrVal?`$${fmt(atrVal)}`:"—"} accent={C.yellow} sub="Volatility" />
          </div>

          {/* Pro-only features */}
          {isPro && <ConfidenceScore score={confidence} sig={sig} />}
          {isPro && <RiskManagement last={last} atrVal={atrVal} rsiVal={rsiVal} sig={sig} />}

          {/* Starter: weekly signals feed */}
          {!isPro && <WeeklySignals sig={sig} coinLabel={coin.label} price={last?.close} />}

          {/* Paper Trading (both tiers) */}
          <PaperTrading currentPrice={last?.close||0} currentSig={sig} coinLabel={coin.label} tier={tier} />

          {/* Price + EMA */}
          <Panel title={`Price + EMA — ${coin.label} · ${INTERVALS[daysIdx].label}`} right={<SigBadge type={sig} />}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={sl}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{fill:C.dim,fontSize:9}} interval="preserveStartEnd" />
                <YAxis domain={["auto","auto"]} tick={{fill:C.dim,fontSize:10}} width={80} tickFormatter={v=>`$${fmt(v)}`} />
                <Tooltip content={<TT />} />
                <Line dataKey="close" stroke={C.text}   dot={false} strokeWidth={1.5} name="Price" />
                <Line dataKey="e9"    stroke={C.accent} dot={false} strokeWidth={1} strokeDasharray="4 2" name="EMA9" />
                <Line dataKey="e21"   stroke={C.yellow} dot={false} strokeWidth={1} strokeDasharray="4 2" name="EMA21" />
                <Line dataKey="e50"   stroke={C.muted}  dot={false} strokeWidth={1} strokeDasharray="2 4" name="EMA50" />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          {/* RSI */}
          <Panel title="RSI (14) — Momentum">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={sl}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{fill:C.dim,fontSize:9}} interval="preserveStartEnd" />
                <YAxis domain={[0,100]} tick={{fill:C.dim,fontSize:10}} width={30} />
                <Tooltip content={<TT />} />
                <ReferenceLine y={70} stroke={C.red}   strokeDasharray="4 2" />
                <ReferenceLine y={30} stroke={C.green} strokeDasharray="4 2" />
                <Line dataKey="rsi" stroke={rc} dot={false} strokeWidth={2} name="RSI" />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          {/* MACD */}
          <Panel title="MACD — Momentum Confirmation">
            <ResponsiveContainer width="100%" height={85}>
              <BarChart data={sl}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{fill:C.dim,fontSize:9}} interval="preserveStartEnd" />
                <YAxis tick={{fill:C.dim,fontSize:9}} width={55} />
                <Tooltip content={<TT />} />
                <ReferenceLine y={0} stroke={C.border} />
                <Bar dataKey="hist" name="Histogram" shape={(props)=>{ const {x,y,width,height,value}=props; const h=Math.abs(height||0); return <rect x={x} y={value>=0?y:y+(height||0)} width={Math.max(width,1)} height={h} fill={value>=0?C.green:C.red} fillOpacity={0.8} />; }} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* Volume + OBV */}
          <Panel title="Volume + OBV — Smart Money">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <ResponsiveContainer width="100%" height={85}><BarChart data={sl}><XAxis hide /><YAxis tick={{fill:C.dim,fontSize:9}} width={40} /><Tooltip content={<TT />} /><Bar dataKey="volume" fill={C.muted} name="Volume" /></BarChart></ResponsiveContainer>
              <ResponsiveContainer width="100%" height={85}><LineChart data={sl}><XAxis hide /><YAxis tick={{fill:C.dim,fontSize:9}} width={55} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} /><Tooltip content={<TT />} /><Line dataKey="obv" stroke={C.accent} dot={false} strokeWidth={1.5} name="OBV" /></LineChart></ResponsiveContainer>
            </div>
          </Panel>
        </>}

        <div style={{fontSize:9,color:C.dim,textAlign:"center",marginTop:6,lineHeight:1.9}}>⚠ Educational only · Not financial advice · {isLive?"Live: CoinGecko":"Simulated data"}</div>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onEnter }) {
  const [loading, setLoading] = useState(null);

  const handleStripe = async (planName, amount) => {
    setLoading(planName);
    try {
      const stripe = window.Stripe(STRIPE_PK);
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price_data: { currency:"usd", product_data:{ name:`Quantum Signal AI — ${planName}`, description: planName==="Starter" ? "5–10 signals/week · Mobile alerts · Paper trading" : "Real-time signals · AI Confidence · Risk guidance · Paper trading" }, recurring:{interval:"month"}, unit_amount:amount }, quantity:1 }],
        mode:"subscription",
        successUrl: window.location.href + `?subscribed=${planName.toLowerCase()}`,
        cancelUrl: window.location.href,
      });
      if (error) { alert(error.message); setLoading(null); }
    } catch {
      onEnter(planName.toLowerCase());
      setLoading(null);
    }
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"monospace",color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes floatUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowBlue{0%,100%{box-shadow:0 0 20px #00d4ff22}50%{box-shadow:0 0 40px #00d4ff55}}
        @keyframes glowPurple{0%,100%{box-shadow:0 0 20px #a855f722}50%{box-shadow:0 0 50px #a855f755}}
        .plan-card:hover{transform:translateY(-4px);}
        .feat-card:hover{border-color:#00d4ff44!important;}
      `}</style>

      {/* Scanlines */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.012) 2px,rgba(0,212,255,0.012) 4px)"}} />

      {/* Nav */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,borderBottom:`1px solid ${C.border}`,background:"rgba(3,6,8,0.96)",backdropFilter:"blur(12px)",padding:"14px 40px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.accent,letterSpacing:-0.5}}>⬡ QUANTUM SIGNAL AI</div>
        <div style={{display:"flex",gap:20,alignItems:"center",fontSize:12,color:C.dim}}>
          {["Features","Pricing","Disclaimer"].map(l=><span key={l} style={{cursor:"pointer"}}>{l}</span>)}
          <button onClick={()=>handleStripe("Pro",14900)} style={{background:C.purple,color:"#fff",border:"none",padding:"8px 18px",borderRadius:4,cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:700,letterSpacing:1}}>GET PRO</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{paddingTop:140,paddingBottom:80,textAlign:"center",position:"relative",zIndex:1,animation:"floatUp 0.9s ease forwards"}}>
        <div style={{display:"inline-block",background:"#00d4ff11",border:`1px solid ${C.accent}44`,borderRadius:20,padding:"4px 16px",fontSize:10,color:C.accent,letterSpacing:3,marginBottom:24,animation:"pulse 3s infinite"}}>
          ● LIVE MARKET SIGNALS · AI-POWERED · 5 INDICATORS
        </div>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(34px,5.5vw,76px)",fontWeight:800,color:"#fff",lineHeight:1.05,marginBottom:20}}>
          Professional Trading Signals.<br/>
          <span style={{color:C.accent}}>Built for Every Market.</span>
        </h1>
        <p style={{fontSize:16,color:C.dim,maxWidth:560,margin:"0 auto 44px",lineHeight:1.75}}>
          From crypto to stocks, options to forex — Quantum Signal AI delivers real-time confluence signals powered by EMA, RSI, MACD, OBV & ATR with AI confidence scoring.
        </p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>handleStripe("Starter",4900)} style={{background:"transparent",color:C.accent,border:`2px solid ${C.accent}`,padding:"15px 32px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontSize:14,fontWeight:700,letterSpacing:1}}>START AT $49/MO</button>
          <button onClick={()=>handleStripe("Pro",14900)} style={{background:C.purple,color:"#fff",border:"none",padding:"15px 32px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontSize:14,fontWeight:700,letterSpacing:1,animation:"glowPurple 2.5s infinite"}}>GET PRO — $149/MO ✦</button>
        </div>
        <div style={{marginTop:16,fontSize:11,color:C.dim}}>Cancel anytime · No contracts · Educational use only · US-based</div>
      </div>

      {/* Features */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 40px 60px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:10,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Platform Features</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:"#fff"}}>Everything you need to read the market</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>
          {[
            {icon:"📈",title:"5-Indicator Engine",desc:"EMA crossovers, RSI, MACD, OBV & ATR combined into one powerful confluence signal."},
            {icon:"⚡",title:"Real-Time Signals",desc:"Pro members get signals the moment they fire. Starter gets 5–10 curated signals per week."},
            {icon:"🤖",title:"AI Confidence Score",desc:"Pro exclusive: AI scores each signal 0–100 based on indicator agreement strength."},
            {icon:"📱",title:"Mobile Alerts",desc:"Email, SMS & push notifications so you never miss a signal, wherever you are."},
            {icon:"💰",title:"Paper Trading",desc:"Both plans include a $10,000 virtual wallet to practice trading signals risk-free."},
            {icon:"🛡",title:"Risk Management",desc:"Pro includes stop loss guidance, take profit targets, and position sizing formulas."},
            {icon:"📊",title:"Multi-Market",desc:"Pro covers stocks, options, crypto & forex. Starter focuses on top 5 crypto pairs."},
            {icon:"🎯",title:"ATR-Based Targets",desc:"Stop loss at 1.5× ATR and take profit at 2× ATR auto-calculated for every signal."},
          ].map(f=>(
            <div key={f.title} className="feat-card" style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:"22px 20px",transition:"border-color 0.2s,transform 0.2s",cursor:"default"}}>
              <div style={{fontSize:26,marginBottom:10}}>{f.icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#fff",marginBottom:7}}>{f.title}</div>
              <div style={{fontSize:12,color:C.dim,lineHeight:1.65}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"0 40px 80px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:10,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Pricing</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:"#fff"}}>Choose your edge</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:24}}>

          {/* Starter */}
          <div className="plan-card" style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:16,padding:"36px 32px",transition:"transform 0.2s",animation:"glowBlue 4s infinite"}}>
            <div style={{fontSize:10,color:C.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>Starter</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:52,fontWeight:800,color:"#fff",lineHeight:1}}>$49</div>
            <div style={{color:C.dim,fontSize:13,marginBottom:28}}>/month · cancel anytime</div>
            {[
              "5–10 curated signals per week",
              "Email, SMS & push notifications",
              "Basic crypto dashboard (BTC, ETH, SOL, BNB, XRP)",
              "$10,000 paper trading wallet",
              "RSI, EMA, MACD indicators",
              "Stop loss & take profit levels",
              "Community Discord access",
            ].map(f=><div key={f} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:11}}><span style={{color:C.green,fontSize:14,flexShrink:0}}>✓</span><span style={{fontSize:12,color:C.text,lineHeight:1.5}}>{f}</span></div>)}
            <button onClick={()=>handleStripe("Starter",4900)} disabled={loading==="Starter"} style={{width:"100%",marginTop:24,background:"transparent",color:C.accent,border:`2px solid ${C.accent}`,padding:"14px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontSize:13,fontWeight:700,letterSpacing:1}}>
              {loading==="Starter"?"REDIRECTING…":"GET STARTED →"}
            </button>
          </div>

          {/* Pro */}
          <div className="plan-card" style={{background:"#0d0820",border:`2px solid ${C.purple}`,borderRadius:16,padding:"36px 32px",position:"relative",transition:"transform 0.2s",animation:"glowPurple 3s infinite"}}>
            <div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:C.purple,color:"#fff",fontSize:10,fontWeight:700,letterSpacing:2,padding:"4px 18px",borderRadius:20}}>MOST POPULAR</div>
            <div style={{fontSize:10,color:C.purple,letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>✦ Pro</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:52,fontWeight:800,color:"#fff",lineHeight:1}}>$149</div>
            <div style={{color:C.dim,fontSize:13,marginBottom:28}}>/month · cancel anytime</div>
            {[
              "Real-time signals as they fire",
              "AI Confidence Score (0–100) per signal",
              "Stocks, options, crypto & forex coverage",
              "Advanced risk management guidance",
              "Position sizing calculator",
              "$10,000 paper trading wallet",
              "All 5 indicators + confluence engine",
              "Priority email & chat support",
              "Early access to new features",
            ].map(f=><div key={f} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:11}}><span style={{color:C.purple,fontSize:14,flexShrink:0}}>✦</span><span style={{fontSize:12,color:C.text,lineHeight:1.5}}>{f}</span></div>)}
            <button onClick={()=>handleStripe("Pro",14900)} disabled={loading==="Pro"} style={{width:"100%",marginTop:24,background:C.purple,color:"#fff",border:"none",padding:"14px",borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontSize:13,fontWeight:700,letterSpacing:1}}>
              {loading==="Pro"?"REDIRECTING…":"GET PRO NOW →"}
            </button>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div style={{background:C.panel,borderTop:`1px solid ${C.border}`,padding:"40px",textAlign:"center"}}>
        <div style={{maxWidth:820,margin:"0 auto"}}>
          <div style={{fontSize:10,color:C.yellow,letterSpacing:3,marginBottom:12}}>⚠ IMPORTANT LEGAL DISCLAIMER</div>
          <p style={{fontSize:11,color:C.dim,lineHeight:1.85}}>
            Quantum Signal AI is a <strong style={{color:C.text}}>software tool for educational and informational purposes only</strong>. It does not constitute financial advice, investment advice, trading advice, or any recommendation to buy, sell, or hold any financial instrument including stocks, options, cryptocurrency, or foreign exchange. Quantum Signal AI LLC is <strong style={{color:C.text}}>not a registered investment advisor (RIA)</strong> under the Investment Advisers Act of 1940, nor a broker-dealer registered with FINRA or the SEC. Past signal performance does not guarantee future results. All trading involves substantial risk of loss. Cryptocurrency markets are highly volatile and unregulated. Options trading involves significant risk and is not suitable for all investors. By subscribing, you confirm you have read, understood, and agree to our <strong style={{color:C.text}}>Terms of Service</strong> and <strong style={{color:C.text}}>Privacy Policy</strong>, and that you are using this tool entirely at your own risk. Always consult a licensed financial advisor before making any investment decisions.
          </p>
          <div style={{marginTop:20,fontSize:10,color:C.dim}}>© 2025 Quantum Signal AI · United States · Educational use only · Not affiliated with any exchange or brokerage</div>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(() => {
    const q = window.location.search;
    if (q.includes("subscribed=pro")) return "pro";
    if (q.includes("subscribed=starter")) return "starter";
    return "landing";
  });

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  if (page === "pro")     return <Dashboard tier="pro"     onLogout={()=>setPage("landing")} />;
  if (page === "starter") return <Dashboard tier="starter" onLogout={()=>setPage("landing")} />;
  return <LandingPage onEnter={tier => setPage(tier)} />;
}
