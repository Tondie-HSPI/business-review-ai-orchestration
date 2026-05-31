export type WorkflowMode = "business-review" | "application-prep" | "liquor-restaurant";

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

export type LiquorRestaurantPacket = {
  workflow_name: string;
  risk_type: string;
  official_form_status: string;
  intake_summary: Record<string, string | null>;
  application_packet: Record<string, Record<string, string | null>>;
  mapped_pdf_fields: Record<string, string>;
  answered_form_questions: Array<{
    id: string;
    question: string;
    answer: string | null;
    source_field: string;
    pdf_field: string;
    confidence: "high" | "missing";
  }>;
  missing_information: string[];
  risk_flags: string[];
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

export const liquorRestaurantSample = `Quote request generated from fake Salesforce intake data.
Applicant: Harbor & Vine Kitchen LLC
DBA: Harbor & Vine
Location address: 1420 Market Street
City: Raleigh
State: NC
Zip: 27601
Email: manager@example.com
Phone: 919-555-0182
Coverage requested: General Liability, Liquor Liability, Property
Operations: Full-service restaurant with bar seating and weekend DJ.
Years experience: 8
Business start year: 2021
Food sales: 850000
Alcohol sales: 420000
Catering sales: 50000
GL limit: 1000000/2000000
Liquor limit: 1000000/1000000
Close time: 1:00 a.m.
Alcohol sales cease: 12:30 a.m.
Entertainment: DJ with dancing on Friday and Saturday.
Security: Door person on weekends.
BYOB: No
Claims or violations: None in the past five years.
Liquor training: Yes
ID scanner: Yes
Happy hour after 9pm: No
Lowest beer price: 4.00
Lowest wine/liquor price: 7.00
Building owner: No
Fryers: Yes
Fire suppression: Wet system with cleaning contract.`;

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

const requiredLiquorRestaurantFields = [
  "applicant",
  "location_address",
  "city",
  "state",
  "zip",
  "email",
  "phone",
  "coverage_requested",
  "operations",
  "food_sales",
  "alcohol_sales",
  "gl_limit",
  "liquor_limit",
  "close_time",
  "alcohol_sales_cease",
  "claims_or_violations",
  "liquor_training",
  "id_scanner"
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

export function buildLiquorRestaurantPacket(text: string): LiquorRestaurantPacket {
  const raw = parseKeyValues(text);
  const fields = {
    applicant: raw.applicant,
    dba: raw.dba,
    location_address: raw["location address"],
    city: raw.city,
    state: raw.state,
    zip: raw.zip,
    email: raw.email,
    phone: raw.phone,
    coverage_requested: raw["coverage requested"],
    operations: raw.operations,
    years_experience: raw["years experience"],
    business_start_year: raw["business start year"],
    food_sales: raw["food sales"],
    alcohol_sales: raw["alcohol sales"],
    catering_sales: raw["catering sales"],
    gl_limit: raw["gl limit"],
    liquor_limit: raw["liquor limit"],
    close_time: raw["close time"],
    alcohol_sales_cease: raw["alcohol sales cease"],
    entertainment: raw.entertainment,
    security: raw.security,
    byob: raw.byob,
    claims_or_violations: raw["claims or violations"],
    liquor_training: raw["liquor training"],
    id_scanner: raw["id scanner"],
    happy_hour_after_9pm: raw["happy hour after 9pm"],
    lowest_beer_price: raw["lowest beer price"],
    lowest_wine_liquor_price: raw["lowest wine/liquor price"],
    building_owner: raw["building owner"],
    fryers: raw.fryers,
    fire_suppression: raw["fire suppression"]
  };

  const missing = requiredLiquorRestaurantFields.filter(
    (field) => !fields[field as keyof typeof fields]
  );
  const riskFlags = liquorRiskFlags(fields);

  return {
    workflow_name: "PaperworkPro Liquor / Restaurant Quote Intake",
    risk_type: "restaurant_bar_liquor_liability",
    official_form_status:
      "Draft intake support only; human review required before carrier submission.",
    intake_summary: {
      applicant: fields.applicant,
      location: [fields.location_address, fields.city, fields.state, fields.zip]
        .filter(Boolean)
        .join(", "),
      coverage_requested: fields.coverage_requested,
      operations: fields.operations
    },
    application_packet: {
      applicant_information: {
        applicant: fields.applicant,
        dba: fields.dba,
        location_address: fields.location_address,
        city: fields.city,
        state: fields.state,
        zip: fields.zip,
        email: fields.email,
        phone: fields.phone
      },
      sales_and_limits: {
        food_sales: fields.food_sales,
        alcohol_sales: fields.alcohol_sales,
        catering_sales: fields.catering_sales,
        gl_limit: fields.gl_limit,
        liquor_limit: fields.liquor_limit
      },
      operations_and_controls: {
        close_time: fields.close_time,
        alcohol_sales_cease: fields.alcohol_sales_cease,
        entertainment: fields.entertainment,
        security: fields.security,
        byob: fields.byob,
        liquor_training: fields.liquor_training,
        id_scanner: fields.id_scanner,
        fire_suppression: fields.fire_suppression
      }
    },
    mapped_pdf_fields: mapLiquorPdfFields(fields),
    answered_form_questions: answerLiquorFormQuestions(fields),
    missing_information: missing,
    risk_flags: riskFlags,
    recommended_next_action: missing.length
      ? "Request missing quote intake fields before preparing the application draft."
      : "Prepare draft application field map and route flagged exposures to a human reviewer.",
    requires_human_review: true
  };
}

function answerLiquorFormQuestions(fields: Record<string, string | null | undefined>) {
  const questions = [
    {
      id: "applicant_name",
      question: "Applicant's name, including DBA name",
      answer: fields.applicant,
      source_field: "account.name",
      pdf_field: "01 Applicant name"
    },
    {
      id: "location_address",
      question: "Location address",
      answer: fields.location_address,
      source_field: "location.street",
      pdf_field: "02 Location address"
    },
    {
      id: "coverage_requested",
      question: "Coverage desired",
      answer: fields.coverage_requested,
      source_field: "opportunity.requested_coverages",
      pdf_field: "01 Coverage 1 / 2 / 3"
    },
    {
      id: "description_of_operations",
      question: "Description of operations",
      answer: fields.operations,
      source_field: "risk_profile.operations",
      pdf_field: "014 Description"
    },
    {
      id: "annual_food_sales",
      question: "Annual food sales",
      answer: fields.food_sales,
      source_field: "risk_profile.food_sales",
      pdf_field: "AR Food"
    },
    {
      id: "annual_alcohol_sales",
      question: "Annual alcohol sales",
      answer: fields.alcohol_sales,
      source_field: "risk_profile.alcohol_sales",
      pdf_field: "AR Alc"
    },
    {
      id: "entertainment",
      question: "Does the establishment feature entertainment?",
      answer: fields.entertainment,
      source_field: "risk_profile.entertainment",
      pdf_field: "7 if yes"
    },
    {
      id: "liquor_training",
      question: "Are alcohol-serving employees certified in formal alcohol training?",
      answer: fields.liquor_training,
      source_field: "risk_profile.liquor_training",
      pdf_field: "44 R56"
    }
  ];

  return questions.map((question) => ({
    ...question,
    answer: question.answer ?? null,
    confidence: question.answer ? "high" as const : "missing" as const
  }));
}

function lineValue(text: string, label: string): string | null {
  const prefix = `${label.toLowerCase()}:`;
  const line = text
    .split(/\r?\n/)
    .find((candidate) => candidate.toLowerCase().startsWith(prefix));
  const value = line?.split(":").slice(1).join(":").trim();
  return value || null;
}

function parseKeyValues(text: string): Record<string, string | null> {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line.includes(":"))
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim().toLowerCase(), rest.join(":").trim() || null];
      })
  );
}

function mapLiquorPdfFields(fields: Record<string, string | null | undefined>) {
  const mapping: Record<string, string | null | undefined> = {
    "01 Applicant name": fields.applicant,
    "02 Location address": fields.location_address,
    "03 City": fields.city,
    "04 State": fields.state,
    "05 Zip": fields.zip,
    "07 email": fields.email,
    "08 phone": fields.phone,
    "014 Description": fields.operations,
    "AR Food": fields.food_sales,
    "AR Alc": fields.alcohol_sales,
    "AR Catering": fields.catering_sales,
    "11 hours": fields.close_time,
    "59 lowest price": fields.lowest_beer_price,
    "60 lowest price": fields.lowest_wine_liquor_price
  };

  return Object.fromEntries(
    Object.entries(mapping).filter(([, value]) => Boolean(value))
  ) as Record<string, string>;
}

function liquorRiskFlags(fields: Record<string, string | null | undefined>) {
  const flags: string[] = [];
  const entertainment = (fields.entertainment ?? "").toLowerCase();
  const security = (fields.security ?? "").toLowerCase();
  const closeTime = (fields.close_time ?? "").toLowerCase();
  const alcoholCease = (fields.alcohol_sales_cease ?? "").toLowerCase();

  if (entertainment.includes("dj") || entertainment.includes("dancing") || entertainment.includes("band")) {
    flags.push("Entertainment or dancing should be reviewed for underwriting eligibility.");
  }
  if (security.includes("door") || security.includes("security")) {
    flags.push("Security or door staff exposure should be reviewed.");
  }
  if (closeTime.includes("a.m.") || closeTime.includes("am")) {
    flags.push("Late closing time should be reviewed.");
  }
  if (alcoholCease.includes("a.m.") || alcoholCease.includes("am")) {
    flags.push("Late alcohol service cutoff should be reviewed.");
  }
  if ((fields.liquor_training ?? "").toLowerCase() !== "yes") {
    flags.push("Alcohol training should be confirmed.");
  }
  if ((fields.id_scanner ?? "").toLowerCase() !== "yes") {
    flags.push("ID scanner control should be confirmed.");
  }
  const claimsOrViolations = (fields.claims_or_violations ?? "").toLowerCase().replace(/[. ]+$/g, "");
  if (!["none", "no", "none in the past five years"].includes(claimsOrViolations)) {
    flags.push("Claims or liquor violations need detail before submission.");
  }

  return flags;
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
