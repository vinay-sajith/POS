from datetime import timedelta
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import viewsets, filters, mixins, serializers
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, Supplier, Product, Purchase, Sale, SaleItem, SaleReturn, LedgerEntry
from .serializers import (UserSerializer, SupplierSerializer, ProductSerializer, PurchaseSerializer,
                          SaleSerializer, ReturnSerializer, LedgerSerializer)


class IsAdmin(BasePermission):
    def has_permission(self, r, v): return bool(r.user.is_authenticated and r.user.role == "admin")


class AdminWriteAuthRead(BasePermission):
    """Any logged-in user may read; only admin may write."""
    def has_permission(self, r, v):
        return bool(r.user.is_authenticated and (r.method in SAFE_METHODS or r.user.role == "admin"))


class MeView(APIView):
    def get(self, r): return Response(UserSerializer(r.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id"); serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter]; search_fields = ["username", "first_name"]

    def perform_destroy(self, o):
        if o == self.request.user: raise serializers.ValidationError("You cannot delete yourself")
        o.delete()


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("name"); serializer_class = SupplierSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter]; search_fields = ["name", "phone"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("supplier").order_by("name"); serializer_class = ProductSerializer
    permission_classes = [AdminWriteAuthRead]
    filter_backends = [filters.SearchFilter]; search_fields = ["name", "sku", "category", "color"]


class PurchaseViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Purchase.objects.select_related("product", "supplier").order_by("-id")
    serializer_class = PurchaseSerializer; permission_classes = [IsAdmin]


class SaleViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = SaleSerializer
    filter_backends = [filters.SearchFilter]; search_fields = ["invoice_no", "customer_name", "customer_phone"]

    def get_queryset(self):
        qs = Sale.objects.select_related("staff").prefetch_related("items")
        return qs if self.request.user.role == "admin" else qs.filter(staff=self.request.user)


class ReturnViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = SaleReturn.objects.select_related("sale_item__sale"); serializer_class = ReturnSerializer
    permission_classes = [IsAdmin]


class LedgerViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = LedgerSerializer; permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter]; search_fields = ["description", "category", "ref"]

    def get_queryset(self):
        qs = LedgerEntry.objects.all(); t = self.request.GET.get("type")
        return qs.filter(type=t) if t else qs


class ReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, r):
        today = timezone.localdate()
        start = parse_date(r.GET.get("from") or "") or today - timedelta(days=29)
        end = parse_date(r.GET.get("to") or "") or today
        sales = Sale.objects.filter(created_at__date__range=(start, end))
        agg = sales.aggregate(total=Sum("total"), count=Count("id"), tax=Sum("tax"))
        led = LedgerEntry.objects.filter(date__range=(start, end))
        s = lambda t: led.filter(type=t).aggregate(x=Sum("amount"))["x"] or 0
        income, expense = s("income"), s("expense")
        return Response({
            "from": start, "to": end,
            "sales_total": agg["total"] or 0, "sales_count": agg["count"], "tax_total": agg["tax"] or 0,
            "income": income, "expense": expense, "net": income - expense,
            "daily": list(sales.annotate(d=TruncDate("created_at")).values("d").annotate(total=Sum("total")).order_by("d")),
            "payments": list(sales.values("payment_method").annotate(total=Sum("total"))),
            "top_products": list(SaleItem.objects.filter(sale__in=sales).values("name")
                                 .annotate(qty=Sum("qty"), revenue=Sum("line_total")).order_by("-qty")[:5]),
            "low_stock": list(Product.objects.filter(active=True, stock__lte=5).values("name", "sku", "stock")),
        })
