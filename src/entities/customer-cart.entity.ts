import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Customer } from "./customer.entity";

@Entity("customer_cart")
@Index(["customer_id", "product_id"])
export class CustomerCart extends BaseAuditColumns {
  @Column({ type: "uuid", name: "customer_id" })
  customer_id: string;

  @Column({ type: "uuid", name: "product_id" })
  product_id: string;

  @Column({ type: "int", default: 1 })
  quantity: number;

  @Column({ type: "varchar", length: 20, nullable: true, default: "regular" })
  type: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  requested_price_per_unit: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  offered_price_per_unit: number;

  @Column({ type: "int", nullable: true })
  bulk_min_quantity: number;

  @ManyToOne(() => Customer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customer_id" })
  customer: Customer;
}
