update public.epew_communication_sender_identities
set metadata = metadata || '{
  "role_scope": "funding_and_strategic_collaboration_only",
  "primary_objective": "seek_and_secure_funding_for_the_program",
  "allowed_activities": [
    "funding_research",
    "funder_outreach",
    "grant_and_sponsorship_development",
    "donor_and_investor_relationships",
    "strategic_collaboration",
    "partnership_development",
    "funding_follow_up"
  ],
  "excluded_authority": [
    "academic_program_decisions",
    "admissions_decisions",
    "curriculum_decisions",
    "general_operations",
    "staff_supervision",
    "program_director_authority",
    "binding_legal_or_financial_commitments_without_approval"
  ],
  "approval_required_for_commitments": true
}'::jsonb,
updated_at = now()
where identity_key = 'emanon_strategic_partnerships_director';
