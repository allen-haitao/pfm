import os
from http.server import BaseHTTPRequestHandler
from django.core.management import call_command
import json

class MigrateHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # We respond to GET requests, which will trigger migrations
        try:
            call_command('makemigrations')
            call_command('migrate')
            response = json.dumps({"message": "Migrations applied successfully!"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response)
        except Exception as e:
            error_message = json.dumps({"error": str(e)}).encode()
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(error_message)

# Vercel expects a handler callable, not a class, so we map it to a handler function
def handler(request, context=None):
    MigrateHandler(request)