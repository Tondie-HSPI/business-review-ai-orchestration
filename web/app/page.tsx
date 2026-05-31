"use client";

import { useMemo, useState } from "react";
import {
  ApplicationPacket,
  applicationSample,
  buildApplicationPacket,
  businessSample,
  reviewBusinessRequest,
  ReviewOutput,
  WorkflowMode
} from "../lib/workflows";

type Result = ReviewOutput | ApplicationPacket;

export default function Home() {
  const [mode, setMode] = useState<WorkflowMode>("application-prep");
  const [text, setText] = useState(applicationSample);

  const result = useMemo<Result>(() => {
    return mode === "application-prep"
      ? buildApplicationPacket(text)
      : reviewBusinessRequest(text);
  }, [mode, text]);

  function switchMode(nextMode: WorkflowMode) {
    setMode(nextMode);
    setText(nextMode === "application-prep" ? applicationSample : businessSample);
  }

  const missingCount = result.missing_information.length;
  const humanReview = result.requires_human_review ? "Required" : "Not required";

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
      </aside>

      <section className="workspace">
        <section className="hero">
          <div>
            <p className="eyebrow">AI-assisted paperwork review</p>
            <h1>Turn messy request notes into a structured review packet.</h1>
            <p>
              PaperworkPro demonstrates intake, extraction, rule-based validation,
              risk flagging, missing-information detection, and human review routing.
            </p>
          </div>
          <div className="heroPanel">
            <span>Human review boundary</span>
            <strong>{humanReview}</strong>
          </div>
        </section>

        <section className="metrics">
          <Metric label="Workflow" value={workflowTitle(result)} />
          <Metric label="Missing fields" value={String(missingCount)} />
          <Metric label="Review status" value={humanReview} />
          <Metric label="Output" value="Structured JSON" />
        </section>

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
                  setText(mode === "application-prep" ? applicationSample : businessSample)
                }
              >
                Reload sample
              </button>
            </div>
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
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ApplicationView({ result }: { result: ApplicationPacket }) {
  return (
    <div className="outputStack">
      <div className="notice">{result.official_form_status}</div>
      {Object.entries(result.application_sections).map(([section, fields]) => (
        <div className="sectionBlock" key={section}>
          <h3>{formatLabel(section)}</h3>
          {Object.entries(fields).map(([field, value]) => (
            <div className="fieldRow" key={field}>
              <span>{formatLabel(field)}</span>
              <strong>{Array.isArray(value) ? value.join(", ") || "None" : value || "Missing"}</strong>
            </div>
          ))}
        </div>
      ))}
      <ChipGroup title="Missing information" values={result.missing_information} variant="missing" />
      <ChipGroup title="Review notes" values={result.review_notes} variant="risk" />
      <div className="nextAction">{result.recommended_next_action}</div>
    </div>
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
