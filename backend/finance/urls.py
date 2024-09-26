"""
File: urls.py
Author: Haitao Wang
Date: 2024-09-18
Description: The URL patterns 
"""

from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    DashboardView,
    TransactionViewSet,
    BudgetViewSet,
    CategoryViewSet,
    ReportView,
    googlelogin,
)
from rest_framework import permissions, routers
from rest_framework_simplejwt.authentication import JWTAuthentication

# from drf_yasg.views import get_schema_view
# from drf_yasg import openapi
from finance import views

router = DefaultRouter()
router.register(r"transactions", TransactionViewSet, basename="transactions")
router.register(r"budgets", BudgetViewSet, basename="budgets")
router.register(r"categories", CategoryViewSet, basename="categories")

"""
schema_view = get_schema_view(
    openapi.Info(
        title="Personal Finance Manager API",
        default_version="V1",
        description="Welcome to Personal Finance Management",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=(JWTAuthentication,),
)
"""

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("profile/", ProfileView.as_view(), name="profile"),
    # re_path(
    #    "^swagger(?P<format>\.json|\.yaml)$",
    #    schema_view.without_ui(cache_timeout=0),
    #    name="schema-json",
    # ),
    # path(
    #    "doc/",
    #    schema_view.with_ui("swagger", cache_timeout=0),
    #    name="schema-swagger-ui",
    # ),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("reports/", ReportView.as_view(), name="reports"),
    # path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("google-login/", googlelogin.google_login, name="google-login"),
    path("", include(router.urls)),
]
