"""
File: budget.py
Author: Haitao Wang
Date: 2024-09-01
Description: Budget view
"""

from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from ..models import Transactions, Categories, Budgets
from ..serializers import BudgetSerializer

# from drf_yasg.utils import swagger_auto_schema


class BudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing budgets.
    """

    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budgets.objects.filter(user_id=self.request.user.id).order_by(
            "-year", "-month"
        )

    # @swagger_auto_schema(
    #    operation_description="List user budgets",
    #    responses={200: BudgetSerializer(many=True)},
    # )
    def list(self, request, *args, **kwargs):
        """
        List all budgets for the authenticated user.
        Request:
        - Authorization: Bearer <token>

        Response:
        - list of budget objects
        """
        return super().list(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Create a new budget",
    #    request_body=BudgetSerializer,
    #    responses={201: BudgetSerializer},
    # )
    def create(self, request, *args, **kwargs):
        """
        Create a new budget for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - category: int (category ID)
        - limit: float
        - spent: float

        Response:
        - id: int
        - category: category object
        - limit: float
        - spent: float
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = Categories.objects.get(id=request.data["category_id"])
        serializer.save(user=request.user, category=category)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )
        # return super().create(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Retrieve a specific budget",
    #    responses={200: BudgetSerializer},
    # )
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific budget for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - id: int
        - category: category object
        - limit: float
        - spent: float
        """
        return super().retrieve(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Update a specific budget",
    #    request_body=BudgetSerializer,
    #    responses={200: BudgetSerializer},
    # )
    def update(self, request, *args, **kwargs):
        """
        Update a specific budget for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - category: int (category ID)
        - limit: float
        - spent: float

        Response:
        - id: int
        - category: category object
        - limit: float
        - spent: float
        """

        return super().update(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Partially update a specific budget",
    #    request_body=BudgetSerializer,
    #    responses={200: BudgetSerializer},
    # )
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update a specific budget for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - category: int (category ID, optional)
        - limit: float (optional)
        - spent: float (optional)

        Response:
        - id: int
        - category: category object
        - limit: float
        - spent: float
        """
        return super().partial_update(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Delete a specific budget", responses={204: "No Content"}
    # )
    def destroy(self, request, *args, **kwargs):
        """
        Delete a specific budget for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - 204 No Content
        """
        return super().destroy(request, *args, **kwargs)
