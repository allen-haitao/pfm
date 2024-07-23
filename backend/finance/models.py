from django.db import models

# Create your models here.

class Users(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=64)
    email = models.CharField(max_length=120)
    password_hash = models.CharField(max_length=128)
    salt = models.CharField(max_length=128)
    create_time = models.DateTimeField(auto_now_add=True)

class Categories(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(Users, null=False, on_delete=models.DO_NOTHING, related_name="categories", db_constraint=False)
    name = models.CharField(max_length=10)
    create_time = models.DateTimeField(auto_now_add=True)

class Transactions(models.Model):
    TRANS_TYPES = (
        ('income', 'income'),
        ('expense', 'expense'),
    )
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(Users, null=False, on_delete=models.DO_NOTHING, related_name="user_transactions", db_constraint=False)
    types = models.CharField(max_length=10, choices= TRANS_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category_id = models.ForeignKey(Categories, null=False, on_delete=models.DO_NOTHING, related_name="transactions", db_constraint=False)
    occu_date= models.DateField(auto_now=False, auto_now_add=False)
    notes = models.TextField()
    create_time = models.DateTimeField(auto_now_add=True)

class budgets(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(Users, null=False, on_delete=models.DO_NOTHING, related_name="budgets", db_constraint=False)
    category_id = models.ForeignKey(Categories, null=False, on_delete=models.DO_NOTHING, related_name="budget_category", db_constraint=False)
    limits = models.DecimalField(max_digits=10, decimal_places=2)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    create_time = models.DateTimeField(auto_now_add=True)