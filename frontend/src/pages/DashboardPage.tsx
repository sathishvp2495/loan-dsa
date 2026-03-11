import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatCurrency, prettyStage } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import type { DashboardSummary, Lead, LeadStage } from "../types";

const stageOptions: Array<LeadStage | ""> = [
  "",
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

export function DashboardPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stage, setStage] = useState<LeadStage | "">("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [summaryResponse, leadResponse] = await Promise.all([
        apiFetch<DashboardSummary>("/dashboard/summary", { token }),
        apiFetch<{ leads: Lead[] }>(
          `/leads?${new URLSearchParams({
            ...(stage ? { stage } : {}),
            ...(search ? { search } : {})
          }).toString()}`,
          { token }
        )
      ]);

      setSummary(summaryResponse);
      setLeads(leadResponse.leads);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    void load();
  }, [stage, search]);

  return (
    <section className="page-grid dashboard-grid">
      <div className="panel">
        <h1>Lead Dashboard</h1>
        <p className="muted">Welcome back, {user?.fullName}. This is the live funnel.</p>

        {summary ? (
          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Leads</span>
              <strong>{summary.totalLeads}</strong>
            </div>
            <div className="stat-card">
              <span>Total Requested</span>
              <strong>{formatCurrency(summary.totalRequestedAmount)}</strong>
            </div>
            <div className="stat-card">
              <span>Total Disbursed</span>
              <strong>{formatCurrency(summary.totalDisbursedAmount)}</strong>
            </div>
            <div className="stat-card">
              <span>Your Payout</span>
              <strong>{formatCurrency(summary.totalPartnerPayout)}</strong>
            </div>
          </div>
        ) : null}

        <div className="funnel-grid">
          {Object.entries(summary?.stageCounts ?? {}).map(([key, value]) => (
            <div key={key} className="funnel-chip">
              <span>{prettyStage(key)}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <h2>Lead List</h2>
          <div className="toolbar-actions">
            <input
              placeholder="Search by name, city, phone, loan ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select value={stage} onChange={(event) => setStage(event.target.value as LeadStage | "")}>
              {stageOptions.map((value) => (
                <option key={value || "ALL"} value={value}>
                  {value ? prettyStage(value) : "All stages"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="loan-id-col">Loan ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Loan Type</th>
                <th>Amount</th>
                <th>Stage</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="loan-id-col">
                    <Link to={`/admin/leads/${lead.id}`}>{lead.referenceCode}</Link>
                  </td>
                  <td>{lead.fullName}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.city}</td>
                  <td>{lead.loanType}</td>
                  <td>{formatCurrency(lead.requestedAmount)}</td>
                  <td>{prettyStage(lead.stage)}</td>
                  <td>{lead.assignedAgent?.fullName ?? "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {leads.length === 0 ? <p className="muted">No leads match the current filter.</p> : null}
        </div>
      </div>
    </section>
  );
}
