import { useEffect, useState } from 'react'
import api, { list, errText, money } from '../api'
import Receipt from './Receipt'

export default function Sales() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [msg, setMsg] = useState('')
  const load = () => list('/sales/', { search: q }).then(setRows)
  useEffect(() => { load() }, [q])
  const open = id => api.get(`/sales/${id}/`).then(r => setSel(r.data))
  const doReturn = async it => {
    const qty = prompt(`Return quantity for ${it.name} (max ${it.qty - it.returned_qty})`, '1'); if (!qty) return
    const reason = prompt('Reason for return', 'Size / defect') || ''
    try { await api.post('/returns/', { sale_item: it.id, qty: Number(qty), reason }); setMsg('Return processed, stock restored'); open(sel.id); load() }
    catch (x) { setMsg(errText(x)) }
  }
  return (
    <div>
      <div className="bar"><h2>Transactions</h2><input className="search" placeholder="Invoice / customer…" value={q} onChange={e => setQ(e.target.value)} /></div>
      <table className="tbl"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Staff</th><th>Pay</th><th>Total</th><th /></tr></thead>
        <tbody>{rows.map(s => <tr key={s.id}>
          <td data-label="Invoice">{s.invoice_no}</td><td data-label="Date">{new Date(s.created_at).toLocaleString('en-IN')}</td>
          <td data-label="Customer">{s.customer_name || '-'}</td><td data-label="Staff">{s.staff_name}</td>
          <td data-label="Pay">{s.payment_method}</td><td data-label="Total">{money(s.total)}</td>
          <td className="actions"><button className="btn sm" onClick={() => { setMsg(''); open(s.id) }}>View / Return</button></td></tr>)}
          {!rows.length && <tr><td colSpan="7" className="muted">No sales yet</td></tr>}</tbody></table>
      {sel && <div className="modal"><div className="card modal-body">
        <Receipt sale={sel} />
        <div className="no-print">
          <b>Returns</b>
          {sel.items.map(i => <div key={i.id} className="cline"><span className="grow">{i.name} ({i.qty} sold, {i.returned_qty} returned)</span>
            <button className="btn sm" disabled={i.returned_qty >= i.qty} onClick={() => doReturn(i)}>Return</button></div>)}
          {msg && <div className="error">{msg}</div>}
          <div className="row"><button className="btn grow" onClick={() => setSel(null)}>Close</button><button className="btn primary grow" onClick={() => window.print()}>🖨 Print</button></div>
        </div></div></div>}
    </div>
  )
}
