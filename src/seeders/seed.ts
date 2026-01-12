import { DataSource } from "typeorm";
import { dataSourceOptions } from "../config/database.config";
import { Customer } from "../entities/customer.entity";
import * as bcrypt from "bcrypt";

const AppDataSource = new DataSource(dataSourceOptions);

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    // Get repositories
    const customerRepository = AppDataSource.getRepository(Customer);

    console.log("Starting customer seeding process...");

    // Seed test customers
    console.log("Seeding test customers...");
    const customersData = [
      {
        fullname: "Test Customer",
        username: "testcustomer",
        email: "test@customer.com",
        password: "Password@123",
        phone: "+1234567890",
      },
      {
        fullname: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        password: "Password@123",
        phone: "+1987654321",
      },
      {
        fullname: "Jane Smith",
        username: "janesmith",
        email: "jane@example.com",
        password: "Password@123",
        phone: "+1122334455",
      },
    ];

    for (const customerData of customersData) {
      const existingCustomer = await customerRepository.findOne({
        where: { email: customerData.email },
      });

      if (!existingCustomer) {
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(customerData.password, 10);

        const customerToSave = {
          fullname: customerData.fullname,
          username: customerData.username,
          email: customerData.email,
          password: hashedPassword,
          phone: customerData.phone,
          is_email_verified: true,
          is_phone_verified: false,
        };
        await customerRepository.save(customerToSave);
        console.log(`Created customer: ${customerData.fullname} (${customerData.email})`);
      } else {
        console.log(`Customer already exists: ${customerData.email}`);
      }
    }

    console.log("Customer seeding completed successfully!");
  } catch (error) {
    console.error("Error during customer seeding:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
