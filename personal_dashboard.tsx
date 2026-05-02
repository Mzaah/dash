import { useState, useEffect } from "react";

const STORAGE_KEY = "liam_dashboard_v2";

const defaultData = {
  businesses: {
    drakenberg: { orders: 0, revenue: 0, costs: 0 },
    ines: { revenue: 0, costs: 0 }
  },
  portfolio: {
    holdings: [
      { name: "Latour B", shares: 0, price: 0 },
      { name: "Investor B", shares: 0, price: 0 },
      { name: "EUNL", shares: 0, price: 0 },
      { name: "Nvidia", shares: 0, price: 0 },
      { name: "Microsoft", shares: 0, price: 0 },
      { name: "Broadcom", shares: 0, price: 0 },
    ]
  },
  habits: {
    list: ["Träning", "Läsa 30 min", "Jobba på Drakenberg", "Jobba på Inés", "Cold shower"],
    log: {},
    streaks: {}
  },
  goals: [
    { label: "Inés intäkter (månad)", current: 0, target: 50000 },
    { label: "Drakenberg ordrar", current: 0, target: 100 },
    { label: "Portföljvärde (kkr)", current: 0, target: 500 }
  ]
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (!d.goals) d.goals = JSON.parse(JSON.stringify(defaultData.goals));
      if (!d.businesses.drakenberg.orders && d.businesses.drakenberg.units) {
        d.businesses.drakenberg.orders = d.businesses.drakenberg.units;
      }
      if (!d.businesses.ines.costs) d.businesses.ines.costs = 0;
      return d;
    }
  } catch {}
  return JSON.parse(JSON.stringify(defaultData));
}

function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

const today = new Date().toISOString().slice(0, 10);
const tabs = ["Businesses", "Portfolio", "Habits & Goals"];
const fmt = n => Number(n || 0).toLocaleString("sv-SE");
const fmtCur = n => Number(n || 0).toLocaleString("sv-SE", { maximumFractionDigits: 0 });

function MetricCard({ label, value, sub }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function NumInput({ value, onChange, label, min = 0, step = 1 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</label>}
      <input type="number" min={min} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", fontSize: 14 }} />
    </div>
  );
}

function BusinessTab({ data, setData }) {
  const d = data.businesses;
  const dr = d.drakenberg;
  const ins = d.ines;
  const drProfit = (dr.revenue || 0) - (dr.costs || 0);
  const insProfit = (ins.revenue || 0) - (ins.costs || 0);
  const totalRev = (dr.revenue || 0) + (ins.revenue || 0);
  const totalProfit = drProfit + insProfit;

  const setDr = (key, val) => { const u = { ...data, businesses: { ...d, drakenberg: { ...dr, [key]: val } } }; setData(u); saveData(u); };
  const setIns = (key, val) => { const u = { ...data, businesses: { ...d, ines: { ...ins, [key]: val } } }; setData(u); saveData(u); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <MetricCard label="Total intäkter" value={`${fmtCur(totalRev)} kr`} />
        <MetricCard label="Total vinst" value={`${fmtCur(totalProfit)} kr`} />
        <MetricCard label="Drakenberg vinst" value={`${fmtCur(drProfit)} kr`} />
        <MetricCard label="Inés vinst" value={`${fmtCur(insProfit)} kr`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Drakenberg</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <NumInput label="Ordrar" value={dr.orders} onChange={v => setDr("orders", v)} />
            <NumInput label="Intäkter (kr)" value={dr.revenue} onChange={v => setDr("revenue", v)} />
            <NumInput label="Kostnader (kr)" value={dr.costs} onChange={v => setDr("costs", v)} />
          </div>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>Inés</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 14 }}>ines.se — Dumpling Bags</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <NumInput label="Intäkter (kr)" value={ins.revenue} onChange={v => setIns("revenue", v)} />
            <NumInput label="Kostnader (kr)" value={ins.costs} onChange={v => setIns("costs", v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioTab({ data, setData }) {
  const holdings = data.portfolio.holdings;
  const total = holdings.reduce((s, h) => s + (h.shares || 0) * (h.price || 0), 0);
  const [newName, setNewName] = useState("");

  const setH = (i, key, val) => {
    const u = JSON.parse(JSON.stringify(data));
    u.portfolio.holdings[i][key] = Number(val);
    setData(u); saveData(u);
  };
  const removeH = i => {
    const u = JSON.parse(JSON.stringify(data));
    u.portfolio.holdings.splice(i, 1);
    setData(u); saveData(u);
  };
  const addH = () => {
    if (!newName.trim()) return;
    const u = JSON.parse(JSON.stringify(data));
    u.portfolio.holdings.push({ name: newName.trim(), shares: 0, price: 0 });
    setData(u); saveData(u);
    setNewName("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <MetricCard label="Portföljvärde" value={`${fmtCur(total)} kr`} />
        <MetricCard label="Innehav" value={holdings.length} />
      </div>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "28%" }} /><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /><col style={{ width: "20%" }} /><col style={{ width: "12%" }} /><col style={{ width: "4%" }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              {["Innehav","Antal","Kurs (kr)","Värde (kr)","Andel",""].map((h,i) => (
                <th key={i} style={{ padding: "10px 10px", textAlign: i === 0 ? "left" : "right", fontWeight: 500, color: "var(--color-text-secondary)", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const val = (h.shares || 0) * (h.price || 0);
              const pct = total > 0 ? (val / total * 100).toFixed(1) : "0.0";
              return (
                <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</td>
                  <td style={{ padding: "6px 6px" }}>
                    <input type="number" min="0" value={h.shares} onChange={e => setH(i,"shares",e.target.value)} style={{ width: "100%", textAlign: "right", fontSize: 13 }} />
                  </td>
                  <td style={{ padding: "6px 6px" }}>
                    <input type="number" min="0" step="0.01" value={h.price} onChange={e => setH(i,"price",e.target.value)} style={{ width: "100%", textAlign: "right", fontSize: 13 }} />
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmtCur(val)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, color: "var(--color-text-secondary)" }}>{pct}%</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>
                    <button onClick={() => removeH(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              <td colSpan={3} style={{ padding: "10px 10px", fontWeight: 500, fontSize: 13 }}>Totalt</td>
              <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 500 }}>{fmtCur(total)}</td>
              <td colSpan={2} style={{ padding: "10px 10px", textAlign: "right", fontSize: 12, color: "var(--color-text-secondary)" }}>100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addH()}
          placeholder="Lägg till innehav (t.ex. Apple)" style={{ flex: 1, fontSize: 14 }} />
        <button onClick={addH} style={{ padding: "0 16px", fontSize: 14 }}>+ Lägg till</button>
      </div>
    </div>
  );
}

const MONTH_NAMES = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAY_ABBR = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

function habitColor(ratio) {
  if (ratio === 0) return "var(--color-background-secondary)";
  if (ratio <= 0.25) return "#c6efce";
  if (ratio <= 0.5) return "#85c98a";
  if (ratio <= 0.75) return "#4aad52";
  return "#237a2b";
}

function HabitCalendar({ habits, log }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const totalDays = lastDay.getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--color-text-secondary)", padding: "0 4px" }}>‹</button>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--color-text-secondary)", padding: "0 4px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
        {DAY_ABBR.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--color-text-secondary)", paddingBottom: 2 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayLog = log[dateStr] || {};
          const done = habits.filter(h => dayLog[h]).length;
          const ratio = habits.length > 0 ? done / habits.length : 0;
          const isToday = dateStr === today;
          return (
            <div key={day} title={`${dateStr}: ${done}/${habits.length} habits`} style={{
              aspectRatio: "1", borderRadius: 3,
              background: habitColor(ratio),
              border: isToday ? "1.5px solid var(--color-text-primary)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: ratio > 0.5 ? "#fff" : "var(--color-text-secondary)", fontWeight: isToday ? 500 : 400
            }}>{day}</div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: habitColor(r), border: "0.5px solid var(--color-border-tertiary)" }} />
            <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{["0%","1–25%","26–50%","51–75%","76–100%"][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitsTab({ data, setData }) {
  const { list, log, streaks } = data.habits;
  const todayLog = log[today] || {};
  const goals = data.goals;
  const [editingGoal, setEditingGoal] = useState(null);
  const [newHabit, setNewHabit] = useState("");

  const toggle = habit => {
    const u = JSON.parse(JSON.stringify(data));
    const cur = u.habits.log[today] || {};
    cur[habit] = !cur[habit];
    u.habits.log[today] = cur;
    u.habits.streaks[habit] = cur[habit]
      ? (u.habits.streaks[habit] || 0) + 1
      : Math.max(0, (u.habits.streaks[habit] || 1) - 1);
    setData(u); saveData(u);
  };

  const removeHabit = habit => {
    const u = JSON.parse(JSON.stringify(data));
    u.habits.list = u.habits.list.filter(h => h !== habit);
    setData(u); saveData(u);
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const u = JSON.parse(JSON.stringify(data));
    u.habits.list.push(newHabit.trim());
    setData(u); saveData(u);
    setNewHabit("");
  };

  const setGoal = (i, key, val) => {
    const u = JSON.parse(JSON.stringify(data));
    if (key === "label") u.goals[i].label = val;
    else u.goals[i][key] = Number(val);
    setData(u); saveData(u);
  };

  const addGoal = () => {
    const u = JSON.parse(JSON.stringify(data));
    u.goals.push({ label: "Nytt mål", current: 0, target: 100 });
    setData(u); saveData(u);
  };

  const removeGoal = i => {
    const u = JSON.parse(JSON.stringify(data));
    u.goals.splice(i, 1);
    setData(u); saveData(u);
  };

  const doneCount = list.filter(h => todayLog[h]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <MetricCard label="Habits idag" value={`${doneCount}/${list.length}`} />
        <MetricCard label="Datum" value={today} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Habit tracker */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Dagliga habits</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map(h => {
              const done = !!todayLog[h];
              const streak = streaks[h] || 0;
              return (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div onClick={() => toggle(h)} style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${done ? "var(--color-text-primary)" : "var(--color-border-secondary)"}`, background: done ? "var(--color-text-primary)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    {done && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="var(--color-background-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span onClick={() => toggle(h)} style={{ fontSize: 14, flex: 1, textDecoration: done ? "line-through" : "none", color: done ? "var(--color-text-secondary)" : "var(--color-text-primary)", cursor: "pointer" }}>{h}</span>
                  {streak > 0 && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{streak}d</span>}
                  <button onClick={() => removeHabit(h)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14, padding: "0 2px", lineHeight: 1 }}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            <input value={newHabit} onChange={e => setNewHabit(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addHabit()}
              placeholder="Lägg till habit..." style={{ flex: 1, fontSize: 13 }} />
            <button onClick={addHabit} style={{ padding: "0 10px", fontSize: 13 }}>+</button>
          </div>
        </div>

        {/* Goals */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Mål</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {goals.map((g, i) => {
              const pct = g.target > 0 ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
              const editing = editingGoal === i;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    {editing
                      ? <input value={g.label} onChange={e => setGoal(i, "label", e.target.value)}
                          onBlur={() => setEditingGoal(null)} autoFocus
                          style={{ fontSize: 13, flex: 1, marginRight: 6 }} />
                      : <span style={{ fontSize: 13, cursor: "pointer", flex: 1 }} onClick={() => setEditingGoal(i)}>{g.label}</span>
                    }
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{fmt(g.current)}/{fmt(g.target)}</span>
                      <button onClick={() => removeGoal(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14, padding: "0 2px", lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                  <div style={{ height: 5, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-text-primary)", borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <NumInput label="Nu" value={g.current} onChange={v => setGoal(i,"current",v)} />
                    <NumInput label="Mål" value={g.target} onChange={v => setGoal(i,"target",v)} />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={addGoal} style={{ marginTop: 12, fontSize: 13, padding: "6px 12px", width: "100%" }}>+ Lägg till mål</button>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 14 }}>Habit-kalender</div>
        <HabitCalendar habits={list} log={log} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState(0);

  return (
    <div style={{ padding: "1.5rem 0", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Command center</div>
        <div style={{ fontSize: 22, fontWeight: 500 }}>Liam</div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: "8px 14px", fontSize: 14, background: "transparent", border: "none", borderBottom: tab === i ? "2px solid var(--color-text-primary)" : "2px solid transparent", color: tab === i ? "var(--color-text-primary)" : "var(--color-text-secondary)", cursor: "pointer", fontWeight: tab === i ? 500 : 400, marginBottom: -1 }}>{t}</button>
        ))}
      </div>
      {tab === 0 && <BusinessTab data={data} setData={setData} />}
      {tab === 1 && <PortfolioTab data={data} setData={setData} />}
      {tab === 2 && <HabitsTab data={data} setData={setData} />}
    </div>
  );
}
