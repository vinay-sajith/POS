import { NavLink, Routes, Route, Navigate, Link } from 'react-router-dom'
import Crud from './Crud'
import Dashboard from './Dashboard'
import Sales from './Sales'
import { money } from '../api'

const Products = () => <Crud title="Products" endpoint="/products/"
  columns={[{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'size', label: 'Size' },
  { key: 'price', label: 'Price', render: r => money(r.price) }, { key: 'gst_percent', label: 'GST%' },
  { key: 'stock', label: 'Stock', render: r => <span className={r.stock <= 5 ? 'low' : ''}>{r.stock}</span> }]}
  fields={[{ key: 'name', label: 'Name', required: true }, { key: 'sku', label: 'SKU', required: true }, { key: 'category', label: 'Category' },
  { key: 'size', label: 'Size' }, { key: 'color', label: 'Color' }, { key: 'price', label: 'Selling price', type: 'number', required: true },
  { key: 'cost', label: 'Cost price', type: 'number' }, { key: 'gst_percent', label: 'GST %', type: 'number', default: 5 },
  { key: 'stock', label: 'Opening stock', type: 'number', default: 0 }, { key: 'supplier', label: 'Supplier', type: 'select', optionsFrom: '/suppliers/' },
  { key: 'active', label: 'Active', type: 'checkbox' }]} />

const Suppliers = () => <Crud title="Suppliers" endpoint="/suppliers/"
  columns={[{ key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }, { key: 'gstin', label: 'GSTIN' }]}
  fields={[{ key: 'name', label: 'Name', required: true }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email', type: 'email' },
  { key: 'gstin', label: 'GSTIN' }, { key: 'address', label: 'Address' }]} />

const Staff = () => <Crud title="Staff" endpoint="/users/"
  columns={[{ key: 'username', label: 'Username' }, { key: 'first_name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'phone', label: 'Phone' },
  { key: 'is_active', label: 'Active', render: r => r.is_active ? 'Yes' : 'No' }]}
  fields={[{ key: 'username', label: 'Username', required: true }, { key: 'first_name', label: 'Full name' }, { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role', type: 'select', options: [{ value: 'staff', label: 'Staff (billing)' }, { value: 'admin', label: 'Admin' }], default: 'staff', required: true },
  { key: 'password', label: 'Password', type: 'password' }, { key: 'is_active', label: 'Active', type: 'checkbox' }]} />

const Purchases = () => <Crud title="Stock In" endpoint="/purchases/" canEdit={false} canDelete={false}
  columns={[{ key: 'date', label: 'Date' }, { key: 'supplier_name', label: 'Supplier' }, { key: 'product_name', label: 'Product' },
  { key: 'qty', label: 'Qty' }, { key: 'unit_cost', label: 'Unit cost', render: r => money(r.unit_cost) }]}
  fields={[{ key: 'supplier', label: 'Supplier', type: 'select', optionsFrom: '/suppliers/', required: true },
  { key: 'product', label: 'Product', type: 'select', optionsFrom: '/products/', required: true },
  { key: 'qty', label: 'Quantity', type: 'number', required: true }, { key: 'unit_cost', label: 'Unit cost', type: 'number', required: true }]} />

const Returns = () => <Crud title="Returns" endpoint="/returns/" canAdd={false} canEdit={false} canDelete={false}
  columns={[{ key: 'invoice_no', label: 'Invoice' }, { key: 'product_name', label: 'Product' }, { key: 'qty', label: 'Qty' },
  { key: 'refund', label: 'Refund', render: r => money(r.refund) }, { key: 'reason', label: 'Reason' },
  { key: 'created_at', label: 'Date', render: r => new Date(r.created_at).toLocaleDateString('en-IN') }]} fields={[]}
  extra={<div className="muted small">Returns are created from Transactions → View / Return.</div>} />

const Ledger = () => <Crud title="Ledger" endpoint="/ledger/" canEdit={false} canDelete={false}
  columns={[{ key: 'date', label: 'Date' }, { key: 'type', label: 'Type', render: r => <span className={r.type === 'income' ? 'in' : 'out'}>{r.type}</span> },
  { key: 'category', label: 'Category' }, { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount', render: r => money(r.amount) }]}
  fields={[{ key: 'type', label: 'Type', type: 'select', options: [{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }], required: true },
  { key: 'category', label: 'Category (rent, salary…)', default: 'other' }, { key: 'amount', label: 'Amount', type: 'number', required: true }, { key: 'description', label: 'Description' }]} />

const NAV = [['', '📊', 'Dashboard'], ['products', '👕', 'Products'], ['sales', '🧾', 'Sales'], ['returns', '↩️', 'Returns'],
['stock', '📦', 'Stock In'], ['suppliers', '🚚', 'Suppliers'], ['ledger', '📒', 'Ledger'], ['staff', '👥', 'Staff']]

export default function AdminShell({ base, user, logout }) {
  const mobile = base === '/m' || window.innerWidth < 760
  const body = (
    <div className={'admin' + (mobile ? ' mobile' : '')}>
      <header className="top"><b>🧵 TexPOS Admin</b><span className="grow" />
        <Link className="btn sm" to="/billing">Billing</Link>
        {base === '/admin' ? <Link className="btn sm" to="/m">📱</Link> : <Link className="btn sm" to="/admin">🖥</Link>}
        <button className="btn sm" onClick={logout}>Logout</button></header>
      <div className="shell">
        <nav>{NAV.map(([p, i, l]) => <NavLink key={p} end={p === ''} to={`${base}/${p}`}><span>{i}</span><small>{l}</small></NavLink>)}</nav>
        <main>
          <Routes>
            <Route index element={<Dashboard />} /><Route path="products" element={<Products />} /><Route path="sales" element={<Sales />} />
            <Route path="returns" element={<Returns />} /><Route path="stock" element={<Purchases />} /><Route path="suppliers" element={<Suppliers />} />
            <Route path="ledger" element={<Ledger />} /><Route path="staff" element={<Staff />} /><Route path="*" element={<Navigate to={base} />} />
          </Routes>
        </main>
      </div>
    </div>)
  return base === '/m' ? <div className="phone-bg"><div className="phone">{body}</div></div> : body
}
