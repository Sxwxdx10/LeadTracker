# ADR-001: Authentication Strategy

## Status
Accepted

## Context
Lead Tracker needs a robust authentication system that supports:
- Multi-tenant architecture with organization isolation
- JWT-based stateless authentication for API scalability
- Secure session management with refresh tokens
- Password reset functionality
- Email verification for new accounts

## Decision
We will implement JWT-based authentication with ASP.NET Core Identity:

### Components:
1. **ASP.NET Core Identity** for user management, password hashing, and email verification
2. **JWT Access Tokens** (15-minute expiry) for API authentication
3. **Refresh Tokens** (7-day expiry) stored as httpOnly cookies for security
4. **Organization Resolution** via `X-Org-Id` header for multi-tenancy
5. **Email Verification** required for new account activation

### Token Structure:
```json
{
  "sub": "user-id",
  "org_id": "organization-id", 
  "email": "user@example.com",
  "roles": ["User", "Admin"],
  "exp": 1234567890
}
```

### Endpoints:
- `POST /auth/register` - Create account with email verification
- `POST /auth/login` - Authenticate and return JWT + refresh token
- `POST /auth/refresh` - Refresh access token using refresh token
- `POST /auth/reset-password` - Request password reset email
- `POST /auth/confirm-reset` - Confirm password reset with token

## Consequences

### Positive:
- Stateless authentication scales horizontally
- Secure refresh token rotation prevents token theft
- Clear separation between organizations
- Industry-standard JWT format
- Built-in ASP.NET Core Identity features

### Negative:
- JWT tokens cannot be revoked before expiry (mitigated by short expiry)
- Additional complexity with refresh token management
- Requires careful CORS configuration for cross-origin requests

### Security Considerations:
- Access tokens stored in memory (not localStorage)
- Refresh tokens in httpOnly, SameSite cookies
- CSRF protection with double-submit cookie pattern
- Rate limiting on authentication endpoints
- Account lockout after failed attempts

## Implementation Notes:
- Use `IHttpContextAccessor` to resolve current user and organization
- Implement custom `IUserClaimsPrincipalFactory` for organization claims
- Configure JWT validation with proper issuer/audience validation
- Implement secure password policy (min 8 chars, complexity requirements)
