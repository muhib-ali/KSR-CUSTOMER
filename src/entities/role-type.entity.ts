import { Entity, Column, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("role_types")
@Unique(["name"])
export class RoleType extends BaseAuditColumns {
  @Column({ type: "varchar" })
  name: string;
}
