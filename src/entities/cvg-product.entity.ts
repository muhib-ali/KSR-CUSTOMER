import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { CustomerVisibilityGroup } from "./customer-visibility-group.entity";
import { Product } from "./product.entity";

@Entity("cvg_products")
@Unique(["cvg_id", "product_id"])
export class CvgProduct extends BaseAuditColumns {
  @Column({ type: "uuid" })
  cvg_id: string;

  @Column({ type: "uuid" })
  product_id: string;

  @ManyToOne(() => CustomerVisibilityGroup, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cvg_id" })
  customerVisibilityGroup: CustomerVisibilityGroup;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;
}
