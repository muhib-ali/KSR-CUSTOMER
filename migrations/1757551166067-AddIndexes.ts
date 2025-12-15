import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexes1757551166067 implements MigrationInterface {
  name = "AddIndexes1757551166067";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Performance indexes for login query optimization

    // Critical index for role_permissions.role_id (most important for login query)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_role_permissions_role_id" ON "role_permissions" ("role_id")`
    );

    // Index for permissions.module_id (for join optimization)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permissions_module_id" ON "permissions" ("module_id")`
    );

    // Composite index for role_permissions (role_id + permission_id) for unique constraint optimization
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_role_permissions_composite" ON "role_permissions" ("role_id", "permission_id")`
    );

    // Index for oauth_tokens.token (for token validation)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_oauth_tokens_token" ON "oauth_tokens" ("token")`
    );

    // Index for oauth_tokens.userId (for user token lookup)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_oauth_tokens_userId" ON "oauth_tokens" ("userId")`
    );

    // Index for users.email (for login email lookup)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`
    );

    // Index for users.role_id (for user role lookup)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_role_id" ON "users" ("role_id")`
    );

    // Additional performance indexes for common queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permissions_slug" ON "permissions" ("slug")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_modules_slug" ON "modules" ("slug")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roles_slug" ON "roles" ("slug")`
    );

    // Composite index for role_permissions with module_slug for faster filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_role_permissions_role_module" ON "role_permissions" ("role_id", "module_slug")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop performance indexes (reverse of up migration)

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_role_permissions_role_module"`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_roles_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_modules_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oauth_tokens_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oauth_tokens_token"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_role_permissions_composite"`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_module_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_role_permissions_role_id"`
    );
  }
}
