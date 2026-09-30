from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . import models
admin.site.register(models.User, UserAdmin)
for m in (models.Supplier, models.Product, models.Purchase, models.Sale, models.SaleItem, models.SaleReturn, models.LedgerEntry):
    admin.site.register(m)
