import { Entity, Column, Unique, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("suppliers")
@Unique(["supplier_name"])
@Index(["supplier_name"])
export class Supplier extends BaseAuditColumns {
  @Column({ type: "varchar", length: 255 })
  supplier_name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;
}
