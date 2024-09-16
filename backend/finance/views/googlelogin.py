from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.conf import settings
from ..models import CustomUser


@api_view(["POST"])
def google_login(request):
    token = request.data.get("token")

    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )

        # Get the user's Google email and other info
        email = idinfo["email"]
        google_user_id = idinfo["sub"]

        # Create or get a user in your system
        user, created = CustomUser.objects.get_or_create(
            email=email, defaults={"username": email}
        )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError:
        return Response(
            {"error": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST
        )
