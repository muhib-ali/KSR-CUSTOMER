import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Module } from "./module.entity";

@Entity("permissions")
@Unique(["slug", "module_id"])
export class Permission extends BaseAuditColumns {
  @Column({ type: "uuid" })
  module_id: string;

  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  slug: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  @ManyToOne(() => Module)
  @JoinColumn({ name: "module_id" })
  module: Module;
}
