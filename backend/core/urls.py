from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from . import views

r = DefaultRouter()
r.register("users", views.UserViewSet, "users")
r.register("suppliers", views.SupplierViewSet, "suppliers")
r.register("products", views.ProductViewSet, "products")
r.register("purchases", views.PurchaseViewSet, "purchases")
r.register("sales", views.SaleViewSet, "sales")
r.register("returns", views.ReturnViewSet, "returns")
r.register("ledger", views.LedgerViewSet, "ledger")

urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/me/", views.MeView.as_view()),
    path("reports/summary/", views.ReportView.as_view()),
    path("", include(r.urls)),
]
