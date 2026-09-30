import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { list, errText, money } from '../api'
import Receipt from './Receipt'

export default function Billing({ user, logout }) {
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [cart, setCart] = useState({})
  const [cust, setCust] = useState({ customer_name: '', customer_phone: '' })
  const [discount, setDiscount] = useState('')
  const [pay, setPay] = useState('cash')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)
  const load = () => list('/products/', { search: q }).then(setProducts)
  useEffect(() => { load() }, [q])

  const lines = useMemo(() => Object.values(cart), [cart])
  const sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0)
  const tax = lines.reduce((s, l) => s + l.p.price * l.qty * l.p.gst_percent / 100, 0)
  const disc = Number(discount) || 0
  const total = sub + tax - disc

  const add = p => {
    if (p.stock < 1) return
    setCart(c => ({ ...c, [p.id]: { p, qty: Math.min((c[p.id]?.qty || 0) + 1, p.stock) } }))
  }
  const setQty = (id, d) => setCart(c => {
    const l = c[id], qty = l.qty + d, n = { ...c }
    qty < 1 ? delete n[id] : n[id] = { ...l, qty: Math.min(qty, l.p.stock) }; return n
  })
  const checkout = async () => {
    setErr('')
    try {
      const { data } = await api.post('/sales/', { ...cust, discount: disc, payment_method: pay,
        cart: lines.map(l => ({ product: l.p.id, qty: l.qty })) })
      setDone(data); setCart({}); setDiscount(''); setCust({ customer_name: '', customer_phone: '' }); load()
    } catch (x) { setErr(errText(x)) }
  }
  return (
    <div className="bill">
      <header className="top"><b>🧵 TexPOS Billing</b><span className="grow" />
        {user.role === 'admin' && <Link to="/admin" className="btn sm">Admin</Link>}
        <span className="muted small">{user.username}</span><button className="btn sm" onClick={logout}>Logout</button></header>
      <div className="bill-grid">
        <section>
          <input className="search full" placeholder="Search product / SKU / category…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="pgrid">{products.filter(p => p.active).map(p => (
            <button key={p.id} className="pcard" disabled={p.stock < 1} onClick={() => add(p)}>
              <b>{p.name}</b><span className="muted small">{p.sku} · {p.size} · {p.color}</span>
              <span>{money(p.price)}</span><span className={p.stock <= 5 ? 'low small' : 'muted small'}>{p.stock < 1 ? 'Out of stock' : `Stock: ${p.stock}`}</span>
            </button>))}</div>
        </section>
        <aside className="card cart">
          <h3>Cart</h3>
          {!lines.length && <div className="muted">Tap a product to add</div>}
          {lines.map(l => <div key={l.p.id} className="cline"><span className="grow">{l.p.name}<br /><span className="muted small">{money(l.p.price)}</span></span>
            <button className="btn sm" onClick={() => setQty(l.p.id, -1)}>−</button><b>{l.qty}</b><button className="btn sm" onClick={() => setQty(l.p.id, 1)}>+</button></div>)}
          <hr />
          <input placeholder="Customer name (optional)" value={cust.customer_name} onChange={e => setCust({ ...cust, customer_name: e.target.value })} />
          <input placeholder="Phone (optional)" value={cust.customer_phone} onChange={e => setCust({ ...cust, customer_phone: e.target.value })} />
          <input type="number" placeholder="Discount ₹" value={discount} onChange={e => setDiscount(e.target.value)} />
          <div className="row">{['cash', 'card', 'upi'].map(m => <button key={m} className={'btn grow' + (pay === m ? ' primary' : '')} onClick={() => setPay(m)}>{m.toUpperCase()}</button>)}</div>
          <div className="rline"><span>Subtotal</span><span>{money(sub)}</span></div>
          <div className="rline"><span>GST</span><span>{money(tax)}</span></div>
          <div className="rline big"><span>Total</span><span>{money(total)}</span></div>
          {err && <div className="error">{err}</div>}
          <button className="btn primary" disabled={!lines.length} onClick={checkout}>Pay & Generate Bill</button>
        </aside>
      </div>
      {done && <div className="modal"><div className="card modal-body">
        <Receipt sale={done} />
        <div className="row no-print"><button className="btn grow" onClick={() => setDone(null)}>New Bill</button><button className="btn primary grow" onClick={() => window.print()}>🖨 Print</button></div>
      </div></div>}
    </div>
  )
}
