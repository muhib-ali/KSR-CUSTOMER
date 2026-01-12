import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Customer } from "./customer.entity";

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_AUTH = 'two_factor_auth'
}

export enum OtpStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired'
}

@Entity("otps")
@Index(["token"])
@Index(["customer_id"])
@Index(["type"])
export class Otp extends BaseAuditColumns {
  @Column({ type: "uuid" })
  customer_id: string;

  @Column({ type: "varchar", length: 10 })
  token: string;

  @Column({ type: "varchar", default: OtpType.EMAIL_VERIFICATION })
  type: OtpType;

  @Column({ type: "varchar", default: OtpStatus.PENDING })
  status: OtpStatus;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  used_at: Date;

  @Column({ type: "varchar", nullable: true })
  recipient: string; // Email or phone number

  @Column({ type: "int", default: 0 })
  attempts: number;

  // Relationships
  @ManyToOne(() => Customer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customer_id" })
  customer: Customer;
}
