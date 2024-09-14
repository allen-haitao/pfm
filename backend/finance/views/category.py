from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from ..models import Categories
from ..serializers import CategorySerializer
from drf_yasg.utils import swagger_auto_schema


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing categories.
    """

    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Categories.objects.for_user(self.request.user)

    @swagger_auto_schema(
        operation_description="List user categories",
        responses={200: CategorySerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        """
        List all categories for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - list of category objects
        """
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create a new category",
        request_body=CategorySerializer,
        responses={201: CategorySerializer},
    )
    def create(self, request, *args, **kwargs):
        """
        Create a new category for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - name: str
        - category_type: str

        Response:
        - id: int
        - name: str
        - category_type: str
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )
        # return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Retrieve a specific category",
        responses={200: CategorySerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific category for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - id: int
        - name: str
        - category_type: str
        """
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Update a specific category",
        request_body=CategorySerializer,
        responses={200: CategorySerializer},
    )
    def update(self, request, *args, **kwargs):
        """
        Update a specific category for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - name: str
        - category_type: str

        Response:
        - id: int
        - name: str
        - category_type: str
        """
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Partially update a specific category",
        request_body=CategorySerializer,
        responses={200: CategorySerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update a specific category for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - name: str (optional)
        - category_type: str (optional)

        Response:
        - id: int
        - name: str
        - category_type: str
        """
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Delete a specific category",
        responses={204: "No Content"},
    )
    def destroy(self, request, *args, **kwargs):
        """
        Delete a specific category for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - 204 No Content
        """
        return super().destroy(request, *args, **kwargs)
