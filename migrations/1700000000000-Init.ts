import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1700000000000 implements MigrationInterface {
  name = "Init1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
            CREATE TABLE "domains" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                CONSTRAINT "UQ_domains_slug" UNIQUE ("slug")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "countries" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                CONSTRAINT "UQ_countries_slug" UNIQUE ("slug")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "cities" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "country_id" uuid NOT NULL,
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                CONSTRAINT "UQ_cities_slug" UNIQUE ("slug"),
                CONSTRAINT "FK_cities_country_id" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                CONSTRAINT "UQ_roles_slug" UNIQUE ("slug")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "modules" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                CONSTRAINT "UQ_modules_slug" UNIQUE ("slug")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying NOT NULL,
                "description" character varying,
                "slug" character varying NOT NULL,
                "domain_id" uuid,
                CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
                CONSTRAINT "FK_tenants_domain_id" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "tenant_allowed_locations" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "country_id" uuid NOT NULL,
                "city_id" uuid NOT NULL,
                "tenant_id" uuid NOT NULL,
                CONSTRAINT "FK_tenant_allowed_locations_country_id" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_tenant_allowed_locations_city_id" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_tenant_allowed_locations_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "module_id" uuid NOT NULL,
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                CONSTRAINT "UQ_permissions_slug_module_id" UNIQUE ("slug", "module_id"),
                CONSTRAINT "FK_permissions_module_id" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "module_slug" character varying NOT NULL,
                "permission_slug" character varying NOT NULL,
                "is_allowed" boolean NOT NULL,
                CONSTRAINT "UQ_role_permissions_role_id_permission_id" UNIQUE ("role_id", "permission_id"),
                CONSTRAINT "FK_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_role_permissions_role_id_permission_id" ON "role_permissions" ("role_id", "permission_id")
        `);

    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "role_id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "oauth_tokens" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "token" character varying NOT NULL,
                "refresh_token" character varying NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked" boolean NOT NULL DEFAULT false,
                CONSTRAINT "FK_oauth_tokens_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_oauth_tokens_token" ON "oauth_tokens" ("token")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_oauth_tokens_userId" ON "oauth_tokens" ("userId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oauth_tokens_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oauth_tokens_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "oauth_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_role_permissions_role_id_permission_id"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_allowed_locations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "modules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "countries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "domains"`);
  }
}
