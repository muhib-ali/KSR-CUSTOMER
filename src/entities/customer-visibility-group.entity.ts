import { Entity, Column } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("customer_visibility_groups")
export class CustomerVisibilityGroup extends BaseAuditColumns {
  @Column({ type: "varchar", length: 50, unique: true })
  type: string;
}
