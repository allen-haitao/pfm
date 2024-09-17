from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..serializers import TransactionSerializer, NotificationSerializer
from ..models import Transactions, Notification
from django.contrib.auth import get_user_model

# from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Sum, F, Func, Value
from decimal import Decimal

User = get_user_model()


class DashboardView(APIView):
    """
    Endpoint for retrieving dashboard data.
    """

    permission_classes = [IsAuthenticated]

    # @swagger_auto_schema(
    #    responses={
    #        200: openapi.Response("Dashboard data", TransactionSerializer(many=True))
    #    }
    # )
    def get(self, request):
        """
        Get dashboard data including total income, expenses, savings, and recent transactions.

        Request:
        - Authorization: Bearer <token>

        Response:
        - total_income: float
        - total_expenses: float
        - total_savings: float
        - recent_transactions: list of transaction objects
        """
        user = request.user
        total_income = Transactions.objects.filter(
            user_id=user.id, types="income"
        ).aggregate(Sum("amount"))["amount__sum"] or Decimal("0.0")
        total_expenses = Transactions.objects.filter(
            user_id=user.id, types="expense"
        ).aggregate(Sum("amount"))["amount__sum"] or Decimal("0.0")
        total_savings = total_income - total_expenses

        # recent_transactions = Transactions.objects.filter(user_id=user.id).order_by(
        #    "-occu_date"
        # )[:5]
        # recent_transactions_data = TransactionSerializer(
        #    recent_transactions, many=True
        # ).data

        notifications = Notification.objects.filter(user_id=user.id).order_by(
            "-create_time"
        )[:5]

        recent_tnotification = NotificationSerializer(notifications, many=True).data

        return Response(
            {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "total_savings": total_savings,
                # "recent_transactions": recent_transactions_data,
                "recent_notification": recent_tnotification,
            }
        )
