import { Entity, Column, Unique, Index, OneToMany } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Product } from "./product.entity";

@Entity("brands")
@Unique(["name"])
@Index(["name"])
export class Brand extends BaseAuditColumns {
  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}
