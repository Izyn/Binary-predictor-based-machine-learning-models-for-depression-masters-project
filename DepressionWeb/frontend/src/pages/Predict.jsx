import { useState } from "react";
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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    for (const [key, value] of Object.entries(form)) {
  if (!value) {
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, children }) => (
    <label className="block">
      <span className="text-slate-300 text-sm">{label}</span>
      {children}
    </label>
  );

  const Select = ({ name, value, onChange, options }) => (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 outline-none focus:ring-4 focus:ring-blue-500/30"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );

  const Input = ({ type = "text", name, value, onChange, placeholder }) => (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 outline-none focus:ring-4 focus:ring-blue-500/30"
    />
  );

  return (
    <Layout title="Depression Risk Prediction">
      <div className="grid place-items-center">
        <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-8 shadow-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Predict Depression Risk</h2>
          <p className="text-slate-400 mb-6">Fill out the form to get your prediction</p>

          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Age*"><Input type="number" name="age" value={form.age} onChange={onChange} /></Field>
            <Field label="Marital Status*"><Select name="marital_status" value={form.marital_status} onChange={onChange} options={OPTIONS.MARITAL_STATUS} /></Field>
            <Field label="Education Level*"><Select name="education_level" value={form.education_level} onChange={onChange} options={OPTIONS.EDUCATION_LEVEL} /></Field>
            <Field label="Number of Children"><Input type="number" name="children" value={form.children} onChange={onChange} /></Field>
            <Field label="Smoking Status"><Select name="smoking_status" value={form.smoking_status} onChange={onChange} options={OPTIONS.SMOKING_STATUS} /></Field>
            <Field label="Physical Activity Level"><Select name="physical_activity" value={form.physical_activity} onChange={onChange} options={OPTIONS.PHYSICAL_ACTIVITY} /></Field>
            <Field label="Employment Status"><Select name="employment_status" value={form.employment_status} onChange={onChange} options={OPTIONS.EMPLOYMENT_STATUS} /></Field>
            <Field label="Income"><Input type="number" name="income" value={form.income} onChange={onChange} /></Field>
            <Field label="Alcohol Consumption"><Select name="alcohol_consumption" value={form.alcohol_consumption} onChange={onChange} options={OPTIONS.ALCOHOL_CONSUMPTION} /></Field>
            <Field label="Dietary Habits"><Select name="dietary_habits" value={form.dietary_habits} onChange={onChange} options={OPTIONS.DIETARY_HABITS} /></Field>
            <Field label="Sleep Patterns"><Select name="sleep_patterns" value={form.sleep_patterns} onChange={onChange} options={OPTIONS.SLEEP_PATTERNS} /></Field>
            <Field label="History of Mental Illness"><Select name="history_mental_illness" value={form.history_mental_illness} onChange={onChange} options={OPTIONS.YES_NO} /></Field>
            <Field label="History of Substance Abuse"><Select name="history_substance_abuse" value={form.history_substance_abuse} onChange={onChange} options={OPTIONS.YES_NO} /></Field>
            <Field label="Family History of Depression"><Select name="family_history_depression" value={form.family_history_depression} onChange={onChange} options={OPTIONS.YES_NO} /></Field>
            <Field label="Chronic Medical Conditions"><Select name="chronic_medical_conditions" value={form.chronic_medical_conditions} onChange={onChange} options={OPTIONS.YES_NO} /></Field>

            <div className="md:col-span-2">
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-semibold disabled:opacity-60">
                {loading ? "Predicting..." : "Predict"}
              </button>
            </div>
          </form>

          {result && (
            <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-900/30 p-4 text-emerald-200">
              <h3 className="font-semibold mb-1">Result</h3>
              <pre className="text-sm whitespace-pre-wrap">
{JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
