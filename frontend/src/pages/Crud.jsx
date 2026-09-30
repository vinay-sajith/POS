import { useEffect, useState } from 'react'
import api, { list, errText } from '../api'

export default function Crud({ title, endpoint, columns, fields, canAdd = true, canEdit = true, canDelete = true, extra }) {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)
  const [opts, setOpts] = useState({})
  const [err, setErr] = useState('')
  const load = () => list(endpoint, { search: q }).then(setRows)
  useEffect(() => { load() }, [q])
  useEffect(() => {
    fields.filter(f => f.optionsFrom).forEach(f => list(f.optionsFrom).then(o =>
      setOpts(p => ({ ...p, [f.key]: o.map(x => ({ value: x.id, label: x[f.optionLabel || 'name'] })) }))))
  }, [])
  const save = async e => {
    e.preventDefault(); setErr('')
    const body = {}
    fields.forEach(f => { const v = form[f.key]; if (v !== undefined && !(v === '' && f.type !== 'text')) body[f.key] = v })
    fields.filter(f => f.optionsFrom && form[f.key] === '').forEach(f => body[f.key] = null)
    try {
      form.id ? await api.patch(`${endpoint}${form.id}/`, body) : await api.post(endpoint, body)
      setForm(null); load()
    } catch (x) { setErr(errText(x)) }
  }
  const del = async r => {
    if (!confirm('Delete this record?')) return
    try { await api.delete(`${endpoint}${r.id}/`); load() } catch (x) { alert(errText(x)) }
  }
  const blank = () => Object.fromEntries(fields.map(f => [f.key, f.default ?? (f.type === 'checkbox' ? true : '')]))
  return (
    <div>
      <div className="bar"><h2>{title}</h2>
        <input className="search" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
        {canAdd && <button className="btn primary" onClick={() => { setErr(''); setForm(blank()) }}>+ Add</button>}
      </div>
      {extra}
      <table className="tbl"><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}{(canEdit || canDelete) && <th />}</tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}>
            {columns.map(c => <td key={c.key} data-label={c.label}>{c.render ? c.render(r) : r[c.key]}</td>)}
            {(canEdit || canDelete) && <td className="actions">
              {canEdit && <button className="btn sm" onClick={() => { setErr(''); setForm({ ...r, password: '' }) }}>Edit</button>}
              {canDelete && <button className="btn sm danger" onClick={() => del(r)}>Delete</button>}
            </td>}
          </tr>))}
          {!rows.length && <tr><td colSpan={columns.length + 1} className="muted">No records</td></tr>}
        </tbody></table>
      {form && <div className="modal" onClick={() => setForm(null)}>
        <form className="card modal-body" onClick={e => e.stopPropagation()} onSubmit={save}>
          <h3>{form.id ? 'Edit' : 'Add'} {title}</h3>
          {fields.map(f => (!f.hideOnEdit || !form.id) && (
            <label key={f.key}>{f.label}
              {f.type === 'select' ? (
                <select value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required}>
                  <option value="">— select —</option>
                  {(f.options || opts[f.key] || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <input type="checkbox" checked={!!form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.checked })} />
              ) : (
                <input type={f.type || 'text'} step="any" value={form[f.key] ?? ''} required={f.required}
                  placeholder={f.type === 'password' && form.id ? 'Leave blank to keep' : ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </label>))}
          {err && <div className="error">{err}</div>}
          <div className="row"><button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button><button className="btn primary">Save</button></div>
        </form></div>}
    </div>
  )
}
