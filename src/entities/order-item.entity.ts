import { Entity, Column, ManyToOne, Index, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

@Entity("order_items")
@Index(["order_id"])
@Index(["product_id"])
export class OrderItem extends BaseAuditColumns {
  @Column({ type: "uuid" })
  order_id: string;

  @Column({ type: "uuid" })
  product_id: string;

  @Column({ type: "varchar" })
  product_name: string;

  @Column({ type: "varchar", nullable: true })
  product_sku: string;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total_price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  requested_price_per_unit: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  offered_price_per_unit: number;

  @Column({ type: "int", nullable: true })
  bulk_min_quantity: number;

  @Column({ type: "varchar", length: 20, nullable: true, default: "pending" })
  item_status: string;

  // Relationships
  @ManyToOne(() => Order, order => order.order_items)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Product, product => product.order_items)
  @JoinColumn({ name: "product_id" })
  product: Product;
}
