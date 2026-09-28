# NestJS Interview & Learning Guide

This document is a practical NestJS reference for this project. It explains the request lifecycle, the main NestJS building blocks, dependency injection, modules, authentication/authorization, DTOs, decorators, and the architecture used in this Todo API.

---

# NestJS Request Flow

This project is a small NestJS API with authentication and todo routes. `AppModule` loads the `AuthModule` and `TodosModule`, and applies a request logger to every route. The application-level validation pipe and response interceptor are registered during bootstrap.

## Request Lifecycle

For a successful HTTP request, the flow through this project is:

```text
Client
  |
  v
LoggerMiddleware (all routes)
  |
  v
Route/controller guards (when configured)
  |
  v
TransformInterceptor (before: reads optional @Message metadata)
  |
  v
Global ValidationPipe (validates/transforms decorated DTO bodies)
  |
  v
Controller route handler
  |
  v
Service
  |
  v
TransformInterceptor (after: wraps successful result)
  |
  v
Client response
  |
  v
LoggerMiddleware logs method, URL, status, and duration on response finish
```

The interceptor wraps the controller/service execution. It does not produce the success envelope when the request throws an exception; NestJS handles error responses through its exception handling instead.

## What each stage does here

- **Middleware:** `LoggerMiddleware` is applied to `*` in `AppModule`. It records the HTTP method, URL, final status code, and elapsed time when the response finishes.
- **Guards:** Guards run only on routes where they are attached. `AuthGuard` reads a bearer token from the `Authorization` header, finds its user in `Users.json`, and places that user on `request.user`. `RolesGuard` allows only a user whose role is `admin`.
- **Interceptor:** The global `TransformInterceptor` runs around the route handler. On success, it returns `{ "data": ..., "statusCode": ..., "message": ... }`. A route's `@Message("...")` supplies the message; otherwise it uses `Request successful`.
- **Validation pipe:** The global `ValidationPipe` enables transformation and `whitelist`. DTO constraints are enforced on decorated request bodies, and properties without validation decorators are stripped.
- **Controller and service:** Controllers receive validated input and request context, then delegate the work to their service. Services handle business logic and read/write the JSON data files.

---

# 1. The NestJS Mental Model

The easiest way to remember NestJS is:

```text
HTTP Request
    |
    v
Middleware
    |
    v
Guards
    |
    v
Interceptors
    |
    v
Pipes
    |
    v
Controller
    |
    v
Service
    |
    v
Database / Repository
```

And the response travels back through the interceptor:

```text
Database
    |
    v
Service
    |
    v
Controller
    |
    v
Interceptor
    |
    v
HTTP Response
```

### Interview shortcut

Remember these questions:

| Feature | Main question |
|---|---|
| Middleware | "Can I process the request before Nest handles the route?" |
| Guard | "Is this request allowed to access this route?" |
| Pipe | "Is this input valid, and should I transform it?" |
| Interceptor | "Can I run something before/after the controller?" |
| Decorator | "Can I define metadata or conveniently extract something?" |
| Controller | "Which HTTP endpoint should handle this request?" |
| Service | "What is the business logic?" |
| Module | "Which parts of the application belong together?" |

---

# 2. Modules

A module is a way of grouping related functionality.

For this project:

```text
AppModule
   |
   +-- AuthModule
   |     +-- AuthController
   |     +-- AuthService
   |
   +-- TodosModule
         +-- TodosController
         +-- TodoService
```

## AppModule

`AppModule` is the root module.

```ts
@Module({
  imports: [
    AuthModule,
    TodosModule,
  ],
})
export class AppModule {}
```

`main.ts` bootstraps the application using the root module:

```ts
const app = await NestFactory.create(AppModule);
```

You normally do not create the Nest application separately from `AuthModule` or `TodosModule`.

## Feature modules

A feature module owns its feature.

```ts
@Module({
  controllers: [TodosController],
  providers: [TodoService],
})
export class TodosModule {}
```

This is better than putting every controller and service directly into `AppModule`.

### Why modules matter

Without modules, a large application can become:

```text
AppModule
  ├── 30 controllers
  ├── 50 services
  ├── 20 guards
  └── 40 other providers
```

With modules:

```text
AppModule
  ├── AuthModule
  ├── UsersModule
  ├── TodosModule
  ├── PaymentsModule
  └── NotificationsModule
```

Each feature manages its own dependencies.

---

# 3. `@Injectable()` and Dependency Injection

`@Injectable()` tells Nest that a class can be managed by Nest's Dependency Injection container.

Most commonly, you use it on services:

```ts
@Injectable()
export class TodoService {
  createTodo() {
    // business logic
  }
}
```

Then inject the service into a controller:

```ts
@Controller("todos")
export class TodosController {
  constructor(
    private readonly todoService: TodoService,
  ) {}
}
```

Nest creates the `TodoService` instance for you.

## Why Dependency Injection?

Without DI, you might manually create dependencies:

```ts
const userService = new UserService();
const todoService = new TodoService(userService);
```

With Nest:

```ts
constructor(
  private readonly userService: UserService,
) {}
```

Nest resolves the dependency.

## Dependency tree

```text
TodosController
      |
      v
TodoService
   /      \
  v        v
UserService TodoRepository
```

Nest builds this dependency graph from your registered providers.

## Where is `@Injectable()` commonly used?

- Services
- Guards
- Interceptors
- Pipes
- Some exception filters
- Other providers managed by Nest

Usually you do not put it on:

- DTOs
- Interfaces
- Enums
- Plain utility functions

Controllers use `@Controller()` rather than needing `@Injectable()`.

---

# 4. Controllers

Controllers handle HTTP requests.

Example:

```ts
@Controller("todos")
export class TodosController {

  constructor(
    private readonly todoService: TodoService,
  ) {}

  @Post("create")
  async createTodo(
    @Body() body: CreateTodoDto,
    @CurrentUser() user: IUser,
  ) {
    return this.todoService.createTodo(
      body,
      user.id,
    );
  }
}
```

The controller should generally be thin.

It should:

1. Receive the HTTP request.
2. Get validated input.
3. Get authenticated user/context.
4. Call the service.
5. Return the result.

Avoid putting large business rules directly into controllers.

---

# 5. Services

Services contain business logic.

```ts
@Injectable()
export class TodoService {

  async createTodo(
    body: TodosDto,
    userId: string,
  ): Promise<ITodo> {

    const todo: ITodo = {
      ...body,
      userId,
      createdAt: new Date(),
    };

    // Save todo...

    return todo;
  }
}
```

The controller says:

```text"Create a todo."
```

The service decides:

```textHow should a todo actually be created?
Who owns it?
What should be saved?
```

### Interview answer

> Controllers handle HTTP concerns; services contain business logic and are reusable through dependency injection.

---

# 6. Middleware

Middleware runs before the request reaches the route handler.

Your project uses middleware for logging:

```ts
@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {

    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      console.log(
        `[${req.method}] ${req.originalUrl} - ` +
        `${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
```

Configure it in `AppModule`:

```ts
export class AppModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes("*");
  }
}
```

## What is middleware good for?

Common examples:

- Request logging
- Request IDs
- General request preprocessing
- Adding request-level information
- Integration with Express/Fastify middleware

### Middleware vs Guard

This is important for interviews.

**Middleware:**

> "Process the request before the route."

**Guard:**

> "Should this request be allowed to access the route?"

For authentication/authorization, Guards are generally a better NestJS abstraction.

---

# 7. Guards

A Guard decides whether a request can continue to a controller.

It implements:

```ts
CanActivate
```

Example:

```ts
@Injectable()
export class AuthGuard implements CanActivate {

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request =
      context.switchToHttp().getRequest<Request>();

    const token =
      request.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException(
        "Authorization token is missing",
      );
    }

    const user = await checkAuthorization(token);

    if (!user) {
      throw new UnauthorizedException(
        "Unauthorized access",
      );
    }

    request.user = user;

    return true;
  }
}
```

Use it:

```ts
@UseGuards(AuthGuard)
@Get("profile")
getProfile() {
  // Protected route
}
```

## Authentication vs Authorization

### Authentication

> Who are you?

Example:

```ts
AuthGuard
```

### Authorization

> Are you allowed to perform this action?

Example:

```ts
RolesGuard
```

You can use both:

```ts
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get("/get-all-users")
async getAllUsers() {
  return this.authService.getAllUsers();
}
```

Flow:

```text
Request
  |
  v
AuthGuard
  |
  | Is the user authenticated?
  |
  v
RolesGuard
  |
  | Is the user an admin?
  |
  v
Controller
```

If authentication fails:

```text
401 Unauthorized
```

If authentication succeeds but authorization fails:

```text
403 Forbidden
```

---

# 8. Multiple Guards

NestJS supports multiple guards on the same route:

```ts
@UseGuards(AuthGuard, RolesGuard)
```

They run in the order configured.

A common real-world pattern is:

```text
JWT/Auth Guard
      |
      v
Role/Permission Guard
      |
      v
Controller
```

Example:

```ts
@Get("/get-all-users")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getAllUsers(): Promise<IUser[]> {
  return this.authService.getAllUsers();
}
```

Do not normally instantiate injectable guards manually:

```ts
// Avoid when the guard is an injectable provider.
@UseGuards(new RolesGuard())
```

Prefer:

```ts
@UseGuards(AuthGuard, RolesGuard)
```

so Nest can manage the guard and inject its dependencies.

---

# 9. Public Routes

There are two useful approaches.

## Approach A: Attach guards only to protected routes

```ts
@Controller("auth")
export class AuthController {

  @Post("signup")
  signup() {}

  @Post("signin")
  signin() {}
}
```

Then:

```ts
@Controller("todos")
@UseGuards(AuthGuard)
export class TodosController {

  @Get()
  getTodos() {}

  @Post()
  createTodo() {}
}
```

This is simple and easy to understand.

## Approach B: Global authentication guard + `@Public()`

For larger applications, you can make authentication the default.

Create:

```ts
export const IS_PUBLIC_KEY = "isPublic";

export const Public = () =>
  SetMetadata(IS_PUBLIC_KEY, true);
```

Then:

```ts
@Public()
@Post("signup")
signup() {}
```

The global AuthGuard checks the metadata and skips authentication for public routes.

This follows a secure-by-default model:

```text
New route
   |
   v
Protected by default
   |
   +-- @Public() --> explicitly public
```

---

# 10. Pipes

Pipes are responsible for:

1. Validation
2. Transformation

## Validation

DTO:

```ts
export class TodosDto {

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(TodoStatus)
  status: TodoStatus;
}
```

Global pipe:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
);
```

If the client sends invalid data:

```json
{
  "title": "",
  "description": "Learn NestJS",
  "status": "wrong"
}
```

the request fails before the controller executes.

## Transformation

Route parameters arrive as strings.

```ts
@Get(":id")
getTodo(
  @Param("id", ParseIntPipe) id: number,
) {}
```

The pipe converts:

```text
"123"
  |
  v
123
```

## `whitelist`

With:

```ts
whitelist: true
```

properties that do not have validation decorators are removed.

Example:

```json
{
  "title": "Learn NestJS",
  "status": "pending",
  "unknownField": "remove me"
}
```

The unknown property is stripped.

---

# 11. DTOs vs Interfaces

This is an important design distinction.

## DTO

A DTO represents data coming into or going out of an API and can contain validation rules.

```ts
export class TodosDto {

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(TodoStatus)
  status: TodoStatus;
}
```

The client should provide:

```json
{
  "title": "Learn NestJS",
  "description": "Learn guards",
  "status": "pending"
}
```

It should not provide server-owned values such as:

```text
userId
createdAt
id
```

## Interface

An interface can represent the complete application/domain object:

```ts
export interface ITodo {
  id?: string;
  title: string;
  description: string;
  status: TodoStatus;
  userId: string;
  createdAt: Date;
}
```

The service builds the complete object:

```ts
const todo: ITodo = {
  ...body,
  userId,
  createdAt: new Date(),
};
```

### Easy rule

```text
DTO       = What the client is allowed to send
ITodo     = Complete Todo inside the application
```

Keep both when their responsibilities differ.

---

# 12. Enums

Use enums when a value has a fixed set of allowed values.

```ts
export enum TodoStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
}
```

DTO:

```ts
@IsEnum(TodoStatus)
status: TodoStatus;
```

This is better than:

```ts
status: string;
```

combined with a manually duplicated list in several places.

---

# 13. Interceptors

Interceptors wrap the controller execution.

They can execute:

- Before the controller
- After the controller
- Around the controller

Your response interceptor:

```ts
@Injectable()
export class TransformInterceptor
  implements NestInterceptor {

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ) {
    return next.handle().pipe(
      map((data) => ({
        data,
        statusCode:
          context
            .switchToHttp()
            .getResponse()
            .statusCode,
        message: "Request successful",
      })),
    );
  }
}
```

A controller returning:

```json
{
  "id": "123",
  "title": "Learn NestJS"
}
```

can become:

```json
{
  "data": {
    "id": "123",
    "title": "Learn NestJS"
  },
  "statusCode": 200,
  "message": "Request successful"
}
```

## Before and after

Conceptually:

```text
Request
   |
   v
Interceptor
   |
   +-- BEFORE
   |
   v
Controller
   |
   v
Service
   |
   +-- AFTER
   |
   v
Interceptor
   |
   v
Response
```

## Common interceptor use cases

- Response transformation
- Logging
- Performance measurement
- Caching
- Adding response metadata
- Cross-cutting behavior

---

# 14. Custom `@Message()` Decorator

You can create a custom decorator to define a response message.

```ts
export const RESPONSE_MESSAGE = "response_message";

export const Message = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE, message);
```

Controller:

```ts
@Post("signup")
@Message("User registered successfully")
async signup(
  @Body() body: UserDto,
) {
  return this.authService.signup(body);
}
```

The interceptor uses `Reflector` to read the metadata:

```ts
const message =
  this.reflector.get<string>(
    RESPONSE_MESSAGE,
    context.getHandler(),
  ) ?? "Request successful";
```

Flow:

```text
@Message(...)
     |
     v
Metadata
     |
     v
Reflector
     |
     v
Interceptor
     |
     v
Response.message
```

This keeps the service independent from HTTP response formatting.

---

# 15. Custom `@CurrentUser()` Decorator

After authentication, the authenticated user can be stored on:

```ts
request.user
```

Instead of writing:

```ts
@Request() req
```

and then:

```ts
req.user
```

you can create:

```ts
export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext) => {
    const request =
      ctx.switchToHttp().getRequest();

    return request.user;
  },
);
```

Then:

```ts
@Post("create")
async createTodo(
  @Body() body: TodosDto,
  @CurrentUser() user: IUser,
) {
  return this.todoService.createTodo(
    body,
    user.id,
  );
}
```

You can also make it return a specific property:

```ts
@CurrentUser("id") userId: string
```

This makes controllers cleaner.

---

# 16. TypeScript `request.user` Extension

Because Express does not know about your custom `user` property by default, you can extend the Express `Request` type.

For example:

```ts
// common/types/express.d.ts

import { IUser } from "../../auth/models.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
```

Now TypeScript understands:

```ts
request.user
```

This is called **declaration merging/type augmentation**.

The `?` is appropriate because not every request is authenticated.

---

# 17. Authentication Architecture

Your current learning implementation uses a token stored in `Users.json`.

The current flow is:

```text
Authorization: Bearer <token>
          |
          v
AuthGuard
          |
          v
checkAuthorization()
          |
          v
Users.json
          |
          v
Find user
          |
          v
request.user = user
```

This is useful for learning Guards and request context.

For a production application, authentication is commonly implemented with JWT + Passport:

```text
Login
  |
  v
AuthService
  |
  v
Generate JWT
  |
  v
Client
  |
  | Authorization: Bearer <JWT>
  v
JwtAuthGuard
  |
  v
JwtStrategy
  |
  v
Validate JWT
  |
  v
request.user
  |
  v
Controller
```

A typical JWT guard:

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
```

The strategy validates the token:

```ts
@Injectable()
export class JwtStrategy
  extends PassportStrategy(Strategy) {

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
```

The object returned from `validate()` becomes the authenticated user available as:

```ts
request.user
```

---

# 18. Middleware vs Guards vs Pipes vs Interceptors

This is one of the most important interview comparisons.

| Feature | Purpose | Example |
|---|---|---|
| Middleware | Process request before route processing | Logger |
| Guard | Allow/deny route access | JWT authentication |
| Pipe | Validate/transform input | ValidationPipe |
| Interceptor | Wrap controller execution | Response transformation |
| Decorator | Add metadata/extract context | `@CurrentUser()` |

### Simple memory trick

```text
Middleware → Process
Guard      → Protect
Pipe       → Validate / Transform
Interceptor→ Wrap
Decorator  → Describe / Extract
```

---

# 19. Exception Handling

If a controller/service throws an exception, the interceptor does not normally turn that exception into your success response.

Example:

```ts
throw new UnauthorizedException(
  "Unauthorized access",
);
```

Nest handles it through its exception handling mechanism.

Success:

```json
{
  "data": {},
  "statusCode": 200,
  "message": "Request successful"
}
```

Error:

```json
{
  "statusCode": 401,
  "message": "Unauthorized access"
}
```

This is why response transformation and exception handling should be considered separate concerns.

---

# 20. Request Flow Example: Create Todo

Request:

```http
POST /todos/create
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "title": "Learn NestJS",
  "description": "Understand Guards",
  "status": "pending"
}
```

### Step 1: Middleware

```text
LoggerMiddleware
```

Records the request.

### Step 2: Guard

```text
AuthGuard
```

Checks the token and attaches:

```ts
request.user = user;
```

### Step 3: Interceptor

The global interceptor starts wrapping the execution.

### Step 4: Pipe

`ValidationPipe` validates `TodosDto`.

### Step 5: Controller

```ts
@Post("create")
@UseGuards(AuthGuard)
async createTodo(
  @Body() body: TodosDto,
  @CurrentUser() user: IUser,
) {
  return this.todoService.createTodo(
    body,
    user.id,
  );
}
```

### Step 6: Service

The service creates:

```ts
const todo: ITodo = {
  ...body,
  userId: user.id,
  createdAt: new Date(),
};
```

### Step 7: Interceptor

The result is wrapped:

```json
{
  "data": {
    "title": "Learn NestJS",
    "description": "Understand Guards",
    "status": "pending",
    "userId": "123",
    "createdAt": "..."
  },
  "statusCode": 201,
  "message": "Request successful"
}
```

### Step 8: Middleware

The response finishes and the logger records:

```text
[POST] /todos/create - 201 - 25ms
```

---

# 21. Example Flows

## Sign up

`POST /auth/signup` is public. The global pipe validates the body using `UserDto`; `AuthController` calls `AuthService.signup()`, which creates a user ID and token and saves the user to `src/Data/Users.json`. The interceptor returns the created user in the `data` field with the message `User created successfully!!`.

## Sign in

`POST /auth/signin` is public. `AuthService.signIn()` matches the submitted email and password against `Users.json`, then returns the stored token. The response is wrapped by the global interceptor.

## Create a todo

`POST /todos/create` is protected by the `AuthGuard` applied to `TodosController`. After the guard authenticates the bearer token, `@CurrentUser()` reads that user from the request. The global pipe validates the body using `TodosDto`, and `TodoService.createTodo()` associates the todo with the authenticated user's ID and saves it to `src/Data/Todos.json`.

Send the token as:

```text
Authorization: Bearer <token>
```

for protected routes.

---

# 22. Routes

| Method | Route | Access | Behavior |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | Public | Create a user (`UserDto`) |
| `POST` | `/auth/signin` | Public | Return a matching user's token |
| `GET` | `/auth/get-all-users` | Authenticated admin | Return all users (`AuthGuard` + `RolesGuard`) |
| `GET` | `/auth/user/info` | No guard currently attached | Uses `@CurrentUser()`, but no guard populates that context on this route as currently configured |
| `POST` | `/todos/create` | Authenticated | Create a todo for the current user (`TodosDto`) |
| `GET` | `/todos/user` | Authenticated | Return todos belonging to the current user |

---

# 23. Data Storage

This project currently uses JSON files rather than a database.

`AuthService` and `Authorization` read user records from:

```text
src/Data/Users.json
```

`TodoService` reads and writes:

```text
src/Data/Todos.json
```

This keeps the example simple, but file-backed storage is intended for local/demo use rather than concurrent or production workloads.

---

# 24. Recommended Folder Structure

For this project, use feature-based modules with shared infrastructure separated into `common`:

```text
src/
│
├── main.ts
├── app.module.ts
│
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── signup.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── models.ts
│
├── todos/
│   ├── dto/
│   │   ├── create-todo.dto.ts
│   │   └── update-todo.dto.ts
│   ├── todos.controller.ts
│   ├── todos.service.ts
│   ├── todos.module.ts
│   └── models.ts
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── message.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── middleware/
│   │   └── logger.middleware.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── types/
│       └── express.d.ts
│
└── database/
    └── data/
        ├── Users.json
        └── Todos.json
```

### Why this structure?

```text
Feature-specific code
        |
        +-- auth/
        +-- todos/

Shared application infrastructure
        |
        +-- common/
```

Do not create a `hooks/` folder just because frontend projects such as React commonly have one. NestJS does not have a React-style hooks concept. Put code according to its responsibility: guards, middleware, services, repositories, decorators, etc.

---

# 25. `main.ts` vs `AppModule`

### `main.ts`

Bootstraps and configures the application:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new TransformInterceptor(
      app.get(Reflector),
    ),
  );

  await app.listen(3000);
}

bootstrap();
```

### `AppModule`

Connects feature modules:

```ts
@Module({
  imports: [
    AuthModule,
    TodosModule,
  ],
})
export class AppModule {}
```

### Simple distinction

```text
main.ts
  = Start/configure the application

AppModule
  = Connect the application's modules
```

---

# 26. Middleware Configuration in AppModule

For application-wide middleware:

```ts
export class AppModule implements NestModule {

  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes("*");
  }
}
```

If middleware should apply only to selected routes, configure those routes instead.

For example:

```ts
consumer
  .apply(SomeMiddleware)
  .forRoutes(TodosController);
```

Authentication is generally better implemented using Guards rather than making an authentication middleware responsible for route authorization.

---

# 27. Common Interview Questions

## What is NestJS?

NestJS is a Node.js server-side framework built with TypeScript. It provides a structured architecture around modules, controllers, providers, dependency injection, decorators, and other abstractions.

## What is Dependency Injection?

Dependency Injection means a class receives its dependencies from an external container instead of creating them itself.

```ts
constructor(
  private readonly todoService: TodoService,
) {}
```

Nest's DI container creates and supplies `TodoService`.

## What is a module?

A module groups related controllers, providers, imports, and exports.

```ts
@Module({
  controllers: [TodosController],
  providers: [TodoService],
})
export class TodosModule {}
```

## Middleware vs Guard?

Middleware processes requests before the route handler.

Guard determines whether the request is allowed to access the route.

Authentication/authorization is commonly handled with Guards.

## Guard vs Interceptor?

Guard decides:

```text
Can the request continue?
```

Interceptor wraps execution:

```text
Before → Controller/Service → After
```

## Pipe vs Guard?

Pipe:

```text
Is the input valid?
Can it be transformed?
```

Guard:

```text
Is this request allowed?
```

## Why use DTOs?

DTOs define the expected API input/output shape and can provide validation rules through `class-validator`.

## Why use interfaces as well as DTOs?

Because they can have different responsibilities:

```text
DTO
= API input

Interface
= Complete application/domain model
```

## What is `@Injectable()`?

It marks a class as a Nest provider that can participate in dependency injection.

## What is `@UseGuards()`?

It attaches one or more Guards to a controller or route.

```ts
@UseGuards(AuthGuard, RolesGuard)
```

## What is `@Controller()`?

It defines a class that handles HTTP routes.

```ts
@Controller("todos")
```

## What is `@Body()`?

It extracts the request body.

```ts
@Post()
create(@Body() body: CreateTodoDto) {}
```

## What is `@Param()`?

It extracts route parameters.

```ts
@Get(":id")
getTodo(@Param("id") id: string) {}
```

## What is `@CurrentUser()`?

It is a custom parameter decorator that extracts the authenticated user from `request.user`.

---

# 28. Quick Interview Cheat Sheet

```text
@Module()
    ↓
Groups application functionality

@Controller()
    ↓
Handles HTTP routes

@Injectable()
    ↓
Makes a class available to Nest DI

Middleware
    ↓
General request preprocessing

Guard
    ↓
Authentication / authorization

Pipe
    ↓
Validation / transformation

Interceptor
    ↓
Before + after controller execution

Decorator
    ↓
Metadata / parameter extraction

DTO
    ↓
API input/output contract + validation

Interface
    ↓
TypeScript/application model

Service
    ↓
Business logic

Repository
    ↓
Data access

Exception Filter
    ↓
Centralized exception handling
```

---

# 29. The One Diagram to Remember for Interviews

```text
                         CLIENT
                           |
                           v
                    +-------------+
                    | Middleware  |
                    |  Logging    |
                    +------+------+
                           |
                           v
                    +-------------+
                    |   Guards    |
                    | Auth / Role  |
                    +------+------+
                           |
                           v
                    +-------------+
                    | Interceptor |
                    |   BEFORE    |
                    +------+------+
                           |
                           v
                    +-------------+
                    |    Pipes    |
                    | Validation  |
                    | Transform   |
                    +------+------+
                           |
                           v
                    +-------------+
                    | Controller  |
                    | HTTP layer  |
                    +------+------+
                           |
                           v
                    +-------------+
                    |   Service   |
                    |   Business  |
                    |    Logic    |
                    +------+------+
                           |
                           v
                    +-------------+
                    | Repository  |
                    | / Database  |
                    +------+------+
                           |
                           v
                    +-------------+
                    | Interceptor |
                    |    AFTER    |
                    +------+------+
                           |
                           v
                        CLIENT
```

### Memorize this sentence

> **Middleware processes the request, Guards protect the route, Pipes validate/transform data, Controllers handle HTTP, Services handle business logic, Interceptors wrap execution, and Decorators provide metadata or extract information.**

That sentence covers a large part of the NestJS architecture and is a useful starting point when preparing for interviews.
