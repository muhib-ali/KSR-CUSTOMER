import { Entity, Column, Unique, OneToMany } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("customers")
@Unique(["email"])
@Unique(["username"])
export class Customer extends BaseAuditColumns {
  @Column({ type: "varchar" })
  fullname: string;

  @Column({ type: "varchar" })
  username: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "varchar" })
  password: string;

  @Column({ type: "varchar", nullable: true })
  phone: string;

  @Column({ type: "boolean", default: false })
  is_email_verified: boolean;

  @Column({ type: "boolean", default: false })
  is_phone_verified: boolean;

  // Relationships - Use string to avoid circular import
  @OneToMany("Order", "user")
  orders: any[];
}
