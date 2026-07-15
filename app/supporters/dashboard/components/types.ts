export interface Supporter {
  id: number;
  user_id?: string;

  supporter_id?: string;

  full_name?: string;

  email?: string;

  phone?: string;

  photo_url?: string;

  status?: string;

  country?: string;

  country_of_origin?: string;

  country_of_residence?: string;

  country_of_citizenship?: string;

  street_address?: string;

  city?: string;

  state?: string;

  zip_code?: string;

  created_at?: string;
}

export interface SupportCommitment {
  id: number;

  entrepreneur_id?: string;

  entrepreneur_name?: string;

  entrepreneur_photo_url?: string;

  business_name?: string;

  business_logo_url?: string;

  public_business_id?: string;

  business_status?: string;

  community?: string;

  country?: string;

  units?: number;

  amount?: number;

  support_type?: string;

  payment_status?: string;

  benefits_available?: number;

  jobs_created?: number;

  quarterly_reports_count?: number;

  business_opening_date?: string;

  grand_opening_date?: string;

  created_at?: string;
}

export interface Invitation {
  id: number;

  title: string;

  type:
    | "Grand Opening"
    | "Annual Meeting"
    | "Conference"
    | "Graduation"
    | "Recognition"
    | "Anniversary";

  event_date?: string;

  event_time?: string;

  location?: string;

  business_name?: string;

  entrepreneur_name?: string;

  livestream_url?: string;

  status?: string;
}

export interface EcosystemNews {
  id: number;

  title: string;

  summary: string;

  image_url?: string;

  published_at?: string;

  featured?: boolean;
}

export interface ImpactSummary {
  entrepreneursEmpowered: number;

  businessesSupported: number;

  businessesOpened: number;

  communitiesStrengthened: number;

  jobsCreated: number;

  grandOpeningsCelebrated: number;

  quarterlyReportsReceived: number;

  participationBenefitsAvailable: number;
}