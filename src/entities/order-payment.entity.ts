import { Entity, Column, ManyToOne, Index, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

export enum PaymentMethod {
  ONLINE = 'online',
  COD = 'cod'
}

@Entity("order_payments")
@Index(["order_id"])
export class OrderPayment extends BaseAuditColumns {
  @Column({ type: "uuid" })
  order_id: string;

  @Column({ type: "varchar", default: PaymentMethod.ONLINE })
  payment_method: PaymentMethod;

  @Column({ type: "varchar", nullable: true })
  card_last_four: string;

  @Column({ type: "varchar", nullable: true })
  cvc: string;

  @Column({ type: "varchar", nullable: true })
  card_brand: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  payment_amount: number;

  @Column({ type: "varchar", default: "NOK" })
  currency: string;

  @Column({ type: "timestamptz", nullable: true })
  paid_at: Date;

  // Relationships - Use string to avoid circular import
  @ManyToOne("Order", "order_items")
  @JoinColumn({ name: "order_id" })
  order: any;
}
