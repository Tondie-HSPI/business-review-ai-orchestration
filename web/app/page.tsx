"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ApplicationPacket,
  applicationSample,
  buildApplicationPacket,
  buildLiquorRestaurantPacket,
  businessSample,
  contractorSample,
  defaultLiquorRestaurantQuestions,
  FormQuestion,
  landscaperSample,
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
  const [mode, setMode] = useState<WorkflowMode>("application-prep");
  const [text, setText] = useState(applicationSample);
  const [sourceRecord, setSourceRecord] = useState<SalesforceLikeRecord | null>(null);
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>(defaultLiquorRestaurantQuestions);
  const [uploadedPdfName, setUploadedPdfName] = useState<string>("");
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [reviewedAnswers, setReviewedAnswers] = useState<Record<string, boolean>>({});

  const result = useMemo<Result>(() => {
    return mode === "application-prep"
      ? buildApplicationPacket(text)
      : mode === "liquor-restaurant" || mode === "contractor" || mode === "landscaper"
        ? buildLiquorRestaurantPacket(text, { sourceRecord, formQuestions })
      : reviewBusinessRequest(text);
  }, [mode, text, sourceRecord, formQuestions]);

  function switchMode(nextMode: WorkflowMode) {
    setMode(nextMode);
    setText(sampleForMode(nextMode));
    setUploadMessage("");
    setReviewedAnswers({});
  }

  async function handleIntakeUpload(file: File | null) {
    if (!file) return;
    const content = await file.text();

    if (file.name.toLowerCase().endsWith(".json")) {
      const parsed = JSON.parse(content) as SalesforceLikeRecord;
      setSourceRecord(parsed);
      setText(salesforceRecordToQuoteText(parsed));
      setMode((currentMode) => (
        currentMode === "contractor" || currentMode === "landscaper" || currentMode === "liquor-restaurant"
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
      currentMode === "contractor" || currentMode === "landscaper" || currentMode === "liquor-restaurant"
        ? currentMode
        : "liquor-restaurant"
    ));
    setUploadMessage(`Loaded intake text from ${file.name}`);
    setReviewedAnswers({});
  }

  async function handleQuestionUpload(file: File | null) {
    if (!file) return;
    const parsed = JSON.parse(await file.text()) as FormQuestion[];
    setFormQuestions(parsed);
    setMode((currentMode) => (
      currentMode === "contractor" || currentMode === "landscaper" || currentMode === "liquor-restaurant"
        ? currentMode
        : "liquor-restaurant"
    ));
    setUploadMessage(`Loaded ${parsed.length} form questions from ${file.name}`);
    setReviewedAnswers({});
  }

  function handlePdfUpload(file: File | null) {
    if (!file) return;
    setUploadedPdfName(file.name);
    setMode((currentMode) => (
      currentMode === "contractor" || currentMode === "landscaper" || currentMode === "liquor-restaurant"
        ? currentMode
        : "liquor-restaurant"
    ));
    setUploadMessage(`Attached carrier app PDF: ${file.name}`);
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
  const isIntakeWorkflow = mode === "contractor" || mode === "landscaper" || mode === "liquor-restaurant";

  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">P</span>
          <div>
            <strong>PaperworkPro</strong>
            <small>Controlled AI workflow</small>
          </div>
        </div>

        <div className="controlGroup">
          <label>Workflow</label>
          <div className="segmented">
            <button
              className={mode === "contractor" ? "active" : ""}
              onClick={() => switchMode("contractor")}
            >
              Contractor
            </button>
            <button
              className={mode === "landscaper" ? "active" : ""}
              onClick={() => switchMode("landscaper")}
            >
              Landscaper
            </button>
            <button
              className={mode === "liquor-restaurant" ? "active" : ""}
              onClick={() => switchMode("liquor-restaurant")}
            >
              Restaurant / Liquor
            </button>
            <button
              className={mode === "application-prep" ? "active" : ""}
              onClick={() => switchMode("application-prep")}
            >
              Application Prep
            </button>
            <button
              className={mode === "business-review" ? "active" : ""}
              onClick={() => switchMode("business-review")}
            >
              Business Review
            </button>
          </div>
        </div>

        <div className="sidebarNote">
          <strong>No API key required.</strong>
          <span>
            The demo separates flexible extraction from deterministic rules,
            missing-field checks, and human review controls.
          </span>
        </div>

        <div className="sidebarNote">
          <strong>Choose one workflow</strong>
          <span>Each client review uses one selected app path at a time.</span>
          <span>Business Review: general document/request review.</span>
          <span>Application Prep: carrier-neutral application packet.</span>
          <span>Contractor, Landscaper, and Restaurant / Liquor each use their own intake sample and review logic.</span>
        </div>

        <div className="sidebarNote">
          <strong>Upload flow</strong>
          <span>1. Upload intake data or use the sample.</span>
          <span>2. Upload form-question JSON or use the default schema.</span>
          <span>3. Attach a carrier PDF for tracking.</span>
          <span>4. Download the review packet JSON.</span>
        </div>
      </aside>

      <section className="workspace">
        <section className="hero">
          <div>
            <p className="eyebrow">AI-assisted paperwork review</p>
            <h1>Turn an initial request into a submission-ready application draft.</h1>
            <p>
              PaperworkPro demonstrates intake, extraction, rule-based validation,
              risk flagging, missing-information detection, and carrier submission review.
            </p>
          </div>
          <div className="heroPanel">
            <span>Human review boundary</span>
            <strong>{humanReview}</strong>
          </div>
        </section>

        <section className="metrics">
          <Metric label="Workflow" value={workflowTitle(result)} />
          <Metric label="Readiness score" value={`${analytics.submission_readiness_score}/100`} />
          <Metric label="Needs review" value={`${analytics.percent_fields_needing_review}%`} />
          <Metric label="Missing fields" value={String(missingCount)} />
        </section>

        <AnalyticsPanel result={result} />

        <section className="grid">
          <div className="panel inputPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Input</p>
                <h2>Request intake</h2>
              </div>
              <button
                className="secondaryButton"
                onClick={() =>
              setText(sampleForMode(mode))
                }
              >
                Reload sample
              </button>
            </div>
            {isIntakeWorkflow && (
              <div className="uploadGrid">
                <label>
                  <span>Upload intake data</span>
                  <input
                    type="file"
                    accept=".txt,.json"
                    onChange={(event) => handleIntakeUpload(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label>
                  <span>Upload form questions</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(event) => handleQuestionUpload(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label>
                  <span>Attach carrier app PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(event) => handlePdfUpload(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}
            {uploadMessage && <div className="uploadMessage">{uploadMessage}</div>}
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label="Request text"
            />
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
            ) : mode === "liquor-restaurant" || mode === "contractor" || mode === "landscaper" ? (
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
            download="paperworkpro-review-packet.json"
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
  if (mode === "contractor") return contractorSample;
  if (mode === "landscaper") return landscaperSample;
  if (mode === "liquor-restaurant") return liquorRestaurantSample;
  return businessSample;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AnalyticsPanel({ result }: { result: Result }) {
  const analytics = result.analytics_summary;
  const categoryEntries = Object.entries(analytics.risk_flags_by_category);

  return (
    <section className="panel analyticsPanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Operations analytics</p>
          <h2>Review summary metrics</h2>
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
          <strong>{uploadedPdfName || "Default preprocessed form schema"}</strong>
        </div>
        <div>
          <span>Form questions</span>
          <strong>{formQuestionCount}</strong>
        </div>
      </div>
      <div className={allReviewed ? "saveGate ready" : "saveGate"}>
          <span>Save draft gate</span>
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
      <div className="summary">
        {result.intake_summary.applicant} | {result.intake_summary.location}
      </div>
      <ReviewSection title="Selected Workflow" defaultOpen>
        <div className="fieldRow">
          <span>Client app path</span>
          <strong>{result.workflow_scope.selected_workflow}</strong>
        </div>
        <div className="fieldRow">
          <span>Review note</span>
          <strong>{result.workflow_scope.routing_note}</strong>
        </div>
      </ReviewSection>
      {Object.entries(result.application_packet).map(([section, fields]) => (
        <ReviewSection
          title={formatLabel(section)}
          key={section}
          defaultOpen={section === "applicant_information" || section === "certificate_requirements"}
        >
          {Object.entries(fields).map(([field, value]) => (
            <div className="fieldRow" key={field}>
              <span>{formatLabel(field)}</span>
              <strong>{value || "Missing"}</strong>
            </div>
          ))}
        </ReviewSection>
      ))}
      <ChipGroup title="Missing information" values={result.missing_information} variant="missing" />
      <ChipGroup title="Risk flags" values={result.risk_flags} variant="risk" />
      {result.csr_certificate_request.requested && (
        <ReviewSection title="CSR Certificate Request Draft" className="certificateRequest" defaultOpen>
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
      <ChipGroup
        title="Rep double-check checklist"
        values={result.submission_readiness.rep_double_checks}
        variant="risk"
      />
      <ReviewSection title="Generic Application Draft Before Save" className="applicationPreview" defaultOpen>
        <div className="reviewHint">
          Carrier-neutral sample app view. It shows where answers would go without copying a carrier form.
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
              download="paperworkpro-reviewed-application-draft.json"
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
      <ReviewSection title="Inferred Application Answers For Rep Review">
        {result.inferred_application_answers.map((item) => (
          <div className="inferenceRow" key={item.id}>
            <span>{item.question}</span>
            <strong>{item.inferred_answer}</strong>
            <em className={item.review_status === "rep_review_required" ? "reviewBadge required" : "reviewBadge"}>
              {formatLabel(item.review_status)}
            </em>
            <small>Evidence: {item.evidence}</small>
            <small>Rep check: {item.rep_check}</small>
            <small>Target field: {item.pdf_field}</small>
          </div>
        ))}
      </ReviewSection>
      <ReviewSection title="Form Questions Answered From Fake Intake Data">
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
