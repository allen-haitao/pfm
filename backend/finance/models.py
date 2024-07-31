from django.contrib.auth.models import AbstractUser
from django.db import models

#user management
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

#Category of transactions
class Categories(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, null=False, on_delete=models.CASCADE, related_name="categories", db_constraint=False)
    name = models.CharField(max_length=50)
    create_time = models.DateTimeField(auto_now_add=True)
  
#transaction
class Transactions(models.Model):
    TRANS_TYPES = (
        ('income', 'income'),
        ('expense', 'expense'),
    )
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, null=False, on_delete=models.DO_NOTHING, related_name="user_transactions", db_constraint=False)
    types = models.CharField(max_length=10, choices= TRANS_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Categories, null=False, on_delete=models.DO_NOTHING, related_name="transactions", db_constraint=False)
    occu_date= models.DateField(auto_now=False, auto_now_add=False)
    notes = models.TextField()
    create_time = models.DateTimeField(auto_now_add=True)

#budget
class Budgets(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, null=False, on_delete=models.DO_NOTHING, related_name="budgets", db_constraint=False)
    category = models.ForeignKey(Categories, null=False, on_delete=models.DO_NOTHING, related_name="budget_category", db_constraint=False)
    limits = models.DecimalField(max_digits=10, decimal_places=2)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    create_time = models.DateTimeField(auto_now_add=True)