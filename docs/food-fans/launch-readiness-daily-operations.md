# Food Fans Launch Readiness and Daily Operations — implementation guide

Generated October 30, 2026, 11:41 AM America/New_York.

## Launch readiness

The administrator dashboard at `/admin/food-fans-readiness` contains five gates: Training, Test Cook, Restaurant Simulation (with training), Soft Opening and Grand Opening. All five initially remain pending, with unassigned owners, pending approvals and no completion evidence. Each card shows the owner, blocker, server-recorded last update, evidence and approval. Changes retain permanent before/after revisions and verified administrator identity.

Gate approval requires completed status, an assigned owner, cleared blocker and completion/approval evidence. Soft Opening requires approved Training, Test Cook and Simulation gates. Grand Opening also requires Soft Opening and all eight event role assignments approved. These are management review gates, not automatic evidence of certification or a completed event. Material changes withdraw approval; affected downstream gate approvals reset for renewed review.

## Grand-opening roles

Floor manager; kitchen lead; POS lead; pickup/delivery expeditor; membership enrollment lead; customer-service troubleshooter; inventory runner; media/community contact. Each has an accountable person, optional linked workforce employee, backup, duties, blockers, briefing evidence and approval. All begin unassigned. Assigning a role label does not grant account access.

## Actual opening and operating days

Record the actual opening date, confirmer and evidence after Soft Opening approval. This actual-opening confirmation is separate from the restaurant master's proposed/approved opening date. No date is assumed and the master record is not overwritten. Operating reports and incidents are accepted only on/after the confirmed date and no later than today in New York. Once daily/incident records exist, the opening date cannot be silently changed.

One daily report per restaurant/date captures completed paid orders, net sales, calculated average order value, qualifying member meals, rewards earned/redeemed, new Food Fans Rewards memberships, orders by ZIP, best-selling item quantities, food waste quantities/units/reasons, actual labor hours, complaint/equipment/delivery/inventory counts and follow-up references. ZIP totals must match all orders, including an unknown ZIP bucket. Separate incident records support accountable follow-up and resolution evidence. Blank metrics remain unknown; zero represents verified no activity. Approval requires complete metrics and review evidence; corrections reset approval and preserve the original revision.

Sales are recorded in USD cents as net food/beverage sales after refunds, excluding tax/tips. Negative net sales may represent refund-heavy days. Average order value is net sales divided by completed paid orders; no paid orders yields no average. Raffle participation is separate from Food Fans Rewards memberships.

This version accepts administrator-entered, source-referenced operating reports. It does not invent POS sales or automatically connect the POS. POS/order, reward/time report reconciliation and import automation need the actual provider integration. No production daily figures or opening confirmation are seeded.

## Future units and permissions

The schema and API partition all records by canonical restaurant unit. For a verified future restaurant master, use Initialize this restaurant’s standard dashboard to create the same five pending gates and eight unassigned roles without copying FFR-001 operational data. FFR-002 is still the existing Cambria Heights support campaign until a separate restaurant master is explicitly established; this module does not convert that campaign into a restaurant.

Existing verified EPEW administrators only. Same-origin writes, optimistic record versions, retry IDs, revoked client grants, row-level security and permanent revisions protect the workflow. Private evidence uses verified launch-workspace attachments scoped to the same restaurant.

## Verification

TypeScript, focused lint and three functional tests cover API permissions, actor spoofing, CSRF, pending initialization, approval prerequisites, all-eight-role readiness, downstream invalidation, source totals, opening/date restrictions, correction history and multi-unit initialization. Production verification is recorded separately in EPEW operational history.
