# CloudCommerce API Reference

Base URL: `https://your-domain.com/api/v1`

## Authentication

All requests (except webhooks) require the `x-tenant-id` header:

```http
x-tenant-id: t-1
```

For admin/merchant endpoints, an `x-user-role` header is also expected.

## Rate Limiting

API routes are rate-limited at 100 requests per minute per IP. Rate limit headers are returned:

```http
x-ratelimit-remaining: 99
x-ratelimit-reset: 1718400000
```

## Security Headers

All responses include:
- `Content-Security-Policy` — strict CSP
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` — 2-year HSTS
- `Referrer-Policy: strict-origin-when-cross-origin`

## Endpoints

### Catalog

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/v1/categories`          | List categories          |
| POST   | `/api/v1/categories`          | Create category          |
| GET    | `/api/v1/categories/[id]`     | Get category             |
| PUT    | `/api/v1/categories/[id]`     | Update category          |
| DELETE | `/api/v1/categories/[id]`     | Delete category          |
| GET    | `/api/v1/products`            | List products (paginated)|
| POST   | `/api/v1/products`            | Create product           |
| GET    | `/api/v1/products/[id]`       | Get product              |
| PUT    | `/api/v1/products/[id]`       | Update product           |
| DELETE | `/api/v1/products/[id]`       | Delete product           |

### Inventory

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/v1/inventory`           | List inventory           |
| POST   | `/api/v1/inventory`           | Adjust stock             |

### Orders

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/v1/orders`              | List orders              |
| POST   | `/api/v1/orders`              | Create order             |
| GET    | `/api/v1/orders/[id]`         | Get order detail         |

### Customers & Cart

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/v1/customers`           | List customers           |
| POST   | `/api/v1/customers`           | Create customer          |
| GET    | `/api/v1/cart`               | Get cart                 |
| POST   | `/api/v1/cart`               | Add to cart              |
| DELETE | `/api/v1/cart`               | Clear cart               |

### Billing

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/v1/plans`               | List subscription plans  |
| GET    | `/api/v1/subscriptions`       | Get current subscription |
| POST   | `/api/v1/subscriptions`       | Subscribe / cancel       |
| PUT    | `/api/v1/subscriptions`       | Upgrade / downgrade plan |
| GET    | `/api/v1/payments`            | Invoice history          |

### Analytics

| Method | Path                                     | Description              |
|--------|------------------------------------------|--------------------------|
| GET    | `/api/v1/analytics/merchant?range=`      | Merchant metrics         |
| GET    | `/api/v1/analytics/admin?range=`         | Admin platform metrics   |
| GET    | `/api/v1/reports/sales?range=&format=`   | Sales report (json/csv)  |
| GET    | `/api/v1/reports/inventory?format=`      | Inventory report         |
| GET    | `/api/v1/reports/customers?format=`      | Customer report          |

### Webhooks

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| POST   | `/api/webhooks/stripe`        | Stripe event handler     |
| POST   | `/api/v1/webhooks/khalti`     | Khalti event handler     |
| POST   | `/api/v1/webhooks/esewa`      | eSewa event handler      |

## Error Responses

```json
{
  "error": "Description of what went wrong"
}
```

HTTP status codes: 400 (validation), 403 (permission), 404 (not found), 429 (rate limit), 500 (server error).
