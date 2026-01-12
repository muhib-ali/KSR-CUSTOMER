import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Customer } from "./customer.entity";

export enum PasswordResetStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired'
}

@Entity("password_resets")
@Index(["token"])
@Index(["customer_id"])
export class PasswordReset extends BaseAuditColumns {
  @Column({ type: "uuid" })
  customer_id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  token: string;

  @Column({ type: "varchar", default: PasswordResetStatus.PENDING })
  status: PasswordResetStatus;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  used_at: Date;

  // Relationships
  @ManyToOne(() => Customer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customer_id" })
  customer: Customer;
}
