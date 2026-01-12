import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Product } from "./product.entity";

@Entity("bulk_prices")
export class BulkPrice extends BaseAuditColumns {
  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price_per_product: number;

  @Column({ type: "uuid" })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;
}
