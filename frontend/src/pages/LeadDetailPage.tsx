import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatCurrency, formatDate, prettyStage } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import type { Agent, Lead, LeadStage } from "../types";

const stageOptions: LeadStage[] = [
  "NEW_LEAD",
  "CONTACT_ATTEMPTED",
  "CONTACTED",
  "QUALIFIED",
  "DOCS_PENDING",
  "BANK_SUBMITTED",
  "SANCTIONED",
  "DISBURSED",
  "REJECTED",
  "CLOSED"
];

function normalizeNumberInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const [wholePart, ...decimalParts] = sanitized.split(".");
  const normalizedWhole = (wholePart ?? "").replace(/^0+(?=\d)/, "");

  if (decimalParts.length === 0) {
    return Number(normalizedWhole || 0);
  }

  const normalized = `${normalizedWhole || "0"}.${decimalParts.join("")}`;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function LeadDetailPage() {
  const { token } = useAuth();
  const { leadId } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stage, setStage] = useState<LeadStage>("NEW_LEAD");
  const [reason, setReason] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [messageBody, setMessageBody] = useState("Hi, your application is being processed.");
  const [commissionForm, setCommissionForm] = useState({
    lenderName: "",
    disbursedAmount: 0,
    payoutPercent: 2,
    addOnPercent: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function load() {
    if (!leadId) return;

    try {
      const [leadResponse, agentResponse] = await Promise.all([
        apiFetch<{ lead: Lead }>(`/leads/${leadId}`, { token }),
        apiFetch<{ agents: Agent[] }>("/users/agents", { token })
      ]);

      setLead(leadResponse.lead);
      setStage(leadResponse.lead.stage);
      setCommissionForm((current) => ({
        lenderName: leadResponse.lead.commission?.lenderName ?? current.lenderName,
        disbursedAmount: Number(leadResponse.lead.commission?.disbursedAmount ?? leadResponse.lead.requestedAmount),
        payoutPercent: Number(leadResponse.lead.commission?.payoutPercent ?? current.payoutPercent),
        addOnPercent: Number(leadResponse.lead.commission?.partnerSharePercent ?? current.addOnPercent)
      }));
      setAgents(agentResponse.agents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    }
  }

  useEffect(() => {
    void load();
  }, [leadId]);

  async function runAction(action: () => Promise<void>, successMessage: string) {
    try {
      await action();
      setFlash(successMessage);
      setError(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setFlash(null);
    }
  }

  const commissionPreview = useMemo(() => {
    const total = (commissionForm.disbursedAmount * commissionForm.payoutPercent) / 100;
    const addOn = (commissionForm.disbursedAmount * commissionForm.addOnPercent) / 100;
    const overall = total + addOn;
    return { total, overall };
  }, [commissionForm]);

  if (!lead) {
    return (
      <section className="panel">
        <h1>Lead Details</h1>
        {error ? <div className="alert error">{error}</div> : <p className="muted">Loading...</p>}
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel">
        <h1>{lead.fullName}</h1>
        <p className="muted">
          Loan ID: {lead.referenceCode} | {lead.city} | {lead.phone}
        </p>

        {flash ? <div className="alert success">{flash}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}

        <div className="details-grid">
          <div className="detail-card">
            <span>Current Stage</span>
            <strong>{prettyStage(lead.stage)}</strong>
          </div>
          <div className="detail-card">
            <span>Loan Type</span>
            <strong>{lead.loanType}</strong>
          </div>
          <div className="detail-card">
            <span>Requested Amount</span>
            <strong>{formatCurrency(lead.requestedAmount)}</strong>
          </div>
          <div className="detail-card">
            <span>Monthly Income</span>
            <strong>{formatCurrency(lead.monthlyIncome)}</strong>
          </div>
        </div>

        <div className="section-block">
          <h2>Update stage</h2>
          <div className="inline-form">
            <select value={stage} onChange={(event) => setStage(event.target.value as LeadStage)}>
              {stageOptions.map((item) => (
                <option key={item} value={item}>
                  {prettyStage(item)}
                </option>
              ))}
            </select>
            <input
              placeholder="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <button
              className="primary-button"
              onClick={() =>
                runAction(
                  () =>
                    apiFetch(`/leads/${lead.id}/stage`, {
                      method: "PATCH",
                      token,
                      body: JSON.stringify({ stage, reason })
                    }).then(() => undefined),
                  "Stage updated"
                )
              }
            >
              Save stage
            </button>
          </div>
        </div>

        <div className="section-block">
          <h2>Assign agent</h2>
          <div className="inline-form">
            <select
              value={lead.assignedAgentId ?? ""}
              onChange={(event) =>
                runAction(
                  () =>
                    apiFetch(`/leads/${lead.id}/assign`, {
                      method: "PATCH",
                      token,
                      body: JSON.stringify({ assignedAgentId: event.target.value || null })
                    }).then(() => undefined),
                  "Assignment updated"
                )
              }
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="section-block">
          <h2>Add note</h2>
          <div className="stack-form">
            <textarea
              rows={4}
              placeholder="Call summary, bank feedback, next follow-up"
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
            />
            <button
              className="primary-button"
              onClick={() =>
                runAction(
                  async () => {
                    await apiFetch(`/leads/${lead.id}/notes`, {
                      method: "POST",
                      token,
                      body: JSON.stringify({ body: noteBody })
                    });
                    setNoteBody("");
                  },
                  "Note added"
                )
              }
            >
              Save note
            </button>
          </div>
        </div>

        <div className="section-block">
          <h2>Record commission</h2>
          <div className="form-grid two-col">
            <label>
              <span>Lender Name</span>
              <input
                value={commissionForm.lenderName}
                onChange={(event) =>
                  setCommissionForm({ ...commissionForm, lenderName: event.target.value })
                }
              />
            </label>
            <label>
              <span>Disbursed Amount</span>
              <input
                type="number"
                min={0}
                value={commissionForm.disbursedAmount}
                onChange={(event) =>
                  setCommissionForm({
                    ...commissionForm,
                    disbursedAmount: normalizeNumberInput(event.target.value)
                  })
                }
              />
            </label>
            <label>
              <span>Payout %</span>
              <input
                type="number"
                min={0}
                value={commissionForm.payoutPercent}
                onChange={(event) =>
                  setCommissionForm({
                    ...commissionForm,
                    payoutPercent: normalizeNumberInput(event.target.value)
                  })
                }
              />
            </label>
            <label>
              <span>Add On %</span>
              <input
                type="number"
                min={0}
                value={commissionForm.addOnPercent}
                onChange={(event) =>
                  setCommissionForm({
                    ...commissionForm,
                    addOnPercent: normalizeNumberInput(event.target.value)
                  })
                }
              />
            </label>
          </div>

          <div className="details-grid">
            <div className="detail-card">
              <span>Total Commission</span>
              <strong>{formatCurrency(commissionPreview.total)}</strong>
            </div>
            <div className="detail-card">
              <span>Overall Amount</span>
              <strong>{formatCurrency(commissionPreview.overall)}</strong>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              if (!commissionForm.lenderName.trim()) {
                setError(null);
                setFlash(null);
                window.alert("Please fill lender name");
                return;
              }

              void runAction(
                () =>
                  apiFetch(`/leads/${lead.id}/commission`, {
                    method: "PUT",
                    token,
                    body: JSON.stringify({
                      ...commissionForm,
                      addOnPercent: commissionForm.addOnPercent
                    })
                  }).then(() => undefined),
                "Commission saved"
              );
            }}
          >
            Save commission
          </button>
        </div>

        <div className="section-block">
          <h2>Send WhatsApp message</h2>
          <div className="stack-form">
            <textarea
              rows={3}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
            />
            <button
              className="primary-button"
              onClick={() =>
                runAction(
                  async () => {
                    await apiFetch(`/leads/${lead.id}/whatsapp/send`, {
                      method: "POST",
                      token,
                      body: JSON.stringify({ body: messageBody })
                    });
                  },
                  "WhatsApp request sent"
                )
              }
            >
              Send message
            </button>
          </div>
          <p className="muted">
            Use this for agent-initiated messages inside the active service window. For automatic
            notifications, configure templates in the backend environment.
          </p>
        </div>
      </div>

      <div className="panel side-panel">
        <h2>Timeline</h2>
        <div className="timeline">
          {(lead.statusHistory ?? []).map((item) => (
            <div className="timeline-item" key={item.id}>
              <strong>{prettyStage(item.nextStage)}</strong>
              <span>{formatDate(item.createdAt)}</span>
              <p>{item.reason || "No reason entered"}</p>
            </div>
          ))}
        </div>

        <h2>Notes</h2>
        <div className="timeline">
          {(lead.notes ?? []).map((item) => (
            <div className="timeline-item" key={item.id}>
              <strong>{item.user?.fullName ?? "System"}</strong>
              <span>{formatDate(item.createdAt)}</span>
              <p>{item.body}</p>
            </div>
          ))}
        </div>

        <h2>WhatsApp Activity</h2>
        <div className="timeline">
          {(lead.messages ?? []).map((item) => (
            <div className="timeline-item" key={item.id}>
              <strong>{item.direction}</strong>
              <span>{formatDate(item.createdAt)}</span>
              <p>{item.body || item.templateName || "No body available"}</p>
              <small className="muted">Status: {item.status || "unknown"}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
