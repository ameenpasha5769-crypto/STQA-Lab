# Online Food Ordering REST API Testing Using Cypress

**Course / Subject:** Software Testing & Quality Assurance (STQA)  
**Project Title:** Specialized Tool Exploration & Program Unit/API Testing: Online Food Ordering REST API Testing Using Cypress  
**System Under Test (SUT):** Online Food Ordering REST API (Node.js & Express.js)  
**Testing Tool:** Cypress (with Mochawesome Reporting)  

---

## 1. Project Objective

The primary objective of this project is to implement a robust, lightweight, and realistic **Online Food Ordering REST API** as a System Under Test (SUT) and perform comprehensive automated API testing using **Cypress**.

The project formally demonstrates core Software Quality Assurance principles:
1. **Functional API Testing:** Validation of CRUD operations across users, restaurants, menu items, shopping carts, and order lifecycles.
2. **Positive Testing:** Confirming that valid inputs produce expected HTTP success codes (`200 OK`, `201 Created`) and expected data schemas.
3. **Negative Testing:** Verifying rejection of malformed or unauthorized requests (`400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `409 Conflict`).
4. **Boundary Value Analysis (BVA):** Testing exact boundaries on inputs (e.g., cart quantities at 0, 1, 2, 5, 9, 10, 11; password length at 5, 6, 7).
5. **Equivalence Class Partitioning (ECP):** Partitioning input domains into valid and invalid classes.
6. **Response-Time Measurement:** Measuring API performance using `response.duration`.
7. **Automated Reporting:** Producing Mochawesome HTML and JSON test execution reports.
8. **Defect Discovery and Regression Testing:** Identifying real defects, recording root causes, and re-running regression suites.

---

## 2. Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | Node.js (v20.x), Express.js (v4.x) | Lightweight RESTful microservice architecture |
| **Database** | File-based JSON Database (`backend/data/db.json`) | Persistent, readable storage suitable for academic demonstration |
| **Testing Tool** | Cypress (v13.x) | Fast headless and interactive end-to-end API testing runner |
| **Assertion Library** | Chai (built into Cypress) | Explicit assertions for status codes, schemas, and values |
| **Reporting** | Mochawesome, Mochawesome-Merge, Marge | Visual HTML test reports and structured JSON summaries |
| **Operating System** | Windows 11 / PowerShell | Cross-platform JavaScript stack |

---

## 3. System Architecture

```
                    +-----------------------------+
                    |        Cypress SQA          |
                    |   Automated Test Suite      |
                    +--------------+--------------+
                                   |
                      HTTP cy.request() via REST
                                   |
                                   v
+-----------------------------------------------------------------+
|                   Express.js REST API (Port 3000)               |
|                                                                 |
|  +----------------+  +-------------------+  +----------------+  |
|  | Health & Auth  |  | Restaurant & Menu |  | Cart & Orders  |  |
|  +-------+--------+  +---------+---------+  +--------+-------+  |
|          |                     |                     |          |
|          +---------------------+---------------------+          |
|                                |                                |
|                  Data Access Layer (readDB / writeDB)           |
+--------------------------------+--------------------------------+
                                 |
                                 v
                 +-------------------------------+
                 |      backend/data/db.json     |
                 |  (Users, Restaurants, Orders) |
                 +-------------------------------+
```

---

## 4. API Specification & Endpoints

| Module | Method | Endpoint | Description | Success Code | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/api/health` | Health check probe | `200 OK` | - |
| **Auth** | `POST` | `/api/auth/register` | Register new user | `201 Created` | `400 Bad Request`, `409 Conflict` |
| **Auth** | `POST` | `/api/auth/login` | Login user and issue token | `200 OK` | `400 Bad Request`, `401 Unauthorized` |
| **Restaurant**| `GET` | `/api/restaurants` | Get all available restaurants | `200 OK` | - |
| **Restaurant**| `GET` | `/api/restaurants/:id` | Get restaurant details by ID | `200 OK` | `404 Not Found` |
| **Menu** | `GET` | `/api/restaurants/:id/menu`| Get menu for a restaurant | `200 OK` | `404 Not Found` |
| **Cart** | `POST` | `/api/cart` | Add food item to user cart | `201 Created` | `400 Bad Request`, `404 Not Found` |
| **Cart** | `GET` | `/api/cart/:userId` | Get user cart items & total | `200 OK` | `400 Bad Request` |
| **Cart** | `PUT` | `/api/cart/:userId/:itemId`| Update quantity of cart item | `200 OK` | `400 Bad Request`, `404 Not Found` |
| **Cart** | `DELETE`| `/api/cart/:userId/:itemId`| Remove item from user cart | `200 OK` | `404 Not Found` |
| **Order** | `POST` | `/api/orders` | Place order from cart items | `201 Created` | `400 Bad Request` |
| **Order** | `GET` | `/api/orders/:id` | Get order details by ID | `200 OK` | `404 Not Found` |
| **Order** | `PUT` | `/api/orders/:id/cancel`| Cancel placed order | `200 OK` | `400 Bad Request`, `404 Not Found` |

---

## 5. Business Validation Rules

1. **User Registration:**
   - `name`, `email`, and `password` are mandatory.
   - Missing or empty fields return HTTP `400 Bad Request`.
   - Email format must be valid (regex check); invalid formats return HTTP `400`.
   - Passwords must be $\ge 6$ characters; length $< 6$ returns HTTP `400`.
   - Duplicate email registration returns HTTP `409 Conflict`.
   - Successful registration returns HTTP `201 Created` without exposing password.

2. **User Authentication:**
   - Valid credentials return HTTP `200 OK` with an authentication token and user profile.
   - Incorrect password returns HTTP `401 Unauthorized`.
   - Unregistered email returns HTTP `401 Unauthorized`.

3. **Restaurants & Menus:**
   - Querying existing restaurants returns HTTP `200 OK`.
   - Querying invalid/non-existent IDs returns HTTP `404 Not Found`.

4. **Cart Management:**
   - Required fields: `userId`, `restaurantId`, `itemId`, `quantity`.
   - Quantity rule: Allowed range is integer $1 \le \text{quantity} \le 10$.
   - Quantities $< 1$, $> 10$, or non-integers return HTTP `400 Bad Request`.
   - Non-existent restaurant ID or food item ID returns HTTP `404 Not Found`.
   - Item line total must strictly satisfy: $\text{total} = \text{price} \times \text{quantity}$.

5. **Order Processing:**
   - Required fields: `userId`, `address`, `paymentMethod`.
   - Allowed payment methods: `'Cash on Delivery'`, `'Credit Card'`, `'Debit Card'`, `'UPI'`.
   - If cart is empty for the user, order placement returns HTTP `400 Bad Request`.
   - Total order amount must strictly equal the sum of cart item totals.
   - Initial status upon creation is `'PLACED'`.
   - Placing an order clears the user's cart in the database.
   - An active order can be cancelled, updating status to `'CANCELLED'` (HTTP `200`).
   - Attempting to cancel an already cancelled order returns HTTP `400 Bad Request`.

---

## 6. Equivalence Class Partitioning (ECP)

| Parameter | Valid Equivalence Partition | Invalid Equivalence Partition |
| :--- | :--- | :--- |
| **Cart Quantity** | $1 \le \text{quantity} \le 10$ (e.g., 1, 2, 5, 9, 10) | $\text{quantity} < 1$ (e.g., 0, -1)<br>$\text{quantity} > 10$ (e.g., 11)<br>Non-integer (e.g., 2.5) |
| **Password Length**| $\text{length} \ge 6$ characters | $\text{length} < 6$ characters |
| **Required Fields**| All mandatory fields present and non-empty | Any required field omitted, `null`, or blank whitespace |
| **Email Syntax** | Standard RFC-compliant format (`user@domain.com`) | Missing `@`, missing domain, or whitespace |
| **Restaurant ID** | Existing restaurant in database (`1`, `2`) | Non-existent ID (`999`) or non-numeric (`abc`) |
| **Menu Item ID** | Existing item in restaurant menu (`101`, `102`) | Non-existent menu item (`9999`) |
| **Payment Method** | `'Cash on Delivery'`, `'Credit Card'`, `'Debit Card'`, `'UPI'` | Unsupported methods (e.g., `'CryptoToken'`, `'BitCoin'`) |
| **Cart State** | User cart contains at least 1 item | User cart is empty |
| **Order Cancellation**| Order status is `'PLACED'` | Order status is already `'CANCELLED'` |

---

## 7. Boundary Value Analysis (BVA)

### Cart Item Quantity ($1 \le Q \le 10$)

| Test Case ID | Boundary Point | Test Value | Partition Type | Expected HTTP Status |
| :--- | :--- | :--- | :--- | :--- |
| **BVA-CART-001** | Minimum - 1 | `0` | Invalid | `400 Bad Request` |
| **BVA-CART-002** | Minimum | `1` | Valid | `201 Created` |
| **BVA-CART-003** | Minimum + 1 | `2` | Valid | `201 Created` |
| **BVA-CART-004** | Nominal / Mid | `5` | Valid | `201 Created` |
| **BVA-CART-005** | Maximum - 1 | `9` | Valid | `201 Created` |
| **BVA-CART-006** | Maximum | `10` | Valid | `201 Created` |
| **BVA-CART-007** | Maximum + 1 | `11` | Invalid | `400 Bad Request` |

### Password Length ($\ge 6$ characters)

| Test Case ID | Boundary Point | Test Value | Partition Type | Expected HTTP Status |
| :--- | :--- | :--- | :--- | :--- |
| **BVA-AUTH-001** | Minimum - 1 | `"abcde"` (5 chars) | Invalid | `400 Bad Request` |
| **BVA-AUTH-002** | Minimum | `"abcdef"` (6 chars) | Valid | `201 Created` |
| **BVA-AUTH-003** | Minimum + 1 | `"abcdefg"` (7 chars)| Valid | `201 Created` |

---

## 8. Complete Test Case Summary (44 Test Cases)

| Test ID | Module | Title | Method | Endpoint | Expected Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-001` | Auth | Register valid user | POST | `/api/auth/register` | `201 Created` |
| `TC-AUTH-002` | Auth | Login valid credentials | POST | `/api/auth/login` | `200 OK` |
| `TC-AUTH-003` | Auth | Login with invalid password | POST | `/api/auth/login` | `401 Unauthorized` |
| `TC-AUTH-004` | Auth | Register missing required field | POST | `/api/auth/register` | `400 Bad Request` |
| `TC-AUTH-005` | Auth | Register password length 5 | POST | `/api/auth/register` | `400 Bad Request` |
| `TC-AUTH-006` | Auth | Register duplicate email | POST | `/api/auth/register` | `409 Conflict` |
| `TC-AUTH-007` | Auth | Login with unknown email | POST | `/api/auth/login` | `401 Unauthorized` |
| `BVA-AUTH-001` | Auth | Password boundary test: Length 5 (Min - 1) | POST | `/api/auth/register` | `400 Bad Request` |
| `BVA-AUTH-002` | Auth | Password boundary test: Length 6 (Min) | POST | `/api/auth/register` | `201 Created` |
| `BVA-AUTH-003` | Auth | Password boundary test: Length 7 (Min + 1) | POST | `/api/auth/register` | `201 Created` |
| `TC-AUTH-EDGE-001` | Auth | Register with empty string fields | POST | `/api/auth/register` | `400 Bad Request` |
| `TC-AUTH-EDGE-002` | Auth | Register with invalid email syntax | POST | `/api/auth/register` | `400 Bad Request` |
| `TC-HEALTH-001` | Health | Health check probe | GET | `/api/health` | `200 OK` |
| `TC-REST-001` | Restaurant | Get all restaurants | GET | `/api/restaurants` | `200 OK` |
| `TC-REST-002` | Restaurant | Get restaurant by valid ID (ID: 1) | GET | `/api/restaurants/1` | `200 OK` |
| `TC-REST-003` | Restaurant | Get invalid restaurant ID (ID: 999) | GET | `/api/restaurants/999` | `404 Not Found` |
| `TC-REST-004` | Menu | Get menu for restaurant ID 1 | GET | `/api/restaurants/1/menu` | `200 OK` |
| `TC-REST-005` | Menu | Get menu for invalid restaurant ID 999 | GET | `/api/restaurants/999/menu` | `404 Not Found` |
| `TC-REST-EDGE-001`| Restaurant | Get restaurant with non-numeric ID | GET | `/api/restaurants/abc` | `404 Not Found` |
| `TC-CART-001` | Cart | Add valid item (qty 2) & verify total | POST | `/api/cart` | `201 Created` |
| `BVA-CART-001` | Cart | Quantity boundary: 0 (Min - 1) | POST | `/api/cart` | `400 Bad Request` |
| `BVA-CART-002` | Cart | Quantity boundary: 1 (Min) | POST | `/api/cart` | `201 Created` |
| `BVA-CART-003` | Cart | Quantity boundary: 2 (Min + 1) | POST | `/api/cart` | `201 Created` |
| `BVA-CART-004` | Cart | Quantity boundary: 5 (Nominal) | POST | `/api/cart` | `201 Created` |
| `BVA-CART-005` | Cart | Quantity boundary: 9 (Max - 1) | POST | `/api/cart` | `201 Created` |
| `BVA-CART-006` | Cart | Quantity boundary: 10 (Max) | POST | `/api/cart` | `201 Created` |
| `BVA-CART-007` | Cart | Quantity boundary: 11 (Max + 1) | POST | `/api/cart` | `400 Bad Request` |
| `TC-CART-009` | Cart | Invalid food item ID (9999) | POST | `/api/cart` | `404 Not Found` |
| `TC-CART-010` | Cart | Invalid restaurant ID (999) | POST | `/api/cart` | `404 Not Found` |
| `TC-CART-011` | Cart | Missing cart fields | POST | `/api/cart` | `400 Bad Request` |
| `TC-CART-012` | Cart | Get user cart items | GET | `/api/cart/:userId` | `200 OK` |
| `TC-CART-013` | Cart | Update cart item quantity (PUT) | PUT | `/api/cart/:userId/:itemId`| `200 OK` |
| `TC-CART-014` | Cart | Remove cart item (DELETE) | DELETE | `/api/cart/:userId/:itemId`| `200 OK` |
| `TC-CART-EDGE-001`| Cart | Negative quantity (-1) rejected | POST | `/api/cart` | `400 Bad Request` |
| `TC-CART-EDGE-002`| Cart | Decimal quantity (2.5) rejected | POST | `/api/cart` | `400 Bad Request` |
| `TC-ORDER-001` | Order | Place valid order and verify status | POST | `/api/orders` | `201 Created` |
| `TC-ORDER-002` | Order | Verify order total matches cart item sums | POST | `/api/orders` | `201 Created` |
| `TC-ORDER-003` | Order | Get valid order details by ID | GET | `/api/orders/:id` | `200 OK` |
| `TC-ORDER-004` | Order | Get invalid order ID (ID: 99999) | GET | `/api/orders/99999` | `404 Not Found` |
| `TC-ORDER-005` | Order | Cancel active order | PUT | `/api/orders/:id/cancel` | `200 OK` |
| `TC-ORDER-006` | Order | Cancel already cancelled order | PUT | `/api/orders/:id/cancel` | `400 Bad Request` |
| `TC-ORDER-007` | Order | Place order with empty cart | POST | `/api/orders` | `400 Bad Request` |
| `TC-ORDER-EDGE-001`| Order | Missing delivery address | POST | `/api/orders` | `400 Bad Request` |
| `TC-ORDER-EDGE-002`| Order | Unsupported payment method | POST | `/api/orders` | `400 Bad Request` |

---

## 9. Installation & Setup Instructions

### Prerequisites
- Windows 10/11 with PowerShell
- Node.js (v18.x or v20.x LTS) and npm installed

### Step 1: Clone and Navigate to Directory
```powershell
cd "c:\Users\Jehan\SQA lab\STQA-Lab"
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Start the Backend Server
```powershell
npm start
```
*The server will start on `http://localhost:3000` with confirmation:*
```
Online Food Ordering REST API is running on http://localhost:3000
```

---

## 10. Cypress Execution & Reporting Commands

### Run Full Cypress Test Suite (Headless Mode)
Open a new PowerShell terminal and execute:
```powershell
npm test
```
or target API specs explicitly:
```powershell
npm run test:api
```

### Run Cypress with Interactive GUI
```powershell
npm run cypress:open
```

### Generate Mochawesome HTML Report
```powershell
npm run report
```
*This bundles all test spec JSON results into `results/index.html`.*

---

## 11. Actual Execution Results

*Execution recorded directly from the Cypress automated runner on Windows:*

```
====================================================================================================
  (Run Finished)

       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ √  auth.cy.js                               474ms       12       12        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  cart.cy.js                               506ms       16       16        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  order.cy.js                              359ms        9        9        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  restaurant.cy.js                         241ms        7        7        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    √  All specs passed!                        00:01       44       44        -        -        -  
====================================================================================================
```

### Metrics Summary:
- **Total Tests Registered:** 44
- **Passed:** 44 (100%)
- **Failed:** 0
- **Pending / Skipped:** 0
- **Total Suite Execution Time:** ~1.58 seconds
- **Report Location:** `results/index.html`

---

## 12. Actual Response Time & Performance Insights

All endpoints were measured locally during test execution using `response.duration`:

| Endpoint | HTTP Method | Observed Response Time | Performance Threshold | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | 38 ms | $< 1000$ ms | PASS |
| `/api/restaurants` | `GET` | 22 ms | $< 1000$ ms | PASS |
| `/api/restaurants/1/menu`| `GET` | 21 ms | $< 1000$ ms | PASS |
| `/api/auth/login` | `POST` | 37 ms | $< 2000$ ms | PASS |
| `/api/cart` | `POST` | 44 ms | $< 1000$ ms | PASS |
| `/api/orders` | `POST` | 48 ms | $< 1000$ ms | PASS |

> **Note on Performance Thresholds:** The response time threshold ($< 1000\text{ ms}$) represents an exploratory local test baseline to catch runaway latency or infinite loops; it is not a production cloud SLA.

---

## 13. Defect Discovery & Resolution Log

### Defect DEF-001
- **Title:** Cypress runner fails to start Electron due to inherited `ELECTRON_RUN_AS_NODE` environment variable
- **Module:** Cypress Test Harness / CLI Launcher
- **Severity:** High
- **Priority:** High
- **Precondition:** Windows environment running inside an IDE where `ELECTRON_RUN_AS_NODE=1` is exported.
- **Steps to Reproduce:** Run `npx cypress verify` or `npm test`.
- **Expected Result:** Cypress verifies its binary and boots headless Electron.
- **Actual Result:** Process crashed with `Cypress.exe: bad option: --smoke-test`.
- **Root Cause:** When `ELECTRON_RUN_AS_NODE` is active, Electron runs as Node.js CLI instead of an Electron GUI runtime, refusing flags like `--smoke-test`.
- **Fix:** Removed the environment variable prior to invoking Cypress (`Remove-Item env:ELECTRON_RUN_AS_NODE`).
- **Regression Result:** Verified with `npx cypress verify` and passed all 44 Cypress tests.

---

## 14. Student Contribution Breakdown

| Contributor | Areas of Ownership | Key Deliverables |
| :--- | :--- | :--- |
| **Student A** | SUT Backend Architecture & Database | Express REST server (`backend/server.js`), schema design (`backend/data/db.json`), business logic, CRUD endpoints, and error handling. |
| **Student B** | Quality Assurance & Cypress Test Automation | Cypress architecture (`cypress/`), fixtures (`testData.json`), custom commands (`commands.js`), BVA/ECP test suites, Mochawesome report generation. |

---

## 15. Future Enhancements

1. **Authentication:** Implement JWT (JSON Web Tokens) with cryptographically hashed passwords via `bcrypt`.
2. **Database:** Migrate from local JSON file persistence to an ACID-compliant SQL database (PostgreSQL/MySQL) or MongoDB.
3. **CI/CD Pipeline:** Integrate GitHub Actions to trigger headless Cypress tests automatically on every pull request.
4. **Load Testing:** Incorporate k6 or Artillery to evaluate system throughput under concurrent user loads.
