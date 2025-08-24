import { useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const OPTIONS = {
  MARITAL_STATUS: ["Single", "Married", "Divorced", "Widowed"],
  EDUCATION_LEVEL: ["High school", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD"],
  SMOKING_STATUS: ["Smoker", "Former", "Non-smoker"],
  PHYSICAL_ACTIVITY: ["Sedentary", "Moderate", "Active"],
  EMPLOYMENT_STATUS: ["Employed", "Unemployed"],
  ALCOHOL_CONSUMPTION: ["Low", "Moderate", "High"],
  DIETARY_HABITS: ["Healthy", "Moderate", "Unhealthy"],
  SLEEP_PATTERNS: ["Good", "Fair", "Poor"],
  YES_NO: ["Yes", "No"],
};

export default function Predict() {
  // ---------- state ----------
  const [form, setForm] = useState({
    age: "",
    marital_status: "",
    education_level: "",
    children: "",
    smoking_status: "",
    physical_activity: "",
    employment_status: "",
    income: "",
    alcohol_consumption: "",
    dietary_habits: "",
    sleep_patterns: "",
    history_mental_illness: "",
    history_substance_abuse: "",
    family_history_depression: "",
    chronic_medical_conditions: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ---------- helpers ----------
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const riskLabel = (score) => (score <= 0.33 ? "Low" : score <= 0.66 ? "Medium" : "High");
  const riskColor = (score) =>
    score <= 0.33
      ? "text-emerald-300 bg-emerald-900/40 ring-emerald-800"
      : score <= 0.66
      ? "text-amber-300 bg-amber-900/40 ring-amber-800"
      : "text-rose-300 bg-rose-900/40 ring-rose-800";
  const barColor = (score) =>
    score <= 0.33 ? "bg-emerald-500" : score <= 0.66 ? "bg-amber-500" : "bg-rose-500";

  const suggestions = (score) => {
    if (score <= 0.33)
      return "Maintain healthy habits: regular sleep, balanced diet, and activity. Keep monitoring.";
    if (score <= 0.66)
      return "Consider stress‑reduction (exercise, mindfulness) and stronger social support. If concerns persist, talk to a professional.";
    return "High risk: please consider speaking with a licensed mental‑health professional for guidance and support.";
  };

  // ---------- actions ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    // require all fields for consistent feature engineering
    for (const [, value] of Object.entries(form)) {
      if (!value && value !== 0) {
        setError("Please fill all fields.");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/predict`,
        {
          age: Number(form.age),
          marital_status: form.marital_status,
          education_level: form.education_level,
          number_of_children: Number(form.children || 0),
          smoking_status: form.smoking_status,
          physical_activity_level: form.physical_activity,
          employment_status: form.employment_status,
          income: Number(form.income || 0),
          alcohol_consumption: form.alcohol_consumption,
          dietary_habits: form.dietary_habits,
          sleep_patterns: form.sleep_patterns,
          history_of_mental_illness: form.history_mental_illness,
          history_of_substance_abuse: form.history_substance_abuse,
          family_history_of_depression: form.family_history_depression,
          chronic_medical_conditions: form.chronic_medical_conditions,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Build a printable HTML and trigger browser “Save as PDF”
  const downloadReport = () => {
    if (!result) return;
    const score = Number(result?.risk_score ?? 0);
    const label = riskLabel(score);
    const now = new Date().toLocaleString();

    const rows = [
      ["Age", form.age],
      ["Marital Status", form.marital_status],
      ["Education Level", form.education_level],
      ["Number of Children", form.children],
      ["Smoking Status", form.smoking_status],
      ["Physical Activity", form.physical_activity],
      ["Employment Status", form.employment_status],
      ["Income", form.income],
      ["Alcohol Consumption", form.alcohol_consumption],
      ["Dietary Habits", form.dietary_habits],
      ["Sleep Patterns", form.sleep_patterns],
      ["History of Mental Illness", form.history_mental_illness],
      ["History of Substance Abuse", form.history_substance_abuse],
      ["Family History of Depression", form.family_history_depression],
      ["Chronic Medical Conditions", form.chronic_medical_conditions],
    ];

    const tableRows = rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 10px;border:1px solid #1f2937;background:#0b1220;color:#d1d5db">${k}</td>
           <td style="padding:6px 10px;border:1px solid #1f2937;background:#0b1220;color:#e5e7eb">${v}</td></tr>`
      )
      .join("");

    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Depression Risk Report</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0b1120; color:#e5e7eb; }
          .card { max-width:800px; margin:30px auto; padding:24px; background:#0f172a; border:1px solid #1f2937; border-radius:14px; }
          .muted { color:#9ca3af; }
          .badge { display:inline-block; padding:6px 10px; border-radius:999px; font-weight:600; border:1px solid rgba(255,255,255,0.12); }
          .low { background:#064e3b; color:#a7f3d0; border-color:#065f46; }
          .med { background:#78350f; color:#fde68a; border-color:#92400e; }
          .high{ background:#7f1d1d; color:#fecaca; border-color:#991b1b; }
          .bar { height:12px; width:100%; background:#111827; border-radius:999px; overflow:hidden; }
          .fill { height:100%; border-radius:999px; transition:width .6s ease; }
          .f-low { background:#10b981; }
          .f-med { background:#f59e0b; }
          .f-high{ background:#ef4444; }
          table { border-collapse: collapse; width:100%; margin-top:14px; }
          @media print {.no-print{display:none}}
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="margin:0 0 6px 0">Depression Risk Report</h2>
          <div class="muted">Generated: ${now}</div>

          <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center">
            <div>
              <div class="muted" style="margin-bottom:6px">Risk Score</div>
              <div class="bar">
                <div class="fill ${score<=0.33?'f-low':score<=0.66?'f-med':'f-high'}" style="width:${Math.round(score*100)}%"></div>
              </div>
              <div style="margin-top:6px">Score: <b>${score.toFixed(2)}</b></div>
            </div>
            <div class="badge ${score<=0.33?'low':score<=0.66?'med':'high'}">${label} risk</div>
          </div>

          <h3 style="margin:18px 0 6px 0">Inputs</h3>
          <table>${tableRows}</table>

          <p class="muted" style="margin-top:16px;font-size:12px">
            This tool provides an informational risk estimate. It does not diagnose depression.
            For concerns, please consult a licensed mental‑health professional.
          </p>
          <button class="no-print" onclick="window.print()" style="margin-top:12px;padding:8px 12px;border-radius:10px;border:1px solid #1f2937;background:#1d4ed8;color:white">Print / Save as PDF</button>
        </div>
      </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=900,height=800");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // computed score/label
  const score = useMemo(() => Number(result?.risk_score ?? NaN), [result]);
  const label = useMemo(() => (isNaN(score) ? "" : riskLabel(score)), [score]);

  // ---------- small UI atoms ----------
  const Field = ({ label, children }) => (
    <label className="block">
      <span className="text-slate-300 text-sm">{label}</span>
      {children}
    </label>
  );

  const Select = ({ name, value, onChange, options, required }) => (
    <select
      required={required}
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 outline-none focus:ring-4 focus:ring-blue-500/30"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );

  const Input = ({ type = "text", name, value, onChange, placeholder, required }) => (
    <input
      required={required}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 outline-none focus:ring-4 focus:ring-blue-500/30"
    />
  );

  const LoadingSkeleton = () => (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse">
      <div className="h-4 w-1/3 bg-slate-700/60 rounded mb-3" />
      <div className="h-3 w-full bg-slate-700/50 rounded mb-2" />
      <div className="h-3 w-5/6 bg-slate-700/50 rounded mb-2" />
      <div className="h-3 w-2/3 bg-slate-700/50 rounded" />
    </div>
  );

  // ---------- render ----------
  const RightHeader = (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
    >
      Logout
    </button>
  );

  return (
    <Layout title="Depression Risk Prediction" right={RightHeader}>
      <div className="grid place-items-center">
        <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-8 shadow-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Predict Depression Risk</h2>
          <p className="text-slate-400 mb-6">Fill out the form to get your prediction</p>

          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Age*"><Input required type="number" name="age" value={form.age} onChange={onChange} /></Field>
            <Field label="Marital Status*"><Select required name="marital_status" value={form.marital_status} onChange={onChange} options={OPTIONS.MARITAL_STATUS} /></Field>
            <Field label="Education Level*"><Select required name="education_level" value={form.education_level} onChange={onChange} options={OPTIONS.EDUCATION_LEVEL} /></Field>
            <Field label="Number of Children*"><Input required type="number" name="children" value={form.children} onChange={onChange} /></Field>
            <Field label="Smoking Status*"><Select required name="smoking_status" value={form.smoking_status} onChange={onChange} options={OPTIONS.SMOKING_STATUS} /></Field>
            <Field label="Physical Activity Level*"><Select required name="physical_activity" value={form.physical_activity} onChange={onChange} options={OPTIONS.PHYSICAL_ACTIVITY} /></Field>
            <Field label="Employment Status*"><Select required name="employment_status" value={form.employment_status} onChange={onChange} options={OPTIONS.EMPLOYMENT_STATUS} /></Field>
            <Field label="Income*"><Input required type="number" name="income" value={form.income} onChange={onChange} /></Field>
            <Field label="Alcohol Consumption*"><Select required name="alcohol_consumption" value={form.alcohol_consumption} onChange={onChange} options={OPTIONS.ALCOHOL_CONSUMPTION} /></Field>
            <Field label="Dietary Habits*"><Select required name="dietary_habits" value={form.dietary_habits} onChange={onChange} options={OPTIONS.DIETARY_HABITS} /></Field>
            <Field label="Sleep Patterns*"><Select required name="sleep_patterns" value={form.sleep_patterns} onChange={onChange} options={OPTIONS.SLEEP_PATTERNS} /></Field>
            <Field label="History of Mental Illness*"><Select required name="history_mental_illness" value={form.history_mental_illness} onChange={onChange} options={OPTIONS.YES_NO} /></Field>
            <Field label="History of Substance Abuse*"><Select required name="history_substance_abuse" value={form.history_substance_abuse} onChange={onChange} options={OPTIONS.YES_NO} /></Field>
            <Field label="Family History of Depression*"><Select required name="family_history_depression" value={form.family_history_depression} onChange={onChange} options={OPTIONS.YES_NO} /></Field>
            <Field label="Chronic Medical Conditions*"><Select required name="chronic_medical_conditions" value={form.chronic_medical_conditions} onChange={onChange} options={OPTIONS.YES_NO} /></Field>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {loading ? "Analyzing..." : "Predict"}
              </button>
            </div>
          </form>

          {loading && <LoadingSkeleton />}

          {!loading && result && !isNaN(score) && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Prediction</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${riskColor(score)}`}>
                  {riskLabel(score)} risk
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>0</span>
                  <span>Risk score</span>
                  <span>1</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${barColor(score)} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Score: <span className="font-semibold">{score.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-300">
                <p className="mb-1 font-semibold">Recommendation</p>
                <p className="text-slate-400">{suggestions(score)}</p>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={downloadReport}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                >
                  Download PDF
                </button>
                <details>
                  <summary className="text-xs text-slate-400 cursor-pointer">View raw response</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap text-slate-300 bg-slate-950/40 rounded p-3">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
