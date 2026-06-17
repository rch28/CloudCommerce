export type Role = "owner" | "staff" | "customer";

export type Permission = "create" | "read" | "update" | "delete" | "archive";

const rolePermissions: Record<Role, Permission[]> = {
  owner: ["create", "read", "update", "delete", "archive"],
  staff: ["create", "read", "update"],
  customer: [],
};

export function mapRole(role?: string): Role {
  switch (role) {
    case "admin": return "owner";
    case "merchant": return "staff";
    default: return "customer";
  }
}

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role].includes(permission);
}
