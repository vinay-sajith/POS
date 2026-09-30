from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, F
from rest_framework import serializers
from .models import (User, Supplier, Product, Purchase, Sale, SaleItem, SaleReturn, LedgerEntry)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "phone", "role", "is_active", "password"]

    def create(self, d):
        pw = d.pop("password", "") or "changeme123"
        u = User(**d); u.set_password(pw); u.save(); return u

    def update(self, inst, d):
        pw = d.pop("password", "")
        for k, v in d.items(): setattr(inst, k, v)
        if pw: inst.set_password(pw)
        inst.save(); return inst


class SupplierSerializer(serializers.ModelSerializer):
    class Meta: model = Supplier; fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True, default="")

    class Meta: model = Product; fields = "__all__"


class PurchaseSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta: model = Purchase; fields = "__all__"

    @transaction.atomic
    def create(self, d):
        p = Purchase.objects.create(**d)
        prod = Product.objects.select_for_update().get(pk=d["product"].pk)
        prod.stock += d["qty"]; prod.cost = d["unit_cost"]; prod.save()
        LedgerEntry.objects.create(type="expense", category="purchase", amount=d["qty"] * d["unit_cost"],
                                   description=f"Stock in: {prod.name} x{d['qty']} from {d['supplier'].name}", ref=f"PUR-{p.pk}")
        return p


class SaleItemSerializer(serializers.ModelSerializer):
    returned_qty = serializers.SerializerMethodField()

    class Meta: model = SaleItem; exclude = ["sale"]

    def get_returned_qty(self, o): return o.returns.aggregate(s=Sum("qty"))["s"] or 0


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    cart = serializers.ListField(child=serializers.DictField(), write_only=True)
    staff_name = serializers.CharField(source="staff.username", read_only=True)

    class Meta:
        model = Sale
        fields = ["id", "invoice_no", "staff_name", "customer_name", "customer_phone", "subtotal", "discount",
                  "tax", "total", "payment_method", "created_at", "items", "cart"]
        read_only_fields = ["invoice_no", "subtotal", "tax", "total"]

    @transaction.atomic
    def create(self, d):
        cart = d.pop("cart")
        if not cart: raise serializers.ValidationError("Cart is empty")
        discount = d.get("discount") or Decimal("0")
        sale = Sale.objects.create(staff=self.context["request"].user, **d)
        sub = tax = Decimal("0")
        for c in cart:
            qty = int(c["qty"])
            try: p = Product.objects.select_for_update().get(pk=c["product"], active=True)
            except Product.DoesNotExist: raise serializers.ValidationError("Product not found")
            if qty < 1 or p.stock < qty:
                raise serializers.ValidationError(f"Insufficient stock for {p.name} (available {p.stock})")
            line = p.price * qty
            sub += line; tax += line * p.gst_percent / 100
            SaleItem.objects.create(sale=sale, product=p, name=p.name, qty=qty, price=p.price,
                                    gst_percent=p.gst_percent, line_total=line)
            p.stock -= qty; p.save()
        if discount > sub: raise serializers.ValidationError("Discount exceeds subtotal")
        sale.subtotal, sale.tax = sub, tax.quantize(Decimal("0.01"))
        sale.total = sub + sale.tax - discount
        sale.invoice_no = f"INV-{sale.pk:05d}"; sale.save()
        LedgerEntry.objects.create(type="income", category="sale", amount=sale.total,
                                   description=f"Sale {sale.invoice_no} ({sale.payment_method})", ref=sale.invoice_no)
        return sale


class ReturnSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="sale_item.name", read_only=True)
    invoice_no = serializers.CharField(source="sale_item.sale.invoice_no", read_only=True)

    class Meta:
        model = SaleReturn; fields = "__all__"; read_only_fields = ["refund", "processed_by"]

    @transaction.atomic
    def create(self, d):
        it = d["sale_item"]
        already = it.returns.aggregate(s=Sum("qty"))["s"] or 0
        if d["qty"] < 1 or d["qty"] > it.qty - already:
            raise serializers.ValidationError(f"Can return at most {it.qty - already} unit(s)")
        refund = (it.price * (1 + it.gst_percent / 100) * d["qty"]).quantize(Decimal("0.01"))
        r = SaleReturn.objects.create(refund=refund, processed_by=self.context["request"].user, **d)
        Product.objects.filter(pk=it.product_id).update(stock=F("stock") + d["qty"])
        LedgerEntry.objects.create(type="expense", category="refund", amount=refund,
                                   description=f"Return {it.sale.invoice_no}: {it.name} x{d['qty']}", ref=it.sale.invoice_no)
        return r


class LedgerSerializer(serializers.ModelSerializer):
    class Meta: model = LedgerEntry; fields = "__all__"
