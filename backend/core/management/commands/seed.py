from django.core.management.base import BaseCommand
from core.models import User, Supplier, Product


class Command(BaseCommand):
    help = "Create demo users, suppliers and products"

    def handle(self, *a, **o):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", password="admin123", role="admin", first_name="Store Admin")
        if not User.objects.filter(username="staff").exists():
            User.objects.create_user("staff", password="staff123", role="staff", first_name="Counter Staff")
        s1, _ = Supplier.objects.get_or_create(name="Surat Textiles", defaults={"phone": "9876500001", "gstin": "24AAAAA0000A1Z5"})
        s2, _ = Supplier.objects.get_or_create(name="Kannur Handloom Co.", defaults={"phone": "9876500002"})
        items = [("Cotton Shirt", "SH-001", "Shirts", "M", "White", 799, 450, 5, 40, s1),
                 ("Cotton Shirt", "SH-002", "Shirts", "L", "Blue", 799, 450, 5, 35, s1),
                 ("Denim Jeans", "JN-001", "Jeans", "32", "Indigo", 1499, 900, 12, 25, s1),
                 ("Kasavu Saree", "SR-001", "Sarees", "Free", "Cream", 2999, 1900, 5, 12, s2),
                 ("Cotton Kurta", "KU-001", "Kurtas", "M", "Green", 999, 600, 5, 30, s2),
                 ("Silk Dhoti", "DH-001", "Dhoti", "Free", "Gold", 1299, 800, 5, 4, s2),
                 ("T-Shirt", "TS-001", "T-Shirts", "L", "Black", 499, 250, 5, 60, s1),
                 ("Bedsheet Double", "BS-001", "Home", "Double", "Floral", 899, 500, 12, 18, s2)]
        for n, sku, cat, sz, col, pr, co, gst, st, sup in items:
            Product.objects.get_or_create(sku=sku, defaults=dict(name=n, category=cat, size=sz, color=col, price=pr,
                                          cost=co, gst_percent=gst, stock=st, supplier=sup))
        self.stdout.write(self.style.SUCCESS("Seeded. admin/admin123, staff/staff123"))
