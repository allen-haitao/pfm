"""
File: transaction.py
Author: Haitao Wang
Date: 2024-09-18
Description: The transactions view
"""

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
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import logging
from django.db.models import Sum, F, Func, Value
from ..receipt import process_img
import base64
import calendar
import uuid  # 用于生成唯一任务ID
import boto3
import json

logger = logging.getLogger(__name__)

# 初始化 AWS Lambda 和 DynamoDB 客户端
lambda_client = boto3.client("lambda", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("ReceiptTasks")


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
        Process a receipt image, extract transaction details, and return a task ID.
        """
        parser_classes = [MultiPartParser]
        try:
            image = request.FILES.get("image")
            if not image:
                return Response(
                    {"error": "No image uploaded."}, status=status.HTTP_400_BAD_REQUEST
                )

            if image.size > 5 * 1024 * 1024:  # 限制大小为 5MB
                return Response(
                    {"error": "Image size exceeds the allowed limit of 5MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                image_data = Image.open(image)
                image_data.verify()  # 验证图片文件是否有效
            except UnidentifiedImageError:
                return Response(
                    {"error": "Uploaded file is not a valid image."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 将上传的图像转换为二进制数据
            image_data = Image.open(image)  # 重新打开，因为 verify() 会破坏图像数据
            image_data.thumbnail((1024, 1024))  # 调整大小以减少数据量
            buffered = BytesIO()
            image_data.save(buffered, format="JPEG")
            image_binary = buffered.getvalue()
            image_base64 = base64.b64encode(image_binary).decode("utf-8")

            # 生成唯一任务ID
            task_id = str(uuid.uuid4())

            # 将任务数据传递给 Lambda
            lambda_payload = {
                "task_id": task_id,
                "image_data": image_base64,
            }

            response = lambda_client.invoke(
                FunctionName="pfm_process_image",
                InvocationType="Event",  # 异步调用
                Payload=json.dumps(lambda_payload),
            )

            # 将任务状态存储在 DynamoDB 中
            table.put_item(
                Item={"task_id": task_id, "status": "submitted", "result": None}
            )

            return Response({"task_id": task_id}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing receipt: {e}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def check_task_status(self, request, pk=None):
        """
        Function:
        Check the status and result of a specific task.
        """
        try:
            task_id = pk
            response = table.get_item(Key={"task_id": task_id})
            if "Item" not in response:
                return Response(
                    {"error": "Task not found."}, status=status.HTTP_404_NOT_FOUND
                )

            task_status = response["Item"]["status"]
            task_result = response["Item"].get("result")

            return Response(
                {"task_id": task_id, "status": task_status, "result": task_result},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error checking task status: {e}")
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
