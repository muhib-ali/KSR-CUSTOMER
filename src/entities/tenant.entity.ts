import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Domain } from "./domain.entity";

@Entity("tenants")
@Unique(["slug"])
export class Tenant extends BaseAuditColumns {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "uuid", nullable: true })
  domain_id: string;

  @ManyToOne(() => Domain)
  @JoinColumn({ name: "domain_id" })
  domain: Domain;
}
