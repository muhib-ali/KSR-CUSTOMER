import { Entity, Column, Unique, ManyToOne, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { RoleType } from "./role-type.entity";

@Entity("roles")
@Unique(["slug"])
export class Role extends BaseAuditColumns {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "uuid" })
  role_type_id: string;

  @ManyToOne(() => RoleType)
  @JoinColumn({ name: "role_type_id" })
  roleType: RoleType;
}
