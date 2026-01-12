import { Entity, Column, Unique, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("warehouses")
@Unique(["code"])
@Index(["code"])
export class Warehouse extends BaseAuditColumns {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "text", nullable: true })
  address: string;
}
