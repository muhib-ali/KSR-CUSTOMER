import { Entity, Column, OneToMany } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Variant } from "./variant.entity";

@Entity("variant_types")
export class VariantType extends BaseAuditColumns {
  @Column({ type: "varchar", length: 50, unique: true })
  name: string;

  @OneToMany(() => Variant, (variant) => variant.variantType)
  variants: Variant[];
}
