import { getPrisma } from '../prisma';
import { redisClient } from '../redis';
import { StockAddedEvent, StockReducedEvent, StockReservedEvent, StockReleasedEvent } from './events';

type TransactionBody = (tx: any) => Promise<any>;

export class InventoryService {
  /**
   * Add stock to a variant.
   */
  async addStock(variantId: string, amount: number, tenantId: string): Promise<void> {
    const event: StockAddedEvent = { type: 'stock_added', variantId, amount, tenantId };
    await this.#withTransaction(async (tx: any) => {
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { variantId, tenantId },
      });
      const newQuantity = inventory.quantity + amount;
      await tx.inventory.update({
        where: { variantId, tenantId },
        data: { quantity: newQuantity },
      });
      await tx.inventoryLog.create({
        data: {
          variantId,
          tenantId,
          action: 'ADD',
          amount,
          newQuantity,
        },
      });
      await redisClient!.publish(InventoryService.makeEventChannel(tenantId), JSON.stringify(event));
    });
  }

  /**
   * Reduce stock (e.g., after sale).
   */
  async reduceStock(variantId: string, amount: number, tenantId: string): Promise<void> {
    const event: StockReducedEvent = { type: 'stock_reduced', variantId, amount, tenantId };
    await this.#withTransaction(async (tx: any) => {
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { variantId, tenantId },
      });
      if (inventory.quantity < amount) {
        throw new Error('Insufficient stock');
      }
      const newQuantity = inventory.quantity - amount;
      await tx.inventory.update({
        where: { variantId, tenantId },
        data: { quantity: newQuantity },
      });
      await tx.inventoryLog.create({
        data: {
          variantId,
          tenantId,
          action: 'REDUCE',
          amount,
          newQuantity,
        },
      });
      await redisClient!.publish(InventoryService.makeEventChannel(tenantId), JSON.stringify(event));
    });
  }

  /**
   * Reserve stock for a reservation.
   */
  async reserveStock(
    variantId: string,
    amount: number,
    reservationId: string,
    tenantId: string,
  ): Promise<void> {
    const event: StockReservedEvent = { type: 'stock_reserved', variantId, amount, reservationId, tenantId };
    await this.#withTransaction(async (tx: any) => {
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { variantId, tenantId },
      });
      if (inventory.quantity < amount) {
        throw new Error('Insufficient stock for reservation');
      }
      const newQuantity = inventory.quantity - amount;
      await tx.inventory.update({
        where: { variantId, tenantId },
        data: { quantity: newQuantity },
      });
      // Store reservation (simple approach: just a log entry)
      await tx.inventoryReservation.create({
        data: {
          variantId,
          tenantId,
          reservationId,
          amount,
        },
      });
      await redisClient!.publish(InventoryService.makeEventChannel(tenantId), JSON.stringify(event));
    });
  }

  /**
   * Release a previous reservation, returning stock to inventory.
   */
  async releaseReserve(
    variantId: string,
    amount: number,
    reservationId: string,
    tenantId: string,
  ): Promise<void> {
    const event: StockReleasedEvent = { type: 'stock_released', variantId, amount, reservationId, tenantId };
    await this.#withTransaction(async (tx: any) => {
      // Return stock
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { variantId, tenantId },
      });
      const newQuantity = inventory.quantity + amount;
      await tx.inventory.update({
        where: { variantId, tenantId },
        data: { quantity: newQuantity },
      });
      // Delete reservation
      await tx.inventoryReservation.delete({
        where: { variantId_reservationId_tenantId: { variantId, reservationId, tenantId } },
      });
      await redisClient!.publish(InventoryService.makeEventChannel(tenantId), JSON.stringify(event));
    });
  }

  /**
   * Internal helper that wraps database operations in a serializable transaction.
   */
  async #withTransaction(callback: TransactionBody): Promise<any> {
    const prisma = getPrisma();
    // Prisma $transaction expects an array of operations or a callback that receives a transaction client.
    // We use the callback form for serializability.
    return prisma.$transaction(async (tx: any) => {
      return callback(tx);
    });
  }

  /**
   * Build a Redis channel name for a tenant.
   */
  static makeEventChannel(tenantId: string): string {
    return `inventory:${tenantId}:events`;
  }
}
