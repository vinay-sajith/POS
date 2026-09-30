from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [("admin", "Admin"), ("staff", "Staff")]
    role = models.CharField(max_length=10, choices=ROLES, default="staff")
    phone = models.CharField(max_length=20, blank=True)


class Supplier(models.Model):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    gstin = models.CharField(max_length=20, blank=True)

    def __str__(self): return self.name


class Product(models.Model):
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=40, unique=True)
    category = models.CharField(max_length=60, blank=True)
    size = models.CharField(max_length=20, blank=True)
    color = models.CharField(max_length=30, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=5)
    stock = models.IntegerField(default=0)
    supplier = models.ForeignKey(Supplier, null=True, blank=True, on_delete=models.SET_NULL)
    active = models.BooleanField(default=True)

    def __str__(self): return self.name


class Purchase(models.Model):
    """Stock-in from a supplier."""
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)


class Sale(models.Model):
    PAY = [("cash", "Cash"), ("card", "Card"), ("upi", "UPI")]
    invoice_no = models.CharField(max_length=20, blank=True)
    staff = models.ForeignKey(User, on_delete=models.PROTECT)
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=10, choices=PAY, default="cash")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: ordering = ["-id"]


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    name = models.CharField(max_length=150)
    qty = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)


class SaleReturn(models.Model):
    sale_item = models.ForeignKey(SaleItem, related_name="returns", on_delete=models.PROTECT)
    qty = models.PositiveIntegerField()
    refund = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reason = models.CharField(max_length=200, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: ordering = ["-id"]


class LedgerEntry(models.Model):
    TYPES = [("income", "Income"), ("expense", "Expense")]
    date = models.DateField(auto_now_add=True)
    type = models.CharField(max_length=10, choices=TYPES)
    category = models.CharField(max_length=30, default="other")  # sale / refund / purchase / other
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=200, blank=True)
    ref = models.CharField(max_length=30, blank=True)

    class Meta: ordering = ["-id"]
