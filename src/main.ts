import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Build allowed origins array, filtering out undefined values
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3007',
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  // Enable CORS with comprehensive configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For production, allow all origins if FRONTEND_URL is not set
      if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-CSRF-Token',
    ],
    exposedHeaders: [
      'Authorization',
      'Content-Range',
      'X-Content-Range',
      'X-Total-Count',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
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
    .addTag("Blogs", "Blog posts endpoints")
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

  const port = process.env.APP_PORT || 3002;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
  logger.log(`🏥 Health check: http://localhost:${port}/health`);
}
bootstrap();
