"""
File: create_demo_data.py
Author: Haitao Wang
Date: 2024-09-18
Description: Cretae demo data, it will create two users and insert some random transactions and budgets records.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from finance.models import Categories, Transactions, Budgets
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = "Generate demo data for two users, including transactions and budgets for the past 3 months"

    def handle(self, *args, **kwargs):
        # Create two demo users
        users = []
        for i in range(1, 3):
            user, created = User.objects.get_or_create(
                username=f"demo_user{i}2", defaults={"email": f"demo{i}@example2.com"}
            )
            if created:
                user.set_password("password123")
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f"Demo user {i} created successfully")
                )
            users.append(user)

        # Create categories if they don't exist
        categories = [
            # Expenses
            {"name": "Rent/Mortgage", "category_type": "expense"},
            {"name": "Utilities (electricity, water, gas)", "category_type": "expense"},
            {"name": "House Maintenance", "category_type": "expense"},
            {"name": "Fuel", "category_type": "expense"},
            {"name": "Vehicle Maintenance", "category_type": "expense"},
            {"name": "Public Transportation", "category_type": "expense"},
            {"name": "Transportation Insurance", "category_type": "expense"},
            {"name": "Food", "category_type": "expense"},
            {"name": "Dining Out", "category_type": "expense"},
            {"name": "Healthcare", "category_type": "expense"},
            {"name": "Entertainment", "category_type": "expense"},
            {"name": "Clothing", "category_type": "expense"},
            {"name": "Haircuts", "category_type": "expense"},
            {"name": "Beauty Products", "category_type": "expense"},
            {"name": "Insurance", "category_type": "expense"},
            {"name": "Education", "category_type": "expense"},
            {"name": "Gifts", "category_type": "expense"},
            {"name": "Donations", "category_type": "expense"},
            {"name": "Miscellaneous", "category_type": "expense"},
            {"name": "Investment", "category_type": "expense"},
            # Income
            {"name": "Salary", "category_type": "income"},
            {"name": "Investment Income", "category_type": "income"},
            {"name": "Rental Income", "category_type": "income"},
            {"name": "IBusiness Income", "category_type": "income"},
            {"name": "Miscellaneous Income", "category_type": "income"},
        ]

        for category_data in categories:
            Categories.objects.get_or_create(
                name=category_data["name"], category_type=category_data["category_type"]
            )

        self.stdout.write(self.style.SUCCESS("Categories created successfully"))

        # Generate transactions and budgets for the last 3 months for each user
        today = timezone.now().date()
        start_date = today - timedelta(days=90)  # 3 months ago

        for user in users:
            for _ in range(30):  # Create 30 random transactions per user
                category = random.choice(Categories.objects.all())
                date = start_date + timedelta(
                    days=random.randint(0, 90)
                )  # Random date in the last 3 months
                amount = random.uniform(10.0, 500.0)
                Transactions.objects.create(
                    user=user,
                    types=category.category_type,
                    amount=amount,
                    category=category,
                    occu_date=date,
                    notes="test data",
                )

            # Create budgets for the user
            for category in Categories.objects.filter(category_type="expense"):
                Budgets.objects.create(
                    user=user,
                    category=category,
                    limits=random.uniform(500.0, 2000.0),
                    spent=random.uniform(0.0, 1500.0),
                    period_type="monthly",
                    month=8,
                    year=2024,
                )

        self.stdout.write(
            self.style.SUCCESS("Demo transactions and budgets created successfully")
        )
