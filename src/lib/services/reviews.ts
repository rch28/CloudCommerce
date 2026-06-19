import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { reviewCache } from "@/lib/redis";

interface EligibilityContext {
  customerId: string;
  orderItemId: string;
  tenantId: string;
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}

export async function validateReviewEligibility(ctx: EligibilityContext): Promise<{ eligible: boolean; error?: string }> {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: ctx.orderItemId },
    include: {
      order: { select: { customerId: true, status: true, tenantId: true } },
    },
  });

  if (!orderItem) {
    return { eligible: false, error: "Order item not found" };
  }

  if (orderItem.order.tenantId !== ctx.tenantId) {
    return { eligible: false, error: "Order item not found" };
  }

  if (orderItem.order.customerId !== ctx.customerId) {
    return { eligible: false, error: "You can only review your own purchases" };
  }

  if (orderItem.order.status !== "delivered") {
    return { eligible: false, error: "You can only review delivered items" };
  }

  const existing = await prisma.review.findUnique({
    where: { orderItemId_customerId: { orderItemId: ctx.orderItemId, customerId: ctx.customerId } },
  });

  if (existing) {
    return { eligible: false, error: "You have already reviewed this item" };
  }

  return { eligible: true };
}

export function canReview(orderStatus: string): boolean {
  return orderStatus === "delivered";
}

export async function calculateRatingStats(productId: string): Promise<ReviewStats> {
  const reviews = await prisma.review.findMany({
    where: { productId, status: "approved" },
    select: { rating: true },
  });

  const count = reviews.length;
  if (count === 0) {
    return { averageRating: 0, reviewCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const r of reviews) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    sum += r.rating;
  }

  return {
    averageRating: Math.round((sum / count) * 100) / 100,
    reviewCount: count,
    distribution,
  };
}

async function updateProductRating(productId: string): Promise<void> {
  const stats = await calculateRatingStats(productId);
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
    },
  });
  await reviewCache.invalidate(productId);
}

export async function createReview(data: {
  productId: string;
  orderItemId: string;
  customerId: string;
  tenantId: string;
  rating: number;
  title?: string;
  body?: string;
  images?: Array<{ url: string; alt?: string; sortOrder?: number }>;
  userId?: string;
}) {
  const eligibility = await validateReviewEligibility({
    customerId: data.customerId,
    orderItemId: data.orderItemId,
    tenantId: data.tenantId,
  });

  if (!eligibility.eligible) {
    throw new Error(eligibility.error || "Not eligible to review");
  }

  const review = await prisma.review.create({
    data: {
      productId: data.productId,
      orderItemId: data.orderItemId,
      customerId: data.customerId,
      tenantId: data.tenantId,
      rating: data.rating,
      title: data.title ?? null,
      body: data.body ?? null,
      isVerified: true,
      images: data.images && data.images.length > 0 ? {
        create: data.images.map((img, i) => ({
          url: img.url,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder ?? i,
        })),
      } : undefined,
    },
    include: { images: true, customer: { select: { name: true } } },
  });

  await logAudit({
    entityType: "review",
    entityId: review.id,
    action: "created",
    changes: { productId: data.productId, rating: data.rating },
    userId: data.userId,
    tenantId: data.tenantId,
  });

  await updateProductRating(data.productId);

  return review;
}

export async function updateReview(
  reviewId: string,
  data: { rating?: number; title?: string; body?: string; images?: Array<{ url: string; alt?: string; sortOrder?: number }> },
  customerId: string,
  tenantId: string,
  userId?: string,
) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");
  if (review.customerId !== customerId) throw new Error("You can only edit your own reviews");

  const updateData: Record<string, unknown> = {};
  if (data.rating !== undefined) updateData.rating = data.rating;
  if (data.title !== undefined) updateData.title = data.title ?? null;
  if (data.body !== undefined) updateData.body = data.body ?? null;

  const images = data.images;
  if (images) {
    await prisma.reviewImage.deleteMany({ where: { reviewId } });
    if (images.length > 0) {
      await prisma.reviewImage.createMany({
        data: images.map((img, i) => ({
          reviewId,
          url: img.url,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder ?? i,
        })),
      });
    }
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: updateData,
    include: { images: true, customer: { select: { name: true } } },
  });

  await logAudit({
    entityType: "review",
    entityId: reviewId,
    action: "updated",
    changes: data,
    userId,
    tenantId,
  });

  await updateProductRating(review.productId);

  return updated;
}

export async function deleteReview(reviewId: string, customerId: string, tenantId: string, userId?: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");
  if (review.customerId !== customerId) throw new Error("You can only delete your own reviews");

  await prisma.reviewImage.deleteMany({ where: { reviewId } });
  await prisma.reviewVote.deleteMany({ where: { reviewId } });
  await prisma.reviewReply.deleteMany({ where: { reviewId } });
  await prisma.report.deleteMany({ where: { reviewId } });
  await prisma.review.delete({ where: { id: reviewId } });

  await logAudit({
    entityType: "review",
    entityId: reviewId,
    action: "deleted",
    userId,
    tenantId,
  });

  await updateProductRating(review.productId);
}

export async function moderateReview(
  reviewId: string,
  status: "approved" | "hidden",
  moderatedBy: string,
  tenantId: string,
  userId?: string,
) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, tenantId } });
  if (!review) throw new Error("Review not found");

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { status, moderatedBy, moderatedAt: new Date() },
    include: { images: true, customer: { select: { name: true } } },
  });

  await logAudit({
    entityType: "review",
    entityId: reviewId,
    action: "moderated",
    changes: { from: review.status, to: status },
    userId,
    tenantId,
  });

  await updateProductRating(review.productId);

  return updated;
}

export async function replyToReview(
  reviewId: string,
  body: string,
  userId: string | undefined,
  tenantId: string,
) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, tenantId } });
  if (!review) throw new Error("Review not found");

  const existing = await prisma.reviewReply.findUnique({ where: { reviewId } });
  if (existing) {
    const updated = await prisma.reviewReply.update({
      where: { reviewId },
      data: { body },
    });

    await logAudit({
      entityType: "review_reply",
      entityId: updated.id,
      action: "updated",
      changes: { reviewId },
      userId,
      tenantId,
    });

    return updated;
  }

  const reply = await prisma.reviewReply.create({
    data: { reviewId, body, userId: userId ?? null },
  });

  await logAudit({
    entityType: "review_reply",
    entityId: reply.id,
    action: "created",
    changes: { reviewId },
    userId,
    tenantId,
  });

  return reply;
}

export async function reportReview(
  reviewId: string,
  reason: string,
  description: string | undefined,
  reportedBy: string | undefined,
  tenantId: string,
  userId?: string,
) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, tenantId } });
  if (!review) throw new Error("Review not found");

  const report = await prisma.report.create({
    data: {
      reviewId,
      reason,
      description: description ?? null,
      reportedBy: reportedBy ?? null,
      tenantId,
    },
  });

  await logAudit({
    entityType: "report",
    entityId: report.id,
    action: "reported",
    changes: { reviewId, reason },
    userId,
    tenantId,
  });

  return report;
}

export async function voteReview(
  reviewId: string,
  customerId: string,
  helpful: boolean,
  tenantId: string,
) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, tenantId } });
  if (!review) throw new Error("Review not found");

  const existing = await prisma.reviewVote.findUnique({
    where: { reviewId_customerId: { reviewId, customerId } },
  });

  if (existing) {
    return prisma.reviewVote.update({
      where: { id: existing.id },
      data: { helpful },
    });
  }

  return prisma.reviewVote.create({
    data: { reviewId, customerId, helpful },
  });
}

export async function listReviews(
  tenantId: string,
  opts: {
    productId?: string;
    status?: string;
    customerId?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { tenantId };
  if (opts.productId) where.productId = opts.productId;
  if (opts.status) where.status = opts.status;
  if (opts.customerId) where.customerId = opts.customerId;

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        customer: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
        reply: true,
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items: items.map(({ _count, ...r }) => ({
      ...r,
      rating: r.rating,
      voteCount: _count.votes,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getReviewDetail(reviewId: string, tenantId: string) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, tenantId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      customer: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
      reply: true,
      _count: { select: { votes: true } },
    },
  });

  if (!review) return null;

  const { _count, ...rest } = review;
  return { ...rest, voteCount: _count.votes };
}

export async function listStorefrontReviews(
  productId: string,
  opts: { page?: number; pageSize?: number; sort?: "recent" | "highest" | "lowest" },
) {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const orderBy: Record<string, string> =
    opts.sort === "highest" ? { rating: "desc" } :
    opts.sort === "lowest" ? { rating: "asc" } :
    { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId, status: "approved" },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 3 },
        customer: { select: { name: true } },
        reply: true,
        _count: { select: { votes: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.review.count({ where: { productId, status: "approved" } }),
  ]);

  return {
    items: items.map(({ _count, ...r }) => ({
      ...r,
      voteCount: _count.votes,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
