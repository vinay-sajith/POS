import { money } from '../api'

export default function Receipt({ sale }) {
  return (
    <div className="receipt">
      <h3 style={{ textAlign: 'center', margin: 0 }}>TexPOS Textiles</h3>
      <div className="muted small" style={{ textAlign: 'center' }}>Kannur, Kerala · GSTIN 32ABCDE1234F1Z5</div>
      <hr />
      <div className="small">Invoice: <b>{sale.invoice_no}</b><br />Date: {new Date(sale.created_at).toLocaleString('en-IN')}<br />
        Cashier: {sale.staff_name}{sale.customer_name && <><br />Customer: {sale.customer_name} {sale.customer_phone}</>}</div>
      <hr />
      <table className="rt"><tbody>
        {sale.items.map(i => <tr key={i.id}><td>{i.name}<br /><span className="muted small">{i.qty} × {money(i.price)} (GST {Number(i.gst_percent)}%)</span></td><td style={{ textAlign: 'right' }}>{money(i.line_total)}</td></tr>)}
      </tbody></table>
      <hr />
      <div className="rline"><span>Subtotal</span><span>{money(sale.subtotal)}</span></div>
      <div className="rline"><span>GST</span><span>{money(sale.tax)}</span></div>
      {Number(sale.discount) > 0 && <div className="rline"><span>Discount</span><span>-{money(sale.discount)}</span></div>}
      <div className="rline big"><span>TOTAL</span><span>{money(sale.total)}</span></div>
      <div className="rline"><span>Paid via</span><span>{sale.payment_method.toUpperCase()}</span></div>
      <hr /><div className="small" style={{ textAlign: 'center' }}>Thank you! Visit again.</div>
    </div>
  )
}
