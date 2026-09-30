import { useEffect, useState } from 'react'
import { list, money } from '../api'

export default function Dashboard() {
  const [r, setR] = useState(null)
  const [range, setRange] = useState({ from: '', to: '' })
  useEffect(() => { list('/reports/summary/', range).then(setR) }, [range])
  if (!r) return <div className="muted">Loading…</div>
  const max = Math.max(1, ...r.daily.map(d => Number(d.total)))
  return (
    <div>
      <div className="bar"><h2>Dashboard & Reports</h2>
        <input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} />
        <input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></div>
      <div className="muted small">{r.from} → {r.to} (default: last 30 days)</div>
      <div className="stats">
        <div className="card stat"><span>Sales</span><b>{money(r.sales_total)}</b><small>{r.sales_count} bills</small></div>
        <div className="card stat"><span>GST collected</span><b>{money(r.tax_total)}</b></div>
        <div className="card stat"><span>Income</span><b>{money(r.income)}</b></div>
        <div className="card stat"><span>Expense</span><b>{money(r.expense)}</b></div>
        <div className="card stat"><span>Net</span><b style={{ color: r.net < 0 ? '#dc2626' : '#16a34a' }}>{money(r.net)}</b></div>
      </div>
      <div className="card"><b>Daily sales</b><div className="chart">{r.daily.map(d => <div key={d.d} className="barcol" title={`${d.d}: ${money(d.total)}`}>
        <div style={{ height: `${(Number(d.total) / max) * 100}%` }} /><small>{d.d.slice(5)}</small></div>)}{!r.daily.length && <span className="muted">No sales in range</span>}</div></div>
      <div className="two">
        <div className="card"><b>Top products</b>{r.top_products.map(t => <div key={t.name} className="rline"><span>{t.name} ×{t.qty}</span><span>{money(t.revenue)}</span></div>)}</div>
        <div className="card"><b>Payment methods</b>{r.payments.map(t => <div key={t.payment_method} className="rline"><span>{t.payment_method}</span><span>{money(t.total)}</span></div>)}</div>
        <div className="card"><b>Low stock (≤5)</b>{r.low_stock.map(t => <div key={t.sku} className="rline"><span>{t.name} ({t.sku})</span><span className="low">{t.stock}</span></div>)}{!r.low_stock.length && <div className="muted">All good</div>}</div>
      </div>
    </div>
  )
}
