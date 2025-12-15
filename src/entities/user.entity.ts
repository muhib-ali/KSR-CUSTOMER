import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Role } from "./role.entity";

@Entity("users")
@Unique(["email"])
export class User extends BaseAuditColumns {
  @Column({ type: "uuid" })
  role_id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "varchar" })
  password: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: "role_id" })
  role: Role;
}
