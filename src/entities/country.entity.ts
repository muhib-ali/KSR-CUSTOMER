import { Entity, Column, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("countries")
@Unique(["slug"])
export class Country extends BaseAuditColumns {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  slug: string;
}
