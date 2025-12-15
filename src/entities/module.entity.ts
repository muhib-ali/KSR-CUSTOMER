import { Entity, Column, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("modules")
@Unique(["slug"])
export class Module extends BaseAuditColumns {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "varchar", nullable: true })
  description: string;
}
