import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";

@Entity("role_permissions")
@Unique(["role_id", "permission_id"])
@Index(["role_id", "permission_id"])
export class RolePermission extends BaseAuditColumns {
  @Column({ type: "uuid" })
  role_id: string;

  @Column({ type: "uuid" })
  permission_id: string;

  @Column({ type: "varchar" })
  module_slug: string;

  @Column({ type: "varchar" })
  permission_slug: string;

  @Column({ type: "boolean" })
  is_allowed: boolean;

  @ManyToOne(() => Role)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: "permission_id" })
  permission: Permission;
}
