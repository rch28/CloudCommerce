export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PAID: "paid",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PAID, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PAID]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.REFUNDED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.REFUNDED],
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.REFUNDED]: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(status: string): string[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

export const STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUSES.PENDING]: "Pending",
  [ORDER_STATUSES.CONFIRMED]: "Confirmed",
  [ORDER_STATUSES.PAID]: "Paid",
  [ORDER_STATUSES.SHIPPED]: "Shipped",
  [ORDER_STATUSES.DELIVERED]: "Delivered",
  [ORDER_STATUSES.CANCELLED]: "Cancelled",
  [ORDER_STATUSES.REFUNDED]: "Refunded",
};
