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
        fields = ['id', 'name','category_type']
        read_only_fields = ['id']

class BudgetSerializer(serializers.ModelSerializer):
    #category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Categories.objects.all(),
        write_only=True,
        source='category'
    )
    class Meta:
        model = Budgets
        fields = ['id', 'category_id', 'limits', 'spent']
        read_only_fields = ['id', 'category']

class TransactionSerializer(serializers.ModelSerializer):
    #category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Categories.objects.all(),
        write_only=True,
        source='category'
    )

    amount = serializers.DecimalField(max_digits=10, decimal_places=2) 

    class Meta:
        model = Transactions
        fields = ['id', 'types', 'amount', 'category_id', 'occu_date', 'notes']
        read_only_fields = ['id', 'category']