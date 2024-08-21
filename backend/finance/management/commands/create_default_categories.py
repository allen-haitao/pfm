from django.core.management.base import BaseCommand
from finance.models import Categories

class Command(BaseCommand):
    help = 'Create default categories for expenses and income'

    def handle(self, *args, **kwargs):
        categories = [
            # Expenses
            {'name': 'Rent/Mortgage', 'category_type': 'expense'},
            {'name': 'Utilities (electricity, water, gas)', 'category_type': 'expense'},
            {'name': 'House Maintenance', 'category_type': 'expense'},
            {'name': 'Fuel', 'category_type': 'expense'},
            {'name': 'Vehicle Maintenance', 'category_type': 'expense'},
            {'name': 'Public Transportation', 'category_type': 'expense'},
            {'name': 'Transportation Insurance', 'category_type': 'expense'},
            {'name': 'Food', 'category_type': 'expense'},
            {'name': 'Dining Out', 'category_type': 'expense'},
            {'name': 'Healthcare', 'category_type': 'expense'},
            {'name': 'Entertainment', 'category_type': 'expense'},
            {'name': 'Clothing', 'category_type': 'expense'},
            {'name': 'Haircuts', 'category_type': 'expense'},
            {'name': 'Beauty Products', 'category_type': 'expense'},
            {'name': 'Insurance', 'category_type': 'expense'},
            {'name': 'Education', 'category_type': 'expense'},
            {'name': 'Gifts', 'category_type': 'expense'},
            {'name': 'Donations', 'category_type': 'expense'},
            {'name': 'Miscellaneous', 'category_type': 'expense'},
            {'name': 'Investment', 'category_type': 'expense'},

            # Income
            {'name': 'Salary', 'category_type': 'income'},
            {'name': 'Investment Income', 'category_type': 'income'},
            {'name': 'Rental Income', 'category_type': 'income'},
            {'name': 'IBusiness Income', 'category_type': 'income'},
            {'name': 'Miscellaneous Income', 'category_type': 'income'},
            
        ]

        for category_data in categories:
            Categories.objects.get_or_create(
                name=category_data['name'],
                category_type=category_data['category_type']
            )

        self.stdout.write(self.style.SUCCESS('Default categories created successfully'))