import os
import json
import django
from django.core.management import call_command

# Initialize Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project_name.settings')  # Replace with your project settings
django.setup()

def handler(event, context):
    try:
        # Run Django migrations
        call_command('makemigrations', interactive=False)
        call_command('migrate', interactive=False)

        # Prepare a successful response
        response = {
            "statusCode": 200,
            "body": json.dumps({"message": "Migrations applied successfully!"}),
            "headers": {
                "Content-Type": "application/json"
            }
        }
    except Exception as e:
        # Handle any errors that occur during migration
        response = {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
            "headers": {
                "Content-Type": "application/json"
            }
        }
    return response