import { Entity, Column, Index } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";

@Entity("home_cms_sections")
@Index(["section_key"])
@Index(["section_key", "subsection_key"])
export class HomeCmsSection extends BaseAuditColumns {
  @Column({ type: "varchar", length: 255, nullable: false })
  section_key: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  subsection_key: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  label: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  title: string | null;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 1000, nullable: true })
  section_img_url: string | null;

  @Column({ type: "int", default: 0 })
  sort_order: number;
}
