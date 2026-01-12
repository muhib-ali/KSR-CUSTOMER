import { Entity, Column, ManyToOne, OneToMany, Unique, Index, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { OrderItem } from "./order-item.entity";
import { OrderStatus } from "./order-status.enum";

@Entity("orders")
@Unique(["order_number"])
@Index(["order_number"])
@Index(["user_id"])
export class Order extends BaseAuditColumns {
  @Column({ type: "varchar" })
  order_number: string;

  @Column({ type: "uuid" })
  user_id: string;

  // Customer information (from logged-in user, cannot be faked)
  @Column({ type: "varchar" })
  first_name: string;

  @Column({ type: "varchar" })
  last_name: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "varchar", nullable: true })
  phone: string;

  // Shipping address (user provided)
  @Column({ type: "text" })
  address: string;

  @Column({ type: "varchar" })
  city: string;

  @Column({ type: "varchar" })
  state: string;

  @Column({ type: "varchar" })
  zip_code: string;

  @Column({ type: "varchar" })
  country: string;

  // Order details
  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotal_amount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: "uuid", nullable: true })
  promo_code_id: string;

  @Column({ type: "varchar", default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: "text", nullable: true })
  notes: string;

  // Relationships - Use string to avoid circular import
  @ManyToOne("Customer", "orders")
  @JoinColumn({ name: "user_id" })
  user: any;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  order_items: OrderItem[];
}
