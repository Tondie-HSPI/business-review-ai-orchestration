"use client";

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  ApplicationPacket,
  applicationSample,
  buildApplicationPacket,
  buildLiquorRestaurantPacket,
  businessSample,
  defaultLiquorRestaurantQuestions,
  FormQuestion,
  LiquorRestaurantPacket,
  liquorRestaurantSample,
  reviewBusinessRequest,
  ReviewOutput,
  SalesforceLikeRecord,
  salesforceRecordToQuoteText,
  WorkflowMode
} from "../lib/workflows";

type Result = ReviewOutput | ApplicationPacket | LiquorRestaurantPacket;
type AnswerDecision = "accepted" | "rejected";

export default function Home() {
  const [mode, setMode] = useState<WorkflowMode>("liquor-restaurant");
  const [text, setText] = useState(liquorRestaurantSample);
  const [sourceRecord, setSourceRecord] = useState<SalesforceLikeRecord | null>(null);
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>(defaultLiquorRestaurantQuestions);
  const [applicationText, setApplicationText] = useState<string>(questionsToText(defaultLiquorRestaurantQuestions));
  const [uploadedPdfName, setUploadedPdfName] = useState<string>("");
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [answerDecisions, setAnswerDecisions] = useState<Record<string, AnswerDecision>>({});

  useEffect(() => {
    const requestedMode = normalizeWorkflowMode(new URLSearchParams(window.location.search).get("workflow"));

    if (!requestedMode || requestedMode === mode) return;

    setMode(requestedMode);
    setText(sampleForMode(requestedMode));
    setUploadMessage("");
    setAnswerDecisions({});
  }, [mode]);

  const result = useMemo<Result>(() => {
    return mode === "application-prep"
      ? buildApplicationPacket(text)
      : mode === "liquor-restaurant" || mode === "contractor" || mode === "landscaper"
        ? buildLiquorRestaurantPacket(text, { sourceRecord, formQuestions })
      : reviewBusinessRequest(text);
  }, [mode, text, sourceRecord, formQuestions]);

  function switchMode(nextMode: WorkflowMode) {
    const normalizedMode = nextMode === "application-prep" ? "liquor-restaurant" : nextMode;
    setMode(normalizedMode);
    setText(sampleForMode(normalizedMode));
    setUploadMessage("");
    setAnswerDecisions({});

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?workflow=${normalizedMode}`);
    }
  }

  function handleWorkflowClick(event: MouseEvent<HTMLAnchorElement>, nextMode: WorkflowMode) {
    event.preventDefault();
    switchMode(nextMode);
  }

  async function handleIntakeUpload(file: File | null) {
    if (!file) return;
    const content = await file.text();

    if (file.name.toLowerCase().endsWith(".json")) {
      const parsed = JSON.parse(content) as SalesforceLikeRecord;
      setSourceRecord(parsed);
      setText(salesforceRecordToQuoteText(parsed));
      setMode((currentMode) => (
        currentMode === "application-prep" || currentMode === "liquor-restaurant"
          ? currentMode
          : "liquor-restaurant"
      ));
      setUploadMessage(`Loaded intake data from ${file.name}`);
      setAnswerDecisions({});
      return;
    }

    setSourceRecord(null);
    setText(content);
    setMode((currentMode) => (
      currentMode === "application-prep" || currentMode === "liquor-restaurant"
        ? currentMode
        : "liquor-restaurant"
    ));
    setUploadMessage(`Loaded intake text from ${file.name}`);
    setAnswerDecisions({});
  }

  async function handleQuestionUpload(file: File | null) {
    if (!file) return;
    const content = await file.text();
    const parsed = parseApplicationQuestions(content);
    setApplicationText(content);
    setFormQuestions(parsed);
    setMode((currentMode) => (
      currentMode === "application-prep" || currentMode === "liquor-restaurant"
        ? currentMode
        : "liquor-restaurant"
    ));
    setUploadMessage(`Loaded ${parsed.length} application questions from ${file.name}`);
    setAnswerDecisions({});
  }

  function handlePdfUpload(file: File | null) {
    if (!file) return;
    setUploadedPdfName(file.name);
    setMode((currentMode) => (
      currentMode === "application-prep" || currentMode === "liquor-restaurant"
        ? currentMode
        : "liquor-restaurant"
    ));
    setUploadMessage(`Attached carrier app PDF: ${file.name}`);
    setAnswerDecisions({});
  }

  function handleApplicationTextChange(value: string) {
    setApplicationText(value);
    setFormQuestions(parseApplicationQuestions(value));
    setAnswerDecisions({});
  }

  function setAnswerDecision(answerId: string, decision: AnswerDecision) {
    setAnswerDecisions((current) => {
      if (current[answerId] === decision) {
        const next = { ...current };
        delete next[answerId];
        return next;
      }

      return {
        ...current,
        [answerId]: decision
      };
    });
  }

  const humanReview = result.requires_human_review ? "Required" : "Not required";
  const isIntakeWorkflow = mode === "liquor-restaurant";
  const showsApplicationUploads = mode === "application-prep" || isIntakeWorkflow;

  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">SR</span>
          <div>
            <strong>SubmissionReady AI</strong>
            <small>Insurance submission review</small>
          </div>
        </div>

        <div className="sidebarNote">
          <strong>Demo flow</strong>
          <span>1. Show the quote intake.</span>
          <span>2. Generate the review packet.</span>
          <span>3. Verify flagged inferences.</span>
          <span>4. Save a human-reviewed draft.</span>
        </div>

        <div className="controlGroup">
          <label>Workflow</label>
          <div className="segmented">
            <a
              href="?workflow=business-review"
              className={mode === "business-review" ? "active" : ""}
              onClick={(event) => handleWorkflowClick(event, "business-review")}
            >
              Small Business GL Review
            </a>
            <div className="workflowGroup">
              <span>Restaurant workflow</span>
              <a
                href="?workflow=liquor-restaurant"
                className={mode === "liquor-restaurant" ? "active nested" : "nested"}
                onClick={(event) => handleWorkflowClick(event, "liquor-restaurant")}
              >
                Restaurant / Liquor
              </a>
            </div>
          </div>
        </div>

        <div className="sidebarNote">
          <strong>No API key required.</strong>
          <span>
            The demo separates flexible extraction from deterministic rules,
            missing-field checks, and human review controls.
          </span>
        </div>
      </aside>

      <section className="workspace">
        <section className="hero">
          <div>
            <p className="eyebrow">AI-assisted insurance workflow</p>
            <h1>Prepare cleaner insurance submissions for human review.</h1>
            <p>
              SubmissionReady AI turns quote intake into a structured application-prep workflow,
              making rep judgment calls visible through inferred answers, missing-information checks,
              certificate wording review, and decision-support analytics.
            </p>
          </div>
          <div className="heroPanel">
            <span>Human review boundary</span>
            <strong>{humanReview}</strong>
            <small>No approval, binding, issuing, or submission decisions are automated.</small>
          </div>
        </section>

        <section className="demoStrip panel">
          <div className="demoStripHeader">
            <p className="eyebrow">Live demo</p>
            <h2>Quote intake to submission-ready review</h2>
            <span className="reviewBadge required">Human-reviewed draft only</span>
          </div>
          <div className="pathSteps">
            <div>
              <span>1</span>
              <strong>Read the intake</strong>
              <small>Capture operations, sales, limits, certificates, and special wording.</small>
            </div>
            <div>
              <span>2</span>
              <strong>Infer answers</strong>
              <small>Draft restaurant application answers from the intake.</small>
            </div>
            <div>
              <span>3</span>
              <strong>Rep reviews</strong>
              <small>Flag uncertain answers and require confirmation before saving.</small>
            </div>
          </div>
        </section>

        <section className="grid">
          <div className="panel inputPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Step 2</p>
                <h2>{showsApplicationUploads ? "Quote intake" : "Small business GL request"}</h2>
              </div>
              <button
                type="button"
                className="secondaryButton"
                onClick={() =>
              setText(sampleForMode(mode))
                }
              >
                Reload sample
              </button>
            </div>
            <div className={showsApplicationUploads ? "uploadGrid twoUpload" : "uploadGrid singleUpload"}>
              <label>
                <span>{showsApplicationUploads ? "Upload quote intake" : "Upload review request"}</span>
                <input
                  type="file"
                  accept=".txt,.json"
                  onChange={(event) => handleIntakeUpload(event.target.files?.[0] ?? null)}
                />
              </label>
              {showsApplicationUploads && (
                <label>
                  <span>Attach app PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(event) => handlePdfUpload(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
            {showsApplicationUploads && (
              <div className="uploadHelp">
                The restaurant app requirements are built into this demo. Paste or upload the quote intake, then review inferred answers, missing items, and rep double-checks before saving a draft.
              </div>
            )}
            {uploadMessage && <div className="uploadMessage">{uploadMessage}</div>}
            {showsApplicationUploads ? (
              <label className="textInputBlock">
                <span>Quote intake form</span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  aria-label="Quote intake form"
                />
              </label>
            ) : (
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                aria-label="Request text"
              />
            )}
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Output</p>
                <h2>Structured review</h2>
              </div>
            </div>
            {mode === "application-prep" ? (
              <ApplicationView result={result as ApplicationPacket} />
            ) : mode === "liquor-restaurant" ? (
              <LiquorRestaurantView
                result={result as LiquorRestaurantPacket}
                uploadedPdfName={uploadedPdfName}
                formQuestionCount={formQuestions.length}
                answerDecisions={answerDecisions}
                onSetAnswerDecision={setAnswerDecision}
              />
            ) : (
              <BusinessReviewView result={result as ReviewOutput} />
            )}
          </div>
        </section>

        <AnalyticsPanel result={result} />
      </section>
    </main>
  );
}

function sampleForMode(mode: WorkflowMode) {
  if (mode === "application-prep") return applicationSample;
  if (mode === "liquor-restaurant") return liquorRestaurantSample;
  return businessSample;
}

function normalizeWorkflowMode(value: string | null): WorkflowMode | null {
  if (value === "contractor" || value === "landscaper") return "liquor-restaurant";
  if (value === "application-prep") return "liquor-restaurant";

  const modes: WorkflowMode[] = [
    "business-review",
    "liquor-restaurant"
  ];

  return modes.find((mode) => mode === value) ?? null;
}

function questionsToText(questions: FormQuestion[]) {
  return questions
    .map((question) => `${question.pdf_field} | ${question.question} | ${question.source_field}`)
    .join("\n");
}

function parseApplicationQuestions(value: string): FormQuestion[] {
  const trimmed = value.trim();
  if (!trimmed) return defaultLiquorRestaurantQuestions;

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as FormQuestion[];
      return parsed.filter((item) => item.id && item.question).map((item, index) => ({
        id: item.id || `question_${index + 1}`,
        question: item.question,
        source_field: item.source_field || guessSourceField(item.question),
        pdf_field: item.pdf_field || `Application question ${index + 1}`
      }));
    } catch {
      return defaultLiquorRestaurantQuestions;
    }
  }

  const questions = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      const pdfField = parts.length >= 2 ? parts[0] : `Application question ${index + 1}`;
      const question = parts.length >= 2 ? parts[1] : line.replace(/^\d+[\).\-\s]+/, "");
      const sourceField = parts.length >= 3 ? parts[2] : guessSourceField(question);

      return {
        id: slugifyQuestion(question) || `question_${index + 1}`,
        question,
        source_field: sourceField,
        pdf_field: pdfField
      };
    });

  return questions.length ? questions : defaultLiquorRestaurantQuestions;
}

function slugifyQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 52);
}

function guessSourceField(question: string) {
  const lowered = question.toLowerCase();
  if (lowered.includes("applicant") || lowered.includes("insured") || lowered.includes("named insured")) return "account.name";
  if (lowered.includes("dba")) return "account.dba";
  if (lowered.includes("address") || lowered.includes("location")) return "location.street";
  if (lowered.includes("city")) return "location.city";
  if (lowered.includes("state")) return "location.state";
  if (lowered.includes("zip")) return "location.zip";
  if (lowered.includes("email")) return "account.email";
  if (lowered.includes("phone")) return "account.phone";
  if (lowered.includes("coverage")) return "opportunity.requested_coverages";
  if (lowered.includes("limit")) return "opportunity.general_liability_limit";
  if (lowered.includes("operation") || lowered.includes("description")) return "risk_profile.operations";
  if (lowered.includes("food sales")) return "risk_profile.food_sales";
  if (lowered.includes("alcohol") || lowered.includes("liquor sales")) return "risk_profile.alcohol_sales";
  if (lowered.includes("entertainment")) return "risk_profile.entertainment";
  if (lowered.includes("training")) return "risk_profile.liquor_training";
  if (lowered.includes("claim") || lowered.includes("loss")) return "risk_profile.claims_or_violations";
  if (lowered.includes("certificate holder")) return "certificate_request.certificate_holder";
  if (lowered.includes("additional insured")) return "certificate_request.additional_insured_requested";
  if (lowered.includes("waiver")) return "certificate_request.waiver_of_subrogation_requested";
  if (lowered.includes("primary") || lowered.includes("noncontributory")) return "certificate_request.primary_and_noncontributory_requested";
  return "intake.review_required";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkflowCard({
  active,
  eyebrow,
  title,
  body,
  href,
  onClick
}: {
  active: boolean;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a className={active ? "workflowCard active" : "workflowCard"} href={href} onClick={onClick}>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <small>{body}</small>
    </a>
  );
}

function AnalyticsPanel({ result }: { result: Result }) {
  const analytics = result.analytics_summary;
  const categoryEntries = Object.entries(analytics.risk_flags_by_category);

  return (
    <section className="panel analyticsPanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Decision-support analytics</p>
          <h2>Submission review metrics</h2>
        </div>
        <span className="reviewBadge required">Human review only</span>
      </div>
      <div className="analyticsGrid">
        <Metric label="Auto-inferred fields" value={`${analytics.percent_fields_auto_inferred}%`} />
        <Metric label="Fields needing review" value={`${analytics.percent_fields_needing_review}%`} />
        <Metric label="Missing info count" value={String(analytics.missing_information_count)} />
        <Metric label="Endorsements" value={String(analytics.required_endorsements_count)} />
        <Metric label="Avg confidence" value={`${analytics.average_confidence_score}/100`} />
      </div>
      <div className="analyticsColumns">
        <div>
          <h3>Risk flags by category</h3>
          {categoryEntries.length ? (
            categoryEntries.map(([category, flags]) => (
              <div className="categoryBlock" key={category}>
                <strong>{formatLabel(category)}</strong>
                <span>{flags.length} review item{flags.length === 1 ? "" : "s"}</span>
              </div>
            ))
          ) : (
            <span className="chip success">None detected</span>
          )}
        </div>
        <div>
          <h3>Common missing fields</h3>
          {analytics.common_missing_fields.length ? (
            analytics.common_missing_fields.map((item) => (
              <div className="categoryBlock" key={item.field}>
                <strong>{formatLabel(item.field)}</strong>
                <span>{item.count} occurrence{item.count === 1 ? "" : "s"}</span>
              </div>
            ))
          ) : (
            <span className="chip success">None detected</span>
          )}
        </div>
      </div>
      <div className="analyticsNote">
        {analytics.dashboard_ready_json.human_review_note}
      </div>
    </section>
  );
}

function ApplicationView({ result }: { result: ApplicationPacket }) {
  return (
    <div className="outputStack">
      <div className="notice">{result.official_form_status}</div>
      {Object.entries(result.application_sections).map(([section, fields]) => (
        <ReviewSection title={formatLabel(section)} key={section} defaultOpen={section === "applicant_information"}>
          {Object.entries(fields).map(([field, value]) => (
            <div className="fieldRow" key={field}>
              <span>{formatLabel(field)}</span>
              <strong>{Array.isArray(value) ? value.join(", ") || "None" : value || "Missing"}</strong>
            </div>
          ))}
        </ReviewSection>
      ))}
      <ChipGroup title="Missing information" values={result.missing_information} variant="missing" />
      <ChipGroup title="Review notes" values={result.review_notes} variant="risk" />
      <div className="nextAction">{result.recommended_next_action}</div>
    </div>
  );
}

function LiquorRestaurantView({
  result,
  uploadedPdfName,
  formQuestionCount,
  answerDecisions,
  onSetAnswerDecision
}: {
  result: LiquorRestaurantPacket;
  uploadedPdfName: string;
  formQuestionCount: number;
  answerDecisions: Record<string, AnswerDecision>;
  onSetAnswerDecision: (answerId: string, decision: AnswerDecision) => void;
}) {
  const requiredReviewCount = result.inferred_application_answers.filter(
    (item) => item.flagged_for_review
  ).length;
  const acceptedReviewCount = result.inferred_application_answers.filter(
    (item) => item.flagged_for_review && answerDecisions[item.id] === "accepted"
  ).length;
  const rejectedReviewCount = result.inferred_application_answers.filter(
    (item) => item.flagged_for_review && answerDecisions[item.id] === "rejected"
  ).length;
  const allReviewed = requiredReviewCount > 0 && acceptedReviewCount === requiredReviewCount && rejectedReviewCount === 0;
  const visibleRiskFlags = result.risk_flags.slice(0, 3);
  const visibleDoubleChecks = result.submission_readiness.rep_double_checks.slice(0, 4);
  const certificateOptimizer = result.csr_certificate_request.certificate_optimizer;

  return (
    <div className="outputStack">
      <div className="notice">{result.official_form_status}</div>
      <div className="uploadStatus">
        <div>
          <span>Restaurant app</span>
          <strong>{uploadedPdfName || "Restaurant app logic applied"}</strong>
        </div>
        <div>
          <span>App questions</span>
          <strong>{formQuestionCount}</strong>
        </div>
      </div>
      <div className="summary intakeOutput">
        <span>Quote intake output</span>
        <strong>{result.intake_summary.applicant}</strong>
        <small>{result.intake_summary.location}</small>
        <small>{result.intake_summary.operations}</small>
      </div>
      <div className={allReviewed ? "saveGate ready" : "saveGate"}>
        <span>Review gate</span>
        <strong>{allReviewed ? "Ready To Save Draft" : "Rep Review Required"}</strong>
        <small>
          {acceptedReviewCount} accepted, {rejectedReviewCount} rejected, {requiredReviewCount} requiring review
        </small>
      </div>
      <div className="readinessBox">
        <span>Submission readiness</span>
        <strong>{formatLabel(result.submission_readiness.status)}</strong>
        <small>
          Carrier agnostic draft | {result.submission_readiness.blocking_missing_information_count} blocking missing fields
        </small>
      </div>
      <ChipGroup
        title="Rep double-check checklist"
        values={visibleDoubleChecks}
        variant="risk"
        overflowCount={result.submission_readiness.rep_double_checks.length - visibleDoubleChecks.length}
      />
      <ReviewSection title="Grouped Confirmation Areas From Quote Intake" className="applicationPreview" defaultOpen>
        <div className="reviewHint">
          Related application questions are grouped into review areas. The system prepares draft summaries from the intake; the rep accepts or rejects each group before saving a draft.
        </div>
        {result.inferred_application_answers.map((item) => (
          <div className={`previewQuestion ${answerDecisions[item.id] ?? ""}`} key={item.id}>
            <div className="decisionStatus">
              {answerDecisions[item.id] === "accepted" ? "Accepted" : answerDecisions[item.id] === "rejected" ? "Rejected" : "Review"}
            </div>
            <div>
              <span>{item.question}</span>
              <strong>{item.inferred_answer}</strong>
              <small>Target field: {item.pdf_field}</small>
              <small>Evidence: {item.evidence}</small>
              <small>Rep must verify: {item.rep_check}</small>
              <div className="answerDecisionButtons">
                <button
                  type="button"
                  className={answerDecisions[item.id] === "accepted" ? "acceptButton active" : "acceptButton"}
                  onClick={() => onSetAnswerDecision(item.id, "accepted")}
                >
                  Accept answer
                </button>
                <button
                  type="button"
                  className={answerDecisions[item.id] === "rejected" ? "rejectButton active" : "rejectButton"}
                  onClick={() => onSetAnswerDecision(item.id, "rejected")}
                >
                  Reject / needs correction
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="saveActions">
          {allReviewed ? (
            <a
              className="downloadButton"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result, null, 2))}`}
              download="submissionready-reviewed-application-draft.json"
            >
              Save reviewed draft
            </a>
          ) : (
            <button className="disabledButton" disabled>
              Save disabled until flagged answers are accepted and rejected answers are corrected
            </button>
          )}
        </div>
      </ReviewSection>
      {result.csr_certificate_request.requested && (
        <ReviewSection title="Certificate Wording Quote Review" className="certificateRequest" defaultOpen>
          <div className="optimizerBox primaryOptimizer">
            <h4>Quote impact summary</h4>
            <div className="fieldRow">
              <span>Complexity score</span>
              <strong>{certificateOptimizer.complexity_score}/100</strong>
            </div>
            <div className="fieldRow">
              <span>Suggested next step</span>
              <strong>{certificateOptimizer.suggested_next_step}</strong>
            </div>
            <ChipGroup
              title="Quote considerations"
              values={certificateOptimizer.quote_considerations.slice(0, 3)}
              variant="risk"
            />
          </div>
        </ReviewSection>
      )}
      <ChipGroup title="Missing information" values={result.missing_information} variant="missing" />
      <ChipGroup
        title="Key review flags"
        values={visibleRiskFlags}
        variant="risk"
        overflowCount={result.risk_flags.length - visibleRiskFlags.length}
      />
      <div className="nextAction">{result.recommended_next_action}</div>
    </div>
  );
}

function ReviewSection({
  title,
  children,
  defaultOpen = false,
  className = ""
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details className={`sectionBlock reviewSection ${className}`} open={defaultOpen}>
      <summary>
        <h3>{title}</h3>
        <span>Review</span>
      </summary>
      <div className="reviewSectionBody">{children}</div>
    </details>
  );
}

function BusinessReviewView({ result }: { result: ReviewOutput }) {
  return (
    <div className="outputStack">
      <div className="summary">{result.summary}</div>
      <ChipGroup title="Extracted requirements" values={result.extracted_requirements} />
      <ChipGroup title="Missing information" values={result.missing_information} variant="missing" />
      <ChipGroup title="Risk flags" values={result.risk_flags} variant="risk" />
      <div className="nextAction">{result.recommended_next_action}</div>
      <div className="emailDraft">{result.email_draft}</div>
    </div>
  );
}

function ChipGroup({
  title,
  values,
  variant = "default",
  overflowCount = 0
}: {
  title: string;
  values: string[];
  variant?: "default" | "missing" | "risk";
  overflowCount?: number;
}) {
  return (
    <div>
      <h3>{title}</h3>
      <div className="chips">
        {values.length ? (
          values.map((value) => (
            <span className={`chip ${variant}`} key={value}>
              {formatLabel(value)}
            </span>
          ))
        ) : (
          <span className="chip success">None detected</span>
        )}
        {overflowCount > 0 && (
          <span className="chip mutedChip">+{overflowCount} more in JSON</span>
        )}
      </div>
    </div>
  );
}

function workflowTitle(result: Result): string {
  if ("workflow_name" in result) return result.workflow_name;
  return formatLabel(result.document_type);
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
