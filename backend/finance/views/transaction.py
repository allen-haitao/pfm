from rest_framework import generics, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from ..models import Transactions, Categories, Budgets, Notification
from ..serializers import TransactionSerializer, CategorySerializer
from decimal import Decimal

# from drf_yasg.utils import swagger_auto_schema
# from drf_yasg import openapi
from PIL import Image
from io import BytesIO
import logging
from django.db.models import Sum, F, Func, Value
from ..receipt import process_img
import base64
import calendar


logger = logging.getLogger(__name__)


class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing transactions.
    """

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transactions.objects.filter(user_id=self.request.user.id).order_by(
            "-occu_date"
        )

    # @swagger_auto_schema(
    #    operation_description="List user transactions",
    #    responses={200: TransactionSerializer(many=True)},
    # )
    def list(self, request, *args, **kwargs):
        """
        List all transactions for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - list of transaction objects
        """
        return super().list(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Create a new transaction",
    #    request_body=TransactionSerializer,
    #    responses={201: TransactionSerializer},
    # )
    def create(self, request, *args, **kwargs):
        """
        Create a new transaction for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - type: str
        - amount: float
        - category: int (category ID)
        - date: str
        - notes: str (optional)

        Response:
        - id: int
        - type: str
        - amount: float
        - category: category object
        - date: str
        - notes: str
        """
        print("process add transaction")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = Categories.objects.get(id=request.data["category_id"])
        transaction = serializer.save(user=request.user, category=category)
        headers = self.get_success_headers(serializer.data)

        if transaction.types == "expense":
            transaction_date = transaction.occu_date
            transaction_month = transaction_date.month
            transaction_year = transaction_date.year
            try:
                # Find the corresponding budget
                budget = Budgets.objects.get(
                    category=transaction.category,
                    user=transaction.user,
                    month=transaction_month,
                    year=transaction_year,
                )
                # Update the spent value
                budget.spent += transaction.amount
                budget.save()
                # if spending is more than the budget, generate a notification
                per = budget.spent / budget.limits
                if per >= 1:
                    # warning
                    notification = Notification.objects.create(
                        user=request.user,
                        notify=f"{category.name} budget has been overspent for {calendar.month_name[budget.month]}. ",
                        types="warning",
                    )
                    notification.save()
                elif per >= 0.9:
                    # info
                    notification = Notification.objects.create(
                        user=request.user,
                        notify=f"{per*100}% of the {calendar.month_name[budget.month]} {category.name} budget has been spent. ",
                        types="info",
                    )
                    notification.save()
            except Budgets.DoesNotExist:
                print("no budget updated")
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )
        # return super().create(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    method="post",
    #    operation_description="Process a receipt image, extract transaction details, and return them.",
    #    manual_parameters=[
    #        openapi.Parameter(
    #            "image",
    #            openapi.IN_FORM,
    #            description="Upload a receipt image file",
    #            type=openapi.TYPE_FILE,
    #            required=True,
    #        ),
    #    ],
    #    responses={
    #        200: openapi.Response(
    #            description="Extracted transaction data from the receipt",
    #            examples={
    #                "application/json": {
    #                    "data": {
    #                        "items": [
    #                            {
    #                                "name": "Item 1",
    #                                "category": "Category A",
    #                                "amount": 9.99,
    #                            },
    #                           {
    #                                "name": "Item 2",
    #                                "category": "Category B",
    #                                "amount": 5.99,
    #                            },
    #                        ],
    #                        "total": 15.98,
    #                    }
    #                }
    #            },
    #        ),
    #        400: "Bad Request - No image uploaded",
    #        500: "Internal Server Error",
    #    },
    # )
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def process_receipt(self, request):
        """
        Process a receipt image, extract transaction details, and return them.

        Request:
        - Authorization: Bearer <token>
        - image: file (JPEG, PNG)

        Response:
        - 200: Extracted transaction data from the receipt
        - 400: Bad Request if no image is uploaded
        - 500: Internal Server Error if something goes wrong
        """
        print("Process Receipt endpoint hit")
        parser_classes = [MultiPartParser]
        try:
            image = request.FILES.get("image")
            if not image:
                return Response(
                    {"error": "No image uploaded."}, status=status.HTTP_400_BAD_REQUEST
                )

            # Convert the uploaded image to binary data
            image_data = Image.open(image)
            # resize the image to reduce consumption of token
            image_data.thumbnail((1024, 1024))
            buffered = BytesIO()
            image_data.save(buffered, format="JPEG")
            image_binary = buffered.getvalue()
            image_base64 = base64.b64encode(image_binary).decode("utf-8")

            # Call the OpenAI API with the image data
            extracted_data = process_img(image_base64)

            return Response({"data": extracted_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # @swagger_auto_schema(
    #    operation_description="Retrieve a specific transaction",
    #    responses={200: TransactionSerializer},
    # )
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific transaction for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - id: int
        - type: str
        - amount: float
        - category: category object
        - date: str
        - notes: str
        """
        return super().retrieve(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Update a specific transaction",
    #    request_body=TransactionSerializer,
    #    responses={200: TransactionSerializer},
    # )
    def update(self, request, *args, **kwargs):
        """
        Update a specific transaction for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - type: str
        - amount: float
        - category: int (category ID)
        - date: str
        - notes: str (optional)

        Response:
        - id: int
        - type: str
        - amount: float
        - category: category object
        - date: str
        - notes: str
        """
        return super().update(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Partially update a specific transaction",
    #    request_body=TransactionSerializer,
    #    responses={200: TransactionSerializer},
    # )
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update a specific transaction for the authenticated user.

        Request:
        - Authorization: Bearer <token>
        - type: str (optional)
        - amount: float (optional)
        - category: int (category ID, optional)
        - date: str (optional)
        - notes: str (optional)

        Response:
        - id: int
        - type: str
        - amount: float
        - category: category object
        - date: str
        - notes: str
        """
        return super().partial_update(request, *args, **kwargs)

    # @swagger_auto_schema(
    #    operation_description="Delete a specific transaction",
    #    responses={204: "No Content"},
    # )
    def destroy(self, request, *args, **kwargs):
        """
        Delete a specific transaction for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - 204 No Content
        """
        return super().destroy(request, *args, **kwargs)
