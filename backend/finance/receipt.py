"""
File: receipt.py
Author: Haitao Wang
Date: 2024-09-18
Description: Integration of GPT-4o model for recognizing supermarket shopping tickets, classification and extraction of expenses
the process is moving to AWS Lamda, here only process the result
"""

import os
from typing import List, Dict
from pydantic import BaseModel, Field
import ast


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


def process_result(resultstr):
    invoice = Invoice(**resultstr)
    return invoice
