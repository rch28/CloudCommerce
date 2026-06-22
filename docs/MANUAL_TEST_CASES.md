# CloudCommerce — Manual Test Cases

> Run these in order where dependencies exist. Mark each case PASS/FAIL/BLOCKED.

---

## 1. Authentication (Dashboard)

### 1.1 Registration
- [ ] **TC-REG-01**: Navigate to `/auth/register` — form renders with email, password, confirm password fields
- [ ] **TC-REG-02**: Submit with empty fields — validation errors shown
- [ ] **TC-REG-03**: Submit with password < 8 chars — error displayed
- [ ] **TC-REG-04**: Submit with mismatched passwords — error displayed
- [ ] **TC-REG-05**: Submit with invalid email format — error displayed
- [ ] **TC-REG-06**: Register with valid data — successful registration, redirected to `/merchant/dashboard`
- [ ] **TC-REG-07**: Register with already-used email — error "email already in use"
- [ ] **TC-REG-08**: After registration, `cc_session_token` cookie is set (httpOnly)

### 1.2 Login
- [ ] **TC-LOG-01**: Navigate to `/auth/login` — form renders with email, password, submit button
- [ ] **TC-LOG-02**: Submit with empty fields — validation errors
- [ ] **TC-LOG-03**: Submit with wrong email — error "Invalid credentials"
- [ ] **TC-LOG-04**: Submit with wrong password — error "Invalid credentials"
- [ ] **TC-LOG-05**: Login with valid credentials — redirected to `/merchant/dashboard`
- [ ] **TC-LOG-06**: `cc_session_token` cookie is set after login
- [ ] **TC-LOG-07**: Remember me — session persists beyond browser close (check cookie expiry)

### 1.3 Session & Logout
- [ ] **TC-SES-01**: Refresh page while logged in — session persists, still on dashboard
- [ ] **TC-SES-02**: Close browser, reopen – session persists (if not expired)
- [ ] **TC-SES-03**: Click logout — session cleared, redirected to `/auth/login`
- [ ] **TC-SES-04**: After logout, accessing `/merchant/dashboard` redirects to `/auth/login`
- [ ] **TC-SES-05**: `cc_session_token` cookie removed after logout
- [ ] **TC-SES-06**: Wait 7 days (or modify expiry), try to use session — redirected to login

### 1.4 Role-Based Access
- [ ] **TC-ROL-01**: Owner user can access `/merchant/*` and `/admin/*`
- [ ] **TC-ROL-02**: Staff user can access `/merchant/*` (with limited CRUD) but NOT `/admin/*`
- [ ] **TC-ROL-03**: Customer user cannot access `/merchant/*` or `/admin/*`
- [ ] **TC-ROL-04**: Unauthenticated user accessing `/merchant/*` is redirected to `/auth/login`

---

## 2. Landing Page (Marketing)

- [ ] **TC-LND-01**: Navigate to `/` — landing page loads
- [ ] **TC-LND-02**: Layout renders header, hero section, feature highlights, footer
- [ ] **TC-LND-03**: "Get Started" / "Login" CTAs are present and link correctly
- [ ] **TC-LND-04**: Responsive layout — test at 375px, 768px, 1440px widths

---

## 3. Merchant Dashboard

### 3.1 Dashboard Overview
- [ ] **TC-DSH-01**: `/merchant/dashboard` loads — stats cards visible (revenue, orders, customers, products)
- [ ] **TC-DSH-02**: Revenue stat card shows correct total for selected period
- [ ] **TC-DSH-03**: Orders stat card shows correct count
- [ ] **TC-DSH-04**: Chart (revenue/orders) renders with data
- [ ] **TC-DSH-05**: Time filter (today/7d/30d/this year) updates all stats and charts
- [ ] **TC-DSH-06**: Live orders feed (WebSocket) shows new orders in real time
- [ ] **TC-DSH-07**: Recent orders table lists latest orders
- [ ] **TC-DSH-08**: Clicking an order in the feed navigates to order detail
- [ ] **TC-DSH-09**: Sidebar navigation expands/collapses
- [ ] **TC-DSH-10**: Topbar shows store name, notification bell, user avatar
- [ ] **TC-DSH-11**: Notification dropdown shows unread count
- [ ] **TC-DSH-12**: Cmd+K or Ctrl+K opens command palette
- [ ] **TC-DSH-13**: Empty state shows when no data exists yet

### 3.2 Products — Listing
- [ ] **TC-PRD-01**: `/merchant/products` — product table renders with columns: image, name, SKU, price, stock, status
- [ ] **TC-PRD-02**: Search/filter by product name works
- [ ] **TC-PRD-03**: Filter by category works
- [ ] **TC-PRD-04**: Filter by status (active/draft/archived) works
- [ ] **TC-PRD-05**: Pagination works (click page 2, page 3...)
- [ ] **TC-PRD-06**: Rows per page selector works (10/25/50)
- [ ] **TC-PRD-07**: Empty state — "No products yet, create your first product" with CTA
- [ ] **TC-PRD-08**: Clicking a product row navigates to product detail

### 3.3 Products — Create
- [ ] **TC-PRD-09**: Click "Add Product" — product form opens
- [ ] **TC-PRD-10**: Submit with empty required fields (name) — validation error
- [ ] **TC-PRD-11**: Fill required fields only — product created with "draft" status
- [ ] **TC-PRD-12**: Set status to "active" — product created as active
- [ ] **TC-PRD-13**: Upload a product image — image appears in form, saved to product
- [ ] **TC-PRD-14**: Assign to a category — dropdown shows existing categories
- [ ] **TC-PRD-15**: Fill all fields (description, price, compare-at price, SEO fields) — all saved
- [ ] **TC-PRD-16**: Add multiple images — ordering preserved
- [ ] **TC-PRD-17**: Save — redirected to product detail page with success toast

### 3.4 Products — Edit
- [ ] **TC-PRD-18**: Navigate to `/merchant/products/[id]/edit` — form pre-filled with product data
- [ ] **TC-PRD-19**: Change name, save — name updated
- [ ] **TC-PRD-20**: Change price, save — price updated
- [ ] **TC-PRD-21**: Change status active ↔ draft — status updated
- [ ] **TC-PRD-22**: Remove an image, add a new one — images updated
- [ ] **TC-PRD-23**: Cancel edit — no changes persisted

### 3.5 Products — Detail View
- [ ] **TC-PRD-24**: `/merchant/products/[id]` — shows all product details
- [ ] **TC-PRD-25**: Image gallery works (click thumbnail to view full)
- [ ] **TC-PRD-26**: Variants section shows if variants exist
- [ ] **TC-PRD-27**: Category link navigates to category detail
- [ ] **TC-PRD-28**: Stats row (total sold, revenue, stock) displayed
- [ ] **TC-PRD-29**: "Edit" button navigates to edit page

### 3.6 Products — Duplicate & Delete
- [ ] **TC-PRD-30**: Click "Duplicate" — product duplicated with "(copy)" suffix
- [ ] **TC-PRD-31**: Duplicated product includes images, variants, category
- [ ] **TC-PRD-32**: Click "Delete" — confirm dialog appears
- [ ] **TC-PRD-33**: Confirm delete — product removed from list
- [ ] **TC-PRD-34**: Deleted product shows in "archived" filter if soft-deleted

### 3.7 Variants & Options
- [ ] **TC-VAR-01**: Product form — "Options" section allows adding option names (Size, Color)
- [ ] **TC-VAR-02**: Add option values (S/M/L, Red/Blue/Green)
- [ ] **TC-VAR-03**: Click "Generate Variants" — all combinations created
- [ ] **TC-VAR-04**: Each variant has editable fields: SKU, price, quantity, weight
- [ ] **TC-VAR-05**: Edit a variant's price independently — saved
- [ ] **TC-VAR-06**: Edit a variant's SKU — saved
- [ ] **TC-VAR-07**: Delete a variant — removed from list
- [ ] **TC-VAR-08**: Add variant manually without options — works
- [ ] **TC-VAR-09**: Update product after generating variants — all variants persist

### 3.8 Categories
- [ ] **TC-CAT-01**: `/merchant/categories` — category tree renders
- [ ] **TC-CAT-02**: "Add Category" — form with name, slug, description, parent
- [ ] **TC-CAT-03**: Create root category — appears in tree
- [ ] **TC-CAT-04**: Create child category (select parent) — nested under parent
- [ ] **TC-CAT-05**: Edit category name — updated in tree
- [ ] **TC-CAT-06**: Delete category — removed (or reassign products prompt)
- [ ] **TC-CAT-07**: Drag-and-drop reorder works
- [ ] **TC-CAT-08**: Category product count shown
- [ ] **TC-CAT-09**: Bulk operations work (delete selected)

### 3.9 Orders — Listing
- [ ] **TC-ORD-01**: `/merchant/orders` — orders table with columns: order#, customer, date, status, total
- [ ] **TC-ORD-02**: Filter by status (pending/processing/shipped/delivered/cancelled/returned)
- [ ] **TC-ORD-03**: Filter by date range
- [ ] **TC-ORD-04**: Search by order number or customer name
- [ ] **TC-ORD-05**: Pagination works
- [ ] **TC-ORD-06**: Click order row navigates to order detail

### 3.10 Orders — Detail & Status
- [ ] **TC-ORD-07**: `/merchant/orders/[id]` — order info, items, customer, status timeline
- [ ] **TC-ORD-08**: Order items listed with product name, SKU, price, quantity, image
- [ ] **TC-ORD-09**: Customer info (name, email, shipping address) displayed
- [ ] **TC-ORD-10**: Order totals (subtotal, shipping, tax, discount, total) correct
- [ ] **TC-ORD-11**: Change status from pending → processing — confirmation dialog
- [ ] **TC-ORD-12**: Change status from processing → shipped — confirmation
- [ ] **TC-ORD-13**: Change status from shipped → delivered — confirmation
- [ ] **TC-ORD-14**: Cancel an order (pending/processing only) — confirmation, stock restored
- [ ] **TC-ORD-15**: Process refund — partial and full refund options
- [ ] **TC-ORD-16**: "Resend Confirmation" button — email resent, confirmation shown
- [ ] **TC-ORD-17**: Disallowed status transitions blocked (e.g. delivered → processing)
- [ ] **TC-ORD-18**: Status change shows in activity timeline
- [ ] **TC-ORD-19**: Invoice download/link works

### 3.11 Customers
- [ ] **TC-CUS-01**: `/merchant/customers` — customer list with name, email, orders count, total spent
- [ ] **TC-CUS-02**: Search by name or email
- [ ] **TC-CUS-03**: Click customer — customer detail view with profile, order history, addresses
- [ ] **TC-CUS-04**: Customer order history shows all their orders with links
- [ ] **TC-CUS-05**: Customer addresses shown

### 3.12 Analytics
- [ ] **TC-ANL-01**: `/merchant/analytics` — revenue chart, orders chart, customer chart
- [ ] **TC-ANL-02**: Time range filter (7d/30d/90d/this year) updates all charts
- [ ] **TC-ANL-03**: Metrics: total revenue, order count, AOV, conversion rate
- [ ] **TC-ANL-04**: Compare period feature works (vs previous period)
- [ ] **TC-ANL-05**: Export data (CSV) works
- [ ] **TC-ANL-06**: Top products list shown

### 3.13 Promotions — Coupons
- [ ] **TC-CPN-01**: `/merchant/promotions` — coupons and promotions tabs
- [ ] **TC-CPN-02**: Create coupon — form with code, type (fixed/percentage/free shipping), value
- [ ] **TC-CPN-03**: Set min order amount restriction — only applies above threshold
- [ ] **TC-CPN-04**: Set usage limit (total and per-customer) — enforced
- [ ] **TC-CPN-05**: Set expiry date — coupon invalid after date
- [ ] **TC-CPN-06**: Set "first order only" — only applies to customer's first order
- [ ] **TC-CPN-07**: Product/category targeting — only valid for specific products
- [ ] **TC-CPN-08**: Edit coupon — changes saved
- [ ] **TC-CPN-09**: Delete coupon — removed
- [ ] **TC-CPN-10**: Coupon usage stats — shows times used, total discount amount
- [ ] **TC-CPN-11**: Disable/enable coupon toggle works

### 3.14 Promotions — Auto Discounts
- [ ] **TC-PRO-01**: Create promotion — form with name, type, discount value
- [ ] **TC-PRO-02**: Add rules (min cart total, specific products, specific categories)
- [ ] **TC-PRO-03**: Set priority — higher priority applies first
- [ ] **TC-PRO-04**: Enable "auto apply" — promotion auto-applies to qualifying carts
- [ ] **TC-PRO-05**: Edit promotion — changes saved
- [ ] **TC-PRO-06**: Delete promotion — removed
- [ ] **TC-PRO-07**: Stacking rules — multiple promotions can/cannot stack correctly

### 3.15 Reviews — Moderation
- [ ] **TC-REV-01**: `/merchant/reviews` — review list with product, customer, rating, status
- [ ] **TC-REV-02**: Filter by status (pending/approved/hidden)
- [ ] **TC-REV-03**: Filter by rating (1-5 stars)
- [ ] **TC-REV-04**: `/merchant/reviews/moderation` — moderation queue shows pending reviews
- [ ] **TC-REV-05**: Approve a review — status changes to "approved", visible on storefront
- [ ] **TC-REV-06**: Hide a review — status changes to "hidden", removed from storefront
- [ ] **TC-REV-07**: Click review — detail view with full review, images, votes
- [ ] **TC-REV-08**: Reply to review — reply shown under review on storefront
- [ ] **TC-REV-09**: Edit reply — updated
- [ ] **TC-REV-10**: "Reported reviews" section shows reviews flagged by customers

### 3.16 Inventory
- [ ] **TC-INV-01**: `/merchant/inventory` — table of all variants with warehouse, SKU, quantity, reserved
- [ ] **TC-INV-02**: Search/filter by SKU or product name
- [ ] **TC-INV-03**: Adjust stock — enter adjustment (+/-), reason — stock updated, log entry created
- [ ] **TC-INV-04**: Low-stock threshold indicator — products below threshold highlighted
- [ ] **TC-INV-05**: Out-of-stock indicator — zero stock variants flagged
- [ ] **TC-INV-06**: Inventory log/history shows all changes with timestamps and user
- [ ] **TC-INV-07**: Export inventory data works

### 3.17 Warehouses
- [ ] **TC-WRH-01**: `/merchant/warehouses` — warehouse list
- [ ] **TC-WRH-02**: Create warehouse — name, code, type (physical/digital), address
- [ ] **TC-WRH-03**: Edit warehouse — changes saved
- [ ] **TC-WRH-04**: Delete warehouse — confirmed and removed
- [ ] **TC-WRH-05**: Click warehouse — shows per-warehouse inventory with variant stock levels
- [ ] **TC-WRH-06**: Reserve stock — stock reserved for order
- [ ] **TC-WRH-07**: Release stock — reservation released back to available
- [ ] **TC-WRH-08**: Allocate stock — allocate to specific order
- [ ] **TC-WRH-09**: Transfer stock between warehouses — transfer created, status tracking
- [ ] **TC-WRH-10**: Stock transfer status updates (pending → completed/cancelled)

### 3.18 Shipping Configuration
- [ ] **TC-SHP-01**: `/merchant/shipping` — zones, methods, rates sections
- [ ] **TC-SHP-02**: Create shipping zone — name, countries, states, zip codes
- [ ] **TC-SHP-03**: Edit shipping zone — changes saved
- [ ] **TC-SHP-04**: Delete shipping zone — removed
- [ ] **TC-SHP-05**: Create shipping method — name, type (flat/weight/price/free), carrier
- [ ] **TC-SHP-06**: Set flat rate — price used for all orders in zone
- [ ] **TC-SHP-07**: Set weight-based rate — correct rate calculated based on order weight
- [ ] **TC-SHP-08**: Set price-based rate — correct rate based on order subtotal
- [ ] **TC-SHP-09**: Link rate to zone + method combination
- [ ] **TC-SHP-10**: Delete shipping method — removed

### 3.19 Tax Configuration
- [ ] **TC-TAX-01**: `/merchant/tax` — zones and rates sections
- [ ] **TC-TAX-02**: Create tax zone — name, type, country/state/region
- [ ] **TC-TAX-03**: Create tax rate — name, rate %, type (percentage/compound), priority
- [ ] **TC-TAX-04**: Edit tax rate — changes saved
- [ ] **TC-TAX-05**: Delete tax rate — removed
- [ ] **TC-TAX-06**: Scheduled rates — rate changes on specified date

### 3.20 CMS — Pages
- [ ] **TC-CMS-01**: `/merchant/cms` — list of CMS pages
- [ ] **TC-CMS-02**: Create page — title, slug, SEO fields
- [ ] **TC-CMS-03**: Set as homepage — page serves as store homepage
- [ ] **TC-CMS-04**: Add sections to page — hero, text, image, product grid, category grid, banner, CTA
- [ ] **TC-CMS-05**: Reorder sections via drag-and-drop
- [ ] **TC-CMS-06**: Edit section content — text editing, image selection, product selection
- [ ] **TC-CMS-07**: Remove a section — confirmed, removed from page
- [ ] **TC-CMS-08**: Save as draft — page not visible on storefront (if not published)
- [ ] **TC-CMS-09**: Publish page — visible on storefront
- [ ] **TC-CMS-10**: Unpublish — removed from storefront
- [ ] **TC-CMS-11**: Navigate to `/store/[tenant]/pages/[slug]` — rendered page with all sections

### 3.21 CMS — Banners
- [ ] **TC-BNR-01**: Create banner — title, image, link URL, position (top/bottom/sidebar)
- [ ] **TC-BNR-02**: Set active/inactive toggle
- [ ] **TC-BNR-03**: Set date range (start/end) — only active within range
- [ ] **TC-BNR-04**: Banner renders correctly on storefront at configured position

### 3.22 Storefront Builder
- [ ] **TC-STF-01**: `/merchant/storefront` — preview of live storefront
- [ ] **TC-STF-02**: Branding settings (logo, colors, fonts) apply to storefront preview
- [ ] **TC-STF-03**: Header layout options (logo position, menu style)
- [ ] **TC-STF-04**: Footer content editable

### 3.23 Loyalty Program
- [ ] **TC-LOY-01**: `/merchant/loyalty` — loyalty settings
- [ ] **TC-LOY-02**: Enable/disable loyalty program toggle
- [ ] **TC-LOY-03**: Create reward rule — name, event type (purchase/signup/review/referral), points
- [ ] **TC-LOY-04**: Edit reward rule — changes saved
- [ ] **TC-LOY-05**: Delete reward rule — removed
- [ ] **TC-LOY-06**: Tier configuration (bronze/silver/gold/platinum) with points thresholds

### 3.24 Settings
- [ ] **TC-SET-01**: `/merchant/settings` — store settings form
- [ ] **TC-SET-02**: Update store name — saved
- [ ] **TC-SET-03**: Update store logo — uploaded and saved
- [ ] **TC-SET-04**: Update contact info (email, phone, address) — saved
- [ ] **TC-SET-05**: Update SEO defaults — saved
- [ ] **TC-SET-06**: Custom domain configuration field present
- [ ] **TC-SET-07**: Branding colors (primary, accent) — preview updated

### 3.25 Staff Management
- [ ] **TC-STF-01**: Invite staff — enter email, select role (staff/owner)
- [ ] **TC-STF-02**: Pending invitation shown in staff list
- [ ] **TC-STF-03**: Cancel invitation
- [ ] **TC-STF-04**: Remove staff member
- [ ] **TC-STF-05**: Staff member has appropriate permissions based on role

### 3.26 Billing / Subscription
- [ ] **TC-BIL-01**: `/merchant/billing` — current plan displayed
- [ ] **TC-BIL-02**: Plan features listed with checkmarks/restrictions
- [ ] **TC-BIL-03**: Upgrade/downgrade plan flow — plan selector, pricing shown
- [ ] **TC-BIL-04**: Payment history displayed
- [ ] **TC-BIL-05**: Invoice download works

### 3.27 Notifications Center
- [ ] **TC-NOT-01**: Notification bell shows unread count badge
- [ ] **TC-NOT-02**: Click bell — dropdown shows recent notifications
- [ ] **TC-NOT-03**: Click "View all" — notification center page with full list
- [ ] **TC-NOT-04**: Mark notification as read — badge count decreases
- [ ] **TC-NOT-05**: Mark all as read — all notifications marked, badge disappears
- [ ] **TC-NOT-06**: Notification appears in real-time (WebSocket push)
- [ ] **TC-NOT-07**: Notification preferences page — toggle channels (in-app, email) per event type
- [ ] **TC-NOT-08**: Order notifications created on order events (created, shipped, etc.)

---

## 4. Storefront (Customer-Facing)

### 4.1 Store Homepage
- [ ] **TC-STR-01**: Navigate to `/store/[tenant]` — store loads with header, content, footer
- [ ] **TC-STR-02**: Hero banner displayed (if configured in CMS)
- [ ] **TC-STR-03**: Featured products section shown
- [ ] **TC-STR-04**: Category grid shown (if configured)
- [ ] **TC-STR-05**: Store branding (logo, colors, fonts) applied

### 4.2 Product Listing (Storefront)
- [ ] **TC-STR-06**: `/store/[tenant]/products` — product grid with pagination
- [ ] **TC-STR-07**: Each product card shows image, name, price, rating
- [ ] **TC-STR-08**: Filter by category (sidebar) — products filtered
- [ ] **TC-STR-09**: Filter by price range — products filtered
- [ ] **TC-STR-10**: Sort by (newest, price low-high, price high-low, name, best selling)
- [ ] **TC-STR-11**: Search by keyword — results match
- [ ] **TC-STR-12**: Empty search results — "no products found" message
- [ ] **TC-STR-13**: Responsive grid — 2 cols on mobile, 3 on tablet, 4 on desktop

### 4.3 Product Detail (Storefront)
- [ ] **TC-STR-14**: `/store/[tenant]/products/[slug]` — product images, name, price, description
- [ ] **TC-STR-15**: Image gallery — click thumbnails to switch main image
- [ ] **TC-STR-16**: Variant selection (size/color) — price updates if variant-specific
- [ ] **TC-STR-17**: "Add to Cart" button — adds selected variant with quantity
- [ ] **TC-STR-18**: "Add to Wishlist" heart button — toggles on/off
- [ ] **TC-STR-19**: Quantity selector — increase/decrease, min 1
- [ ] **TC-STR-20**: Stock display — "In Stock" / "Low Stock" / "Out of Stock"
- [ ] **TC-STR-21**: Out of stock variant — "Add to Cart" disabled
- [ ] **TC-STR-22**: Reviews section — rating distribution, review list, average rating
- [ ] **TC-STR-23**: Share product link works

### 4.4 Shopping Cart
- [ ] **TC-CRT-01**: Click "Add to Cart" — item added, cart drawer slides in
- [ ] **TC-CRT-02**: Cart drawer shows items, quantity, price, subtotal
- [ ] **TC-CRT-03**: Update quantity in cart — total recalculated
- [ ] **TC-CRT-04**: Remove item from cart — item removed, total updated
- [ ] **TC-CRT-05**: Empty cart — "Your cart is empty" message with "Shop Now" CTA
- [ ] **TC-CRT-06**: `/store/[tenant]/cart` — full cart page with all items
- [ ] **TC-CRT-07**: Coupon code input — apply coupon, discount reflected in totals
- [ ] **TC-CRT-08**: Invalid coupon — error message shown
- [ ] **TC-CRT-09**: Remove coupon — discount removed
- [ ] **TC-CRT-10**: Shipping estimate selector (if configured)
- [ ] **TC-CRT-11**: Cart persists in localStorage for guest users
- [ ] **TC-CRT-12**: Cart merges after login (guest → authenticated cart)
- [ ] **TC-CRT-13**: Subtotal, shipping, tax, discount, total all calculated correctly

### 4.5 Customer Auth (Storefront)
- [ ] **TC-CSA-01**: `/store/[tenant]/auth/login` — login form for customers
- [ ] **TC-CSA-02**: `/store/[tenant]/auth/register` — registration form
- [ ] **TC-CSA-03**: Register new customer account — redirected to account page
- [ ] **TC-CSA-04**: Login with credentials — redirected to previous page or account
- [ ] **TC-CSA-05**: Logout — session cleared

### 4.6 Checkout
- [ ] **TC-CHK-01**: `/store/[tenant]/checkout` — guest can proceed without login
- [ ] **TC-CHK-02**: Logged-in customer — addresses pre-filled
- [ ] **TC-CHK-03**: Enter shipping address — all fields validated
- [ ] **TC-CHK-04**: Select shipping method — rate calculated and displayed
- [ ] **TC-CHK-05**: Apply coupon code — discount applied
- [ ] **TC-CHK-06**: Order summary shows items, subtotal, shipping, tax, discount, total
- [ ] **TC-CHK-07**: Place order as guest — order created, redirect to success page
- [ ] **TC-CHK-08**: Place order as logged-in customer — order created, linked to account
- [ ] **TC-CHK-09**: Stripe Checkout — redirected to Stripe, payment completed, back to success page
- [ ] **TC-CHK-10**: Stripe payment fails — error shown, retry option
- [ ] **TC-CHK-11**: `/store/[tenant]/checkout/success` — order confirmation with order number
- [ ] **TC-CHK-12**: Order confirmation email sent after successful checkout
- [ ] **TC-CHK-13**: Inventory deducted after order placement
- [ ] **TC-CHK-14**: Valid coupon applied and discount reflected in totals
- [ ] **TC-CHK-15**: Tax calculated correctly based on shipping address zone

### 4.7 Customer Account (Storefront)
- [ ] **TC-CAC-01**: `/store/[tenant]/account` — account overview with recent orders
- [ ] **TC-CAC-02**: `/store/[tenant]/account/profile` — edit name, email, password
- [ ] **TC-CAC-03**: `/store/[tenant]/account/orders` — order history list
- [ ] **TC-CAC-04**: Click order — order detail with items, status, address
- [ ] **TC-CAC-05**: `/store/[tenant]/account/addresses` — saved addresses list
- [ ] **TC-CAC-06**: Add new address — saved to address book
- [ ] **TC-CAC-07**: Edit address — changes saved
- [ ] **TC-CAC-08**: Delete address — removed
- [ ] **TC-CAC-09**: Set default address — used in checkout
- [ ] **TC-CAC-10**: `/store/[tenant]/account/loyalty` — points balance, tier, transaction history
- [ ] **TC-CAC-11**: `/store/[tenant]/account/notifications` — notification list, preferences

### 4.8 Wishlist
- [ ] **TC-WSH-01**: Guest user — add to wishlist, stored in session/localStorage
- [ ] **TC-WSH-02**: Logged-in user — add to wishlist, persisted to account
- [ ] **TC-WSH-03**: `/store/[tenant]/wishlist` — all wishlist items displayed
- [ ] **TC-WSH-04**: Remove item from wishlist — removed
- [ ] **TC-WSH-05**: Move item from wishlist to cart — added to cart, removed from wishlist
- [ ] **TC-WSH-06**: Share wishlist — generates shareable link
- [ ] **TC-WSH-07**: Open shared wishlist link — displays items (read-only)
- [ ] **TC-WSH-08**: Wishlist item count badge updates correctly
- [ ] **TC-WSH-09**: Sync wishlist across devices (after login)

### 4.9 Product Reviews (Storefront)
- [ ] **TC-SRV-01**: Review form on product detail page — rating (1-5), title, body, images
- [ ] **TC-SRV-02**: Submit review as non-purchaser — error (purchase required)
- [ ] **TC-SRV-03**: Submit review — success message, pending moderation
- [ ] **TC-SRV-04**: Review appears after merchant approves
- [ ] **TC-SRV-05**: Vote "Helpful" on a review — count increases
- [ ] **TC-SRV-06**: Vote "Not Helpful" — count increases
- [ ] **TC-SRV-07**: Report a review — form with reason, submitted
- [ ] **TC-SRV-08**: Rating distribution chart shows breakdown
- [ ] **TC-SRV-09**: Sort reviews by (most recent, highest rated, lowest rated, most helpful)

### 4.10 Search (Storefront)
- [ ] **TC-SRC-01**: `/store/[tenant]/search?q=keyword` — results page
- [ ] **TC-SRC-02**: Search by product name — matching products shown
- [ ] **TC-SRC-03**: Search by SKU — exact match shown
- [ ] **TC-SRC-04**: Search with no results — "No products found" message
- [ ] **TC-SRC-05**: Filters work with search (category, price range)
- [ ] **TC-SRC-06**: Search suggestions/autocomplete (if implemented)

### 4.11 Shared Wishlist
- [ ] **TC-SHW-01**: Navigate to `/store/[tenant]/shared-wishlist/[token]` — wishlist items displayed
- [ ] **TC-SHW-02**: Invalid/expired token — error message

---

## 5. Admin Panel

### 5.1 Admin Dashboard
- [ ] **TC-ADM-01**: `/admin` — platform-wide stats (total tenants, total orders, total revenue)
- [ ] **TC-ADM-02**: MRR (Monthly Recurring Revenue) displayed
- [ ] **TC-ADM-03**: Active tenants count
- [ ] **TC-ADM-04**: Platform churn rate

### 5.2 Admin Settings
- [ ] **TC-ADM-05**: `/admin/settings` — platform level settings
- [ ] **TC-ADM-06**: Default plan configuration
- [ ] **TC-ADM-07**: Platform-wide feature flags

---

## 6. API — Direct Endpoint Testing

> Use `curl`, Postman, or Bruno. All versioned endpoints require `x-tenant-id` header.

### 6.1 Health
- [ ] **TC-API-01**: `GET /api/v1/health` — returns `{ status: "ok" }`

### 6.2 Auth
- [ ] **TC-API-02**: `POST /api/auth/login` with valid credentials — returns user, sets cookie
- [ ] **TC-API-03**: `POST /api/auth/login` with invalid credentials — 401
- [ ] **TC-API-04**: `POST /api/auth/register` with new email — creates user, returns 201
- [ ] **TC-API-05**: `POST /api/auth/register` with existing email — 409
- [ ] **TC-API-06**: `POST /api/auth/logout` — clears session, 200
- [ ] **TC-API-07**: `GET /api/auth/me` with valid session — returns user
- [ ] **TC-API-08**: `GET /api/auth/me` without session — 401

### 6.3 Customer Auth (V1)
- [ ] **TC-API-09**: `POST /api/v1/auth/customer/register` — creates customer
- [ ] **TC-API-10**: `POST /api/v1/auth/customer/login` — returns customer session

### 6.4 Products API
- [ ] **TC-API-11**: `GET /api/v1/products` — returns paginated product list
- [ ] **TC-API-12**: `GET /api/v1/products?search=term` — filtered results
- [ ] **TC-API-13**: `GET /api/v1/products?categoryId=X` — filtered by category
- [ ] **TC-API-14**: `POST /api/v1/products` with valid body — creates product, returns 201
- [ ] **TC-API-15**: `POST /api/v1/products` without required fields — 400
- [ ] **TC-API-16**: `GET /api/v1/products/[id]` — returns product with variants
- [ ] **TC-API-17**: `PUT /api/v1/products/[id]` — updates product
- [ ] **TC-API-18**: `DELETE /api/v1/products/[id]` — soft-deletes product
- [ ] **TC-API-19**: `POST /api/v1/products/[id]/duplicate` — copies product
- [ ] **TC-API-20**: `POST /api/v1/products/bulk` — creates/updates multiple products
- [ ] **TC-API-21**: `POST /api/v1/products/generate-variants` — generates variants from options
- [ ] **TC-API-22**: `GET /api/v1/products/[id]/variants` — returns variants
- [ ] **TC-API-23**: `POST /api/v1/products/[id]/variants` — creates variant
- [ ] **TC-API-24**: `PUT /api/v1/products/[id]/variants/[vid]` — updates variant
- [ ] **TC-API-25**: `DELETE /api/v1/products/[id]/variants/[vid]` — deletes variant

### 6.5 Categories API
- [ ] **TC-API-26**: `GET /api/v1/categories` — category tree
- [ ] **TC-API-27**: `POST /api/v1/categories` — creates category
- [ ] **TC-API-28**: `PUT /api/v1/categories/[id]` — updates category
- [ ] **TC-API-29**: `DELETE /api/v1/categories/[id]` — deletes category

### 6.6 Orders API
- [ ] **TC-API-30**: `GET /api/v1/orders` — paginated orders
- [ ] **TC-API-31**: `POST /api/v1/orders` — creates order
- [ ] **TC-API-32**: `GET /api/v1/orders/[id]` — order detail
- [ ] **TC-API-33**: `PUT /api/v1/orders/[id]` — updates order
- [ ] **TC-API-34**: `PUT /api/v1/orders/[id]/status` — transitions status
- [ ] **TC-API-35**: `POST /api/v1/orders/[id]/refund` — processes refund
- [ ] **TC-API-36**: `POST /api/v1/orders/[id]/resend-confirmation` — resends email

### 6.7 Coupons & Promotions API
- [ ] **TC-API-37**: `POST /api/v1/coupons` — creates coupon
- [ ] **TC-API-38**: `POST /api/v1/coupons/validate` with valid code — returns coupon info
- [ ] **TC-API-39**: `POST /api/v1/coupons/validate` with expired code — error
- [ ] **TC-API-40**: `POST /api/v1/coupons/validate` with used-up code — error
- [ ] **TC-API-41**: `POST /api/v1/promotions` — creates promotion

### 6.8 Reviews API
- [ ] **TC-API-42**: `POST /api/v1/reviews` — creates review
- [ ] **TC-API-43**: `PUT /api/v1/reviews/[id]/moderate` — approve/hide review

### 6.9 Cart API
- [ ] **TC-API-44**: `GET /api/v1/cart` — returns cart
- [ ] **TC-API-45**: `POST /api/v1/cart` — adds item to cart
- [ ] **TC-API-46**: `POST /api/v1/cart/merge` — merges guest cart with authenticated

### 6.10 Inventory API
- [ ] **TC-API-47**: `GET /api/v1/inventory` — inventory list
- [ ] **TC-API-48**: `GET /api/v1/inventory/history` — change log

### 6.11 Warehouses API
- [ ] **TC-API-49**: `POST /api/v1/warehouses` — creates warehouse
- [ ] **TC-API-50**: `POST /api/v1/warehouses/reserve` — reserves stock
- [ ] **TC-API-51**: `POST /api/v1/warehouses/release` — releases reservation
- [ ] **TC-API-52**: `POST /api/v1/warehouses/allocate` — allocates stock
- [ ] **TC-API-53**: `GET /api/v1/warehouses/transfers` — transfer list

### 6.12 Checkout API
- [ ] **TC-API-54**: `POST /api/v1/checkout` — processes checkout
- [ ] **TC-API-55**: `POST /api/v1/checkout/stripe-session` — creates Stripe session

### 6.13 Analytics & Reports API
- [ ] **TC-API-56**: `GET /api/v1/analytics/merchant` — merchant analytics data
- [ ] **TC-API-57**: `GET /api/v1/reports/sales` — sales report CSV/JSON
- [ ] **TC-API-58**: `GET /api/v1/dashboard/stats` — dashboard stats

### 6.14 Settings API
- [ ] **TC-API-59**: `GET /api/v1/settings` — store settings
- [ ] **TC-API-60**: `PUT /api/v1/settings` — update settings

### 6.15 Error Handling & Validation
- [ ] **TC-API-61**: Request without `x-tenant-id` header — 400/401
- [ ] **TC-API-62**: Request with invalid `x-tenant-id` — 401
- [ ] **TC-API-63**: Request with malformed JSON body — 400
- [ ] **TC-API-64**: Request exceeding rate limit (100 req/min) — 429
- [ ] **TC-API-65**: Request to non-existent route — 404

---

## 7. Multi-Tenancy

- [ ] **TC-MTN-01**: Tenant A's data not visible in Tenant B's dashboard
- [ ] **TC-MTN-02**: Tenant A's storefront at `/store/tenant-a-slug` loads correctly
- [ ] **TC-MTN-03**: Tenant B's storefront at `/store/tenant-b-slug` shows different data
- [ ] **TC-MTN-04**: API with `x-tenant-id: A` returns only Tenant A products
- [ ] **TC-MTN-05**: API with `x-tenant-id: B` returns only Tenant B products

---

## 8. File Upload

- [ ] **TC-UPL-01**: Upload product image — file uploaded, URL returned
- [ ] **TC-UPL-02**: Upload invalid file type (e.g. .exe) — error
- [ ] **TC-UPL-03**: Upload file exceeding size limit — error
- [ ] **TC-UPL-04**: Upload multiple images at once — all uploaded
- [ ] **TC-UPL-05**: `POST /api/v1/upload` — returns file URL
- [ ] **TC-UPL-06**: `POST /api/v1/upload/signed` — returns signed upload URL

---

## 9. Webhooks

### 9.1 Stripe Webhook
- [ ] **TC-WHK-01**: Stripe checkout.session.completed event — order marked paid
- [ ] **TC-WHK-02**: Stripe payment_intent.payment_failed — order marked failed
- [ ] **TC-WHK-03**: Stripe charge.refunded — refund processed
- [ ] **TC-WHK-04**: Webhook with invalid signature — rejected 401
- [ ] **TC-WHK-05**: Duplicate webhook event — idempotent (not processed twice)

### 9.2 Khalti / eSewa Webhooks
- [ ] **TC-WHK-06**: Khalti payment verification callback works
- [ ] **TC-WHK-07**: eSewa payment verification callback works

---

## 10. Real-Time (WebSocket)

- [ ] **TC-WS-01**: WebSocket server starts on port 3001
- [ ] **TC-WS-02**: Dashboard connects to WS on page load
- [ ] **TC-WS-03**: New order event pushed to dashboard in real time
- [ ] **TC-WS-04**: Order status change pushed in real time
- [ ] **TC-WS-05**: Notification event pushed via WebSocket
- [ ] **TC-WS-06**: Connection lost — auto-reconnect with backoff
- [ ] **TC-WS-07**: History replay on reconnect (last 50 events)
- [ ] **TC-WS-08**: Heartbeat/pong keeps connection alive
- [ ] **TC-WS-09**: Unauthenticated WS connection rejected

---

## 11. Background Jobs (BullMQ + Redis)

- [ ] **TC-BGJ-01**: Redis connection succeeds (check `bun run workers:start`)
- [ ] **TC-BGJ-02**: Order confirmation email job enqueued on order creation
- [ ] **TC-BGJ-03**: Shipping confirmation email enqueued on ship status
- [ ] **TC-BGJ-04**: Inventory sync job enqueued on stock change
- [ ] **TC-BGJ-05**: Low stock check job enqueued and runs
- [ ] **TC-BGJ-06**: Notification delivery job enqueued
- [ ] **TC-BGJ-07**: Webhook delivery job enqueued and delivered
- [ ] **TC-BGJ-08**: Failed jobs retry with exponential backoff
- [ ] **TC-BGJ-09**: Dead-letter queue receives exhausted retries
- [ ] **TC-BGJ-10**: Worker process shuts down gracefully on SIGTERM

---

## 12. Security

### 12.1 Rate Limiting
- [ ] **TC-SEC-01**: Send 101 requests in 1 minute — 101st request gets 429
- [ ] **TC-SEC-02**: After rate limit window expires — requests succeed again

### 12.2 Headers
- [ ] **TC-SEC-03**: Response includes CSP headers
- [ ] **TC-SEC-04**: Response includes HSTS header (production)
- [ ] **TC-SEC-05**: Response includes X-Frame-Options
- [ ] **TC-SEC-06**: Response includes X-Content-Type-Options

### 12.3 Auth Security
- [ ] **TC-SEC-07**: Session cookie is httpOnly (not accessible via JS)
- [ ] **TC-SEC-08**: Session cookie has Secure flag in production
- [ ] **TC-SEC-09**: Session cookie has SameSite=Lax
- [ ] **TC-SEC-10**: CSRF protection on mutation endpoints (if implemented)

### 12.4 API Security
- [ ] **TC-SEC-11**: API key auth works (generate key → use in Authorization header)
- [ ] **TC-SEC-12**: Revoked API key — returns 401
- [ ] **TC-SEC-13**: API key without required scope — returns 403
- [ ] **TC-SEC-14**: SQL injection attempt on search — no data leak

---

## 13. Audit Logging

- [ ] **TC-AUD-01**: Create product — audit log entry created
- [ ] **TC-AUD-02**: Update product — audit log shows before/after
- [ ] **TC-AUD-03**: Delete product — audit log entry created
- [ ] **TC-AUD-04**: `GET /api/v1/audit-logs` — returns log entries filtered by entity
- [ ] **TC-AUD-05**: Pagination works on audit log endpoint

---

## 14. Feature Gating (Plan Limits)

- [ ] **TC-FTG-01**: Starter plan — create 11th product when limit is 10 — blocked
- [ ] **TC-FTG-02**: Growth plan — create products beyond Starter limit — allowed
- [ ] **TC-FTG-03**: Staff count limited by plan — adding more than limit blocked
- [ ] **TC-FTG-04**: Feature gate for analytics — Starter plan sees basic stats only

---

## 15. Responsive Design & UX

- [ ] **TC-RSP-01**: Dashboard sidebar collapses on mobile (<768px)
- [ ] **TC-RSP-02**: Product grid on storefront — 2 cols on mobile, 4 on desktop
- [ ] **TC-RSP-03**: Cart drawer full-screen on mobile
- [ ] **TC-RSP-04**: Forms scrollable and usable on mobile
- [ ] **TC-RSP-05**: Data tables have horizontal scroll on mobile
- [ ] **TC-RSP-06**: Toast notifications display correctly on all screen sizes
- [ ] **TC-RSP-07**: Touch interactions work on mobile (swipe, tap)
- [ ] **TC-RSP-08**: Loading skeletons display during data fetch
- [ ] **TC-RSP-09**: Error states show retry button on API failure
- [ ] **TC-RSP-10**: Empty states have appropriate CTAs

---

## 16. Error & Edge Cases

### 16.1 Network & Loading
- [ ] **TC-ERR-01**: Slow network — loading skeletons/spinners shown
- [ ] **TC-ERR-02**: API returns 500 — error state with retry button
- [ ] **TC-ERR-03**: Network offline — appropriate error message
- [ ] **TC-ERR-04**: Concurrent requests handled correctly (no double-submit)

### 16.2 Data Integrity
- [ ] **TC-ERR-05**: Create order with out-of-stock variant — error, order not created
- [ ] **TC-ERR-06**: Double-click "Place Order" — order created only once
- [ ] **TC-ERR-07**: Delete a category with products — prompt to reassign
- [ ] **TC-ERR-08**: Try to delete a product with active orders — warning shown
- [ ] **TC-ERR-09**: Session expires mid-operation — redirect to login, state preserved

### 16.3 Concurrent Operations
- [ ] **TC-ERR-10**: Two users edit the same product simultaneously — last save wins
- [ ] **TC-ERR-11**: Stock reserved by one order, another order tries to reserve same stock — blocked

---

## 17. Admin Platform (Multi-Tenant)
- [ ] **TC-SUP-01**: Admin can view all tenants' data
- [ ] **TC-SUP-02**: Admin can impersonate a tenant store
- [ ] **TC-SUP-03**: Platform-level subscription plan management

---

## Summary Section

### Test Coverage Legend
- **TC-REG** = Registration
- **TC-LOG** = Login
- **TC-SES** = Session
- **TC-ROL** = Roles
- **TC-LND** = Landing
- **TC-DSH** = Dashboard
- **TC-PRD** = Products
- **TC-VAR** = Variants
- **TC-CAT** = Categories
- **TC-ORD** = Orders
- **TC-CUS** = Customers
- **TC-ANL** = Analytics
- **TC-CPN** = Coupons
- **TC-PRO** = Promotions
- **TC-REV** = Reviews (Dashboard)
- **TC-INV** = Inventory
- **TC-WRH** = Warehouses
- **TC-SHP** = Shipping
- **TC-TAX** = Tax
- **TC-CMS** = CMS
- **TC-BNR** = Banners
- **TC-STF** = Storefront
- **TC-LOY** = Loyalty
- **TC-SET** = Settings
- **TC-BIL** = Billing
- **TC-NOT** = Notifications
- **TC-STR** = Storefront
- **TC-CRT** = Cart
- **TC-CSA** = Customer Auth
- **TC-CHK** = Checkout
- **TC-CAC** = Customer Account
- **TC-WSH** = Wishlist
- **TC-SRV** = Storefront Reviews
- **TC-SRC** = Search
- **TC-SHW** = Shared Wishlist
- **TC-ADM** = Admin
- **TC-API** = API
- **TC-MTN** = Multi-Tenancy
- **TC-UPL** = Upload
- **TC-WHK** = Webhooks
- **TC-WS** = WebSocket
- **TC-BGJ** = Background Jobs
- **TC-SEC** = Security
- **TC-AUD** = Audit
- **TC-FTG** = Feature Gate
- **TC-RSP** = Responsive
- **TC-ERR** = Error/Edge

**Total test cases: ~360**
