"""
File: middleware.py
Author: Haitao Wang
Date: 2024-09-18
Description: Middleware  for logging bad request
"""


class LogBadRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response.status_code == 404:
            print(f"404 Error: {request.path} not found.")
        return response
