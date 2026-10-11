// Shapes of the deployed Saans API responses. Only fields the UI reads are typed.

export type StageCode = 'I' | 'II' | 'III' | 'IV';
export type StageNumber = 1 | 2 | 3 | 4;

/** Where a response came from. Anything other than `live` is labelled on screen. */
export type Origin = 'live' | 'snapshot';

export interface Sourced<T> {
  data: T;
  origin: Origin;
}

export interface Pm25Pair {
  nominal: number;
  pessimistic: number;
}

export interface ClassifiedPeriod {
  class: string;
  period: string;
  start: string;
  end: string;
  subject: string;
  teacher_code: string;
  venue: string;
  label: 'allowed' | 'advisory' | 'restricted' | 'banned' | string;
  reason: string;
  rule_ids: string[];
  pm25: number;
  is_outdoor: boolean;
}

export interface PlanMove {
  class: string;
  from_period: string;
  to_period: string;
  moved_subject: string;
  partner_subject: string;
  reason: string;
  exposure_before: number;
  exposure_after: number;
  rule_id: string;
}

export interface VenueOption {
  venue_id: string;
  label: string;
  ventilation: string;
  infiltration_factor: number;
  indoor_pm25_modelled: number;
}

export interface PlanIndoor {
  class: string;
  period: string;
  subject: string;
  venue: string;
  fallback_venue: string;
  assigned_activity: string;
  activity_is_physical: boolean;
  duration_minutes: number;
  reason: string;
  rule_id: string;
  venue_choice?: {
    outdoor_pm25_forecast: number;
    chosen: VenueOption;
    alternatives: VenueOption[];
    basis: string;
    assumption_note?: string;
    why?: string;
  };
}

export interface TraceCandidate {
  period: string;
  subject: string;
  forecast_pm25: Pm25Pair;
  verdict: 'chosen' | 'rejected' | string;
  reasons: string[];
}

export interface DecisionTrace {
  class: string;
  period: string;
  subject: string;
  label: string;
  reason: string;
  rule_ids: string[];
  forecast_pm25: Pm25Pair;
  candidates: TraceCandidate[];
  outcome: {
    plan: 'A' | 'B' | string;
    moved_to?: string;
    activity?: string;
    why?: string;
    venue?: string;
    venue_why?: string;
  };
  sensitivity?: {
    threshold_multiplier: number;
    advisory_at: number;
    restricted_at: number;
    basis: string;
    applied?: string;
  };
}

export interface Plan {
  decision_id: string;
  declared_stage: StageCode;
  status: string;
  plan_a: PlanMove[];
  plan_b: PlanIndoor[];
  exposure_before: number;
  exposure_after: number;
  exposure_reduction_pct: number;
  plan_b_indoor_exposure_modelled?: number;
  exposure_averted_modelled?: { value: number; unit: string; basis: string };
  pe_minutes: {
    scheduled: number;
    unchanged: number;
    moved_to_cleaner_slot: number;
    replaced_indoor_active: number;
    lost: number;
    kept_active: number;
    basis: string;
  };
  pe_minutes_preserved: number;
  ruleset_version: string;
  classified_periods: ClassifiedPeriod[];
  decision_trace: DecisionTrace[];
  forecast?: {
    model: string;
    is_replay: boolean;
    label: string;
    fallback_reason: string | null;
    generated_at: string;
    periods: { period: string; pm25_nominal: number; pm25_pessimistic: number }[];
  };
}

export interface Forecast {
  source: 'live' | 'replay';
  label: string;
  model: string;
  generated_at: string;
  fallback_reason: string | null;
  unit: string;
  hours: { time: string; pm25: number; school_hours: boolean }[];
  thresholds: { name: string; value?: number; values?: number[]; basis: string }[];
  first_crossing: { threshold: string; time: string | null } | null;
  declared_stage?: { stage: StageCode; label: string };
  note?: string;
  cache?: string;
}

export interface Health {
  status: 'ok' | 'degraded' | 'down';
  tenant?: string;
  checked_at: string;
  checks: {
    table?: { ok: boolean; latency_ms?: number };
    ruleset?: { version: string; sha256: string; rules: number; jurisdiction: string };
    declared_stage?: { stage: StageCode | null; source?: { order?: string; label?: string } | null };
    forecast?: { date?: string; source: string; fallback_reason?: string | null; model?: string };
    bedrock?: { usable: boolean; model: string; error?: string; effect?: string };
    audit?: { rows: number; head_seq: number; head_hash: string | null; chain_valid: boolean; message: string };
  };
}

export interface ReceiptBlock {
  sequence: number;
  hash: string;
  previousHash: string;
  actor: string;
  eventType: string;
  payloadDigest: string;
  timestamp: string;
  payloadJson?: string | null;
  decisionId?: string | null;
}

export interface Receipt {
  receiptId: string;
  schoolId: string;
  decisionId: string;
  decisionStatus?: string | null;
  decisionSequences: number[];
  genesisHash: string;
  auditHead: string;
  blocks: ReceiptBlock[];
  hashing: string;
  serverVerification: { valid: boolean; message: string; brokenSequence: number | null };
  verifiedAt: string;
}

/** One entry of NOTICES_DRAFTED.notices in the audit chain. */
export interface NoticeProvenance {
  audience: string;
  language: string;
  model_used?: string;
  fallback_used: boolean;
  /** 'output_rejected' when code refused the model's draft, 'model_unavailable' when Bedrock did not answer. */
  fallback_reason?: 'output_rejected' | 'model_unavailable' | 'forced' | string | null;
  /** Why code refused the model's draft, e.g. 'invented_number:450'. */
  rejected_reasons?: string[];
  model_id: string | null;
  /** 'bedrock' (primary) or 'fallback' (only when Bedrock failed); null when the static template wrote it. */
  model_provider?: 'bedrock' | 'fallback' | null;
  template_id: string | null;
  prompt_sha256: string | null;
  prompt_template_id?: string | null;
  text_sha256: string;
}

export interface NoticeText extends NoticeProvenance {
  notice_text: string;
  whatsapp_click_to_share_url: string;
}

export type ApprovalAction = 'APPROVE_PLAN_A' | 'APPROVE_PLAN_B' | 'REJECT';

export interface Decision {
  decision_id: string;
  status: string;
  decided_by_role?: string | null;
  decided_at?: string | null;
  plan: Plan | null;
  receipt_id?: string | null;
  approval: {
    waiting_for_role: string;
    expires_at: number;
    approve_url: string;
    actions: ApprovalAction[];
  } | null;
  /** Present once the backend change that stores drafted notices on the decision is deployed. */
  notices?: { english: NoticeText; hindi: NoticeText; teacher: NoticeText } | null;
}

export interface Watch {
  date: string;
  risk: 'act' | 'watch' | 'clear' | string;
  peak_pm25?: number;
  forecast_source?: string;
  label?: string;
  summary?: string;
  [k: string]: unknown;
}

export interface WatchResponse {
  tenant: string;
  watches: Watch[];
  promote_hint?: { description: string };
}

export interface RunStarted {
  status: 'started' | 'duplicate_suppressed' | string;
  decision_id: string;
  execution_name?: string;
  existing_status?: string | null;
  date?: string;
}
