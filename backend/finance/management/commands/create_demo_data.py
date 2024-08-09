from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from finance.models import Categories, Transactions, Budgets
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Generate demo data for two users, including transactions and budgets for the past 3 months'

    def handle(self, *args, **kwargs):
        # Create two demo users
        users = []
        for i in range(1, 3):
            user, created = User.objects.get_or_create(
                username=f'demo_user{i}',
                defaults={'email': f'demo_user{i}@example.com'}
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Demo user {i} created successfully'))
            users.append(user)

        # Create categories if they don't exist
        categories = [
            # Expenses
            {'name': 'Dining', 'category_type': 'expense'},
            {'name': 'Clothing', 'category_type': 'expense'},
            {'name': 'Beauty', 'category_type': 'expense'},
            {'name': 'Pets', 'category_type': 'expense'},
            {'name': 'Shopping', 'category_type': 'expense'},
            {'name': 'Travel', 'category_type': 'expense'},
            {'name': 'Recreation', 'category_type': 'expense'},
            {'name': 'Education', 'category_type': 'expense'},
            {'name': 'Utilities', 'category_type': 'expense'},
            {'name': 'Medical', 'category_type': 'expense'},
            {'name': 'Rent and Mortgate', 'category_type': 'expense'},
            {'name': 'Insurance', 'category_type': 'expense'},

            # Income
            {'name': 'Salary', 'category_type': 'income'},
            {'name': 'Investment Income', 'category_type': 'income'},
        ]

        for category_data in categories:
            Categories.objects.get_or_create(
                name=category_data['name'],
                category_type=category_data['category_type']
            )

        self.stdout.write(self.style.SUCCESS('Categories created successfully'))

        # Generate transactions and budgets for the last 3 months for each user
        today = timezone.now().date()
        start_date = today - timedelta(days=90)  # 3 months ago

        for user in users:
            for _ in range(30):  # Create 30 random transactions per user
                category = random.choice(Categories.objects.all())
                date = start_date + timedelta(days=random.randint(0, 90))  # Random date in the last 3 months
                amount = random.uniform(10.0, 500.0)
                Transactions.objects.create(
                    user=user,
                    types=category.category_type,
                    amount=amount,
                    category=category,
                    occu_date=date,
                    notes='This is a demo transaction'
                )

            # Create budgets for the user
            for category in Categories.objects.filter(category_type='expense'):
                Budgets.objects.create(
                    user=user,
                    category=category,
                    limits=random.uniform(500.0, 2000.0),
                    spent=random.uniform(0.0, 1500.0)
                )

        self.stdout.write(self.style.SUCCESS('Demo transactions and budgets created successfully'))