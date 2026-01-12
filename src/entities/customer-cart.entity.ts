import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Customer } from "./customer.entity";

@Entity("customer_cart")
@Unique(["customer_id", "product_id"])
@Index(["customer_id", "product_id"])
export class CustomerCart extends BaseAuditColumns {
  @Column({ type: "uuid", name: "customer_id" })
  customer_id: string;

  @Column({ type: "uuid", name: "product_id" })
  product_id: string;

  @Column({ type: "int", default: 1 })
  quantity: number;

  @ManyToOne(() => Customer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customer_id" })
  customer: Customer;
}
