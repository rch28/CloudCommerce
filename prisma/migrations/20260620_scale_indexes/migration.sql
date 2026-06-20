-- Scale Indexes: Performance optimization for 10k+ stores, 100k+ products, 1M+ orders
-- Migration date: 2026-06-19

-- Product query indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_tenantId_status_deletedAt_idx" ON "Product"("tenantId", "status", "deletedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_tenantId_deletedAt_createdAt_idx" ON "Product"("tenantId", "deletedAt", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_status_idx" ON "Product"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

-- Variant query indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductVariant_status_idx" ON "ProductVariant"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- Order query indexes (critical for merchant dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_tenantId_status_createdAt_idx" ON "Order"("tenantId", "status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_tenantId_createdAt_idx" ON "Order"("tenantId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_paymentIntentId_idx" ON "Order"("paymentIntentId");

-- OrderItem index for order detail queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- Cart query indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Cart_tenantId_idx" ON "Cart"("tenantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Cart_customerId_idx" ON "Cart"("customerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CartItem_cartId_idx" ON "CartItem"("cartId");

-- Customer query indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId");

-- Inventory query indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Inventory_tenantId_quantity_idx" ON "Inventory"("tenantId", "quantity");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "InventoryLog_variantId_createdAt_idx" ON "InventoryLog"("variantId", "createdAt" DESC);

-- Audit log indexes (for order timeline and entity history)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- Notification query indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_tenantId_userId_createdAt_idx" ON "Notification"("tenantId", "userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- Webhook indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WebhookEvent_status_nextRetryAt_idx" ON "WebhookEvent"("status", "nextRetryAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WebhookLog_webhookId_idx" ON "WebhookLog"("webhookId");

-- Session query index
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- User index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
