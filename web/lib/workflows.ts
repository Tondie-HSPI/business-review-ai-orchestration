export type WorkflowMode = "business-review" | "application-prep" | "contractor" | "landscaper" | "liquor-restaurant";

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
  analytics_summary: AnalyticsSummary;
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
  analytics_summary: AnalyticsSummary;
};

export type LiquorRestaurantPacket = {
  workflow_name: string;
  risk_type: string;
  workflow_scope: {
    selected_workflow: string;
    routing_note: string;
  };
  official_form_status: string;
  submission_readiness: {
    status: "ready_for_human_review" | "needs_more_information";
    carrier_agnostic: boolean;
    blocking_missing_information_count: number;
    rep_double_checks: string[];
  };
  intake_summary: Record<string, string | null>;
  application_packet: Record<string, Record<string, string | null | undefined>>;
  csr_certificate_request: {
    requested: boolean;
    status: "ready_for_csr_review" | "missing_information" | "not_requested";
    certificate_holder: {
      name: string | null;
      address: string | null;
      email: string | null;
    };
    purpose: string | null;
    requested_wording: Record<string, string | null | undefined>;
    missing_information: string[];
    review_flags: string[];
    certificate_optimizer: {
      optimization_goal: string;
      complexity_score: number;
      quote_considerations: string[];
      csr_review_priorities: string[];
      suggested_next_step: string;
    };
    csr_email_draft: string;
    requires_csr_review: boolean;
  };
  inferred_application_answers: Array<{
    id: string;
    question: string;
    inferred_answer: string;
    evidence: string;
    rep_check: string;
    pdf_field: string;
    confidence: "high" | "needs_review";
    review_status: "verify_before_submission" | "rep_review_required";
    flagged_for_review: boolean;
  }>;
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
  analytics_summary: AnalyticsSummary;
};

export type AnalyticsSummary = {
  submission_readiness_score: number;
  percent_fields_auto_inferred: number;
  percent_fields_needing_review: number;
  missing_information_count: number;
  risk_flags_by_category: Record<string, string[]>;
  required_endorsements_count: number;
  average_confidence_score: number;
  common_missing_fields: Array<{ field: string; count: number }>;
  dashboard_ready_json: {
    workflow_name: string;
    document_type: string;
    review_status: string;
    metrics: {
      submission_readiness_score: number;
      percent_fields_auto_inferred: number;
      percent_fields_needing_review: number;
      missing_information_count: number;
      required_endorsements_count: number;
      average_confidence_score: number;
    };
    human_review_note: string;
  };
};

export type FormQuestion = {
  id: string;
  question: string;
  source_field: string;
  pdf_field: string;
};

export type SalesforceLikeRecord = {
  account?: Record<string, unknown>;
  location?: Record<string, unknown>;
  opportunity?: Record<string, unknown>;
  risk_profile?: Record<string, unknown>;
};

export const businessSample = `Client is requesting vendor onboarding approval for Northstar Claims Services.
They need access by June 15 for claims intake support. Contract language mentions
SOC 2, data handling, indemnification, and a 24-hour incident notice requirement.
Insurance limits were not included. The request asks for expedited approval.`;

export const applicationSample = `Generic carrier-neutral application prep notes for a sample professional services applicant.
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
Operations: Full-service restaurant with bar seating, weekend DJ, and seasonal food truck operations for catering events.
Business class: Restaurant with food truck operations
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
Fire suppression: Wet system with cleaning contract.
Food truck operations: Seasonal food truck used for off-premises catering and festivals.
Contractor operations:
Landscaping operations:
Certificate requested: Yes
Certificate holder: Triangle Events Group
Certificate holder address: 500 Convention Center Drive, Raleigh, NC 27601
Certificate holder email: certificates@example.com
Certificate purpose: Catering event contract for July 20
Additional insured requested: Yes
Waiver of subrogation requested: Yes
Primary and noncontributory requested: Yes
Special certificate wording: Include additional insured, waiver of subrogation, and primary and noncontributory wording if approved by policy terms.`;

export const contractorSample = `Quote request generated from fake intake data.
Applicant: Apex Build & Repair LLC
DBA: Apex Build
Location address: 2250 Trade Center Way
City: Charlotte
State: NC
Zip: 28208
Email: ops@example.com
Phone: 704-555-0199
Coverage requested: General Liability, Inland Marine, Umbrella
Operations: Residential remodeling contractor performing drywall, flooring, light carpentry, and punch-list repairs.
Business class: Contractor
Years experience: 12
Business start year: 2018
Food sales:
Alcohol sales:
Catering sales:
GL limit: 1000000/2000000
Claims or violations: None in the past five years.
Building owner: No
Contractor operations: Uses subcontractors for electrical and plumbing; certificates collected before job start.
Certificate requested: Yes
Certificate holder: Queen City Property Group
Certificate holder address: 100 Owner Plaza, Charlotte, NC 28202
Certificate holder email: certs@example.com
Certificate purpose: Renovation contract for tenant improvement work
Additional insured requested: Yes
Waiver of subrogation requested: Yes
Primary and noncontributory requested: Yes
Special certificate wording: Include project name, additional insured, waiver of subrogation, and primary/noncontributory wording if allowed by policy terms.`;

export const landscaperSample = `Quote request generated from fake intake data.
Applicant: Greenline Grounds LLC
DBA: Greenline Grounds
Location address: 810 Garden Ridge Road
City: Durham
State: NC
Zip: 27703
Email: service@example.com
Phone: 919-555-0144
Coverage requested: General Liability, Commercial Auto, Inland Marine
Operations: Lawn maintenance, mulch installation, seasonal planting, and small hardscape work.
Business class: Landscaper
Years experience: 9
Business start year: 2019
Food sales:
Alcohol sales:
Catering sales:
GL limit: 1000000/2000000
Claims or violations: None in the past five years.
Building owner: No
Landscaping operations: Uses mowers, trailers, trimmers, and pesticide subcontractor for chemical applications. No tree removal over 15 feet.
Certificate requested: Yes
Certificate holder: Lakeside HOA
Certificate holder address: 45 Lakeview Drive, Durham, NC 27703
Certificate holder email: hoa@example.com
Certificate purpose: Annual landscape maintenance contract
Additional insured requested: Yes
Waiver of subrogation requested: No
Primary and noncontributory requested: Yes
Special certificate wording: HOA asks to be additional insured for ongoing landscape maintenance agreement.`;

export const defaultLiquorRestaurantQuestions: FormQuestion[] = [
  {
    id: "applicant_name",
    question: "Applicant's name, including DBA name",
    source_field: "account.name",
    pdf_field: "01 Applicant name"
  },
  {
    id: "location_address",
    question: "Location address",
    source_field: "location.street",
    pdf_field: "02 Location address"
  },
  {
    id: "coverage_requested",
    question: "Coverage desired",
    source_field: "opportunity.requested_coverages",
    pdf_field: "01 Coverage 1 / 2 / 3"
  },
  {
    id: "description_of_operations",
    question: "Description of operations",
    source_field: "risk_profile.operations",
    pdf_field: "014 Description"
  },
  {
    id: "annual_food_sales",
    question: "Annual food sales",
    source_field: "risk_profile.food_sales",
    pdf_field: "AR Food"
  },
  {
    id: "annual_alcohol_sales",
    question: "Annual alcohol sales",
    source_field: "risk_profile.alcohol_sales",
    pdf_field: "AR Alc"
  },
  {
    id: "entertainment",
    question: "Does the establishment feature entertainment?",
    source_field: "risk_profile.entertainment",
    pdf_field: "7 if yes"
  },
  {
    id: "liquor_training",
    question: "Are alcohol-serving employees certified in formal alcohol training?",
    source_field: "risk_profile.liquor_training",
    pdf_field: "44 R56"
  }
];

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

const commonIntakeFields = [
  "applicant",
  "location_address",
  "city",
  "state",
  "zip",
  "email",
  "phone",
  "coverage_requested",
  "operations",
  "gl_limit",
  "claims_or_violations",
];

const requiredLiquorRestaurantFields = [
  ...commonIntakeFields,
  "food_sales",
  "alcohol_sales",
  "liquor_limit",
  "close_time",
  "alcohol_sales_cease",
  "liquor_training",
  "id_scanner"
];

const requiredContractorFields = [
  ...commonIntakeFields,
  "contractor_operations",
  "years_experience"
];

const requiredLandscaperFields = [
  ...commonIntakeFields,
  "landscaping_operations",
  "years_experience"
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

  const output = {
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

  return {
    ...output,
    analytics_summary: buildAnalyticsSummary({
      workflowName: "SubmissionReady AI Business Review",
      documentType: output.document_type,
      missingInformation: output.missing_information,
      riskFlags: output.risk_flags,
      totalFields: requiredBusinessFields.length,
      autoInferredFields: output.extracted_requirements.length,
      fieldsNeedingReview: output.missing_information.length + output.risk_flags.length,
      confidenceValues: [output.confidence_level]
    })
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

  const output = {
    workflow_name: "SubmissionReady AI Application Prep",
    carrier_context: "Generic carrier-neutral application preparation",
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

  return {
    ...output,
    analytics_summary: buildAnalyticsSummary({
      workflowName: output.workflow_name,
      documentType: "application_prep_packet",
      missingInformation: output.missing_information,
      riskFlags: output.review_notes,
      totalFields: requiredApplicationFields.length,
      autoInferredFields: Object.values(output.field_completion_status).filter((status) => status === "complete").length,
      fieldsNeedingReview: output.missing_information.length + output.review_notes.length,
      confidenceValues: Object.values(output.field_completion_status).map((status) =>
        status === "complete" ? "high" : "missing"
      )
    })
  };
}

export function buildLiquorRestaurantPacket(
  text: string,
  options: { sourceRecord?: SalesforceLikeRecord | null; formQuestions?: FormQuestion[] } = {}
): LiquorRestaurantPacket {
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
    business_class: raw["business class"],
    food_truck_operations: raw["food truck operations"],
    contractor_operations: raw["contractor operations"],
    landscaping_operations: raw["landscaping operations"],
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
    fire_suppression: raw["fire suppression"],
    certificate_requested: raw["certificate requested"],
    certificate_holder: raw["certificate holder"],
    certificate_holder_address: raw["certificate holder address"],
    certificate_holder_email: raw["certificate holder email"],
    certificate_purpose: raw["certificate purpose"],
    additional_insured_requested: raw["additional insured requested"],
    waiver_requested: raw["waiver of subrogation requested"],
    primary_noncontributory_requested: raw["primary and noncontributory requested"],
    special_certificate_wording: raw["special certificate wording"]
  };

  const selectedRequiredFields = requiredFieldsFor(fields);
  const missing = selectedRequiredFields.filter(
    (field) => !fields[field as keyof typeof fields]
  );
  const riskFlags = liquorRiskFlags(fields);

  const inferredAnswers = inferLiquorApplicationAnswers(fields);
  const answeredQuestions = answerLiquorFormQuestions(
    fields,
    options.formQuestions ?? defaultLiquorRestaurantQuestions,
    options.sourceRecord
  );
  const csrCertificateRequest = buildCsrCertificateRequest(fields);
  const output = {
    workflow_name: "SubmissionReady AI Contractor / Landscaper / Restaurant Intake",
    risk_type: detectedBusinessClass(fields),
    workflow_scope: {
      selected_workflow: selectedWorkflowLabel(fields),
      routing_note:
        "Only this workflow is used for the client review packet. SubmissionReady AI prepares the draft and flags items for rep review."
    },
    official_form_status:
      "Draft intake support only; human review required before carrier submission.",
    submission_readiness: {
      status: (missing.length
        ? "needs_more_information"
        : "ready_for_human_review") as LiquorRestaurantPacket["submission_readiness"]["status"],
      carrier_agnostic: true,
      blocking_missing_information_count: missing.length,
      rep_double_checks: repDoubleChecks(fields, riskFlags)
    },
    intake_summary: {
      applicant: fields.applicant,
      location: [fields.location_address, fields.city, fields.state, fields.zip]
        .filter(Boolean)
        .join(", "),
      coverage_requested: fields.coverage_requested,
      operations: fields.operations
    },
    application_packet: buildClassSpecificApplicationPacket(fields),
    csr_certificate_request: csrCertificateRequest,
    inferred_application_answers: inferredAnswers,
    mapped_pdf_fields: mapLiquorPdfFields(fields),
    answered_form_questions: answeredQuestions,
    missing_information: missing,
    risk_flags: riskFlags,
    recommended_next_action: missing.length
      ? "Request missing quote intake fields before preparing the application draft."
      : "Prepare draft application field map and route flagged exposures to a human reviewer.",
    requires_human_review: true
  };

  return {
    ...output,
    analytics_summary: buildAnalyticsSummary({
      workflowName: output.workflow_name,
      documentType: output.risk_type,
      missingInformation: [
        ...output.missing_information,
        ...output.csr_certificate_request.missing_information
      ],
      riskFlags: [
        ...output.risk_flags,
        ...output.csr_certificate_request.review_flags
      ],
      totalFields: selectedRequiredFields.length + output.inferred_application_answers.length,
      autoInferredFields: output.inferred_application_answers.filter((answer) => answer.confidence === "high").length,
      fieldsNeedingReview: output.inferred_application_answers.filter(
        (answer) => answer.flagged_for_review || answer.confidence === "needs_review"
      ).length + output.missing_information.length,
      confidenceValues: [
        ...output.inferred_application_answers.map((answer) => answer.confidence),
        ...output.answered_form_questions.map((answer) => answer.confidence)
      ]
    })
  };
}

function inferLiquorApplicationAnswers(fields: Record<string, string | null | undefined>) {
  const detectedClass = detectedBusinessClass(fields);
  if (detectedClass === "contractor") {
    return [
      inferredAnswer(
        "subcontractor_use",
        "Does the contractor use subcontractors?",
        containsAny(fields.contractor_operations ?? "", ["subcontractor", "subcontractors"]) ? "Yes" : "Review Required",
        fields.contractor_operations ?? "",
        "Confirm subcontractor controls, certificate collection, and contract requirements.",
        "Contractor operations / subcontractors"
      ),
      inferredAnswer(
        "residential_work",
        "Does the contractor perform residential work?",
        containsAny(fields.operations ?? "", ["residential", "home", "tenant"]) ? "Yes" : "Review Required",
        fields.operations ?? "",
        "Confirm residential/commercial split and any excluded operations.",
        "Operations class"
      ),
      inferredAnswer(
        "losses_or_claims",
        "Any losses, claims, or violations in the past five years?",
        cleanNone(fields.claims_or_violations) ? "No" : "Review Required",
        fields.claims_or_violations ?? "",
        "Confirm loss runs and prior claims before submission.",
        "Loss history"
      )
    ];
  }

  if (detectedClass === "landscaper") {
    return [
      inferredAnswer(
        "chemical_application",
        "Does the landscaping operation involve chemical or pesticide application?",
        containsAny(fields.landscaping_operations ?? "", ["chemical", "pesticide"]) ? "Yes" : "No",
        fields.landscaping_operations ?? "",
        "Confirm whether chemical application is performed by the insured or a subcontractor.",
        "Landscape operations / chemicals"
      ),
      inferredAnswer(
        "tree_work",
        "Does the landscaper perform tree work?",
        containsAny(fields.landscaping_operations ?? "", ["tree"]) ? "Review Required" : "No",
        fields.landscaping_operations ?? "",
        "Confirm tree work height, subcontractor use, and excluded operations.",
        "Landscape operations / tree work"
      ),
      inferredAnswer(
        "losses_or_claims",
        "Any losses, claims, or violations in the past five years?",
        cleanNone(fields.claims_or_violations) ? "No" : "Review Required",
        fields.claims_or_violations ?? "",
        "Confirm loss runs and prior claims before submission.",
        "Loss history"
      )
    ];
  }

  const entertainment = fields.entertainment ?? "";
  const security = fields.security ?? "";
  const operations = fields.operations ?? "";
  const claims = (fields.claims_or_violations ?? "").toLowerCase().replace(/[. ]+$/g, "");
  const fireSuppression = fields.fire_suppression ?? "";

  return [
    inferredAnswer(
      "entertainment_featured",
      "Does the establishment feature entertainment?",
      containsAny(entertainment, ["dj", "dancing", "band", "entertainment"]) ? "Yes" : "No",
      entertainment,
      "Confirm entertainment type, frequency, and whether dancing is permitted.",
      "7 if yes"
    ),
    inferredAnswer(
      "security_or_door_staff",
      "Are bouncers, security, or door persons ever employed?",
      containsAny(security, ["door", "security", "bouncer"]) ? "Yes" : "No",
      security,
      "Confirm whether security is employee, contractor, or third-party service.",
      "12 R14"
    ),
    inferredAnswer(
      "losses_or_violations",
      "Any losses, claims, liquor citations, violations, charges, or enforcement actions in the past five years?",
      cleanNone(claims) ? "No" : "Review Required",
      fields.claims_or_violations ?? "",
      "Confirm loss runs and liquor violation history before submission.",
      "4 R1 / 21 / 22"
    ),
    inferredAnswer(
      "bar_with_seating",
      "Is there a bar with seating?",
      operations.toLowerCase().includes("bar seating") ? "Yes" : "Review Required",
      operations,
      "Confirm seating layout and whether bar seating is available to patrons.",
      "48 R60"
    ),
    inferredAnswer(
      "happy_hour_after_9pm",
      "Are drink specials or happy hours offered after 9 p.m.?",
      fields.happy_hour_after_9pm ?? "Review Required",
      fields.happy_hour_after_9pm ?? "",
      "Confirm all drink specials, happy hours, and promotional pricing.",
      "46 R58"
    ),
    inferredAnswer(
      "applicant_building_owner",
      "Is the applicant the building owner?",
      fields.building_owner ?? "Review Required",
      fields.building_owner ?? "",
      "Confirm ownership, lease terms, and maintenance responsibilities.",
      "16 R18"
    ),
    inferredAnswer(
      "fire_suppression",
      "If fryers are present, is a functioning fire extinguishing system in place?",
      fireSuppression ? "Yes" : "Review Required",
      fireSuppression,
      "Confirm system type, cleaning contract, and service status.",
      "20a R23 / 28 R39"
    )
  ];
}

function buildClassSpecificApplicationPacket(fields: Record<string, string | null | undefined>) {
  const baseSections = {
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
    coverage_request: {
      coverage_requested: fields.coverage_requested,
      gl_limit: fields.gl_limit
    }
  };

  const certificateRequirements = {
    certificate_requested: fields.certificate_requested,
    certificate_holder: fields.certificate_holder,
    certificate_purpose: fields.certificate_purpose,
    additional_insured_requested: fields.additional_insured_requested,
    waiver_of_subrogation_requested: fields.waiver_requested,
    primary_and_noncontributory_requested: fields.primary_noncontributory_requested,
    special_certificate_wording: fields.special_certificate_wording
  };

  const detectedClass = detectedBusinessClass(fields);
  if (detectedClass === "contractor") {
    return {
      ...baseSections,
      contractor_operations: {
        business_class: fields.business_class,
        operations: fields.operations,
        contractor_operations: fields.contractor_operations,
        years_experience: fields.years_experience,
        building_owner: fields.building_owner,
        claims_or_violations: fields.claims_or_violations
      },
      certificate_requirements: certificateRequirements
    };
  }

  if (detectedClass === "landscaper") {
    return {
      ...baseSections,
      landscaping_operations: {
        business_class: fields.business_class,
        operations: fields.operations,
        landscaping_operations: fields.landscaping_operations,
        years_experience: fields.years_experience,
        building_owner: fields.building_owner,
        claims_or_violations: fields.claims_or_violations
      },
      certificate_requirements: certificateRequirements
    };
  }

  return {
    ...baseSections,
    sales_and_limits: {
      food_sales: fields.food_sales,
      alcohol_sales: fields.alcohol_sales,
      catering_sales: fields.catering_sales,
      liquor_limit: fields.liquor_limit
    },
    restaurant_liquor_operations: {
      business_class: fields.business_class,
      food_truck_operations: fields.food_truck_operations,
      close_time: fields.close_time,
      alcohol_sales_cease: fields.alcohol_sales_cease,
      entertainment: fields.entertainment,
      security: fields.security,
      byob: fields.byob,
      liquor_training: fields.liquor_training,
      id_scanner: fields.id_scanner,
      fryers: fields.fryers,
      fire_suppression: fields.fire_suppression,
      claims_or_violations: fields.claims_or_violations
    },
    certificate_requirements: certificateRequirements
  };
}

function buildCsrCertificateRequest(fields: Record<string, string | null | undefined>) {
  const requested = (fields.certificate_requested ?? "").toLowerCase() === "yes";
  const missing = requested
    ? ["certificate_holder", "certificate_holder_address", "certificate_holder_email"].filter(
        (field) => !fields[field]
      )
    : [];

  const reviewFlags = [
    (fields.additional_insured_requested ?? "").toLowerCase() === "yes"
      ? "Additional insured request needs policy/endorsement review."
      : null,
    (fields.waiver_requested ?? "").toLowerCase() === "yes"
      ? "Waiver of subrogation request needs endorsement review."
      : null,
    (fields.primary_noncontributory_requested ?? "").toLowerCase() === "yes"
      ? "Primary and noncontributory wording needs policy review."
      : null,
    fields.special_certificate_wording
      ? "Special certificate wording should be reviewed before issuance."
      : null
  ].filter(Boolean) as string[];

  return {
    requested,
    status: !requested ? "not_requested" as const : missing.length ? "missing_information" as const : "ready_for_csr_review" as const,
    certificate_holder: {
      name: fields.certificate_holder ?? null,
      address: fields.certificate_holder_address ?? null,
      email: fields.certificate_holder_email ?? null
    },
    purpose: fields.certificate_purpose ?? null,
    requested_wording: {
      additional_insured: fields.additional_insured_requested,
      waiver_of_subrogation: fields.waiver_requested,
      primary_and_noncontributory: fields.primary_noncontributory_requested,
      special_wording: fields.special_certificate_wording
    },
    missing_information: missing,
    review_flags: reviewFlags,
    certificate_optimizer: certificateOptimizer(fields, missing, reviewFlags),
    csr_email_draft: requested
      ? csrEmailDraft(fields, missing, reviewFlags)
      : "",
    requires_csr_review: requested
  };
}

function certificateOptimizer(
  fields: Record<string, string | null | undefined>,
  missing: string[],
  reviewFlags: string[]
) {
  const quoteConsiderations = [
    (fields.additional_insured_requested ?? "").toLowerCase() === "yes"
      ? "Check whether additional insured wording affects quote terms or endorsement availability."
      : null,
    (fields.waiver_requested ?? "").toLowerCase() === "yes"
      ? "Confirm waiver of subrogation can be offered for the requested class and contract."
      : null,
    (fields.primary_noncontributory_requested ?? "").toLowerCase() === "yes"
      ? "Review primary and noncontributory wording before presenting quote terms."
      : null,
    detectedBusinessClass(fields).includes("food_truck")
      ? "Confirm off-premises, festival, and mobile food truck exposures are included in the submission review."
      : null,
    detectedBusinessClass(fields).includes("contractor")
      ? "Confirm subcontractor, jobsite, and completed operations details before certificate wording review."
      : null,
    detectedBusinessClass(fields).includes("landscaper")
      ? "Confirm snow removal, chemical application, tree work, and equipment exposures before certificate wording review."
      : null
  ].filter(Boolean) as string[];

  const csrReviewPriorities = [
    ...missing.map((field) => `Collect missing certificate information: ${formatAnalyticsLabel(field)}.`),
    ...reviewFlags,
    fields.special_certificate_wording
      ? "Compare special wording against policy permissions before issuing any certificate."
      : null
  ].filter(Boolean) as string[];

  return {
    optimization_goal:
      "Prepare certificate requirements for rep and CSR review while keeping quote-impacting wording visible before issuance.",
    complexity_score: Math.min(100, reviewFlags.length * 20 + missing.length * 15 + quoteConsiderations.length * 10),
    quote_considerations: quoteConsiderations,
    csr_review_priorities: csrReviewPriorities,
    suggested_next_step: missing.length
      ? "Collect missing holder details before CSR processing."
      : "Rep should review wording impact during quoting, then route the certificate request to CSR review."
  };
}

function csrEmailDraft(
  fields: Record<string, string | null | undefined>,
  missing: string[],
  reviewFlags: string[]
) {
  if (missing.length) {
    return "Certificate request is missing required holder information before CSR processing.";
  }

  const flags = reviewFlags.length
    ? reviewFlags.map((flag) => `- ${flag}`).join("\n")
    : "- No complex certificate wording detected.";

  return `Please review the certificate request below before issuance.

Insured: ${fields.applicant ?? ""}
Certificate holder: ${fields.certificate_holder ?? ""}
Holder address: ${fields.certificate_holder_address ?? ""}
Delivery email: ${fields.certificate_holder_email ?? ""}
Purpose: ${fields.certificate_purpose ?? ""}

Requested wording / review flags:
${flags}

Please confirm policy permissions and endorsements before issuing.`;
}

function inferredAnswer(
  id: string,
  question: string,
  inferred_answer: string,
  evidence: string,
  rep_check: string,
  pdf_field: string
) {
  const confidence = evidence && inferred_answer !== "Review Required" ? "high" as const : "needs_review" as const;
  return {
    id,
    question,
    inferred_answer,
    evidence: evidence || "No direct evidence found in intake.",
    rep_check,
    pdf_field,
    confidence,
    review_status: confidence === "high" ? "verify_before_submission" as const : "rep_review_required" as const,
    flagged_for_review: true
  };
}

function containsAny(value: string, keywords: string[]) {
  const lowered = value.toLowerCase();
  return keywords.some((keyword) => lowered.includes(keyword));
}

function answerLiquorFormQuestions(
  fields: Record<string, string | null | undefined>,
  questions: FormQuestion[],
  sourceRecord?: SalesforceLikeRecord | null
) {
  return questions.map((question) => ({
    id: question.id,
    question: question.question,
    answer: answerQuestion(question, fields, sourceRecord),
    source_field: question.source_field,
    pdf_field: question.pdf_field,
    confidence: answerQuestion(question, fields, sourceRecord) ? "high" as const : "missing" as const
  }));
}

export function salesforceRecordToQuoteText(record: SalesforceLikeRecord) {
  const account = record.account ?? {};
  const location = record.location ?? {};
  const opportunity = record.opportunity ?? {};
  const risk = record.risk_profile ?? {};
  const certificate = (record as SalesforceLikeRecord & { certificate_request?: Record<string, unknown> }).certificate_request ?? {};
  const coverages = Array.isArray(opportunity.requested_coverages)
    ? opportunity.requested_coverages.join(", ")
    : stringValue(opportunity.requested_coverages);

  return `Quote request generated from uploaded intake data.
Applicant: ${stringValue(account.name)}
DBA: ${stringValue(account.dba)}
Location address: ${stringValue(location.street)}
City: ${stringValue(location.city)}
State: ${stringValue(location.state)}
Zip: ${stringValue(location.zip)}
Email: ${stringValue(account.email)}
Phone: ${stringValue(account.phone)}
Coverage requested: ${coverages}
Operations: ${stringValue(risk.operations)}
Years experience: ${stringValue(risk.years_experience)}
Business start year: ${stringValue(risk.business_start_year)}
Food sales: ${stringValue(risk.food_sales)}
Alcohol sales: ${stringValue(risk.alcohol_sales)}
Catering sales: ${stringValue(risk.catering_sales)}
GL limit: ${stringValue(opportunity.general_liability_limit)}
Liquor limit: ${stringValue(opportunity.liquor_liability_limit)}
Close time: ${stringValue(risk.close_time)}
Alcohol sales cease: ${stringValue(risk.alcohol_sales_cease)}
Entertainment: ${stringValue(risk.entertainment)}
Security: ${stringValue(risk.security)}
BYOB: ${stringValue(risk.byob)}
Claims or violations: ${stringValue(risk.claims_or_violations)}
Liquor training: ${stringValue(risk.liquor_training)}
ID scanner: ${stringValue(risk.id_scanner)}
Happy hour after 9pm: ${stringValue(risk.happy_hour_after_9pm)}
Lowest beer price: ${stringValue(risk.lowest_beer_price)}
Lowest wine/liquor price: ${stringValue(risk.lowest_wine_liquor_price)}
Building owner: ${stringValue(risk.building_owner)}
Fryers: ${stringValue(risk.fryers)}
Fire suppression: ${stringValue(risk.fire_suppression)}
Certificate requested: ${stringValue(certificate.certificate_requested)}
Certificate holder: ${stringValue(certificate.certificate_holder)}
Certificate holder address: ${stringValue(certificate.certificate_holder_address)}
Certificate holder email: ${stringValue(certificate.certificate_holder_email)}
Certificate purpose: ${stringValue(certificate.certificate_purpose)}
Additional insured requested: ${stringValue(certificate.additional_insured_requested)}
Waiver of subrogation requested: ${stringValue(certificate.waiver_of_subrogation_requested)}
Primary and noncontributory requested: ${stringValue(certificate.primary_and_noncontributory_requested)}
Special certificate wording: ${stringValue(certificate.special_certificate_wording)}`;
}

function answerQuestion(
  question: FormQuestion,
  fields: Record<string, string | null | undefined>,
  sourceRecord?: SalesforceLikeRecord | null
) {
  const sourceAnswer = sourceRecord ? lookupPath(sourceRecord, question.source_field) : null;
  if (sourceAnswer !== null && sourceAnswer !== undefined && sourceAnswer !== "") {
    return Array.isArray(sourceAnswer) ? sourceAnswer.join(", ") : String(sourceAnswer);
  }

  const fallbackMap: Record<string, string | null | undefined> = {
    applicant_name: fields.applicant,
    location_address: fields.location_address,
    coverage_requested: fields.coverage_requested,
    description_of_operations: fields.operations,
    annual_food_sales: fields.food_sales,
    annual_alcohol_sales: fields.alcohol_sales,
    entertainment: fields.entertainment,
    liquor_training: fields.liquor_training
  };

  const sourceFieldFallback: Record<string, string | null | undefined> = {
    "account.name": fields.applicant,
    "account.dba": fields.dba,
    "account.email": fields.email,
    "account.phone": fields.phone,
    "location.street": fields.location_address,
    "location.city": fields.city,
    "location.state": fields.state,
    "location.zip": fields.zip,
    "opportunity.requested_coverages": fields.coverage_requested,
    "opportunity.general_liability_limit": fields.gl_limit,
    "opportunity.liquor_liability_limit": fields.liquor_limit,
    "risk_profile.operations": fields.operations,
    "risk_profile.food_sales": fields.food_sales,
    "risk_profile.alcohol_sales": fields.alcohol_sales,
    "risk_profile.catering_sales": fields.catering_sales,
    "risk_profile.entertainment": fields.entertainment,
    "risk_profile.security": fields.security,
    "risk_profile.liquor_training": fields.liquor_training,
    "risk_profile.claims_or_violations": fields.claims_or_violations,
    "risk_profile.years_experience": fields.years_experience,
    "risk_profile.contractor_operations": fields.contractor_operations,
    "risk_profile.landscaping_operations": fields.landscaping_operations,
    "certificate_request.certificate_holder": fields.certificate_holder,
    "certificate_request.certificate_holder_address": fields.certificate_holder_address,
    "certificate_request.certificate_holder_email": fields.certificate_holder_email,
    "certificate_request.additional_insured_requested": fields.additional_insured_requested,
    "certificate_request.waiver_of_subrogation_requested": fields.waiver_requested,
    "certificate_request.primary_and_noncontributory_requested": fields.primary_noncontributory_requested,
    "certificate_request.special_certificate_wording": fields.special_certificate_wording
  };

  return fallbackMap[question.id] ?? sourceFieldFallback[question.source_field] ?? null;
}

function lookupPath(record: SalesforceLikeRecord, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return null;
    return (current as Record<string, unknown>)[part];
  }, record);
}

function stringValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function detectedBusinessClass(fields: Record<string, string | null | undefined>) {
  const text = [
    fields.business_class,
    fields.operations,
    fields.food_truck_operations,
    fields.contractor_operations,
    fields.landscaping_operations
  ].join(" ").toLowerCase();

  if (text.includes("landscap")) return "landscaper";
  if (text.includes("contractor") || text.includes("remodel") || text.includes("subcontractor")) {
    return "contractor";
  }
  if (text.includes("food truck")) return "restaurant_liquor_food_truck";
  return "restaurant_liquor";
}

function requiredFieldsFor(fields: Record<string, string | null | undefined>) {
  const detected = detectedBusinessClass(fields);
  if (detected === "contractor") return requiredContractorFields;
  if (detected === "landscaper") return requiredLandscaperFields;
  return requiredLiquorRestaurantFields;
}

function selectedWorkflowLabel(fields: Record<string, string | null | undefined>) {
  const detected = detectedBusinessClass(fields);
  if (detected === "contractor") return "Contractor";
  if (detected === "landscaper") return "Landscaper";
  if (detected === "restaurant_liquor_food_truck") return "Restaurant / Liquor with food truck operations";
  return "Restaurant / Liquor";
}

function formatAnalyticsLabel(value: string) {
  return value.replaceAll("_", " ");
}

function cleanNone(value: string | null | undefined) {
  const cleaned = (value ?? "").toLowerCase().replace(/[. ]+$/g, "");
  return ["none", "no", "none in the past five years"].includes(cleaned);
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
  const detectedClass = detectedBusinessClass(fields);

  if (detectedClass === "contractor") {
    if (containsAny(fields.contractor_operations ?? "", ["subcontractor"])) {
      flags.push("Subcontractor exposure should be reviewed for certificate collection and contract controls.");
    }
    if (containsAny(fields.operations ?? "", ["remodel", "carpentry", "repair"])) {
      flags.push("Contractor operations should be reviewed for class eligibility and excluded work.");
    }
    if (!cleanNone(fields.claims_or_violations)) {
      flags.push("Claims or violations need detail before submission.");
    }
    return certificateRiskFlags(fields, flags);
  }

  if (detectedClass === "landscaper") {
    if (containsAny(fields.landscaping_operations ?? "", ["chemical", "pesticide"])) {
      flags.push("Chemical or pesticide exposure should be reviewed.");
    }
    if (containsAny(fields.landscaping_operations ?? "", ["tree"])) {
      flags.push("Tree work exposure should be reviewed for height and subcontractor controls.");
    }
    if (!cleanNone(fields.claims_or_violations)) {
      flags.push("Claims or violations need detail before submission.");
    }
    return certificateRiskFlags(fields, flags);
  }

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
  if (!cleanNone(fields.claims_or_violations)) {
    flags.push("Claims or liquor violations need detail before submission.");
  }
  return certificateRiskFlags(fields, flags);
}

function certificateRiskFlags(fields: Record<string, string | null | undefined>, flags: string[]) {
  if ((fields.additional_insured_requested ?? "").toLowerCase() === "yes") {
    flags.push("Additional insured wording may affect quote terms or endorsements.");
  }
  if ((fields.waiver_requested ?? "").toLowerCase() === "yes") {
    flags.push("Waiver of subrogation may require endorsement availability review.");
  }
  if ((fields.primary_noncontributory_requested ?? "").toLowerCase() === "yes") {
    flags.push("Primary and noncontributory wording may require carrier approval.");
  }
  return flags;
}

function repDoubleChecks(fields: Record<string, string | null | undefined>, riskFlags: string[]) {
  const checks = [
    "Confirm all applicant-provided facts before carrier submission.",
    "Confirm the selected carrier application version and state-specific requirements.",
    "Review inferred answers against source intake notes and producer guidance."
  ];

  if (riskFlags.length) {
    checks.push("Review underwriting flags before sending the application packet.");
  }
  if (fields.entertainment) {
    checks.push("Confirm entertainment type, frequency, and whether dancing is permitted.");
  }
  if (fields.security) {
    checks.push("Confirm security or door staff duties and employment status.");
  }
  if (fields.fryers === "Yes") {
    checks.push("Confirm fire suppression system type, service status, and cleaning contract.");
  }
  if ((fields.certificate_requested ?? "").toLowerCase() === "yes") {
    checks.push("Review certificate wording requirements during quote preparation, not only after binding.");
  }

  return checks;
}

function buildAnalyticsSummary({
  workflowName,
  documentType,
  missingInformation,
  riskFlags,
  totalFields,
  autoInferredFields,
  fieldsNeedingReview,
  confidenceValues
}: {
  workflowName: string;
  documentType: string;
  missingInformation: string[];
  riskFlags: string[];
  totalFields: number;
  autoInferredFields: number;
  fieldsNeedingReview: number;
  confidenceValues: string[];
}): AnalyticsSummary {
  const missingCount = missingInformation.length;
  const riskCount = riskFlags.length;
  const confidenceScore = averageConfidenceScore(confidenceValues);
  const score = clampScore(
    100 - missingCount * 8 - fieldsNeedingReview * 4 - riskCount * 3 + Math.round(confidenceScore * 0.12)
  );
  const metrics = {
    submission_readiness_score: score,
    percent_fields_auto_inferred: percent(autoInferredFields, totalFields),
    percent_fields_needing_review: percent(fieldsNeedingReview, totalFields),
    missing_information_count: missingCount,
    required_endorsements_count: requiredEndorsementCount(riskFlags),
    average_confidence_score: confidenceScore
  };

  return {
    ...metrics,
    risk_flags_by_category: groupRiskFlagsByCategory(riskFlags),
    common_missing_fields: commonMissingFields(missingInformation),
    dashboard_ready_json: {
      workflow_name: workflowName,
      document_type: documentType,
      review_status: missingCount ? "needs_more_information_for_human_review" : "prepared_for_human_review",
      metrics,
      human_review_note:
        "This score supports document preparation and operations review only. It does not approve, reject, bind, issue, or submit anything."
    }
  };
}

function averageConfidenceScore(values: string[]) {
  if (!values.length) return 0;
  const scores = values.map((value) => {
    if (value === "high" || value === "medium-high") return 90;
    if (value === "medium") return 70;
    if (value === "needs_review") return 55;
    if (value === "missing") return 20;
    return 60;
  });
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function groupRiskFlagsByCategory(flags: string[]) {
  return flags.reduce<Record<string, string[]>>((groups, flag) => {
    const category = riskCategory(flag);
    groups[category] = [...(groups[category] ?? []), flag];
    return groups;
  }, {});
}

function riskCategory(flag: string) {
  const lowered = flag.toLowerCase();
  if (lowered.includes("additional insured") || lowered.includes("waiver") || lowered.includes("primary")) {
    return "certificate_endorsements";
  }
  if (lowered.includes("missing")) return "missing_information";
  if (lowered.includes("entertainment") || lowered.includes("security") || lowered.includes("late")) {
    return "operations_review";
  }
  if (lowered.includes("legal") || lowered.includes("indemnification") || lowered.includes("contract")) {
    return "legal_or_contract_review";
  }
  if (lowered.includes("training") || lowered.includes("scanner") || lowered.includes("claims")) {
    return "controls_and_history";
  }
  return "general_review";
}

function requiredEndorsementCount(flags: string[]) {
  return flags.filter((flag) => {
    const lowered = flag.toLowerCase();
    return lowered.includes("additional insured") || lowered.includes("waiver") || lowered.includes("primary");
  }).length;
}

function commonMissingFields(fields: string[]) {
  const counts = fields.reduce<Record<string, number>>((summary, field) => {
    summary[field] = (summary[field] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts)
    .map(([field, count]) => ({ field, count }))
    .sort((left, right) => right.count - left.count || left.field.localeCompare(right.field));
}

function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
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
