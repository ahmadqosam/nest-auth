# NestJS Secure Authentication System
A production-grade authentication API built with **NestJS**, **Prisma 7**, **LibSQL**, and **Passport**.
Features **Asymmetric Signing (RS256)**, **Opaque Refresh Tokens**, and strictly typed **OpenAPI** documentation.
## Features
-   **Database**: Prisma 7 (Bleeding Edge) with LibSQL Driver Adapter.
-   **Security**:
    -   **RS256 Signing**: Access Tokens signed with private RSA key.
    -   **JWKS Endpoint**: `/.well-known/jwks.json` public key discovery.
    -   **Opaque Refresh Tokens**: Hashed (Argon2) in DB, random strings on wire.
    -   **Rolse-Based Access (RBAC)**: `roles` claim embedded in JWT (USER, ADMIN).
    -   **Argon2**: Secure password hashing.
-   **Documentation**:
    -   **Scalar UI**: Modern replacement for Swagger UI.
    -   **Auto-Schema**: Types enforced via NestJS CLI Plugin.
## Setup & Installation
**1. Install Dependencies**
```bash
npm install
```
**2. Generate Security Keys We use a helper script to generate RSA 2048-bit keys and update your .env file automatically.**
```bash
npm run keys:gen
```
**3. Database Setup**

**Option A: Turso (Current Configuration)**
*These steps are specific to the LibSQL/Turso driver adapter.*

```bash
# 1. Install Turso CLI & Login
brew install tursodatabase/tap/turso
turso auth login

# 2. Create DB & Get Credentials
turso db create nest-auth
turso db show nest-auth --url      # -> DATABASE_URL
turso db tokens create nest-auth   # -> DB_TOKEN

# 3. Apply Schema (Turso-Specific Workaround)
# Prisma CLI does not natively support 'libsql://' for migrations yet.
# We must generate SQL locally and pipe it to the Turso CLI.
DATABASE_URL="file:./dev.db" npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > migration.sql
turso db shell nest-auth < migration.sql

# 4. Generate Client
npx prisma generate
```

**Option B: Standard SQL (Future)**
*If switching to standard PostgreSQL/MySQL, use standard Prisma commands:*
```bash
# npx prisma migrate dev
```
**4. Run Server**
```bash
npm run start:dev
```
## API Documentation
Once the server is running, visit:

- Docs (Scalar UI): http://localhost:3000/docs
- JWKS (Public Keys): http://localhost:3000/.well-known/jwks.json

## Architecture
**Token Lifecycle**
1. Login/Signup: Returns access_token (JWT) and refresh_token (Opaque).
2. Access Protected Routes: Send Authorization: Bearer <access_token>.
3. Validated using Public Key (RS256).
4. Refresh: Send POST /auth/refresh with { userId, refreshToken }.
Service looks up user -> Verifies Hash of Refresh Token -> Returns new pair.

## Environment Variables
| Variable | Description |
| --- | --- |
| JWT_PRIVATE_KEY | Private key for signing JWTs |
| JWT_PUBLIC_KEY | Public key for verifying JWTs |
| JWT_RT_SECRET | Secret for signing refresh tokens |
| JWT_EXPIRES_IN | Expiration time for access tokens |
| JWT_RT_EXPIRES_IN | Expiration time for refresh tokens |
| DATABASE_URL | Turso Connection URL (`libsql://...`) |
| DB_TOKEN | Turso Auth Token (Required for Remote Connection) |

