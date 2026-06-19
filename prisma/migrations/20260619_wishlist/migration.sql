-- Wishlist feature: Wishlist + WishlistItem

CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "sessionId" TEXT,
    "shareToken" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Wishlist_customerId_tenantId_key" UNIQUE ("customerId", "tenantId"),
    CONSTRAINT "Wishlist_shareToken_key" UNIQUE ("shareToken")
);

CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WishlistItem_wishlistId_variantId_key" UNIQUE ("wishlistId", "variantId")
);

CREATE INDEX IF NOT EXISTS "Wishlist_sessionId_idx" ON "Wishlist"("sessionId");
CREATE INDEX IF NOT EXISTS "Wishlist_shareToken_idx" ON "Wishlist"("shareToken");
CREATE INDEX IF NOT EXISTS "Wishlist_tenantId_idx" ON "Wishlist"("tenantId");
CREATE INDEX IF NOT EXISTS "WishlistItem_wishlistId_idx" ON "WishlistItem"("wishlistId");

ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
