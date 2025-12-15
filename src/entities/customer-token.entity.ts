import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Customer } from "./customer.entity";

@Entity("customer_tokens")
@Index(["token"])
@Index(["customer_id"])
export class CustomerToken extends BaseAuditColumns {
  @Column({ type: "uuid" })
  customer_id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  token: string;

  @Column({ type: "varchar" })
  refresh_token: string;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "boolean", default: false })
  revoked: boolean;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customer_id" })
  customer: Customer;
}
