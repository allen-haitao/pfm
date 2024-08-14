from rest_framework import generics, viewsets, mixins, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Sum
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .serializers import RegisterSerializer, UserSerializer, TransactionSerializer, BudgetSerializer, CategorySerializer
from .models import Transactions, Budgets, Categories
from decimal import Decimal
from django.utils import timezone

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    Endpoint for user registration.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    @swagger_auto_schema(
        operation_description="Register a new user",
        request_body=RegisterSerializer,
        responses={201: UserSerializer}
    )
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
        return super().post(request, *args, **kwargs)

class LoginView(generics.GenericAPIView):
    """
    Endpoint for user login.
    """
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    @swagger_auto_schema(request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email address'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password'),
        }
    ))
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
        email = request.data.get('email')
        password = request.data.get('password')
        user = User.objects.filter(email=email).first()

        if user is None or not user.check_password(password):
            return Response({"error": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint for retrieving and updating user profile.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    @swagger_auto_schema(
        operation_description="Retrieve user profile",
        responses={200: UserSerializer}
    )
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
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Update user profile",
        request_body=UserSerializer,
        responses={200: UserSerializer}
    )
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
        return super().update(request, *args, **kwargs)

class DashboardView(APIView):
    """
    Endpoint for retrieving dashboard data.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(responses={200: openapi.Response('Dashboard data', TransactionSerializer(many=True))})
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
        total_income = Transactions.objects.filter(user_id=user.id, types='income').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.0')
        total_expenses = Transactions.objects.filter(user_id=user.id, types='expense').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.0')
        total_savings = total_income - total_expenses

        recent_transactions = Transactions.objects.filter(user_id=user.id).order_by('occu_date')[:5]
        recent_transactions_data = TransactionSerializer(recent_transactions, many=True).data

        return Response({
            "total_income": total_income,
            "total_expenses": total_expenses,
            "total_savings": total_savings,
            "recent_transactions": recent_transactions_data
        })

class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing transactions.
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transactions.objects.filter(user_id=self.request.user.id)

    @swagger_auto_schema(
        operation_description="List user transactions",
        responses={200: TransactionSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        """
        List all transactions for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - list of transaction objects
        """
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create a new transaction",
        request_body=TransactionSerializer,
        responses={201: TransactionSerializer}
    )
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = Categories.objects.get(id=request.data['category_id'])
        transaction = serializer.save(user=request.user, category=category)
        headers = self.get_success_headers(serializer.data)

        if transaction.types == 'expense':
            now = timezone.now().date()
            try:
                # Find the corresponding budget
                budget = Budgets.objects.get(
                        category=transaction.category,
                        user=transaction.user,
                        start_date__lte=now,
                        end_date__gte=now
                    )
                # Update the spent value
                budget.spent += transaction.amount
                budget.save()
            except Budgets.DoesNotExist:
                print('no budget updated')
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        #return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Retrieve a specific transaction",
        responses={200: TransactionSerializer}
    )
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

    @swagger_auto_schema(
        operation_description="Update a specific transaction",
        request_body=TransactionSerializer,
        responses={200: TransactionSerializer}
    )
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

    @swagger_auto_schema(
        operation_description="Partially update a specific transaction",
        request_body=TransactionSerializer,
        responses={200: TransactionSerializer}
    )
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

    @swagger_auto_schema(
        operation_description="Delete a specific transaction",
        responses={204: 'No Content'}
    )
    def destroy(self, request, *args, **kwargs):
        """
        Delete a specific transaction for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - 204 No Content
        """
        return super().destroy(request, *args, **kwargs)

class BudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing budgets.
    """
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budgets.objects.filter(user_id=self.request.user.id)

    @swagger_auto_schema(
        operation_description="List user budgets",
        responses={200: BudgetSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        """
        List all budgets for the authenticated user.
        Request:
        - Authorization: Bearer <token>

        Response:
        - list of budget objects
        """
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
    operation_description="Create a new budget",
    request_body=BudgetSerializer,
    responses={201: BudgetSerializer}
    )
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
        category = Categories.objects.get(id=request.data['category_id'])
        serializer.save(user=request.user, category=category)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        #return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Retrieve a specific budget",
        responses={200: BudgetSerializer}
    )
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

    @swagger_auto_schema(
        operation_description="Update a specific budget",
        request_body=BudgetSerializer,
        responses={200: BudgetSerializer}
    )
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

    @swagger_auto_schema(
        operation_description="Partially update a specific budget",
        request_body=BudgetSerializer,
        responses={200: BudgetSerializer}
    )
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

    @swagger_auto_schema(
        operation_description="Delete a specific budget",
        responses={204: 'No Content'}
    )
    def destroy(self, request, *args, **kwargs):
        """
        Delete a specific budget for the authenticated user.

        Request:
        - Authorization: Bearer <token>

        Response:
        - 204 No Content
        """
        return super().destroy(request, *args, **kwargs)
    
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
        responses={200: CategorySerializer(many=True)}
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
        responses={201: CategorySerializer}
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
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        #return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Retrieve a specific category",
        responses={200: CategorySerializer}
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
        responses={200: CategorySerializer}
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
        responses={200: CategorySerializer}
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
        responses={204: 'No Content'}
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
    
class ReportView(APIView):
    """
    Endpoint for generating reports on income and expense trends, and expense categories.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Generate monthly income and expense trends and a pie chart report of the expense categories",
        responses={
            200: openapi.Response(
                description="Report data",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'income_trends': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'date__year': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'date__month': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'total': openapi.Schema(type=openapi.TYPE_STRING, format='decimal')
                                }
                            )
                        ),
                        'expense_trends': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'date__year': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'date__month': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'total': openapi.Schema(type=openapi.TYPE_STRING, format='decimal')
                                }
                            )
                        ),
                        'expense_categories': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'category__name': openapi.Schema(type=openapi.TYPE_STRING),
                                    'total': openapi.Schema(type=openapi.TYPE_STRING, format='decimal')
                                }
                            )
                        )
                    }
                )
            )
        }
    )
    def get(self, request):
        """
        Get monthly income and expense trends and a pie chart report of the expense categories.

        Request:
        - Authorization: Bearer <token>

        Response:
        - income_trends: list of monthly income data
        - expense_trends: list of monthly expense data
        - expense_categories: list of expense categories data for pie chart
        """
        user = request.user

        # Calculate income and expense trends
        income_trends = Transactions.objects.filter(user=user, types='income').values('occu_date').annotate(total=Sum('amount')).order_by('occu_date')
        expense_trends = Transactions.objects.filter(user=user, types='expense').values('occu_date').annotate(total=Sum('amount')).order_by('occu_date')

        # Calculate expense categories for pie chart
        expense_categories = Transactions.objects.filter(user=user, types='expense').values('category__name').annotate(total=Sum('amount')).order_by('category__name')

        return Response({
            "income_trends": list(income_trends),
            "expense_trends": list(expense_trends),
            "expense_categories": list(expense_categories)
        })