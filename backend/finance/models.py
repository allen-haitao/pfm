"""
File: models.py
Author: Haitao Wang
Date: 2024-08-13
Description: The models of the pfm.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta


# user management
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)


class CategoryManager(models.Manager):
    def for_user(self, user):
        """
        Return categories that are either global (user is null) or specific to the given user.
        """
        return self.filter(Q(user=user) | Q(user__isnull=True))


# Category of transactions
class Categories(models.Model):
    CATEGORY_TYPES = [
        ("income", "Income"),
        ("expense", "Expense"),
    ]
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        CustomUser,
        null=True,
        on_delete=models.CASCADE,
        related_name="categories",
        db_constraint=False,
    )
    name = models.CharField(max_length=50)
    create_time = models.DateTimeField(auto_now_add=True)
    category_type = models.CharField(max_length=7, choices=CATEGORY_TYPES)

    objects = CategoryManager()

    def __str__(self):
        return f"{self.name} ({self.get_category_type_display()})"


# transaction
class Transactions(models.Model):
    TRANS_TYPES = (
        ("income", "income"),
        ("expense", "expense"),
    )
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        CustomUser,
        null=False,
        on_delete=models.DO_NOTHING,
        related_name="user_transactions",
        db_constraint=False,
    )
    types = models.CharField(max_length=10, choices=TRANS_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(
        Categories,
        null=False,
        on_delete=models.DO_NOTHING,
        related_name="transactions",
        db_constraint=False,
    )
    occu_date = models.DateField(auto_now=False, auto_now_add=False)
    notes = models.TextField()
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.types} - {self.amount}"


# budget
class Budgets(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    category = models.ForeignKey(Categories, on_delete=models.CASCADE)
    limits = models.DecimalField(max_digits=10, decimal_places=2)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    period_type = models.CharField(
        max_length=10, choices=[("monthly", "Monthly"), ("yearly", "Yearly")]
    )
    month = models.PositiveIntegerField(
        null=True, blank=True
    )  # Optional, only needed for monthly budgets
    year = models.PositiveIntegerField()
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category.name} - {self.get_period_display()} {self.year}"

    def save(self, *args, **kwargs):
        # Calculate spent before saving the budget
        self.spent = self.calculate_spent()
        super().save(*args, **kwargs)

    def calculate_spent(self):
        # Get the base query for transactions
        transactions = Transactions.objects.filter(
            user=self.user, category=self.category, types="expense"
        )

        # Filter by the period type
        if self.period_type == "monthly":
            transactions = transactions.filter(
                occu_date__year=self.year, occu_date__month=self.month
            )
        elif self.period_type == "yearly":
            transactions = transactions.filter(occu_date__year=self.year)

        # Calculate the total spent amount
        total_spent = transactions.aggregate(Sum("amount"))["amount__sum"] or 0
        return total_spent


# notification
class Notification(models.Model):
    NOTIFY_LEVEL = (
        ("warning", "warning"),
        ("info", "info"),
    )
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    notify = models.TextField()
    types = models.CharField(max_length=10, choices=NOTIFY_LEVEL)
    create_time = models.DateTimeField(auto_now_add=True)
