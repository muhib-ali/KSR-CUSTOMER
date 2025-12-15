import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Role } from "./role.entity";

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

  @Column({ type: "uuid" })
  role_id: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: "role_id" })
  role: Role;
}
