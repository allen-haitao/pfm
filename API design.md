```

1.	User Management:
	•	Register User: POST /api/register
	            Purpose: Allows a new user to create an account.
                    Request: { "username": "test", "email": "test@example.com", "password": "password123" }
                    Response: 201 Created or 400 Bad Request
	•	Login User: POST /api/login
	            Purpose: Allows an existing user to log in.
                    Request: { "email": "test@example.com", "password": "password123" }.
                    Response: 200 OK or 401 Unauthorized.
	•	Get User Profile: GET /api/profile
                    Purpose: Retrieves the profile information of the logged-in user.
                    Request Header: Authorization: Bearer <jwt_token>
                    Response: 200 OK or 401 Unauthorized
	•	Update User Profile: PUT /api/profile
                    Purpose: Allows the logged-in user to update their profile information.
                    Request Header: Authorization: Bearer <jwt_token>
                    Request Body: { "username": "test_updated", "password": "new_password123" }
                    Response: 200 OK or 400 Bad Request
2.	Dashboard and Reports:
	•	Get Dashboard Data: GET /api/dashboard
                    Purpose: Retrieves summary data for the user’s dashboard.
                    Request Header: Authorization: Bearer <jwt_token>
                    Response: 200 OK or 401 Unauthorized
        •	Get Report Data: GET /api/dashboard
                    Purpose: Retrieves report data for the user’s .
                    Request Header: Authorization: Bearer <jwt_token>
                    Request Body: {"start_date": "2024-07-01","end_date": "2024-07-31","type": "monthly"}
                    Response: 200 OK or 401 Unauthorized
                    Response Body:{
                        "report": {
                        "total_income": 5000.00,
                        "total_expenses": 3000.00,
                        "savings": 2000.00,
                        "transactions": [
                          {
                            "id": 1,
                            "type": "expense",
                            "amount": 50.00,
                            "category": "Groceries",
                            "date": "2024-07-01"
                          },
                          {
                            "id": 2,
                            "type": "income",
                            "amount": 1000.00,
                            "category": "Salary",
                            "date": "2024-07-01"
                          }
                        ]
                      }
                    }
3.	Transaction Management:
	•	Get Transactions: GET /api/transactions
                    Purpose: Retrieves all transactions for the logged-in user.
                    Request Header: Authorization: Bearer <jwt_token>
                    Response: 200 OK or 401 Unauthorized
        •	Add Transactions: POST /api/transactions
                    Purpose:Allows the user to add a new transaction.
                    Request Header: Authorization: Bearer <jwt_token>
                    Request Body: {"type": "expense","amount": 50.00,"category": "Groceries","date": "2024-07-01","notes": "Weekly groceries"}
                    Response:
        •	Edit Transactions: POST /api/transactions/{transaction_id}
                    Purpose:Allows the user to eidt an existing transaction.
                    Request Header: Authorization: Bearer <jwt_token>
                    Request Body: {"type": "expense","amount": 60.00,"category": "Groceries","date": "2024-07-01","notes": "Weekly groceries update"}
                    Response:
        •	Delete Transactions: DELETE /api/transactions/{transaction_id}
                    Purpose:Allows the user to wdit an existing transaction.
                    Request Header: Authorization: Bearer <jwt_token>
                    Response:
4.	Budgets Management:
        •	Get Budgets: GET /api/budgets
                    Purpose: Retrieves all budgets for the logged-in user.
                    Request Header: Authorization: Bearer <jwt_token>
                    Response: 200 OK or 401 Unauthorized
        •	Add Budgets: POST /api/Budgets
                    Purpose:Allows the user to add a budget for a specific category.
                    Request Header: Authorization: Bearer <jwt_token>
                    Request Body: {"category": "Groceries","limit": 500.00}
                    Response:
        •	Edit budgets: POST /api/budgets/{budget_id}
                    Purpose:Allows the user to edit an existing budget.
                    Request Header: Authorization: Bearer <jwt_token>
                    Request Body: {"category": "Groceries","limit": 500.00}
                    Response:
        •	Delete Budgets: DELETE /api/budgets/{budget_id}
                    Purpose:Allows the user to delete an existing budget.
                    Request Header: Authorization: Bearer <jwt_token>
```
