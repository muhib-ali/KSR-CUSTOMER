import { Entity, Column, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("domains")
@Unique(["slug"])
export class Domain extends BaseAuditColumns {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "varchar", nullable: true })
  description: string;
}
