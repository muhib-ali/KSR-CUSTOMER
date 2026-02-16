import { Entity, Column, Unique, Index, OneToMany } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Product } from "./product.entity";
import { Subcategory } from "./subcategory.entity";

@Entity("categories")
@Unique(["name"])
@Index(["name"])
export class Category extends BaseAuditColumns {
  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  
  @OneToMany(() => Subcategory, (sub) => sub.category)
  subcategories: Subcategory[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
