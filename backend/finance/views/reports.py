from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Sum

# from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import Transactions, Budgets
from django.utils import timezone
from django.db.models import Sum, F, Func, Value


class Year(Func):
    function = "EXTRACT"
    template = "%(function)s(YEAR FROM %(expressions)s)"


class Month(Func):
    function = "EXTRACT"
    template = "%(function)s(MONTH FROM %(expressions)s)"


class ReportView(APIView):
    """
    Endpoint for generating reports on income and expense trends, expense categories, and additional reports.
    """

    permission_classes = [IsAuthenticated]

    # "Generate monthly income and expense trends and a pie chart report of the expense categories",

    def get(self, request):
        """
        Get monthly income and expense trends, a pie chart report of the expense categories, and additional reports.

        Request:
        - Authorization: Bearer <token>

        Response:
        - income_trends: list of monthly income data
        - expense_trends: list of monthly expense data with category breakdown
        - expense_categories: list of expense categories data for pie chart
        - cash_flow: list of monthly cash flow data (income - expenses)
        - budget_vs_actual: comparison of budgeted vs. actual spending by category
        - year_end_summary: summary of total income, total expenses, and net savings for the year
        """
        user = request.user

        # Use the current year as the default
        year = request.query_params.get("year", timezone.now().year)
        month = request.query_params.get("month", None)

        # Calculate income and expense trends
        income_trends = (
            Transactions.objects.filter(user=user, types="income")
            .annotate(year=Year("occu_date"), month=Month("occu_date"))
            .values("year", "month")
            .annotate(total=Sum("amount"))
            .order_by("year", "month")
        )

        expense_trends = (
            Transactions.objects.filter(user=user, types="expense")
            .annotate(
                year=Year("occu_date"),
                month=Month("occu_date"),
                category_name=F("category__name"),
            )
            .values("year", "month", "category_name")
            .annotate(total=Sum("amount"))
            .order_by("year", "month", "category_name")
        )

        # Calculate expense categories for pie chart
        expense_categories = (
            Transactions.objects.filter(user=user, types="expense")
            .values("category__name")
            .annotate(total=Sum("amount"))
            .order_by("category__name")
        )

        # Calculate cash flow (income - expenses)
        cash_flow = []
        for income in income_trends:
            expense = next(
                (
                    exp
                    for exp in expense_trends
                    if exp["year"] == income["year"] and exp["month"] == income["month"]
                ),
                {"total": 0},
            )
            cash_flow.append(
                {
                    "year": income["year"],
                    "month": income["month"],
                    "income_total": income["total"],
                    "expense_total": expense["total"],
                    "cash_flow": float(income["total"]) - float(expense["total"]),
                }
            )

        # Budget vs. Actual (assuming Budget model exists and related to user and categories)
        budget_vs_actual = []
        budgets = Budgets.objects.filter(user=user)
        for budget in budgets:
            actual_spent = (
                Transactions.objects.filter(
                    user=user,
                    category=budget.category,
                    occu_date__year=budget.year,
                    occu_date__month=budget.month,
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )
            budget_vs_actual.append(
                {
                    "year": budget.year,
                    "month": budget.month,
                    "category__name": budget.category.name,
                    "budgeted_amount": budget.limits,
                    "actual_amount": actual_spent,
                }
            )

        # Year-End Financial Summary
        total_income = (
            Transactions.objects.filter(
                user=user, types="income", occu_date__year=year
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )
        total_expenses = (
            Transactions.objects.filter(
                user=user, types="expense", occu_date__year=year
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )
        net_savings = float(total_income) - float(total_expenses)

        year_end_summary = {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_savings": net_savings,
        }

        return Response(
            {
                "income_trends": list(income_trends),
                "expense_trends": list(expense_trends),
                "expense_categories": list(expense_categories),
                "cash_flow": cash_flow,
                "budget_vs_actual": budget_vs_actual,
                "year_end_summary": year_end_summary,
            }
        )
