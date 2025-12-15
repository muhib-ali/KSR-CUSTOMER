import { Entity, Column, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("locations")
@Unique(["slug"])
export class Location extends BaseAuditColumns {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "varchar", nullable: true })
  description: string;
}
