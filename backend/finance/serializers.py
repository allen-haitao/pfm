from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Transactions, Budgets, Categories, Notification

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
        fields = ["id", "username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    old_password = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    new_password = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "new_password",
            "old_password",
        ]
        extra_kwargs = {"new_password": {"write_only": True, "required": False}}

    def validate(self, attrs):
        user = self.instance
        old_password = attrs.get("old_password")
        new_password = attrs.get("new_password")

        if new_password:
            if not old_password:
                raise serializers.ValidationError(
                    "Current password is required to set a new password."
                )
            if not user.check_password(old_password):
                raise serializers.ValidationError("Current password is incorrect.")

        return attrs

    def update(self, instance, validated_data):
        validated_data.pop("old_password", None)
        new_password = validated_data.pop("new_password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = ["id", "name", "user_id", "category_type"]
        read_only_fields = ["id"]


class BudgetSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Categories.objects.all(), write_only=True, source="category"
    )

    class Meta:
        model = Budgets
        fields = [
            "id",
            "category",
            "category_id",
            "limits",
            "spent",
            "period_type",
            "month",
            "year",
        ]
        read_only_fields = ["id", "category_id"]


class TransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Categories.objects.all(), write_only=True, source="category"
    )

    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        model = Transactions
        fields = [
            "id",
            "types",
            "amount",
            "category_id",
            "category",
            "occu_date",
            "notes",
        ]
        read_only_fields = ["id", "category_id"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "user_id", "notify", "types", "create_time"]
        read_only_fields = ["id"]
