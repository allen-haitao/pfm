from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

#user management
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

class CategoryManager(models.Manager):
    def for_user(self, user):
        """
        Return categories that are either global (user is null) or specific to the given user.
        """
        return self.filter(Q(user=user) | Q(user__isnull=True))

#Category of transactions
class Categories(models.Model):
    CATEGORY_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, null=True, on_delete=models.CASCADE, related_name="categories", db_constraint=False)
    name = models.CharField(max_length=50)
    create_time = models.DateTimeField(auto_now_add=True)
    category_type = models.CharField(max_length=7, choices=CATEGORY_TYPES)

    objects = CategoryManager()

    def __str__(self):
        return f"{self.name} ({self.get_category_type_display()})"
  
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
    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
    ]
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, null=False, on_delete=models.DO_NOTHING, related_name="budgets", db_constraint=False)
    category = models.ForeignKey(Categories, null=False, on_delete=models.DO_NOTHING, related_name="budget_category", db_constraint=False)
    limits = models.DecimalField(max_digits=10, decimal_places=2)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    period_type = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='monthly')
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()
    create_time = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.end_date:
            if self.period_type == 'monthly':
                self.end_date = self.start_date + timedelta(days=30)
            elif self.period_type == 'quarterly':
                self.end_date = self.start_date + timedelta(days=90)
            elif self.period_type == 'annual':
                self.end_date = self.start_date + timedelta(days=365)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category.name} ({self.period_type.capitalize()} Budget)"
