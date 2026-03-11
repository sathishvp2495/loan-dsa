import { useState, type FormEvent } from "react";
import { apiFetch } from "../lib/api";
import type { EmploymentType, Lead, LoanType } from "../types";

const loanTypes: LoanType[] = ["PERSONAL", "HOME", "BUSINESS", "MORTGAGE", "CAR", "EDUCATION", "GOLD"];
const employmentTypes: EmploymentType[] = ["SALARIED", "SELF_EMPLOYED", "BUSINESS_OWNER", "OTHER"];

function normalizeIntegerInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^0+(?=\d)/, "");
}

export function PublicLeadPage() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    whatsappPhone: "",
    city: "",
    loanType: "PERSONAL" as LoanType,
    employmentType: "SALARIED" as EmploymentType,
    monthlyIncome: "",
    requestedAmount: "",
    whatsappOptIn: true,
    notes: ""
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const whatsappPhone = form.whatsappPhone.trim();
      const result = await apiFetch<{ lead: Lead; message: string }>("/leads/public", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          whatsappPhone: whatsappPhone || undefined,
          monthlyIncome: Number(form.monthlyIncome || 0),
          requestedAmount: Number(form.requestedAmount || 0)
        })
      });

      setSuccess(`Application submitted. Loan ID: ${result.lead.referenceCode}`);
      setForm({
        fullName: "",
        phone: "",
        whatsappPhone: "",
        city: "",
        loanType: "PERSONAL",
        employmentType: "SALARIED",
        monthlyIncome: "",
        requestedAmount: "",
        whatsappOptIn: true,
        notes: ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h1>Apply for a Loan</h1>
      <p className="muted">
        This form feeds the lead engine. From here the customer can be tracked until disbursement.
      </p>

      <form className="form-grid two-col" onSubmit={handleSubmit}>
        <label>
          <span>Full Name</span>
          <input
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            required
          />
        </label>

        <label>
          <span>Phone</span>
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            required
          />
        </label>

        <label>
          <span>WhatsApp Phone</span>
          <input
            value={form.whatsappPhone}
            onChange={(event) => setForm({ ...form, whatsappPhone: event.target.value })}
          />
        </label>

        <label>
          <span>City</span>
          <input
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
            required
          />
        </label>

        <label>
          <span>Loan Type</span>
          <select
            value={form.loanType}
            onChange={(event) => setForm({ ...form, loanType: event.target.value as LoanType })}
          >
            {loanTypes.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Employment Type</span>
          <select
            value={form.employmentType}
            onChange={(event) =>
              setForm({ ...form, employmentType: event.target.value as EmploymentType })
            }
          >
            {employmentTypes.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Monthly Income</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.monthlyIncome}
            onChange={(event) =>
              setForm({ ...form, monthlyIncome: normalizeIntegerInput(event.target.value) })
            }
            required
          />
        </label>

        <label>
          <span>Requested Amount</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.requestedAmount}
            onChange={(event) =>
              setForm({ ...form, requestedAmount: normalizeIntegerInput(event.target.value) })
            }
            required
          />
        </label>

        <label className="full-width checkbox-row">
          <span>I agree to receive updates on WhatsApp</span>
          <input
            type="checkbox"
            checked={form.whatsappOptIn}
            onChange={(event) => setForm({ ...form, whatsappOptIn: event.target.checked })}
          />
        </label>

        <label className="full-width">
          <span>Notes</span>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Current employer, urgency, preferred bank, or anything useful"
          />
        </label>

        {success ? <div className="alert success">{success}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}

        <button className="primary-button" disabled={busy}>
          {busy ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </section>
  );
}
