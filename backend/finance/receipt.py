"""
File: receipt.py
Author: Haitao Wang
Date: 2024-09-05
Description: Integration of GPT-4o model for recognizing supermarket shopping tickets, classification and extraction of expenses
the process is moving to AWS Lamda, here only process the result
"""

import os
from typing import List, Dict
from pydantic import BaseModel, Field
import ast
from decimal import Decimal


# the  data models
class Address(BaseModel):
    name: str = Field(description="the name of person and organization")
    address_line: str = Field(
        description="the local delivery information such as street, building number, PO box, or apartment portion of a postal address"
    )
    city: str = Field(description="the city portion of the address")
    state_province_code: str = Field(description="the code for address US states")
    postal_code: int = Field(description="the postal code portion of the address")


class Product(BaseModel):
    product_description: str = Field(
        description="the description of the product or service"
    )
    count: int = Field(description="number of units bought for the product")
    unit_item_price: float = Field(description="price per unit")
    product_total_price: float = Field(
        description="the total price, which is number of units * unit_price"
    )
    category: str = Field(
        description="the category of the product based on its description"
    )


class TotalBill(BaseModel):
    total: float = Field(description="the total amount before tax and delivery charges")
    discount_amount: float = Field(
        description="discount amount is total cost * discount %"
    )
    tax_amount: float = Field(
        description="tax amount is tax_percentage * (total - discount_amount). If discount_amount is 0, then its tax_percentage * total"
    )
    delivery_charges: float = Field(description="the cost of shipping products")
    final_total: float = Field(
        description="the total price or balance after removing tax, adding delivery and tax from total"
    )
    category_subtotals: Dict[str, float] = Field(
        description="subtotals for each category"
    )  # New field for category subtotals


class Invoice(BaseModel):
    invoice_number: str = Field(
        description="extraction of relevant information from invoice"
    )
    billing_address: Address = Field(
        description="where the bill for a product or service is sent so it can be paid by the recipient"
    )
    product: List[Product] = Field(description="the details of bill")
    total_bill: TotalBill = Field(
        description="the details of total amount, discounts and tax"
    )


def dynamodb_to_python(data):
    """
    Recursively converting DynamoDB-formatted data to normal Python datatypes
    """
    if isinstance(data, dict):
        if "S" in data:
            return data["S"]  # String
        elif "N" in data:
            return float(data["N"])  # Number to float
        elif "M" in data:
            # Map: recursive processing, treats all child elements as normal Python types
            return {k: dynamodb_to_python(v) for k, v in data["M"].items()}
        elif "L" in data:
            # List: recursive processing, treats all child elements as normal Python types
            return [dynamodb_to_python(item) for item in data["L"]]
        elif "BOOL" in data:
            return data["BOOL"]  # Boolean
        elif "NULL" in data:
            return None  # Null
        else:
            raise TypeError(f"Invalidate Data: {data}")
    elif isinstance(data, list):
        # list
        return [dynamodb_to_python(item) for item in data]
    elif isinstance(data, Decimal):
        # Decimal
        return float(data)
    else:
        return data


def convert_dynamodb_item(item):
    """
    Recursively converting DynamoDB's Item data format to normal Python data types
    """
    return {k: dynamodb_to_python(v) for k, v in item.items()}


def convert_to_floats(data):
    """
    Recursively convert Decimal types in data to float types
    """
    if isinstance(data, list):
        return [convert_to_floats(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_to_floats(value) for key, value in data.items()}
    elif isinstance(data, Decimal):
        return float(data)  # Decimal to float
    else:
        return data


# convert data to object
def process_result(resultstr):
    # invoice_data = convert_dynamodb_item(resultstr)
    invoice_data = convert_to_floats(resultstr)
    invoice = Invoice(**invoice_data)

    return invoice
