# Lead Tracker - Demo Dataset Documentation

## Overview

This document describes the comprehensive demo dataset created for the Lead Tracker application. The dataset includes 50 realistic leads with varied data, designed to showcase all features of the application.

## Dataset Statistics

- **Total Leads**: 50
- **Pipeline Stages**: 7
- **Sales Team Members**: 3
- **Organizations**: 1 (Demo Corporation)
- **Average Tasks per Lead**: 2
- **Industries Represented**: 20
- **Lead Sources**: 20

## Lead Distribution

### Pipeline Stages

| Stage | Count | Percentage | Description |
|-------|-------|------------|-------------|
| Initial Contact | ~7 | 14% | First contact made with prospect |
| Qualified | ~8 | 16% | Lead has been qualified and shows interest |
| Needs Analysis | ~8 | 16% | Analyzing customer needs and requirements |
| Proposal | ~7 | 14% | Proposal sent to customer |
| Negotiation | ~6 | 12% | Negotiating terms and pricing |
| Closed Won | ~8 | 16% | Deal successfully closed |
| Closed Lost | ~6 | 12% | Deal lost to competitor or no decision |

### Lead Sources

The leads come from 20 different sources:
- Website
- Referral
- Cold Call
- Email Campaign
- Social Media
- Trade Show
- LinkedIn
- Google Ads
- Content Marketing
- Partner Channel
- Webinar
- Case Study
- White Paper
- Demo Request
- Free Trial
- Newsletter
- Blog
- Podcast
- Video
- Press Release

### Industries

Leads represent 20 different industries:
- Technology
- Healthcare
- Finance
- Manufacturing
- Retail
- Education
- Government
- Non-profit
- Real Estate
- Consulting
- Media
- Transportation
- Energy
- Telecommunications
- Automotive
- Aerospace
- Pharmaceuticals
- Food & Beverage
- Construction
- Entertainment

## Lead Data Structure

Each lead includes the following realistic data:

### Contact Information
- **Name**: Realistic first and last names
- **Email**: Generated based on name and company
- **Phone**: US format (+1-XXX-XXX-XXXX)
- **Company**: 50 unique company names
- **Job Title**: 20 different professional titles

### Business Information
- **Estimated Value**: $10,000 - $500,000 (based on job title and industry)
- **Probability**: 0-100% (correlated with pipeline stage)
- **Expected Close Date**: Realistic timeline based on stage
- **Source**: One of 20 lead sources
- **Industry**: One of 20 industries

### Pipeline Information
- **Stage**: One of 7 pipeline stages
- **Status**: Open, Won, or Lost
- **Assigned User**: One of 3 sales team members
- **Last Contacted**: Within last 30 days
- **Notes**: Realistic notes based on industry and source

## Task Distribution

Each lead has 1-3 associated tasks with the following characteristics:

### Task Types
- Call
- Email
- Meeting
- Follow-up
- Demo
- Proposal
- Contract Review

### Task Priorities
- Low (25%)
- Medium (50%)
- High (20%)
- Urgent (5%)

### Task Status
- Pending (60%)
- Completed (35%)
- Cancelled (5%)

### Task Timing
- **Due Date**: 1-30 days from creation
- **Overdue Tasks**: 10% of pending tasks
- **Duration**: 15-120 minutes for completed tasks

## Sales Team

### John Doe - Sales Manager
- **Email**: john.doe@demo-corp.com
- **Phone**: +1-555-0101
- **Assigned Leads**: ~33% of leads

### Jane Smith - Account Executive
- **Email**: jane.smith@demo-corp.com
- **Phone**: +1-555-0102
- **Assigned Leads**: ~33% of leads

### Mike Johnson - Business Development
- **Email**: mike.johnson@demo-corp.com
- **Phone**: +1-555-0103
- **Assigned Leads**: ~33% of leads

## Data Quality Features

### Realistic Company Names
- 50 unique, professional company names
- Mix of industries and company sizes
- Realistic naming patterns

### Realistic Contact Information
- Professional email addresses
- US phone number format
- Appropriate job titles for each industry

### Realistic Business Values
- Values correlate with job titles and industries
- CEO/CTO: $100,000 - $500,000
- VP Sales/Marketing Director: $50,000 - $200,000
- Operations/Product Manager: $25,000 - $100,000
- Others: $10,000 - $75,000

### Realistic Pipeline Progression
- Probability increases with stage progression
- Close dates become more immediate as stage advances
- Won/Lost stages have appropriate probability values

## Usage Instructions

### Seeding the Data

#### Via API Endpoint
```bash
POST /api/seed/demo-data
Authorization: Bearer <token>
```

#### Via CLI Script
```bash
# PowerShell (Windows)
.\scripts\seed-demo-data.ps1

# Bash (Linux/macOS)
./scripts/seed-demo-data.sh
```

### Viewing the Data

1. Start the API: `dotnet run --project LeadTracker.Api`
2. Access Swagger UI: `http://localhost:5000/swagger`
3. Authenticate with demo credentials
4. Use the Leads API to view seeded data

## Demo Credentials

- **Email**: john.doe@demo-corp.com
- **Password**: Demo123!
- **Role**: Sales Manager

## Data Relationships

### Lead → Stage
- Each lead belongs to exactly one stage
- Stage determines probability and close date

### Lead → User
- Each lead is assigned to one sales team member
- Even distribution across team members

### Lead → Tasks
- Each lead has 1-3 associated tasks
- Tasks are assigned to the same user as the lead

### Lead → Organization
- All leads belong to "Demo Corporation"
- Multi-tenant isolation maintained

## Performance Considerations

- **Database Size**: ~50 leads + ~100 tasks = minimal impact
- **Query Performance**: Indexed on organization_id, stage_id, assigned_user_id
- **Memory Usage**: Optimized for development and testing
- **Seeding Time**: < 5 seconds on modern hardware

## Customization

The demo data can be customized by modifying:
- `DemoDataSeeder.cs`: Lead generation logic
- `SeedData.cs`: Basic organization and user data
- Company names, industries, and sources arrays
- Task types and priorities
- Probability and value calculations

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Ensure demo user exists in database
2. **Seeding Fails**: Check database connection and permissions
3. **Data Not Appearing**: Verify organization context is set correctly
4. **Duplicate Data**: Clear existing data before re-seeding

### Reset Data

To reset the demo data:
1. Clear the leads table: `DELETE FROM "Leads"`
2. Clear the tasks table: `DELETE FROM "Tasks"`
3. Re-run the seeding process

## Future Enhancements

- Add more realistic company data from external APIs
- Include geographic distribution
- Add seasonal variations in lead generation
- Include more complex task dependencies
- Add lead scoring algorithms
- Include competitive intelligence data
