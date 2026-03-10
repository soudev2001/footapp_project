# FootApp: AI Prompts for Role-Specific Improvements

**Document**: Strategic prompts for each role to identify improvements
**Version**: 1.0
**Usage**: Copy prompts into ChatGPT, Claude, or other AI tools for role-specific guidance

---

## How to Use These Prompts

1. **Copy the entire role section** (or specific prompt)
2. **Paste into ChatGPT or Claude** (or your preferred AI tool)
3. **Ask for elaboration** on specific items
4. **Use responses to inform** your development roadmap
5. **Iterate and refine** based on your actual user feedback

---

## ADMIN ROLE: Improvement Prompts

### Prompt 1: Current State Analysis & Pain Points

```
I'm a club administrator using FootApp for member management and club administration. Here's my current situation:

CURRENT SETUP:
- Club size: 100-200 members
- Teams: 3-5 teams
- Main responsibilities: Member onboarding, team management, communication, financial tracking
- Time spent on admin: 15 hours per week
- Current pain points:
  * Manual member invitation process (1-2 hours per member)
  * Scattered member information (emails, spreadsheets, WhatsApp)
  * No visibility into member engagement or activity
  * Manual tracking of subscriptions and payments
  * Can't generate reports for board meetings quickly
  * Communication is fragmented

GOALS:
- Reduce admin time from 15 to 8 hours per week
- Have complete member directory with contact info
- Track member engagement and retention
- Generate professional reports for board in <30 minutes
- Automate payment collection and invoicing
- Improve communication with all members

QUESTION: What are the 10 most important features I should prioritize to improve club management? For each feature, explain:
1. How it solves my problem
2. Rough timeline to implement
3. Resources needed
4. Expected ROI (time saved or revenue generated)
```

### Prompt 2: Bulk Operations & Workflow Automation

```
I need to streamline my member onboarding process. Currently:
- I add members one by one (30 minutes per member)
- I send invitation emails manually
- I track who has registered in a spreadsheet
- I resend invitations manually to non-responders
- I create player profiles by hand

CHALLENGE: During registration season, I onboard 50-100 new members in 2 weeks.

QUESTION: Design a bulk member onboarding workflow that would:
1. Allow CSV import of members (fields: email, name, role, team)
2. Auto-send invitation emails with customizable text
3. Track invitation status (pending, accepted, expired)
4. Auto-send reminders to non-responders
5. Auto-create player profiles
6. Allow bulk actions (resend, change role, assign team)
7. Generate onboarding reports

For each step, explain:
- How it saves time
- How to measure success
- What data to track
```

### Prompt 3: Analytics & Data-Driven Decisions

```
I need to present club performance to my board quarterly. Currently, I spend 3-4 hours:
- Calculating member growth from spreadsheets
- Gathering team data manually
- Creating charts in Excel
- Writing summary report

I want to generate a professional report in <30 minutes.

QUESTION: Design a comprehensive analytics dashboard that would give me instant visibility into:

1. MEMBER METRICS
   - Total members (with growth trend)
   - Members by role (admin, coach, player, parent, fan)
   - New members this month
   - Member retention rate
   - Active vs. inactive members

2. TEAM METRICS
   - Players per team
   - Coaches per team
   - Team performance (if match data available)
   - Team engagement

3. ENGAGEMENT METRICS
   - Login frequency (who's active)
   - Feature usage (calendar, messaging, etc.)
   - Event attendance rate
   - Message activity

4. FINANCIAL METRICS
   - MRR (Monthly Recurring Revenue)
   - Subscription plan breakdown
   - Revenue per member
   - Projected annual revenue

For each metric:
- How to calculate it
- Where to display it (dashboard, report)
- Export options (PDF, Excel, PowerPoint)
```

### Prompt 4: Financial Management & Revenue

```
I'm currently tracking subscriptions manually in a notebook. I have no way to:
- Collect payments online
- Generate invoices
- Track overdue payments
- Report financial status to board
- Manage refunds

CHALLENGE: I need to generate consistent monthly revenue to sustain the club.

QUESTION: Design a financial management system that would:

1. PAYMENT PROCESSING
   - Accept credit card payments online (Stripe)
   - Support monthly or annual billing
   - Auto-charge recurring subscriptions
   - Handle payment failures with retries

2. INVOICING
   - Auto-generate invoices on payment
   - Send to member email
   - Provide download option
   - Archive all invoices

3. SUBSCRIPTION MANAGEMENT
   - Allow upgrade/downgrade
   - Prorate charges mid-cycle
   - Support free trials
   - Enable cancellation workflow

4. FINANCIAL REPORTING
   - Dashboard showing MRR/ARR
   - Payment history table
   - Revenue trends (chart)
   - Export financial data

5. DUNNING MANAGEMENT
   - Email reminders before due date
   - Retry failed payments automatically
   - Suspend access for non-payment
   - Track payment disputes

For each feature:
- Implementation complexity
- Time to set up
- Monthly fees (Stripe, payment processor)
- Expected revenue impact
```

### Prompt 5: Member Communication & Engagement

```
Currently I communicate with members via email, WhatsApp, and in-person. It's chaotic because:
- Different groups use different channels
- Messages get lost
- No record of communication
- Can't reach everyone at once efficiently

QUESTION: Design a communication system that enables:

1. ANNOUNCEMENTS
   - Club-wide announcements
   - Team-specific messages
   - Role-specific messages (to all parents, coaches, etc.)
   - Scheduled sending (prepare in advance, send later)

2. EMAIL CAMPAIGNS
   - Newsletter templates
   - Segment targeting (parents, coaches, players)
   - Track open rates
   - A/B test subject lines

3. NOTIFICATIONS
   - In-app notifications
   - Email notifications
   - SMS (optional)
   - Push notifications (mobile)

4. TWO-WAY COMMUNICATION
   - Feedback forms (satisfaction surveys)
   - Help/support requests
   - Member inquiries
   - Complaint tracking

5. ANALYTICS
   - Message open rate
   - Click-through rate
   - Unsubscribe rate
   - Member feedback compilation

For each channel:
- Setup complexity
- Monthly cost
- Expected impact on engagement
```

---

## COACH ROLE: Improvement Prompts

### Prompt 1: Strategic Player Development

```
I'm a head coach managing a 25-player squad. My challenge is:
- Can't objectively track player progress
- Performance evaluation is based on intuition, not data
- No systematic training program
- Can't identify which training drills work best
- Player feedback is ad-hoc, not structured
- No way to set measurable development goals for players

TIME SPENT ON ADMIN: 5-7 hours per week on non-coaching work

GOALS:
- Know every player's exact development trajectory
- Implement data-driven training (not intuition-based)
- Reduce injury risk through load management
- Create measurable improvement plans
- Objectively justify player selection decisions
- Reduce time on admin work

QUESTION: Design a comprehensive player development system that:

1. TRACKS PLAYER PERFORMANCE
   - Match statistics (goals, assists, minutes, position)
   - Technical ratings (passing, shooting, dribbling, defense, etc.)
   - Physical data (height, weight, speed metrics)
   - Training attendance
   - Injury history

2. ANALYZES TRENDS
   - Show improvement over time (graphs)
   - Compare with team average
   - Identify peak performance periods
   - Spot warning signs (declining form, overuse injury risk)

3. ENABLES COMPARISON
   - Compare players in same position
   - Identify skill gaps
   - Recruitment guidance (what type of player to recruit)

4. SUPPORTS GOAL SETTING
   - Players set personal development goals
   - Coach tracks progress toward goals
   - Identify specific training to achieve goals
   - Celebrate milestones

For each feature:
- How it improves player development
- Time saved per week
- Data required
- How to integrate with current workflow
```

### Prompt 2: Structured Training Management

```
Currently my training sessions are:
- Not systematically planned (ad-hoc week-to-week)
- Not documented (no record of what we did)
- Not evaluated (don't know which drills work)
- Not tailored (same training for all players)
- Time-consuming to plan (1-2 hours per week)

I want to:
- Plan training systematically (seasonal progression)
- Have a drill library (reusable exercises)
- Document every session (what happened)
- Track effectiveness (which drills improve which skills)
- Tailor training by player (individual development)
- Save time on planning

QUESTION: Design a training management system with:

1. TRAINING PLAN BUILDER
   - Create weekly/monthly plans
   - Drag-and-drop session planning
   - Pre-built training templates by focus area
   - Seasonal periodization (pre-season, in-season, off-season)

2. DRILL LIBRARY
   - 100+ pre-built drills (by category)
   - Categorized: Technical, Tactical, Physical, Mental
   - Sub-categories: By position, skill, difficulty
   - Each drill includes: diagram, video, coaching points
   - Search and filter functionality
   - Ability to create custom drills

3. SESSION PLANNING
   - Add drills to session (warm-up, main, cool-down)
   - Track duration and equipment needed
   - Assign specific players to specific drills
   - Print session plan for reference
   - Share with assistant coaches and players

4. ATTENDANCE & FEEDBACK
   - Track who attended each session
   - Rate each player's effort (1-10)
   - Add coaching notes (what improved, what to work on)
   - Track player-specific feedback

5. TRAINING LOAD MANAGEMENT
   - Calculate intensity (low/medium/high)
   - Track cumulative weekly load
   - Warn if player is overworked
   - Prevent overuse injuries
   - Recommend rest days

For each feature:
- Implementation timeline
- Data entry required
- How it saves time
- Impact on training effectiveness
```

### Prompt 3: Injury Management & Player Wellness

```
Currently I manage injuries informally:
- Players tell me about injuries verbally
- I keep notes in a notebook
- No systematic recovery tracking
- Don't know when players are cleared to play
- Risk of re-injury from rushing return
- Can't identify injury patterns

I want to:
- Log all injuries systematically
- Track recovery progress weekly
- Know exact return-to-play date
- Prevent re-injuries with proper return protocol
- Identify injury trends (which positions, which injuries)
- Manage player workload to prevent injuries

QUESTION: Design an injury tracking system that:

1. INJURY LOGGING
   - Quick injury report (date, player, type, severity)
   - Injury categorization (muscle strain, ligament, concussion, etc.)
   - Body part identification
   - Description of how it happened
   - Initial assessment (estimated recovery time)

2. RECOVERY TRACKING
   - Weekly progress updates (how is recovery going)
   - Medical notes from doctor
   - Recovery milestones (pain-free range of motion, running, kicking, etc.)
   - Expected return date (updated as recovery progresses)

3. RETURN-TO-PLAY PROTOCOL
   - Medical clearance checklist
   - Graduated return plan (light training → full training → match)
   - Performance tests before return
   - Gradual minutes increase

4. INJURY HISTORY & ANALYTICS
   - Complete injury log per player
   - Recurring injuries (player prone to ankle injuries)
   - Injury statistics (most common by position, by team)
   - Injury prevention recommendations

5. ROSTER IMPACT
   - Injured players highlighted in squad view
   - Automatic availability filter
   - Suggested replacement players
   - Impact on lineup (how does it change tactics)

For each feature:
- Data to track
- Who enters the data (coach, medical staff, player)
- How it prevents injuries
- Timeline for implementation
```

### Prompt 4: Video Analysis & Match Preparation

```
I want to analyze matches but currently:
- Don't have systematic video storage
- Can't annotate video (mark specific moments)
- Can't create highlight reels easily
- Can't review tactical decisions
- Can't analyze opponent formations
- Can't share analysis with players

QUESTION: Design a video analysis system with:

1. VIDEO MANAGEMENT
   - Upload match footage easily
   - Organize by match, team, season
   - Auto-convert formats
   - Cloud storage
   - Easy sharing with team

2. ANNOTATION TOOLS
   - Draw on video (circles, arrows, lines)
   - Add timestamps and notes
   - Mark key moments (goals, mistakes, tactical switches)
   - Create playlists of key moments

3. HIGHLIGHT CREATION
   - Auto-extract goals/cards from match
   - Manual clip creation (select time range)
   - Edit clips (trim, combine)
   - Share highlight reels with players/fans

4. OPPONENT ANALYSIS
   - Review opponent match footage
   - Identify formation and tactics
   - Mark key opponent players
   - Note weaknesses to exploit

5. PLAYER FEEDBACK
   - Share video clips with players
   - Add coaching comments to video
   - Players can watch on demand
   - Track who watched

For implementation:
- Video storage requirements
- Recommended platform (Vimeo, Cloudinary, AWS)
- Cost estimates
- Time to set up
```

### Prompt 5: Match Preparation & Tactical Planning

```
I prepare for matches by:
- Manually gathering opponent data
- Drawing formations on whiteboard
- Writing notes on paper
- Creating lineup mentally
- No documented match plan
- Difficult to explain tactics to players clearly

QUESTION: Design a match preparation workflow that:

1. OPPONENT ANALYSIS
   - Input opponent name, recent results
   - Review previous match footage against them
   - Note key opponent players
   - Identify their formation and tactics
   - Identify weaknesses we can exploit

2. TACTICAL PLANNING
   - Select formation
   - Assign players to positions
   - Set tactical configuration (pressing, passing style, etc.)
   - Plan set pieces (corners, free kicks, penalties)
   - Document strategic approach

3. MATCH BRIEF
   - Create player-facing document
   - Explain tactics in simple terms
   - Highlight opponent threats
   - Show expected lineup
   - Print or share digitally

4. PRE-MATCH CHECKLIST
   - Equipment checklist
   - Travel logistics
   - Expected lineup confirmation
   - Injury updates
   - Mental prep notes

5. LIVE MATCH INTEGRATION
   - Use tactical plan in match center
   - Update formation if adjustments made
   - Record match events with context
   - Note tactical decisions

For each component:
- Time to prepare (before vs. after implementation)
- How it improves team performance
- How it helps players understand tactics
```

---

## PLAYER ROLE: Improvement Prompts

### Prompt 1: Performance Transparency & Development

```
As a player, I want to:
- See my exact progress and development
- Understand what I'm improving at
- Know what areas need work
- Get clear feedback from coach
- Set personal development goals
- See how I compare to teammates

CURRENTLY:
- I don't have access to my performance data
- Coach feedback is verbal only (hard to remember)
- No clear development plan
- Don't know what I'm good at vs. where I need improvement
- No visibility into my journey

QUESTION: Design a player performance system showing:

1. MY STATISTICS
   - Season stats (goals, assists, minutes played, cards)
   - Technical ratings (shooting, passing, dribbling, defense)
   - Trends (am I improving over time?)
   - Position-specific metrics

2. COACH FEEDBACK
   - Session-by-session feedback
   - Strengths highlighted
   - Areas for improvement
   - Specific coaching points
   - Video clips of key moments

3. DEVELOPMENT PLAN
   - Set personal goals (e.g., score 10 goals, 90% pass accuracy)
   - Action plans to achieve goals (specific drills to practice)
   - Progress tracking (how close am I to goal?)
   - Coach input on plan

4. COMPARISON
   - How I compare to team average
   - How I compare to position peers
   - Ranking within position
   - Areas I'm strongest in vs. weakest

5. VISUALIZATIONS
   - Charts showing improvement over time
   - Radar chart of my strengths
   - Goals progress bar
   - Achievement badges

For implementation:
- Data accuracy (how is it measured?)
- Privacy (can I control what's shared?)
- Frequency of updates (real-time, weekly, monthly?)
```

### Prompt 2: Training & Skill Development

```
As a player, I want to:
- Know what the team is practicing (training plan)
- Access drills to practice on my own
- Understand the purpose of each drill
- See videos of proper technique
- Track my own improvement between sessions
- Have personalized development focus

CURRENTLY:
- I show up to training without knowing what we're working on
- No access to drills to practice on my own
- Can't watch technique videos
- No guidance for individual training

QUESTION: Design a player training resource system with:

1. TRAINING PLAN ACCESS
   - See this week's training plan
   - Understand the focus (technical, tactical, physical)
   - Know what equipment to bring
   - See which drills are planned
   - Get pre-training prep (warm-up tips, mental focus)

2. DRILL LIBRARY
   - Access to all team drills
   - Video of each drill (how to do it correctly)
   - Coaching points (key technique)
   - Difficulty levels
   - Filter by: position, skill focus, duration

3. INDIVIDUAL TRAINING
   - Recommended drills for my role
   - Personalized training plan (from coach or AI)
   - Progression (easier drills → harder drills)
   - Video demonstrations of each drill

4. PROGRESS TRACKING
   - Mark drills as completed
   - Track improvement in specific skills
   - Self-rate performance on drills
   - See progression over time

5. FEEDBACK LOOP
   - Coach can assign specific drills
   - Coach feedback on execution
   - Drill effectiveness tracking

For implementation:
- Video requirements (how many drills?)
- Update frequency
- Mobile accessibility (can I watch on phone?)
```

### Prompt 3: Goal Setting & Career Development

```
As a player, I want to:
- Set clear career goals (e.g., start in 20 matches this season)
- See progress toward goals
- Get coach input on achievable goals
- Understand what it takes to reach goals
- Celebrate when I achieve them
- Plan my career development

CURRENTLY:
- No formal goal setting
- Don't know what I'm aiming for
- Can't measure progress

QUESTION: Design a goal-setting system with:

1. GOAL CREATION
   - Set goals by category (technical, tactical, physical, career)
   - Examples: "Score 10 goals", "90% pass accuracy", "Start in 15 matches"
   - Set target date
   - Coach review and approval

2. PROGRESS TRACKING
   - See current progress toward goal
   - Progress bar or percentage
   - What I've accomplished so far
   - How much further to go

3. ACTION PLANS
   - Coach suggests specific drills to achieve goal
   - Training assignments
   - Practice frequency recommendations
   - Video coaching on technique

4. COACH FEEDBACK
   - Coach provides regular updates
   - Adjusts goals if needed (too easy/too hard)
   - Celebrates milestones
   - Encouragement and motivation

5. CELEBRATION & RECOGNITION
   - Badge when goal achieved
   - Team recognition
   - Achievement history
   - Share achievements with parents/friends

For implementation:
- Goal types to support
- How specific should goals be?
- Update frequency
- Mobile app consideration
```

---

## PARENT ROLE: Improvement Prompts

### Prompt 1: Child Monitoring & Communication with Coach

```
As a parent, I want to:
- Know how my child is progressing
- Understand coach feedback
- Communicate with coach about my child
- Know if my child is at risk of injury
- See my child's development over time
- Communicate concerns to coach

CURRENTLY:
- Very limited visibility into my child's progress
- Occasional conversations with coach (informal)
- No formal feedback channel
- Don't know the child's stats or development
- Can't message coach easily
- Communication happens at random times

QUESTION: Design a parent-coach communication system with:

1. CHILD PROGRESS DASHBOARD
   - Child's statistics (goals, assists, matches played)
   - Technical ratings (age-appropriate)
   - Training attendance
   - Injury history
   - Development milestones
   - Achievement badges

2. COACH FEEDBACK
   - Coach sends structured feedback to parents
   - Frequency (weekly, monthly)
   - Highlights strengths
   - Notes areas for improvement
   - Provides encouragement

3. MESSAGING WITH COACH
   - Easy way to message child's coach
   - Ask questions about development
   - Report absences/injuries
   - Request meetings
   - Response tracking (did coach see message?)

4. MEETING REQUESTS
   - Parent can request meeting with coach
   - Share proposed times
   - View meeting history
   - Document discussion outcomes

5. TRANSPARENCY
   - Why is child not starting?
   - What can child work on to improve?
   - Injury status and recovery timeline
   - Playing time analysis

For implementation:
- Age-appropriate data (what should parents see?)
- Privacy (protect sensitive information)
- Frequency of updates (real-time, weekly?)
- Mobile accessibility
```

### Prompt 2: Financial Management & Payments

```
As a parent, I want to:
- Know exactly what I owe and when
- Pay online easily
- Get receipts for tax purposes
- See payment history
- Get reminders before due date
- See financial summary for children

CURRENTLY:
- Unclear what payments are due
- Manual payment process
- No receipts or records
- Easy to miss payment deadlines
- No transparency into costs

QUESTION: Design a parent payment system with:

1. PAYMENT DASHBOARD
   - Clear list of upcoming payments (dues, fees, equipment)
   - Payment categories (subscription, tournament, travel)
   - Due dates
   - Amount owed
   - Payment status (paid, pending, overdue)

2. ONLINE PAYMENTS
   - Secure payment form (credit card, bank transfer)
   - Multiple children/teams bundled
   - Save payment method for future
   - Confirmation of payment

3. RECEIPTS & HISTORY
   - Digital receipts (email)
   - Download receipts (PDF)
   - Complete payment history
   - Export for tax purposes

4. REMINDERS
   - Email reminder 7 days before due
   - Reminder 1 day before
   - Payment confirmation after
   - Overdue notices (if needed)

5. TRANSPARENCY
   - What is the money for?
   - Where does it go? (club budget breakdown)
   - Financial summary (club health)
   - Cost comparison (fair pricing?)

For implementation:
- Payment processor (Stripe, PayPal)
- Which payment methods to support?
- Tax documentation requirements
- Multi-child bundling
```

### Prompt 3: Event Coordination & Child Scheduling

```
As a parent, I want to:
- See all my child's training & match schedule
- Share calendar with family
- Coordinate transportation with other parents
- Get event reminders
- Know event details (location, time, what to bring)
- Report absences to coach

CURRENTLY:
- Event information scattered (email, WhatsApp, coach tells child)
- Difficult to plan family activities
- Hard to coordinate carpools
- Easy to miss or be late to events
- No centralized schedule

QUESTION: Design a parent event management system with:

1. UNIFIED CALENDAR
   - All child's team events in one place
   - Filter by team if multiple children
   - Color-coded by event type (training, match, meeting)
   - Shows: date, time, location, format (home/away)

2. EVENT DETAILS
   - What to bring (equipment, snacks, water)
   - What to wear (uniform, colors)
   - Parking information
   - Coach/staff contact
   - Special instructions

3. CALENDAR SYNC
   - Add to phone calendar (Google, Apple)
   - Share with family members
   - Recurring events (weekly training)
   - Reminders before event

4. CARPOOL COORDINATION
   - See other parents' availability
   - Offer/request ride
   - Route planning
   - Cost splitting

5. ABSENCE REPORTING
   - Report child can't attend
   - Reason (sick, work conflict, travel)
   - Automatic coach notification
   - Excuse tracking

For implementation:
- Calendar sync (Google Calendar, Outlook)
- Location services (map integration)
- Parent community features
- Mobile app priority
```

---

## FAN ROLE: Improvement Prompts

### Prompt 1: Match Experience & Engagement

```
As a fan, I want to:
- Watch live match updates (scores, goals, substitutions)
- See match statistics
- Watch match highlights after
- Discuss with other fans
- Feel connected to the club
- Support the team in different ways

CURRENTLY:
- Limited content access
- Have to manually check score
- No community to discuss with
- Limited ways to engage

QUESTION: Design a fan engagement platform with:

1. LIVE MATCH CENTER
   - Real-time score updates (auto-refresh)
   - Match timeline (goals, cards, subs with timestamps)
   - Team lineups and formation
   - Live statistics (possession, shots, passes)
   - Live text commentary

2. MATCH CONTENT
   - Highlights video (30-60 seconds after match)
   - Full match replay (delayed)
   - Key moments compilation
   - Player performance highlights

3. COMMUNITY
   - Comment on posts
   - Discuss with other fans
   - Fan polls (vote for man-of-match)
   - Fan forum (separate threads per topic)

4. NOTIFICATIONS
   - Get alerted when team scores
   - Subscribe to notifications for team
   - Customize alert types
   - Real-time push notifications

5. MERCHANDISE & SUPPORT
   - Buy team merchandise
   - Virtual support (donate, NFTs, memberships)
   - Season tickets/match passes
   - Exclusive fan content

For implementation:
- Real-time technology (WebSocket)
- Video platform (YouTube, Vimeo)
- Community moderation
- Payment integration
```

### Prompt 2: Content & Community Building

```
As a fan, I want to:
- Follow team news and updates
- See player highlights and stats
- Discuss with other fans
- Contribute my own content (photos, videos)
- Get exclusive behind-the-scenes access
- Feel like part of the community

CURRENTLY:
- Limited content
- No way to engage with other fans
- One-way communication (club posts, fans receive)
- No community

QUESTION: Design a fan community platform with:

1. NEWS & CONTENT
   - Match reports
   - Player interviews
   - Behind-the-scenes photos/videos
   - Training footage
   - Club announcements

2. PLAYER PROFILES
   - Player statistics
   - Career history
   - Position-specific stats
   - Achievements and awards
   - Fan ratings/votes

3. FAN ENGAGEMENT
   - Comments on posts
   - Reactions (like, love, celebrate)
   - Fan polls (predictions, ratings)
   - Fan forum (discussion threads)
   - Fan user profiles

4. USER-GENERATED CONTENT
   - Fans upload match photos
   - Fan videos (celebrations, away support)
   - Fan art gallery
   - Best of fan content highlighting

5. COMMUNITY FEATURES
   - Leaderboard (top contributors)
   - Fan badges/achievements
   - Fan spotlight (highlight top fans)
   - Events coordination (watch parties)

For implementation:
- Moderation tools
- User authentication
- Content upload infrastructure
- Community management
- Scalability for high engagement
```

---

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

## How to Use These Prompts Effectively

### Step 1: Select Your Role
Choose the section matching your role (Admin, Coach, Player, Parent, Fan, or SuperAdmin)

### Step 2: Choose a Focus Area
Pick one prompt that resonates most with your current challenge

### Step 3: Copy & Paste into AI
Copy the entire prompt and paste into:
- ChatGPT (https://chat.openai.com)
- Claude (https://claude.ai)
- Gemini (https://gemini.google.com)
- Your preferred AI tool

### Step 4: Engage with AI
Ask follow-up questions like:
- "What's the specific implementation approach?"
- "How would this work with our current system?"
- "What's the minimum viable version of this feature?"
- "How long would this take to build?"
- "What's the cost/benefit analysis?"
- "Can you prioritize these features?"

### Step 5: Iterate
Refine your understanding based on AI responses, then:
1. Share insights with your team
2. Reference the improvement documents for implementation details
3. Create detailed requirements based on the conversation
4. Build implementation plan

---

## Example: How to Use in Practice

**Scenario**: You're an admin reading this document.

1. **Your challenge**: Overwhelmed by manual member onboarding (15 hours/week)

2. **Your action**:
   - Find "ADMIN ROLE: Improvement Prompts"
   - Copy "Prompt 2: Bulk Operations & Workflow Automation"
   - Paste into ChatGPT

3. **Follow-up questions you ask**:
   - "Can you create a step-by-step implementation plan?"
   - "What's the minimum version we could launch in 2 weeks?"
   - "How do we integrate this with our current system?"
   - "What data integrity risks should we watch for?"

4. **Use the response to**:
   - Share specific ideas with your team
   - Reference the IMPROVEMENTS_ADMIN.md document
   - Create detailed feature requirements
   - Plan development timeline

5. **Outcome**: Instead of 15-hour weeks, you're spending 8 hours/week with automated onboarding system

---

## Tips for Best Results

### ✅ DO:
- Be specific about your current situation
- Ask "why" questions (not just "how")
- Request multiple approaches/solutions
- Ask for trade-offs and considerations
- Request cost/benefit analysis
- Share the response with your team

### ❌ DON'T:
- Use generic questions without context
- Accept first answer without follow-ups
- Implement without understanding trade-offs
- Skip the detailed requirements phase
- Forget to validate with actual users

---

## Integration with Other Documents

These prompts work together with:
1. **FOOTAPP_PROJECT_REPORT.md** - Understand current state
2. **IMPROVEMENTS_[ROLE].md** - Get detailed specifications
3. **GM_PROMPTS_BY_ROLE.md** - This document - AI-driven discovery
4. **IMPLEMENTATION_ROADMAP.md** - Plan the build

**Process**:
- Read Report → Understand current state
- Use Prompts → Discover what you want to build
- Read Improvements → Get detailed specs
- Use Roadmap → Plan implementation

---

## Conclusion

These prompts are designed to help each role:
1. **Understand** their unique challenges
2. **Discover** what improvements would help most
3. **Explore** implementation options
4. **Engage** with AI for deeper insights
5. **Plan** concrete improvements

Use them to drive continuous improvement of FootApp across all roles!

---

**Document**: Complete prompt suite for role-based improvement discovery
**Last Updated**: March 2026
**Version**: 1.0
