export type StockAddedEvent = {
  type: 'stock_added';
  variantId: string;
  amount: number;
  tenantId: string;
};

export type StockReducedEvent = {
  type: 'stock_reduced';
  variantId: string;
  amount: number;
  tenantId: string;
};

export type StockReservedEvent = {
  type: 'stock_reserved';
  variantId: string;
  amount: number;
  reservationId: string;
  tenantId: string;
};

export type StockReleasedEvent = {
  type: 'stock_released';
  variantId: string;
  amount: number;
  reservationId: string;
  tenantId: string;
};

export const makeEventChannel = (tenantId: string) => `inventory:${tenantId}:events`;
