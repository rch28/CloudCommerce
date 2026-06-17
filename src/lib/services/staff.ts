import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { inviteStaffSchema, updateStaffRoleSchema } from "@/lib/schemas";

interface StaffRecord {
  id: string; tenantId: string; email: string; role: string;
  invitedAt: Date; acceptedAt: Date | null;
}

const mockStaff: Record<string, StaffRecord[]> = {};

export async function listStaff(tenantId: string): Promise<StaffRecord[]> {
  if (process.env.DATABASE_URL) {
    return (prisma as any).staffMember.findMany({ where: { tenantId } }) as unknown as StaffRecord[];
  }
  return [...(mockStaff[tenantId] ?? [])];
}

export async function inviteStaff(data: { email: string; role?: string }, tenantId: string, userId?: string): Promise<StaffRecord> {
  const parsed = inviteStaffSchema.parse(data);
  const { email, role } = parsed;

  if (process.env.DATABASE_URL) {
    const existing = await (prisma as any).staffMember.findUnique({ where: { email_tenantId: { email, tenantId } } });
    if (existing) throw new Error("Staff member already invited");

    const member = await (prisma as any).staffMember.create({
      data: { email, role: role ?? "staff", tenantId },
    });
    await logAudit({ entityType: "staff", entityId: member.id, action: "invited", changes: { email, role }, userId, tenantId });
    return member as unknown as StaffRecord;
  }

  const list = mockStaff[tenantId] ?? [];
  if (list.find((s) => s.email === email)) throw new Error("Staff member already invited");

  const member: StaffRecord = {
    id: `staff-${Date.now()}`, tenantId, email, role: role ?? "staff",
    invitedAt: new Date(), acceptedAt: null,
  };
  list.push(member);
  mockStaff[tenantId] = list;

  await logAudit({ entityType: "staff", entityId: member.id, action: "invited", changes: { email, role }, userId, tenantId });
  return member;
}

export async function removeStaff(staffId: string, tenantId: string, userId?: string): Promise<void> {
  if (process.env.DATABASE_URL) {
    const member = await (prisma as any).staffMember.findFirst({ where: { id: staffId, tenantId } });
    if (!member) throw new Error("Staff member not found");
    await (prisma as any).staffMember.delete({ where: { id: staffId } });
    await logAudit({ entityType: "staff", entityId: staffId, action: "removed", changes: { email: member.email }, userId, tenantId });
    return;
  }

  const list = mockStaff[tenantId] ?? [];
  const idx = list.findIndex((s) => s.id === staffId);
  if (idx === -1) throw new Error("Staff member not found");
  const [removed] = list.splice(idx, 1);
  mockStaff[tenantId] = list;
  await logAudit({ entityType: "staff", entityId: staffId, action: "removed", changes: { email: removed.email }, userId, tenantId });
}

export async function updateStaffRole(data: { staffId: string; role: string }, tenantId: string, userId?: string): Promise<StaffRecord> {
  const parsed = updateStaffRoleSchema.parse(data);
  const { staffId, role } = parsed;

  if (process.env.DATABASE_URL) {
    const member = await (prisma as any).staffMember.findFirst({ where: { id: staffId, tenantId } });
    if (!member) throw new Error("Staff member not found");
    const updated = await (prisma as any).staffMember.update({ where: { id: staffId }, data: { role } });
    await logAudit({ entityType: "staff", entityId: staffId, action: "role_changed", changes: { email: member.email, from: member.role, to: role }, userId, tenantId });
    return updated as unknown as StaffRecord;
  }

  const list = mockStaff[tenantId] ?? [];
  const idx = list.findIndex((s) => s.id === staffId);
  if (idx === -1) throw new Error("Staff member not found");
  const prevRole = list[idx].role;
  list[idx].role = role;
  await logAudit({ entityType: "staff", entityId: staffId, action: "role_changed", changes: { email: list[idx].email, from: prevRole, to: role }, userId, tenantId });
  return { ...list[idx] };
}
