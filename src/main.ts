import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // Add your frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Add raw body parser for debugging
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Add request logging middleware
  app.use((req, res, next) => {
    if (req.path === '/auth/login' && req.method === 'POST') {
      console.log('Login Request Headers:', req.headers);
      console.log('Login Request Body:', req.body);
    }
    next();
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.log("Validation Errors:", errors);
        return errors;
      },
    })
  );

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("KSR Customer API")
    .setDescription(
      "Complete customer backend with JWT authentication, product catalog, categories, brands, shopping cart, and order management"
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token (without 'Bearer' prefix)",
        in: "header",
      },
      "JWT-auth" // This should match the security name
    )
    .addTag("Authentication", "User authentication endpoints")
    .addTag("Authentication Extended", "Password reset and OTP endpoints")
    .addTag("Products", "Product catalog endpoints")
    .addTag("Categories", "Category management endpoints")
    .addTag("Brands", "Brand management endpoints")
    .addTag("Cart", "Shopping cart endpoints")
    .addTag("Orders", "Order management endpoints")
    .addTag("Health", "Health check endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    customSiteTitle: "KSR Customer API Documentation",
  });

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  logger.log(`🏥 Health check: http://localhost:${port}/health`);
}
bootstrap();
