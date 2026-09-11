// Tipos de base de datos — espejo de supabase/migrations/0001-0010
// Regenerar contra el proyecto real con:
//   npx supabase gen types typescript --project-id <ID> --schema public > src/types/database.ts
// (este archivo es la versión mantenida a mano hasta conectar el proyecto Supabase)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------- Enums ----------
export type PlatformRole = "platform_admin" | "user";
export type ComplexRole = "complex_owner" | "complex_admin" | "staff";
export type ComplexStatus = "active" | "suspended" | "archived";
export type CustomerStatus = "active" | "inactive" | "blocked";
export type DepositMode = "none" | "percent" | "fixed";
export type CourtStatus = "active" | "inactive" | "maintenance";
export type DiscountType = "percent" | "fixed" | "two_for_one" | "free_hours";
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"
  | "expired"
  | "refunded";
export type ReservationKind = "booking" | "block" | "maintenance" | "event";
export type ReservationChannel = "online" | "admin" | "phone" | "import" | "series";
export type ReservationSeriesStatus = "active" | "paused" | "cancelled";
export type PaymentProvider = "mercadopago" | "manual" | "other";
export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";
export type PaymentConcept = "deposit" | "full" | "balance" | "refund";
export type WebhookEventStatus = "received" | "processed" | "failed" | "ignored";
export type NotificationChannel = "email" | "whatsapp";
export type NotificationStatus = "queued" | "sending" | "sent" | "failed" | "skipped";
export type ImportJobStatus =
  | "uploaded"
  | "parsed"
  | "mapped"
  | "validated"
  | "importing"
  | "completed"
  | "failed"
  | "cancelled";
export type ImportRowStatus = "pending" | "valid" | "invalid" | "imported" | "skipped";
export type MatchMethod = "email" | "phone" | "name" | "manual" | "none";

// ---------- Helpers ----------
type Timestamps = { created_at: string; updated_at: string };
type Id = { id: string };
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ---------- Tablas ----------
export type UserProfileRow = Id & {
  platform_role: PlatformRole;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  locale: string;
}
export type UserProfile = UserProfileRow & Timestamps;

export type ComplexRow = Id & {
  name: string;
  slug: string;
  status: ComplexStatus;
  timezone: string;
  currency: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  public_site_enabled: boolean;
}
export type Complex = ComplexRow & Timestamps;

export type ComplexSettingsRow = {
  complex_id: string;
  slot_duration_minutes: 30 | 45 | 60 | 90 | 120;
  max_advance_days: number;
  min_advance_minutes: number;
  hold_minutes: number;
  cancellation_deadline_hours: number;
  allow_customer_cancellation: boolean;
  require_online_payment: boolean;
  deposit_mode: DepositMode;
  deposit_percent: number | null;
  deposit_fixed: number | null;
  allow_guest_booking: boolean;
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;
  publish_stats: boolean;
  publish_occupancy: boolean;
  publish_reservations_count: boolean;
  publish_court_stats: boolean;
  publish_history: boolean;
  publish_promotions: boolean;
}
export type ComplexSettings = ComplexSettingsRow & Timestamps;

export type ComplexMemberRow = Id & {
  complex_id: string;
  user_id: string;
  role: ComplexRole;
  is_active: boolean;
}
export type ComplexMember = ComplexMemberRow & Timestamps;

export type CourtRow = Id & {
  complex_id: string;
  name: string;
  description: string | null;
  surface: string | null;
  is_indoor: boolean;
  has_lighting: boolean;
  position: number | null;
  status: CourtStatus;
  image_url: string | null;
  is_public: boolean;
}
export type Court = CourtRow & Timestamps;

export type OperatingHourRow = Id & {
  complex_id: string;
  court_id: string | null;
  day_of_week: number; // 0 = domingo … 6 = sábado
  opens_at: string; // "09:00:00"
  closes_at: string;
  is_closed: boolean;
}
export type OperatingHour = OperatingHourRow & Timestamps;

export type RateRuleRow = Id & {
  complex_id: string;
  court_id: string | null;
  name: string | null;
  day_of_week: number | null;
  starts_from: string | null;
  ends_to: string | null;
  price: number;
  currency: string;
  valid_from: string; // date "2026-09-07"
  valid_to: string | null;
  is_active: boolean;
  priority: number;
}
export type RateRule = RateRuleRow & Timestamps;

export type PromotionRow = Id & {
  complex_id: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number | null;
  applies_days: number[] | null;
  applies_from: string | null;
  applies_to: string | null;
  valid_from: string;
  valid_to: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  is_public: boolean;
}
export type Promotion = PromotionRow & Timestamps;

export type CustomerRow = Id & {
  complex_id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  notes: string | null;
  status: CustomerStatus;
  name_normalized: string | null; // generada
  phone_normalized: string | null; // generada
  import_job_id: string | null;
  imported_at: string | null;
}
export type Customer = CustomerRow & Timestamps;

export type ReservationSeriesRow = Id & {
  complex_id: string;
  court_id: string;
  customer_id: string;
  created_by: string | null;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  valid_from: string;
  valid_until: string;
  status: ReservationSeriesStatus;
  notes: string | null;
}
export type ReservationSeries = ReservationSeriesRow & Timestamps;

export type ReservationRow = Id & {
  complex_id: string;
  court_id: string;
  customer_id: string | null;
  series_id: string | null;
  occurrence_index: number | null;
  created_by: string | null;
  channel: ReservationChannel;
  kind: ReservationKind;
  status: ReservationStatus;
  starts_at: string;
  ends_at: string;
  price: number;
  currency: string;
  deposit_amount: number;
  paid_amount: number;
  promotion_id: string | null;
  title: string | null;
  notes: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  import_job_id: string | null;
  import_row_id: string | null;
}
export type Reservation = ReservationRow & Timestamps;

export type PaymentRow = Id & {
  complex_id: string;
  reservation_id: string | null;
  customer_id: string | null;
  created_by: string | null;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  provider_preference_id: string | null;
  concept: PaymentConcept;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw_payload: Json | null;
  failure_reason: string | null;
  approved_at: string | null;
  refunded_at: string | null;
}
export type Payment = PaymentRow & Timestamps;

export type WebhookEventRow = Id & {
  provider: string;
  external_event_id: string;
  event_type: string;
  payload: Json;
  status: WebhookEventStatus;
  error: string | null;
  processed_at: string | null;
  created_at: string;
}

export type NotificationTemplateRow = Id & {
  complex_id: string | null;
  channel: NotificationChannel;
  template_key: string;
  subject: string | null;
  body: string;
  is_active: boolean;
}
export type NotificationTemplate = NotificationTemplateRow & Timestamps;

export type NotificationRow = Id & {
  complex_id: string;
  customer_id: string | null;
  reservation_id: string | null;
  channel: NotificationChannel;
  template_key: string;
  recipient: string;
  payload: Json;
  status: NotificationStatus;
  provider: string | null;
  provider_message_id: string | null;
  scheduled_at: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  sent_at: string | null;
}
export type Notification = NotificationRow & Timestamps;

export type AuditLogRow = {
  id: number;
  complex_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export type ImportJobRow = Id & {
  complex_id: string;
  created_by: string | null;
  file_name: string;
  storage_path: string;
  sheet_name: string | null;
  entity_types: string[];
  status: ImportJobStatus;
  column_mapping: Json | null;
  normalization_rules: Json | null;
  error_report: Json | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  imported_rows: number;
  skipped_rows: number;
  started_at: string | null;
  finished_at: string | null;
}
export type ImportJob = ImportJobRow & Timestamps;

export type ImportRowRow = Id & {
  job_id: string;
  row_number: number;
  raw: Json;
  normalized: Json | null;
  errors: Json;
  status: ImportRowStatus;
  is_duplicate: boolean;
  matched_customer_id: string | null;
  match_method: MatchMethod | null;
  target_entity: string | null;
  target_id: string | null;
  imported_at: string | null;
  created_at: string;
}

// ---------- Vistas ----------
export type ReservationDetail = Reservation & {
  court_name: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  has_approved_payment: boolean;
}

export type CustomerStats = {
  customer_id: string;
  complex_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  status: CustomerStatus;
  notes: string | null;
  preferred_contact_channel: NotificationChannel | null;
  created_at: string;
  reservations_count: number;
  last_reservation_at: string | null;
  cancellations_count: number;
  no_shows_count: number;
  total_spent: number;
  favorite_court_id: string | null;
  favorite_court_name: string | null;
  favorite_hour: number | null;
}

// ---------- Database (genérico para supabase-js) ----------
export type Database = {
  public: {
    Tables: {
      complexes: {
        Row: Complex;
        Insert: Optional<ComplexRow, "id" | "slug"> & { name: string; slug: string };
        Update: Partial<ComplexRow>;
        Relationships: [];
      };
      complex_settings: {
        Row: ComplexSettings;
        Insert: Optional<ComplexSettingsRow, never>;
        Update: Partial<ComplexSettingsRow>;
        Relationships: [];
      };
      complex_members: {
        Row: ComplexMember;
        Insert: Optional<ComplexMemberRow, "id"> & { complex_id: string; user_id: string };
        Update: Partial<ComplexMemberRow>;
        Relationships: [];
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Optional<UserProfileRow, never> & { id: string };
        Update: Partial<UserProfileRow>;
        Relationships: [];
      };
      courts: {
        Row: Court;
        Insert: Optional<CourtRow, "id"> & { complex_id: string; name: string };
        Update: Partial<CourtRow>;
        Relationships: [];
      };
      operating_hours: {
        Row: OperatingHour;
        Insert: Optional<OperatingHourRow, "id"> & { complex_id: string };
        Update: Partial<OperatingHourRow>;
        Relationships: [];
      };
      rate_rules: {
        Row: RateRule;
        Insert: Optional<RateRuleRow, "id"> & { complex_id: string; price: number };
        Update: Partial<RateRuleRow>;
        Relationships: [];
      };
      promotions: {
        Row: Promotion;
        Insert: Optional<PromotionRow, "id"> & { complex_id: string; name: string };
        Update: Partial<PromotionRow>;
        Relationships: [];
      };
      customers: {
        Row: Customer;
        Insert: Optional<Omit<CustomerRow, "name_normalized" | "phone_normalized">, "id"> & {
          complex_id: string;
          first_name: string;
        };
        Update: Partial<Omit<CustomerRow, "name_normalized" | "phone_normalized">>;
        Relationships: [];
      };
      reservation_series: {
        Row: ReservationSeries;
        Insert: Optional<ReservationSeriesRow, "id"> & {
          complex_id: string;
          court_id: string;
          customer_id: string;
        };
        Update: Partial<ReservationSeriesRow>;
        Relationships: [];
      };
      reservations: {
        Row: Reservation;
        Insert: Optional<ReservationRow, "id"> & {
          complex_id: string;
          court_id: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<ReservationRow>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Optional<PaymentRow, "id"> & { complex_id: string; amount: number };
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      webhook_events: {
        Row: WebhookEventRow;
        Insert: Optional<WebhookEventRow, "id"> & { external_event_id: string; event_type: string };
        Update: Partial<WebhookEventRow>;
        Relationships: [];
      };
      notification_templates: {
        Row: NotificationTemplate;
        Insert: Optional<NotificationTemplateRow, "id"> & { template_key: string; body: string };
        Update: Partial<NotificationTemplateRow>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Optional<NotificationRow, "id"> & {
          complex_id: string;
          template_key: string;
          recipient: string;
        };
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      import_jobs: {
        Row: ImportJob;
        Insert: Optional<ImportJobRow, "id"> & { complex_id: string; file_name: string; storage_path: string };
        Update: Partial<ImportJobRow>;
        Relationships: [];
      };
      import_rows: {
        Row: ImportRowRow;
        Insert: Optional<ImportRowRow, "id"> & { job_id: string; row_number: number };
        Update: Partial<ImportRowRow>;
        Relationships: [];
      };
    };
    Views: {
      v_reservations_detail: { Row: ReservationDetail; Insert: never; Update: never; Relationships: [] };
      v_customer_stats: { Row: CustomerStats; Insert: never; Update: never; Relationships: [] };
    };
    Functions: {
      fn_create_reservation: {
        Args: {
          p_court_id: string;
          p_starts_at: string;
          p_ends_at?: string | null;
          p_customer_id?: string | null;
          p_kind?: ReservationKind;
          p_price?: number | null;
          p_channel?: ReservationChannel;
          p_created_by?: string | null;
          p_title?: string | null;
          p_notes?: string | null;
          p_hold?: boolean;
        };
        Returns: Reservation;
      };
      fn_cancel_reservation: {
        Args: { p_reservation_id: string; p_reason?: string | null; p_by_customer?: boolean };
        Returns: Reservation;
      };
      fn_generate_series_occurrences: {
        Args: { p_series_id: string; p_from?: string; p_to?: string | null };
        Returns: { starts_at: string; created: boolean }[];
      };
      fn_available_slots: {
        Args: { p_court_id: string; p_date: string };
        Returns: { starts_at: string; ends_at: string; is_available: boolean; reservation_id: string | null }[];
      };
      fn_resolve_price: {
        Args: { p_complex_id: string; p_court_id: string; p_starts_at: string };
        Returns: number;
      };
      fn_complex_kpis: {
        Args: { p_complex_id: string; p_from: string; p_to: string };
        Returns: {
          total_reservations: number;
          confirmed: number;
          cancelled: number;
          no_shows: number;
          revenue: number;
          occupancy_pct: number;
        }[];
      };
      fn_occupancy_by_court: {
        Args: { p_complex_id: string; p_from: string; p_to: string };
        Returns: {
          court_id: string;
          court_name: string;
          reservations_count: number;
          revenue: number;
          occupancy_pct: number;
          avg_booking_value: number;
        }[];
      };
      fn_compare_periods: {
        Args: {
          p_complex_id: string;
          p_from_a: string;
          p_to_a: string;
          p_from_b: string;
          p_to_b: string;
        };
        Returns: {
          metric: string;
          value_a: number;
          value_b: number;
          delta_abs: number;
          delta_pct: number | null;
        }[];
      };
      fn_expire_reservation_holds: { Args: Record<string, never>; Returns: number };
      fn_is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      fn_complex_role: { Args: { p_complex_id: string }; Returns: ComplexRole | null };
      fn_has_complex_role: {
        Args: { p_complex_id: string; p_min_role: ComplexRole };
        Returns: boolean;
      };
      fn_is_complex_member: { Args: { p_complex_id: string }; Returns: boolean };
      fn_is_own_customer: { Args: { p_customer_id: string }; Returns: boolean };
      fn_normalize_text: { Args: { p_input: string }; Returns: string };
      fn_normalize_phone: { Args: { p_input: string | null }; Returns: string | null };
      fn_audit: {
        Args: {
          p_complex_id: string | null;
          p_action: string;
          p_entity_type: string;
          p_entity_id?: string | null;
          p_old_data?: Json | null;
          p_new_data?: Json | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      platform_role: PlatformRole;
      complex_role: ComplexRole;
      complex_status: ComplexStatus;
      customer_status: CustomerStatus;
      deposit_mode: DepositMode;
      court_status: CourtStatus;
      discount_type: DiscountType;
      reservation_status: ReservationStatus;
      reservation_kind: ReservationKind;
      reservation_series_status: ReservationSeriesStatus;
      payment_provider: PaymentProvider;
      payment_status: PaymentStatus;
      payment_concept: PaymentConcept;
      webhook_event_status: WebhookEventStatus;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
      import_job_status: ImportJobStatus;
      import_row_status: ImportRowStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
