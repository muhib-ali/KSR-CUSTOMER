import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseAuditColumns } from "./base-audit-columns.entity";
import { Country } from "./country.entity";
import { City } from "./city.entity";
import { Tenant } from "./tenant.entity";

@Entity("tenant_allowed_locations")
export class TenantAllowedLocation extends BaseAuditColumns {
  @Column({ type: "uuid" })
  country_id: string;

  @Column({ type: "uuid" })
  city_id: string;

  @Column({ type: "uuid" })
  tenant_id: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: "country_id" })
  country: Country;

  @ManyToOne(() => City)
  @JoinColumn({ name: "city_id" })
  city: City;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;
}
