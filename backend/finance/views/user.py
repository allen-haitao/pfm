from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..serializers import RegisterSerializer, UserSerializer, UserProfileSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

# from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for user registration.
    """

    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    # @swagger_auto_schema(
    #    operation_description="Register a new user",
    #    request_body=RegisterSerializer,
    #    responses={201: UserSerializer},
    # )
    def post(self, request, *args, **kwargs):
        """
        Register a new user.

        Request:
        - username: str
        - email: str
        - password: str

        Response:
        - id: int
        - username: str
        - email: str
        """
        logger.info("user register request")
        return super().post(request, *args, **kwargs)


class LoginView(generics.GenericAPIView):
    """
    Endpoint for user login.
    """

    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    """
    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "email": openapi.Schema(
                    type=openapi.TYPE_STRING, description="Email address"
                ),
                "password": openapi.Schema(
                    type=openapi.TYPE_STRING, description="Password"
                ),
            },
        )
    )
    """

    # @ratelimit(key='ip', rate='10/m', method='POST', block=True)  # Allow 5 attempts per minute
    def post(self, request, *args, **kwargs):
        """
        User login endpoint to obtain JWT tokens.

        Request:
        - email: str
        - password: str

        Response:
        - refresh: str (JWT refresh token)
        - access: str (JWT access token)
        """
        email = request.data.get("email")
        password = request.data.get("password")
        user = User.objects.filter(email=email).first()

        if user is None or not user.check_password(password):
            return Response({"error": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "username": user.username,
            }
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint for retrieving and updating user profile.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    # @swagger_auto_schema(
    #    operation_description="Retrieve user profile", responses={200: UserSerializer}
    # )
    def get(self, request, *args, **kwargs):
        """
        Retrieve the authenticated user's profile.

        Request:
        - Authorization: Bearer <token>

        Response:
        - id: int
        - username: str
        - email: str
        """
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

        # return super().retrieve(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Update user profile",
    #    request_body=UserSerializer,
    #    responses={200: UserSerializer},
    # )
    def put(self, request, *args, **kwargs):
        """
        Update the authenticated user's profile.

        Request:
        - Authorization: Bearer <token>
        - username: str
        - email: str
        - password: str (optional)

        Response:
        - id: int
        - username: str
        - email: str
        """
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
        # return super().update(request, *args, **kwargs)
