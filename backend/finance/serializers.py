from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Transactions, Budgets, Categories

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user.

    Fields:
        id (int): Unique identifier for the user.
        name (str): Name of the user.
        email (str): The email of user.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = ['id', 'name']

class BudgetSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    class Meta:
        model = Budgets
        fields = ['id', 'category', 'limits', 'spent']

class TransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    class Meta:
        model = Transactions
        fields = ['id', 'types', 'amount', 'category', 'occu_date', 'notes']