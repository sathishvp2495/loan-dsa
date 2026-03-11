export type UserRole = "ADMIN" | "AGENT" | "OPERATIONS";
export type LoanType = "PERSONAL" | "HOME" | "BUSINESS" | "MORTGAGE" | "CAR" | "EDUCATION" | "GOLD";
export type EmploymentType = "SALARIED" | "SELF_EMPLOYED" | "BUSINESS_OWNER" | "OTHER";
export type LeadStage =
  | "NEW_LEAD"
  | "CONTACT_ATTEMPTED"
  | "CONTACTED"
  | "QUALIFIED"
  | "DOCS_PENDING"
  | "BANK_SUBMITTED"
  | "SANCTIONED"
  | "DISBURSED"
  | "REJECTED"
  | "CLOSED";

export type Agent = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export type Commission = {
  lenderName: string;
  disbursedAmount: number;
  payoutPercent: string | number;
  totalCommission: string | number;
  partnerSharePercent: string | number;
  partnerShareAmount: string | number;
};

export type LeadNote = {
  id: string;
  body: string;
  systemGenerated: boolean;
  createdAt: string;
  user?: Agent | null;
};

export type LeadStatusHistory = {
  id: string;
  previousStage?: LeadStage | null;
  nextStage: LeadStage;
  reason?: string | null;
  createdAt: string;
  changedBy?: Agent | null;
};

export type CustomerMessage = {
  id: string;
  body?: string | null;
  templateName?: string | null;
  status?: string | null;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: string;
  fromIdentity?: string | null;
  toIdentity?: string | null;
};

export type Lead = {
  id: string;
  referenceCode: string;
  fullName: string;
  phone: string;
  whatsappPhone?: string | null;
  city: string;
  loanType: LoanType;
  employmentType: EmploymentType;
  monthlyIncome: number;
  requestedAmount: number;
  source: string;
  stage: LeadStage;
  whatsappOptIn: boolean;
  assignedAgentId?: string | null;
  assignedAgent?: Agent | null;
  createdAt: string;
  updatedAt: string;
  notes?: LeadNote[];
  statusHistory?: LeadStatusHistory[];
  commission?: Commission | null;
  messages?: CustomerMessage[];
};

export type DashboardSummary = {
  totalLeads: number;
  totalRequestedAmount: number;
  totalDisbursedAmount: number;
  totalPartnerPayout: number;
  stageCounts: Record<string, number>;
  recentLeads: Array<{
    id: string;
    referenceCode: string;
    fullName: string;
    phone: string;
    stage: LeadStage;
    requestedAmount: number;
    city: string;
    createdAt: string;
  }>;
};
