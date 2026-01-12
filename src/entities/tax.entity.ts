import { Entity, Column, Unique, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("taxes")
@Unique(["title"])
@Index(["title"])
export class Tax extends BaseAuditColumns {
  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  rate: number;

  @Column({ type: "boolean", default: true })
  is_active: boolean;
}
