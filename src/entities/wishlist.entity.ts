import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Customer } from "./customer.entity";
import { Product } from "./product.entity";

@Entity("wishlists")
@Unique(["customer_id", "product_id"])
@Index(["customer_id"])
@Index(["product_id"])
export class Wishlist extends BaseAuditColumns {
  @Column({ type: "uuid" })
  customer_id: string;

  @Column({ type: "uuid" })
  product_id: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customer_id" })
  customer: Customer;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "product_id" })
  product: Product;
}
