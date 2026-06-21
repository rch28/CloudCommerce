import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

type EntityType = "product" | "category" | "variant" | "product_image" | "product_option" | "inventory";
type Action = "created" | "updated" | "deleted" | "archived";

export interface AuditMeta {
  tenantId: string;
  userId?: string;
}

export interface PaginateParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getPrismaModel(name: string): any {
  if (!process.env.DATABASE_URL) return undefined;
  return (prisma as any)[name];
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected abstract entityType: EntityType;
  protected abstract modelName: string;

  protected get model(): any {
    return (prisma as any)[this.modelName];
  }

  async findMany(where: Record<string, unknown>, params: PaginateParams = {}): Promise<PaginatedResult<T>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const finalWhere = where.deletedAt !== undefined ? where : { ...where, deletedAt: null };

    const [items, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        orderBy: params.orderBy ? { [params.orderBy]: params.order || "desc" } : { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.model.count({ where: finalWhere }),
    ]);

    return { items: items as T[], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findFirst({ where: { id, deletedAt: null } }) as Promise<T | null>;
  }

  async create(data: CreateInput, meta: AuditMeta): Promise<T> {
    const record = await this.model.create({ data });
    await logAudit({
      entityType: this.entityType,
      entityId: record.id,
      action: "created",
      changes: data as Record<string, unknown>,
      userId: meta.userId,
      tenantId: meta.tenantId,
    });
    return record as T;
  }

  async update(id: string, data: UpdateInput, meta: AuditMeta): Promise<T> {
    const before = await this.model.findUnique({ where: { id } });
    const after = await this.model.update({ where: { id }, data });
    await logAudit({
      entityType: this.entityType,
      entityId: id,
      action: "updated",
      changes: { before, after: data },
      userId: meta.userId,
      tenantId: meta.tenantId,
    });
    return after as T;
  }

  async softDelete(id: string, meta: AuditMeta): Promise<T> {
    const record = await this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAudit({
      entityType: this.entityType,
      entityId: id,
      action: "deleted",
      changes: { softDelete: true },
      userId: meta.userId,
      tenantId: meta.tenantId,
    });
    return record as T;
  }

  async hardDelete(id: string, meta: AuditMeta): Promise<void> {
    await this.model.delete({ where: { id } });
    await logAudit({
      entityType: this.entityType,
      entityId: id,
      action: "deleted",
      changes: { hardDelete: true },
      userId: meta.userId,
      tenantId: meta.tenantId,
    });
  }
}
