from django.core.management.base import BaseCommand
from finance.models import Categories

class Command(BaseCommand):
    help = 'Create default categories for expenses and income'

    def handle(self, *args, **kwargs):
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

        self.stdout.write(self.style.SUCCESS('Default categories created successfully'))