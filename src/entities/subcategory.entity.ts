import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Category } from "./category.entity";

@Entity("subcategories")
@Index(["cat_id"])
export class Subcategory extends BaseAuditColumns {
  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  @Column({ type: "uuid" })
  cat_id: string;

  @ManyToOne(() => Category, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cat_id" })
  category: Category;
}
