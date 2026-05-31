export type WorkflowMode = "business-review" | "application-prep";

export type ReviewOutput = {
  document_type: string;
  summary: string;
  extracted_requirements: string[];
  missing_information: string[];
  risk_flags: string[];
  recommended_next_action: string;
  email_draft: string;
  confidence_level: string;
  requires_human_review: boolean;
};

export type ApplicationPacket = {
  workflow_name: string;
  carrier_context: string;
  official_form_status: string;
  application_sections: Record<string, Record<string, string | null | string[]>>;
  missing_information: string[];
  field_completion_status: Record<string, "complete" | "missing">;
  review_notes: string[];
  recommended_next_action: string;
  requires_human_review: boolean;
};

export const businessSample = `Client is requesting vendor onboarding approval for Northstar Claims Services.
They need access by June 15 for claims intake support. Contract language mentions
SOC 2, data handling, indemnification, and a 24-hour incident notice requirement.
Insurance limits were not included. The request asks for expedited approval.`;

export const applicationSample = `USLI application prep notes for a sample professional services applicant.
Applicant: Northstar Risk Advisory LLC
Operations: Compliance consulting and insurance documentation support for small businesses
Business owner: Jordan Lee
Requested effective date: June 15
Requested limits: 1M/2M
Prior carrier:
Loss history:
Notes: Applicant needs help preparing the application packet. Do not submit without human review.`;

const requiredBusinessFields = ["insurance_limits", "business_owner", "effective_date"];
const requiredApplicationFields = [
  "applicant_name",
  "effective_date",
  "insurance_limits",
  "business_owner",
  "operations_description",
  "loss_history",
  "prior_carrier"
];

export function reviewBusinessRequest(text: string): ReviewOutput {
  const lowered = text.toLowerCase();
  const requirements = [
    ["soc 2", "SOC 2 mentioned"],
    ["data handling", "Data handling requirement mentioned"],
    ["indemnification", "Indemnification mentioned"],
    ["incident notice", "Incident notice requirement mentioned"],
    ["approval", "Approval requested"],
    ["expedited", "Expedited review requested"]
  ]
    .filter(([keyword]) => lowered.includes(keyword))
    .map(([, label]) => label);

  const fields = {
    insurance_limits: lowered.includes("insurance limits were not included")
      ? null
      : extractMoney(text),
    business_owner: lineValue(text, "business owner"),
    effective_date: extractDate(text)
  };

  const missing = requiredBusinessFields.filter(
    (field) => !fields[field as keyof typeof fields]
  );

  const riskFlags = [
    lowered.includes("soc 2") ? "SOC 2 requirement requires security review" : null,
    lowered.includes("data handling") ? "Data handling language requires review" : null,
    lowered.includes("indemnification") ? "Indemnification language requires legal review" : null,
    lowered.includes("incident notice") ? "Incident notice requirement requires review" : null,
    lowered.includes("expedited") || lowered.includes("urgent")
      ? "Expedited approval requested"
      : null,
    ...missing.map((field) => `${titleize(field)} missing`)
  ].filter(Boolean) as string[];

  return {
    document_type: lowered.includes("vendor") ? "vendor_onboarding_request" : "business_review_request",
    summary:
      "Business request reviewed for structured requirements, missing information, risk flags, and next action.",
    extracted_requirements: requirements,
    missing_information: missing,
    risk_flags: riskFlags,
    recommended_next_action: missing.length
      ? `Route to human reviewer and request missing ${missing
          .map((field) => field.replaceAll("_", " "))
          .join(", ")}.`
      : "Route to human reviewer for final validation before approval.",
    email_draft: missing.length
      ? `Thank you for the request. Before we can complete review, please provide: ${missing
          .map((field) => field.replaceAll("_", " "))
          .join(", ")}.`
      : "Thank you for the request. We have enough information to continue standard review.",
    confidence_level: missing.length > 1 || riskFlags.length > 3 ? "medium" : "medium-high",
    requires_human_review: missing.length > 0 || riskFlags.length > 0
  };
}

export function buildApplicationPacket(text: string): ApplicationPacket {
  const fields = {
    applicant_name: lineValue(text, "applicant"),
    effective_date: lineValue(text, "requested effective date") ?? lineValue(text, "effective date"),
    insurance_limits:
      text.toLowerCase().includes("1m/2m") || text.toLowerCase().includes("$1m/$2m")
        ? "$1,000,000/$2,000,000"
        : lineValue(text, "requested limits"),
    business_owner: lineValue(text, "business owner"),
    operations_description: lineValue(text, "operations"),
    loss_history: lineValue(text, "loss history"),
    prior_carrier: lineValue(text, "prior carrier")
  };

  const missing = requiredApplicationFields.filter(
    (field) => !fields[field as keyof typeof fields]
  );

  return {
    workflow_name: "PaperworkPro Application Prep",
    carrier_context: "USLI-style application preparation",
    official_form_status: "Not an official carrier form; human review required before use.",
    application_sections: {
      applicant_information: {
        applicant_name: fields.applicant_name,
        operations_description: fields.operations_description,
        effective_date: fields.effective_date
      },
      coverage_request: {
        requested_limits: fields.insurance_limits,
        prior_carrier: fields.prior_carrier
      },
      underwriting_review: {
        loss_history: fields.loss_history,
        extracted_requirements: []
      }
    },
    missing_information: missing,
    field_completion_status: Object.fromEntries(
      requiredApplicationFields.map((field) => [
        field,
        fields[field as keyof typeof fields] ? "complete" : "missing"
      ])
    ) as Record<string, "complete" | "missing">,
    review_notes: [
      "Do not submit to carrier without licensed/human review.",
      "Confirm all applicant-provided facts before completing final paperwork.",
      "Carrier context mentioned; verify current carrier form requirements.",
      ...(missing.length ? ["Application packet is incomplete and needs follow-up."] : [])
    ],
    recommended_next_action: missing.length
      ? `Request missing application information before carrier submission: ${missing
          .map((field) => field.replaceAll("_", " "))
          .join(", ")}.`
      : "Send completed packet to human reviewer for final validation before carrier submission.",
    requires_human_review: true
  };
}

function lineValue(text: string, label: string): string | null {
  const prefix = `${label.toLowerCase()}:`;
  const line = text
    .split(/\r?\n/)
    .find((candidate) => candidate.toLowerCase().startsWith(prefix));
  const value = line?.split(":").slice(1).join(":").trim();
  return value || null;
}

function extractDate(text: string): string | null {
  const match = text.match(/\b(?:by|effective)\s+([A-Z][a-z]+\s+\d{1,2})\b/);
  return match?.[1] ?? null;
}

function extractMoney(text: string): string | null {
  const match = text.match(/\$[\d,]+(?:\s*million|\s*M)?/);
  return match?.[0] ?? null;
}

function titleize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
