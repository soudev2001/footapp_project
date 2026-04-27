
## SUPERADMIN ROLE: Improvement Prompts

### Prompt 1: Platform Management & Business Metrics

```
I'm the SuperAdmin managing the FootApp platform. I need to:
- Understand how many clubs are active and healthy
- Track revenue and growth
- Manage multiple clubs as separate instances
- Monitor platform usage and engagement
- Make data-driven platform decisions

CURRENTLY:
- Limited visibility into club health
- Manual tracking of metrics
- No clear picture of business performance
- Difficulty identifying at-risk customers

QUESTION: Design a platform management dashboard with:

1. CLUB OVERVIEW
   - Total clubs (with count trends)
   - Club status (active, trial, suspended, churned)
   - Club health score (activity, engagement, revenue)
   - Club details (members, teams, revenue)
   - Quick actions (suspend, activate, impersonate)

2. BUSINESS METRICS
   - Total users (by role)
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - Churn rate (clubs lost)
   - Paying vs. free clubs
   - ARPU (Average Revenue Per User)
   - LTV (Lifetime Value)

3. GROWTH ANALYTICS
   - Club acquisition rate (new clubs/month)
   - User growth (new users/month)
   - Revenue growth trends
   - Projected annual revenue
   - Retention cohorts (which cohorts are retaining best)

4. ENGAGEMENT ANALYTICS
   - DAU/MAU (Daily/Monthly Active Users)
   - Feature usage breakdown
   - Login frequency
   - Least-used features

5. OPERATIONAL INSIGHTS
   - Support tickets
   - Error rates
   - API usage
   - Performance metrics

For implementation:
- Data aggregation across all clubs
- Real-time vs. batch updates
- Dashboard frequency (update)
- Export capabilities (reports)
```

### Prompt 2: Revenue & Billing Management

```
I need to manage subscriptions and payment processing for all clubs. Currently:
- Manual subscription tracking
- No payment processing
- Manual invoice generation
- No recurring revenue automation
- Difficult to scale to more clubs

GOALS:
- Automated payment collection (recurring)
- Professional invoicing system
- Revenue tracking and forecasting
- Subscription management (upgrades, downgrades)
- Handle failed payments automatically

QUESTION: Design a billing system with:

1. PAYMENT PROCESSING
   - Stripe integration
   - Credit card processing
   - Monthly/annual billing options
   - Free trial support
   - Multiple payment methods

2. SUBSCRIPTION MANAGEMENT
   - Plan tiers (free, starter, pro, enterprise)
   - Plan features and limits
   - Upgrade/downgrade workflows
   - Proration calculations
   - Cancellation workflows

3. INVOICING
   - Auto-generate invoices
   - Email invoices to customers
   - Invoice archive
   - Invoice customization (branding)
   - Tax calculation (VAT, GST)

4. REVENUE TRACKING
   - MRR/ARR calculations
   - Revenue by plan
   - Revenue by region/country
   - Revenue forecasting
   - Cohort revenue analysis

5. DUNNING & FAILURES
   - Failed payment detection
   - Automatic retries (3+ attempts)
   - Dunning emails
   - Subscription suspension (non-payment)
   - Chargeback handling

For implementation:
- Stripe account setup
- PCI compliance
- Tax/VAT handling
- Payment timing (monthly on specific date)
```

### Prompt 3: Customer Support & Success

```
I want to ensure clubs are successful and reduce churn. Currently:
- Limited support infrastructure
- Reactive problem-solving (customers complain, then we fix)
- No proactive customer success
- No support ticket system

GOALS:
- Quick response to issues
- Proactive support (identify issues before customers complain)
- Higher customer satisfaction (NPS > 50)
- Reduce churn (increase retention)
- Scale support as platform grows

QUESTION: Design a customer success system with:

1. SUPPORT TICKETING
   - Ticket creation (by customer or support team)
   - Categorization (technical, billing, feature, other)
   - Priority levels (critical, high, medium, low)
   - SLA tracking (response time, resolution time)
   - Ticket history and notes

2. KNOWLEDGE BASE
   - FAQ section
   - How-to guides per role (admin, coach, player)
   - Video tutorials
   - Troubleshooting guides
   - Search functionality

3. PROACTIVE MONITORING
   - Identify inactive clubs (haven't logged in 30 days)
   - Identify underutilization (using <10% of features)
   - Usage alerts (unusual patterns)
   - Health score alerts (club health declining)
   - Engagement regression

4. CUSTOMER SUCCESS
   - Onboarding checklist per role
   - Guided first steps (activation metrics)
   - Feature adoption tracking
   - Regular check-ins (monthly business reviews)
   - Success metrics tracking (are they getting value?)

5. FEEDBACK & CONTINUOUS IMPROVEMENT
   - Net Promoter Score (NPS) surveys
   - Feature request voting
   - Usage feedback
   - Satisfaction tracking
   - Roadmap input from customers

For implementation:
- Support ticketing system (Zendesk, Freshdesk, custom)
- Knowledge base platform (Notion, Intercom, custom)
- Monitoring and alerting infrastructure
- Customer communication plan
- Support team training
```

---