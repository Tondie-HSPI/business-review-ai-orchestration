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

export default function Home() {
  const [mode, setMode] = useState<WorkflowMode>("liquor-restaurant");
  const [text, setText] = useState(liquorRestaurantSample);
  const [sourceRecord, setSourceRecord] = useState<SalesforceLikeRecord | null>(null);
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>(defaultLiquorRestaurantQuestions);
  const [applicationText, setApplicationText] = useState<string>(questionsToText(defaultLiquorRestaurantQuestions));
  const [uploadedPdfName, setUploadedPdfName] = useState<string>("");
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [reviewedAnswers, setReviewedAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const requestedMode = normalizeWorkflowMode(new URLSearchParams(window.location.search).get("workflow"));

    if (!requestedMode || requestedMode === mode) return;

    setMode(requestedMode);
    setText(sampleForMode(requestedMode));
    setUploadMessage("");
    setReviewedAnswers({});
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
    setReviewedAnswers({});

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
      setReviewedAnswers({});
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
    setReviewedAnswers({});
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
    setReviewedAnswers({});
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
    setReviewedAnswers({});
  }

  function handleApplicationTextChange(value: string) {
    setApplicationText(value);
    setFormQuestions(parseApplicationQuestions(value));
    setReviewedAnswers({});
  }

  function toggleReviewed(answerId: string) {
    setReviewedAnswers((current) => ({
      ...current,
      [answerId]: !current[answerId]
    }));
  }

  const missingCount = result.missing_information.length;
  const humanReview = result.requires_human_review ? "Required" : "Not required";
  const analytics = result.analytics_summary;
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
              <a
                href="?workflow=application-prep"
                className={mode === "application-prep" ? "active" : ""}
                onClick={(event) => handleWorkflowClick(event, "liquor-restaurant")}
              >
              Restaurant App Prep
            </a>
              <span>Pre-mapped app demo</span>
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
          <strong>Demo flow</strong>
          <span>1. Select one workflow.</span>
          <span>2. Add quote intake details.</span>
          <span>3. Add the restaurant app to map.</span>
          <span>4. Review inferred answers, missing info, and flags.</span>
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
              making rep judgment calls visible through mapped fields, missing-information checks,
              certificate wording review, and decision-support analytics.
            </p>
          </div>
          <div className="heroPanel">
            <span>Human review boundary</span>
            <strong>{humanReview}</strong>
            <small>No approval, binding, issuing, or submission decisions are automated.</small>
          </div>
        </section>

        <section className="workflowPicker panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Start here</p>
              <h2>Choose the review path</h2>
            </div>
            <span className="reviewBadge required">One workflow per client</span>
          </div>
          <div className="workflowCards">
            <WorkflowCard
              active={mode === "business-review"}
              eyebrow="GL quote review"
              title="Small Business GL Review"
              body="Review a small-business GL request for operations, limits, certificates, missing information, and next action."
              href="?workflow=business-review"
              onClick={(event) => handleWorkflowClick(event, "business-review")}
            />
            <WorkflowCard
              active={mode === "liquor-restaurant"}
              eyebrow="Flagship demo"
              title="Restaurant / Liquor App"
              body="Use a pre-mapped restaurant application schema to infer answers from quote intake for rep review."
              href="?workflow=liquor-restaurant"
              onClick={(event) => handleWorkflowClick(event, "liquor-restaurant")}
            />
          </div>
        </section>

        <section className="decisionPath panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Presentation flow</p>
              <h2>Quote intake to submission-ready review</h2>
            </div>
          </div>
          <div className="pathSteps">
            <div>
              <span>1</span>
              <strong>Read the intake</strong>
              <small>Capture operations, limits, locations, sales, certificates, and special wording.</small>
            </div>
            <div>
              <span>2</span>
              <strong>Use the mapped app</strong>
              <small>Apply a pre-mapped restaurant application schema to the intake.</small>
            </div>
            <div>
              <span>3</span>
              <strong>Infer draft answers</strong>
              <small>Show answer, target field, evidence, and what the rep must verify.</small>
            </div>
            <div>
              <span>4</span>
              <strong>Prepare for review</strong>
              <small>Create a draft packet for human review, not automated approval or binding.</small>
            </div>
          </div>
        </section>

        <section className="metrics">
          <Metric label="Workflow" value={workflowTitle(result)} />
          <Metric label="Readiness score" value={`${analytics.submission_readiness_score}/100`} />
          <Metric label="Needs review" value={`${analytics.percent_fields_needing_review}%`} />
          <Metric label="Missing fields" value={String(missingCount)} />
        </section>

        <section className="grid">
          <div className="panel inputPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">{showsApplicationUploads ? "Steps 2 and 3" : "Step 2"}</p>
                <h2>{showsApplicationUploads ? "Quote intake and pre-mapped app" : "Small business GL request"}</h2>
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
            <div className={showsApplicationUploads ? "uploadGrid" : "uploadGrid singleUpload"}>
              <label>
                <span>{showsApplicationUploads ? "1. Upload intake form" : "Upload review request"}</span>
                <input
                  type="file"
                  accept=".txt,.json"
                  onChange={(event) => handleIntakeUpload(event.target.files?.[0] ?? null)}
                />
              </label>
              {showsApplicationUploads && (
                <>
                  <label>
                    <span>2. Upload mapped app schema</span>
                    <input
                      type="file"
                      accept=".txt,.json"
                      onChange={(event) => handleQuestionUpload(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <label>
                    <span>3. Attach app PDF</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(event) => handlePdfUpload(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </>
              )}
            </div>
            {showsApplicationUploads && (
              <div className="uploadHelp">
                The demo uses a pre-mapped restaurant app schema. Paste or upload the quote intake, then review how the mapped app fields derive inferred answers for the rep.
              </div>
            )}
            {uploadMessage && <div className="uploadMessage">{uploadMessage}</div>}
            {showsApplicationUploads ? (
              <div className="intakeAppGrid">
                <label className="textInputBlock">
                  <span>1. Quote intake form</span>
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    aria-label="Quote intake form"
                  />
                </label>
                <label className="textInputBlock">
                  <span>2. Pre-mapped restaurant app schema</span>
                  <textarea
                    value={applicationText}
                    onChange={(event) => handleApplicationTextChange(event.target.value)}
                    aria-label="Application to fill and map"
                  />
                </label>
              </div>
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
                reviewedAnswers={reviewedAnswers}
                onToggleReviewed={toggleReviewed}
              />
            ) : (
              <BusinessReviewView result={result as ReviewOutput} />
            )}
          </div>
        </section>

        <AnalyticsPanel result={result} />

        <section className="panel jsonPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">System output</p>
              <h2>Review JSON</h2>
            </div>
          </div>
          <a
            className="downloadButton"
            href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result, null, 2))}`}
            download="submissionready-review-packet.json"
          >
            Download review packet JSON
          </a>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
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
  reviewedAnswers,
  onToggleReviewed
}: {
  result: LiquorRestaurantPacket;
  uploadedPdfName: string;
  formQuestionCount: number;
  reviewedAnswers: Record<string, boolean>;
  onToggleReviewed: (answerId: string) => void;
}) {
  const requiredReviewCount = result.inferred_application_answers.filter(
    (item) => item.flagged_for_review
  ).length;
  const completedReviewCount = result.inferred_application_answers.filter(
    (item) => item.flagged_for_review && reviewedAnswers[item.id]
  ).length;
  const allReviewed = requiredReviewCount > 0 && completedReviewCount === requiredReviewCount;

  return (
    <div className="outputStack">
      <div className="notice">{result.official_form_status}</div>
      <div className="uploadStatus">
        <div>
          <span>Carrier app</span>
          <strong>{uploadedPdfName || "Pre-mapped restaurant app schema"}</strong>
        </div>
        <div>
          <span>Form questions</span>
          <strong>{formQuestionCount}</strong>
        </div>
      </div>
      <div className="summary">
        {result.intake_summary.applicant} | {result.intake_summary.location}
      </div>
      <div className={allReviewed ? "saveGate ready" : "saveGate"}>
        <span>Review gate</span>
        <strong>{allReviewed ? "Ready To Save Draft" : "Rep Review Required"}</strong>
        <small>
          {completedReviewCount} of {requiredReviewCount} flagged inferred answers reviewed
        </small>
      </div>
      <div className="readinessBox">
        <span>Submission readiness</span>
        <strong>{formatLabel(result.submission_readiness.status)}</strong>
        <small>
          Carrier agnostic draft | {result.submission_readiness.blocking_missing_information_count} blocking missing fields
        </small>
      </div>
      <ReviewSection title="Inferred Application Answers For Rep Review" className="applicationPreview" defaultOpen>
        <div className="reviewHint">
          Answers are derived from the quote intake using a USLI-style pre-mapped restaurant app schema. The rep reviews each answer, evidence, and target field before saving a draft.
        </div>
        {result.inferred_application_answers.map((item) => (
          <label className="previewQuestion" key={item.id}>
            <input
              type="checkbox"
              checked={Boolean(reviewedAnswers[item.id])}
              onChange={() => onToggleReviewed(item.id)}
            />
            <div>
              <span>{item.question}</span>
              <strong>{item.inferred_answer}</strong>
              <small>Target field: {item.pdf_field}</small>
              <small>Evidence: {item.evidence}</small>
              <small>Rep must verify: {item.rep_check}</small>
            </div>
          </label>
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
              Save disabled until flagged answers are reviewed
            </button>
          )}
        </div>
      </ReviewSection>
      <ChipGroup title="Missing information" values={result.missing_information} variant="missing" />
      <ChipGroup title="Risk flags" values={result.risk_flags} variant="risk" />
      <ChipGroup
        title="Rep double-check checklist"
        values={result.submission_readiness.rep_double_checks}
        variant="risk"
      />
      {result.csr_certificate_request.requested && (
        <ReviewSection title="Certificate Optimizer And CSR Draft" className="certificateRequest" defaultOpen>
          <div className="fieldRow">
            <span>Status</span>
            <strong>{formatLabel(result.csr_certificate_request.status)}</strong>
          </div>
          <div className="fieldRow">
            <span>Certificate Holder</span>
            <strong>{result.csr_certificate_request.certificate_holder.name || "Missing"}</strong>
          </div>
          <div className="fieldRow">
            <span>Holder Address</span>
            <strong>{result.csr_certificate_request.certificate_holder.address || "Missing"}</strong>
          </div>
          <div className="fieldRow">
            <span>Delivery Email</span>
            <strong>{result.csr_certificate_request.certificate_holder.email || "Missing"}</strong>
          </div>
          <ChipGroup
            title="CSR review flags"
            values={result.csr_certificate_request.review_flags}
            variant="risk"
          />
          <div className="optimizerBox">
            <h4>Certificate Optimizer</h4>
            <div className="fieldRow">
              <span>Complexity score</span>
              <strong>{result.csr_certificate_request.certificate_optimizer.complexity_score}/100</strong>
            </div>
            <div className="fieldRow">
              <span>Suggested next step</span>
              <strong>{result.csr_certificate_request.certificate_optimizer.suggested_next_step}</strong>
            </div>
            <ChipGroup
              title="Quote considerations"
              values={result.csr_certificate_request.certificate_optimizer.quote_considerations}
              variant="risk"
            />
            <ChipGroup
              title="CSR review priorities"
              values={result.csr_certificate_request.certificate_optimizer.csr_review_priorities}
              variant="risk"
            />
          </div>
          <div className="emailDraft">
            <pre>{result.csr_certificate_request.csr_email_draft}</pre>
          </div>
        </ReviewSection>
      )}
      <ReviewSection title="Mapped Application Questions">
        {result.answered_form_questions.map((item) => (
          <div className="questionRow" key={item.id}>
            <span>{item.question}</span>
            <strong>{item.answer || "Missing"}</strong>
            <small>
              {item.source_field} to {item.pdf_field}
            </small>
          </div>
        ))}
      </ReviewSection>
      <ReviewSection title="Selected Workflow And Extracted Packet">
        <div className="fieldRow">
          <span>Client app path</span>
          <strong>{result.workflow_scope.selected_workflow}</strong>
        </div>
        <div className="fieldRow">
          <span>Review note</span>
          <strong>{result.workflow_scope.routing_note}</strong>
        </div>
        {Object.entries(result.application_packet).map(([section, fields]) => (
          <div className="subSection" key={section}>
            <h3>{formatLabel(section)}</h3>
            {Object.entries(fields).map(([field, value]) => (
              <div className="fieldRow" key={field}>
                <span>{formatLabel(field)}</span>
                <strong>{value || "Missing"}</strong>
              </div>
            ))}
          </div>
        ))}
      </ReviewSection>
      <ReviewSection title="Draft PDF Field Map">
        {Object.entries(result.mapped_pdf_fields).map(([field, value]) => (
          <div className="fieldRow" key={field}>
            <span>{field}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </ReviewSection>
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
  variant = "default"
}: {
  title: string;
  values: string[];
  variant?: "default" | "missing" | "risk";
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
