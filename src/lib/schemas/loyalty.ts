import { z } from "zod/v4";

export const rewardRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["earn_points", "redeem_discount", "redeem_free_shipping"]),
  eventType: z.enum(["purchase", "signup", "referral", "review", "birthday"]),
  points: z.coerce.number().int().min(1, "Points must be at least 1"),
  value: z.coerce.number().min(0).optional(),
  valueType: z.enum(["fixed", "percentage"]).optional(),
  minPoints: z.coerce.number().int().min(0).optional(),
  maxRedemptions: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  startsAt: z.union([z.string().datetime(), z.date()]).optional(),
  endsAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export type RewardRuleInput = z.infer<typeof rewardRuleSchema>;

export const loyaltySettingsSchema = z.object({
  pointsPerCurrency: z.coerce.number().min(0.01).default(1),
  signupPoints: z.coerce.number().int().min(0).default(100),
  referralPoints: z.coerce.number().int().min(0).default(50),
  reviewPoints: z.coerce.number().int().min(0).default(25),
  birthdayPoints: z.coerce.number().int().min(0).default(50),
});

export type LoyaltySettingsInput = z.infer<typeof loyaltySettingsSchema>;

export const pointsAdjustSchema = z.object({
  customerId: z.string().min(1),
  points: z.coerce.number().int(),
  reason: z.string().min(1).max(500),
});

export type PointsAdjustInput = z.infer<typeof pointsAdjustSchema>;

export const redeemPointsSchema = z.object({
  customerId: z.string().min(1),
  points: z.coerce.number().int().min(1),
  redemptionType: z.enum(["redeem_discount", "redeem_free_shipping"]),
});

export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;
