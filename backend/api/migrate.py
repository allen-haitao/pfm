import os
from django.core.management import call_command
from django.http import JsonResponse

def handler(request):
    try:
        call_command('makemigrations')
        call_command('migrate')
        return JsonResponse({"message": "Migrations applied successfully!"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)