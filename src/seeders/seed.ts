import { DataSource } from "typeorm";
import { dataSourceOptions } from "../config/database.config";
import { Role } from "../entities/role.entity";
import { Module } from "../entities/module.entity";
import { Permission } from "../entities/permission.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { User } from "../entities/user.entity";
import { Country } from "../entities/country.entity";
import { City } from "../entities/city.entity";
import { Tenant } from "../entities/tenant.entity";
import { TenantAllowedLocation } from "../entities/tenant-allowed-location.entity";
import { Domain } from "../entities/domain.entity";
import * as bcrypt from "bcrypt";

const AppDataSource = new DataSource(dataSourceOptions);

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    // Get repositories
    const roleRepository = AppDataSource.getRepository(Role);
    const moduleRepository = AppDataSource.getRepository(Module);
    const permissionRepository = AppDataSource.getRepository(Permission);
    const rolePermissionRepository =
      AppDataSource.getRepository(RolePermission);
    const userRepository = AppDataSource.getRepository(User);
    const countryRepository = AppDataSource.getRepository(Country);
    const cityRepository = AppDataSource.getRepository(City);
    const tenantRepository = AppDataSource.getRepository(Tenant);
    const tenantAllowedLocationRepository = AppDataSource.getRepository(
      TenantAllowedLocation
    );
    const domainRepository = AppDataSource.getRepository(Domain);

    console.log("Starting seeding process...");

    // 1) ROLES
    console.log("Seeding roles...");
    const rolesData = [
      { title: "Platform Admin", slug: "platformAdmin", is_active: true },
      { title: "Platform Manager", slug: "platformManager", is_active: true },
    ];

    for (const roleData of rolesData) {
      const existingRole = await roleRepository.findOne({
        where: { slug: roleData.slug },
      });
      if (!existingRole) {
        await roleRepository.save(roleData);
        console.log(`Created role: ${roleData.title}`);
      } else {
        console.log(`Role already exists: ${roleData.title}`);
      }
    }

    // 2) MODULES
    console.log("Seeding modules...");
    const modulesData = [
      {
        title: "Roles",
        slug: "roles",
        description: "Manage roles",
        is_active: true,
      },
      {
        title: "Modules",
        slug: "modules",
        description: "Manage modules",
        is_active: true,
      },
      {
        title: "Permissions",
        slug: "permissions",
        description: "Manage permissions",
        is_active: true,
      },
      // {
      //   title: "Role Permissions Mapping",
      //   slug: "rolePermissionsMapping",
      //   description: "Map role-permissions",
      //   is_active: true,
      // },
      {
        title: "Users",
        slug: "users",
        description: "Manage users",
        is_active: true,
      },
      {
        title: "Dropdowns",
        slug: "dropdowns",
        description: "Manage dropdowns",
        is_active: true,
      },
    ];

    for (const moduleData of modulesData) {
      const existingModule = await moduleRepository.findOne({
        where: { slug: moduleData.slug },
      });
      if (!existingModule) {
        await moduleRepository.save(moduleData);
        console.log(`Created module: ${moduleData.title}`);
      } else {
        console.log(`Module already exists: ${moduleData.title}`);
      }
    }

    // 3) PERMISSIONS
    console.log("Seeding permissions...");
    const modules = await moduleRepository.find();
    const permissionDefs = [
      { slug: "create", title: "Create", description: "Create" },
      { slug: "update", title: "Update", description: "Update" },
      { slug: "getById", title: "Get By Id", description: "Get by id" },
      {
        slug: "getAllPermissionsByRoleId",
        title: "Get All Permissions By Role Id",
        description: "Get all permissions by role id",
      }, // this record will insert for roles module only
      {
        slug: "updatePermissionsAccessByRoleId",
        title: "Update Permissions Access By Role Id",
        description: "Update permissions access by role id",
      }, // this record will insert for roles module only
      {
        slug: "getAllRoles",
        title: "Get All Roles",
        description: "Get all roles for dropdown",
      }, // this record will insert for dropdowns module only
      {
        slug: "getAllModules",
        title: "Get All Modules",
        description: "Get all modules for dropdown",
      }, // this record will insert for dropdowns module only
      { slug: "getAll", title: "Get All", description: "List all" },
      { slug: "delete", title: "Delete", description: "Delete" },
    ];

    for (const module of modules) {
      for (const permDef of permissionDefs) {
        // Skip role-specific permissions for non-roles modules
        if (
          (permDef.slug === "getAllPermissionsByRoleId" ||
            permDef.slug === "updatePermissionsAccessByRoleId") &&
          module.slug !== "roles"
        ) {
          continue; // Skip these permissions for non-roles modules
        }

        // Skip dropdowns-specific permissions for non-dropdowns modules
        if (
          (permDef.slug === "getAllRoles" ||
            permDef.slug === "getAllModules") &&
          module.slug !== "dropdowns"
        ) {
          continue; // Skip these permissions for non-dropdowns modules
        }

        // For dropdowns module, only allow specific permissions
        if (
          module.slug === "dropdowns" &&
          permDef.slug !== "getAllRoles" &&
          permDef.slug !== "getAllModules"
        ) {
          continue; // Skip all other permissions for dropdowns module
        }

        const permissionData = {
          module_id: module.id,
          title: `${module.title} ${permDef.title}`,
          slug: permDef.slug,
          description: `${permDef.description} ${module.title.toLowerCase()}`,
          is_active: true,
        };

        const existingPermission = await permissionRepository.findOne({
          where: { slug: permissionData.slug, module_id: module.id },
        });

        if (!existingPermission) {
          const savedPermission = await permissionRepository.save(
            permissionData
          );
          console.log(
            `Created permission: ${permissionData.title} for module ${module.title}`
          );
        } else {
          console.log(
            `Permission already exists: ${permissionData.title} for module ${module.title}`
          );
        }
      }
    }

    // 4) ROLE-PERMISSIONS
    console.log("Seeding role permissions...");
    const roles = await roleRepository.find();
    const permissions = await permissionRepository.find({
      relations: ["module"],
    });

    const platformAdmin = roles.find((r) => r.slug === "platformAdmin");
    const platformManager = roles.find((r) => r.slug === "platformManager");

    if (platformAdmin) {
      // Platform Admin → all permissions true
      for (const permission of permissions) {
        const existingRolePermission = await rolePermissionRepository.findOne({
          where: { role_id: platformAdmin.id, permission_id: permission.id },
        });

        if (!existingRolePermission) {
          const rolePermissionData = {
            role_id: platformAdmin.id,
            permission_id: permission.id,
            module_slug: permission.module.slug,
            permission_slug: permission.slug,
            is_allowed: true,
            is_active: true,
          };
          await rolePermissionRepository.save(rolePermissionData);
          console.log(
            `Created role permission: ${platformAdmin.title} → ${permission.title} (allowed)`
          );
        }
      }
    }

    if (platformManager) {
      // Platform Manager → only getAll, getById, update true; do not insert denied permissions
      const allowedSlugs = ["getAll", "getById", "update"];

      for (const permission of permissions) {
        // Only insert permissions that are allowed (no denied permissions)
        if (!allowedSlugs.includes(permission.slug)) {
          continue; // Skip permissions that are not explicitly allowed
        }

        const existingRolePermission = await rolePermissionRepository.findOne({
          where: { role_id: platformManager.id, permission_id: permission.id },
        });

        if (!existingRolePermission) {
          const rolePermissionData = {
            role_id: platformManager.id,
            permission_id: permission.id,
            module_slug: permission.module.slug,
            permission_slug: permission.slug,
            is_allowed: true, // Only allowed permissions are inserted
            is_active: true,
          };
          await rolePermissionRepository.save(rolePermissionData);
          console.log(
            `Created role permission: ${platformManager.title} → ${permission.title} (allowed)`
          );
        }
      }
    }

    // 5) USERS
    console.log("Seeding users...");
    const usersData = [
      {
        name: "Arsalan",
        email: "arsalan@aarcsol.com",
        password: "Password@123",
        role_slug: "platformAdmin",
      },
      {
        name: "Ali",
        email: "ali@aarcsol.com",
        password: "Password@123",
        role_slug: "platformManager",
      },
    ];

    for (const userData of usersData) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const role = roles.find((r) => r.slug === userData.role_slug);
        if (role) {
          // Hash password before saving
          const hashedPassword = await bcrypt.hash(userData.password, 10);

          const userToSave = {
            role_id: role.id,
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            is_active: true,
          };
          await userRepository.save(userToSave);
          console.log(`Created user: ${userData.name} (${userData.email})`);
        } else {
          console.log(`Role not found for user: ${userData.name}`);
        }
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    // 6) COUNTRIES
    console.log("Seeding countries...");
    const countriesData = [
      { title: "Pakistan", slug: "pakistan" },
      { title: "India", slug: "india" },
      { title: "United States", slug: "united_states" },
      { title: "United Kingdom", slug: "united_kingdom" },
      { title: "Canada", slug: "canada" },
      { title: "Australia", slug: "australia" },
      { title: "Germany", slug: "germany" },
      { title: "France", slug: "france" },
      { title: "Japan", slug: "japan" },
      { title: "China", slug: "china" },
    ];

    for (const countryData of countriesData) {
      const existingCountry = await countryRepository.findOne({
        where: { slug: countryData.slug },
      });
      if (!existingCountry) {
        await countryRepository.save(countryData);
        console.log(`Created country: ${countryData.title}`);
      } else {
        console.log(`Country already exists: ${countryData.title}`);
      }
    }

    // 7) CITIES
    console.log("Seeding cities...");
    const countries = await countryRepository.find();
    const pakistan = countries.find((c) => c.slug === "pakistan");
    const india = countries.find((c) => c.slug === "india");
    const unitedStates = countries.find((c) => c.slug === "united_states");
    const unitedKingdom = countries.find((c) => c.slug === "united_kingdom");
    const canada = countries.find((c) => c.slug === "canada");
    const australia = countries.find((c) => c.slug === "australia");
    const germany = countries.find((c) => c.slug === "germany");
    const france = countries.find((c) => c.slug === "france");
    const japan = countries.find((c) => c.slug === "japan");
    const china = countries.find((c) => c.slug === "china");

    const citiesData = [
      // Pakistan cities
      { title: "Karachi", slug: "karachi", country_id: pakistan?.id },
      { title: "Lahore", slug: "lahore", country_id: pakistan?.id },
      { title: "Islamabad", slug: "islamabad", country_id: pakistan?.id },
      { title: "Rawalpindi", slug: "rawalpindi", country_id: pakistan?.id },
      { title: "Faisalabad", slug: "faisalabad", country_id: pakistan?.id },
      { title: "Multan", slug: "multan", country_id: pakistan?.id },
      { title: "Peshawar", slug: "peshawar", country_id: pakistan?.id },
      { title: "Quetta", slug: "quetta", country_id: pakistan?.id },
      { title: "Sialkot", slug: "sialkot", country_id: pakistan?.id },
      { title: "Gujranwala", slug: "gujranwala", country_id: pakistan?.id },

      // India cities
      { title: "Mumbai", slug: "mumbai", country_id: india?.id },
      { title: "Delhi", slug: "delhi", country_id: india?.id },
      { title: "Bangalore", slug: "bangalore", country_id: india?.id },
      { title: "Chennai", slug: "chennai", country_id: india?.id },
      { title: "Kolkata", slug: "kolkata", country_id: india?.id },
      { title: "Hyderabad", slug: "hyderabad", country_id: india?.id },
      { title: "Pune", slug: "pune", country_id: india?.id },
      { title: "Ahmedabad", slug: "ahmedabad", country_id: india?.id },

      // United States cities
      { title: "New York", slug: "new_york", country_id: unitedStates?.id },
      {
        title: "Los Angeles",
        slug: "los_angeles",
        country_id: unitedStates?.id,
      },
      { title: "Chicago", slug: "chicago", country_id: unitedStates?.id },
      { title: "Houston", slug: "houston", country_id: unitedStates?.id },
      { title: "Phoenix", slug: "phoenix", country_id: unitedStates?.id },
      {
        title: "Philadelphia",
        slug: "philadelphia",
        country_id: unitedStates?.id,
      },
      {
        title: "San Antonio",
        slug: "san_antonio",
        country_id: unitedStates?.id,
      },
      { title: "San Diego", slug: "san_diego", country_id: unitedStates?.id },

      // United Kingdom cities
      { title: "London", slug: "london", country_id: unitedKingdom?.id },
      {
        title: "Birmingham",
        slug: "birmingham",
        country_id: unitedKingdom?.id,
      },
      {
        title: "Manchester",
        slug: "manchester",
        country_id: unitedKingdom?.id,
      },
      { title: "Glasgow", slug: "glasgow", country_id: unitedKingdom?.id },
      { title: "Liverpool", slug: "liverpool", country_id: unitedKingdom?.id },
      { title: "Leeds", slug: "leeds", country_id: unitedKingdom?.id },

      // Canada cities
      { title: "Toronto", slug: "toronto", country_id: canada?.id },
      { title: "Vancouver", slug: "vancouver", country_id: canada?.id },
      { title: "Montreal", slug: "montreal", country_id: canada?.id },
      { title: "Calgary", slug: "calgary", country_id: canada?.id },
      { title: "Ottawa", slug: "ottawa", country_id: canada?.id },
      { title: "Edmonton", slug: "edmonton", country_id: canada?.id },

      // Australia cities
      { title: "Sydney", slug: "sydney", country_id: australia?.id },
      { title: "Melbourne", slug: "melbourne", country_id: australia?.id },
      { title: "Brisbane", slug: "brisbane", country_id: australia?.id },
      { title: "Perth", slug: "perth", country_id: australia?.id },
      { title: "Adelaide", slug: "adelaide", country_id: australia?.id },

      // Germany cities
      { title: "Berlin", slug: "berlin", country_id: germany?.id },
      { title: "Munich", slug: "munich", country_id: germany?.id },
      { title: "Hamburg", slug: "hamburg", country_id: germany?.id },
      { title: "Cologne", slug: "cologne", country_id: germany?.id },
      { title: "Frankfurt", slug: "frankfurt", country_id: germany?.id },

      // France cities
      { title: "Paris", slug: "paris", country_id: france?.id },
      { title: "Marseille", slug: "marseille", country_id: france?.id },
      { title: "Lyon", slug: "lyon", country_id: france?.id },
      { title: "Toulouse", slug: "toulouse", country_id: france?.id },
      { title: "Nice", slug: "nice", country_id: france?.id },

      // Japan cities
      { title: "Tokyo", slug: "tokyo", country_id: japan?.id },
      { title: "Osaka", slug: "osaka", country_id: japan?.id },
      { title: "Kyoto", slug: "kyoto", country_id: japan?.id },
      { title: "Yokohama", slug: "yokohama", country_id: japan?.id },
      { title: "Nagoya", slug: "nagoya", country_id: japan?.id },

      // China cities
      { title: "Beijing", slug: "beijing", country_id: china?.id },
      { title: "Shanghai", slug: "shanghai", country_id: china?.id },
      { title: "Guangzhou", slug: "guangzhou", country_id: china?.id },
      { title: "Shenzhen", slug: "shenzhen", country_id: china?.id },
      { title: "Chengdu", slug: "chengdu", country_id: china?.id },
    ].filter((city) => city.country_id); // Filter out cities with undefined country_id

    for (const cityData of citiesData) {
      const existingCity = await cityRepository.findOne({
        where: { slug: cityData.slug },
      });
      if (!existingCity) {
        await cityRepository.save(cityData);
        console.log(`Created city: ${cityData.title}`);
      } else {
        console.log(`City already exists: ${cityData.title}`);
      }
    }

    // 8) DOMAINS (if not exists)
    console.log("Seeding domains...");
    const domainData = {
      title: "Mentor Health Platform",
      slug: "mentor_health_platform",
      description: "Main domain for Mentor Health Platform",
      is_active: true,
    };

    let domain = await domainRepository.findOne({
      where: { slug: domainData.slug },
    });
    if (!domain) {
      domain = await domainRepository.save(domainData);
      console.log(`Created domain: ${domainData.title}`);
    } else {
      console.log(`Domain already exists: ${domainData.title}`);
    }

    // 9) TENANTS
    console.log("Seeding tenants...");
    const tenantData = {
      title: "Agha Khan Hospital",
      slug: "agha_khan_hospital",
      description: "Agha Khan Hospital - Healthcare Services",
      domain_id: domain.id,
      is_active: true,
    };

    let tenant = await tenantRepository.findOne({
      where: { slug: tenantData.slug },
    });
    if (!tenant) {
      tenant = await tenantRepository.save(tenantData);
      console.log(`Created tenant: ${tenantData.title}`);
    } else {
      console.log(`Tenant already exists: ${tenantData.title}`);
    }

    // 10) TENANT ALLOWED LOCATIONS
    console.log("Seeding tenant allowed locations...");
    if (tenant && pakistan) {
      // Get all Pakistan cities
      const pakistanCities = await cityRepository.find({
        where: { country_id: pakistan.id },
      });

      for (const city of pakistanCities) {
        const existingMapping = await tenantAllowedLocationRepository.findOne({
          where: {
            tenant_id: tenant.id,
            country_id: pakistan.id,
            city_id: city.id,
          },
        });

        if (!existingMapping) {
          await tenantAllowedLocationRepository.save({
            tenant_id: tenant.id,
            country_id: pakistan.id,
            city_id: city.id,
            is_active: true,
          });
          console.log(
            `Created tenant location mapping: ${tenant.title} → ${city.title}, ${pakistan.title}`
          );
        } else {
          console.log(
            `Tenant location mapping already exists: ${tenant.title} → ${city.title}, ${pakistan.title}`
          );
        }
      }
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
