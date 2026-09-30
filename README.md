# TexPOS – POS & Billing Software (Django REST Framework + React)

Textile/retail POS with an **Admin Portal**, a **Billing Portal** for staff, and a **mobile-layout Admin UI** (`/m`).

## Stack
- Backend: Django 5, Django REST Framework, SimpleJWT (auth), SQLite
- Frontend: React 18 + Vite, React Router, Axios
- Roles: `admin` (everything) and `staff` (billing + own sales only), enforced on the API

## Run locally (VS Code terminal)
### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py seed          # demo users + products
python manage.py runserver     # http://127.0.0.1:8000
```
### 2. Frontend (second terminal)
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

## URLs
- Admin Portal: `/admin` · Billing Portal: `/billing` · Mobile Admin UI: `/m`
- Django admin: `http://127.0.0.1:8000/admin/`

## Test credentials
| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |
| Staff | staff    | staff123 |

## Features
- Products CRUD (SKU, size, colour, GST %, stock, supplier)
- Staff management (create/edit/deactivate, role-based access)
- Suppliers + Stock-In (purchase) which raises stock and posts a ledger expense
- Billing: product search, cart, discount, cash/card/UPI, GST calc, printable bill; stock checked and deducted atomically
- Sales/Transactions list, and Returns (partial qty, refund incl. GST, stock restored, ledger expense)
- Ledger (auto entries for sales/refunds/purchases + manual income/expense) and Dashboard reports (sales, GST, net, daily chart, top products, payment split, low stock)

## Assumptions / limitations
- Prices are GST-exclusive; refunds return price + GST (discount not pro-rated)
- JWT access token lasts 1 day (no refresh flow); SQLite for simplicity
- Set `VITE_API_URL` in the frontend and restrict CORS/SECRET_KEY/DEBUG before production
