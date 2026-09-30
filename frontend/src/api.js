import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })
api.interceptors.request.use(c => {
  const t = localStorage.getItem('token'); if (t) c.headers.Authorization = 'Bearer ' + t; return c
})
export const list = async (url, params) => (await api.get(url, { params })).data
export const errText = e => {
  const d = e?.response?.data
  if (!d) return e.message
  if (typeof d === 'string') return 'Server error'
  return Object.entries(d).map(([k, v]) => `${k === 'non_field_errors' || k === 'detail' ? '' : k + ': '}${[].concat(v).join(' ')}`).join(' | ')
}
export const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export default api
