# Identity Service - Environment Configuration

## Overview

This service follows enterprise security standards by using environment variables for sensitive configuration data.

## Setup Instructions

### 1. Environment Variables Setup

Copy the example environment file and configure your values:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your actual values:

```bash
# Database Configuration
DB_PASSWORD=your_actual_database_password
DB_USERNAME=your_database_username

# JWT Configuration
JWT_SIGNER_KEY=your_secure_jwt_signing_key

# OAuth2 Google Configuration
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Application URLs
OAUTH_REDIRECT_URL=
PROFILE_SERVICE_URL=

# Database URL
DB_URL=jdbc:mysql://localhost:3306/identity_service?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

### 3. Security Notes

- The `.env` file is automatically excluded from version control via `.gitignore`
- Environment variables have fallback default values in `application.yaml`
- For production, use your platform's environment variable management (e.g., Kubernetes secrets, AWS Parameter Store, etc.)

### 4. Running the Application

The application will automatically load environment variables from the `.env` file when starting up.

```bash
mvn spring-boot:run
```

## Environment Variable Precedence

1. System environment variables (highest priority)
2. `.env` file variables
3. Default values in `application.yaml` (lowest priority)

## Production Deployment

For production environments:

- Use your cloud provider's secret management service
- Set environment variables directly in your deployment configuration
- Never commit actual sensitive values to version control
