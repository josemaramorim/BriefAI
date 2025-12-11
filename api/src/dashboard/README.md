# Dashboard Module

This module provides analytics and metrics endpoints for the BriefAI application.

## Features

- **Metrics Aggregation**: Aggregate metrics for briefings, templates, collaborations, and storage
- **Multi-tenant Support**: Filter metrics by tenant ID
- **Performance Optimized**: Uses Prisma's parallel query execution for fast metrics retrieval

## Endpoints

### GET /dashboard/metrics

Get dashboard metrics for a specific tenant.

**Query Parameters:**
- `tenantId` (required): The ID of the tenant to retrieve metrics for

**Response:**
```json
{
  "briefings": {
    "total": 10,
    "inProgress": 3,
    "completed": 5,
    "draft": 2
  },
  "templates": {
    "total": 8,
    "published": 5,
    "draft": 3
  },
  "collaborations": {
    "totalCollaborators": 15,
    "activeCollaborators": 3
  },
  "storage": {
    "totalAttachments": 25,
    "totalSize": 1024000
  }
}
```

## Implementation Notes

- Metrics are calculated on-demand using Prisma aggregation queries
- Queries are parallelized using `Promise.all()` for optimal performance
- Active collaborators are counted using `groupBy` to get unique users
- Storage size is aggregated in bytes using Prisma's `_sum` aggregation

## Testing

Run tests with:
```bash
npm test -- dashboard
```

## Future Enhancements

Potential future features:
- Time-series metrics (last 7 days, last 30 days, etc.)
- Export statistics by format
- User activity metrics
- Template usage statistics
- Briefing completion rates
