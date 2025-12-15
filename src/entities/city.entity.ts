import { Entity, Column, Unique, ManyToOne, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Country } from "./country.entity";

@Entity("cities")
@Unique(["slug"])
export class City extends BaseAuditColumns {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "uuid" })
  country_id: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: "country_id" })
  country: Country;
}
