# ADR-002: Multi-Tenant Data Isolation Strategy

## Status
Accepted

## Context
Lead Tracker serves multiple organizations with strict data isolation requirements:
- Each organization must only access their own data
- Data isolation must be enforced at the database level
- Performance should not degrade with tenant filtering
- Implementation should be transparent to business logic
- Migration between single-tenant and multi-tenant should be seamless

## Decision
We will implement **Row-Level Security (RLS)** using EF Core Global Query Filters:

### Implementation Strategy:
1. **Global Query Filters** on all tenant-scoped entities
2. **Automatic org_id injection** via custom DbContext
3. **Index optimization** for tenant-filtered queries
4. **Tenant resolution** from authenticated user context

### Entity Design Pattern:
```csharp
public abstract class TenantEntity
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; }
}

public class Lead : TenantEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    // ... other properties
}
```

### DbContext Configuration:
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Global query filter for all tenant entities
    modelBuilder.Entity<Lead>()
        .HasQueryFilter(e => e.OrganizationId == CurrentOrganizationId);
    
    // Composite indexes for performance
    modelBuilder.Entity<Lead>()
        .HasIndex(e => new { e.OrganizationId, e.CreatedAt });
}
```

### Tenant Resolution:
- Extract `org_id` from JWT claims in authenticated requests
- Inject into `ITenantContext` service via DI container
- Use `IHttpContextAccessor` for request-scoped tenant resolution

## Alternatives Considered

### 1. Separate Databases per Tenant
**Rejected** - Increases infrastructure complexity and costs

### 2. Schema-based Isolation  
**Rejected** - Limited PostgreSQL schema support, complex migrations

### 3. Application-level Filtering
**Rejected** - Error-prone, requires manual filtering in all queries

## Consequences

### Positive:
- **Automatic Isolation**: Query filters applied transparently
- **Performance**: Proper indexing with org_id prefix
- **Security**: Database-level enforcement prevents data leaks
- **Maintainability**: Single codebase, single database
- **Scalability**: Horizontal scaling with proper partitioning

### Negative:
- **Query Complexity**: All queries include org_id filter
- **Testing Complexity**: Must test cross-tenant isolation
- **Migration Complexity**: Existing data needs org_id backfill

### Performance Considerations:
- All tenant entities have composite indexes starting with `org_id`
- Query execution plans optimized for tenant filtering
- Connection pooling shared across tenants
- Consider partitioning by org_id for very large datasets

## Security Measures:
1. **Double Validation**: Query filter + application-level checks
2. **Audit Logging**: All cross-tenant access attempts logged
3. **Integration Tests**: Comprehensive tenant isolation testing
4. **Code Reviews**: Mandatory review for new tenant entities

## Implementation Checklist:
- [ ] Custom `TenantDbContext` with automatic org_id injection
- [ ] `ITenantContext` service for current organization resolution
- [ ] Global query filters on all tenant entities
- [ ] Composite indexes with org_id prefix
- [ ] Integration tests for tenant isolation
- [ ] Migration scripts for existing data
- [ ] Documentation for adding new tenant entities
