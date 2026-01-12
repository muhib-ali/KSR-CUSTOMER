import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Product } from "./product.entity";

@Entity("product_images")
@Index(["product_id"])
@Unique(["product_id", "sort_order"])
export class ProductImage extends BaseAuditColumns {
  @Column({ type: "uuid" })
  product_id: string;

  @Column({ type: "varchar" })
  url: string;

  @Column({ type: "varchar" })
  file_name: string;

  @Column({ type: "int" })
  sort_order: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product: Product;
}
