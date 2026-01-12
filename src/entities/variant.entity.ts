import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { VariantType } from "./variant-type.entity";
import { Product } from "./product.entity";

@Entity("variants")
export class Variant extends BaseAuditColumns {
  @Column({ type: "uuid" })
  vtype_id: string;

  @Column({ type: "varchar", length: 100 })
  value: string;

  @Column({ type: "uuid" })
  product_id: string;

  @ManyToOne(() => VariantType)
  @JoinColumn({ name: "vtype_id" })
  variantType: VariantType;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;
}
