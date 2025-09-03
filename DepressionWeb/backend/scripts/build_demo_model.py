import os
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor


FEATURES = [
    "age",
    "marital_status",
    "education_level",
    "number_of_children",
    "smoking_status",
    "physical_activity_level",
    "employment_status",
    "income",
    "alcohol_consumption",
    "dietary_habits",
    "sleep_patterns",
    "history_of_mental_illness",
    "history_of_substance_abuse",
    "family_history_of_depression",
    "chronic_medical_conditions",
]


rng = np.random.default_rng(42)
n = 4000  # enough to fit a stable demo model

marital_opts   = np.array(["Single", "Married", "Divorced", "Widowed"])
edu_opts       = np.array(["High school", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD"])
smoke_opts     = np.array(["Smoker", "Former", "Non-smoker"])
pa_opts        = np.array(["Sedentary", "Moderate", "Active"])
emp_opts       = np.array(["Employed", "Unemployed"])
alc_opts       = np.array(["Low", "Moderate", "High"])
diet_opts      = np.array(["Healthy", "Moderate", "Unhealthy"])
sleep_opts     = np.array(["Good", "Fair", "Poor"])
yn_opts        = np.array(["Yes", "No"])

# Helper to draw categorical with slight priors (matches your EDA tendencies)
def draw(opts, probs=None, size=n):
    idx = rng.choice(len(opts), size=size, p=probs)
    return opts[idx]

# Numerics
age  = rng.integers(18, 81, size=n)
kids = rng.integers(0, 5, size=n)
# income: log-normal-ish, skewed right, cap to realistic
income = np.clip(rng.normal(50000, 20000, size=n), 5000, 200000)

# Categoricals with mild priors
marital_status           = draw(marital_opts, probs=[0.22, 0.58, 0.12, 0.08])
education_level          = draw(edu_opts, probs=[0.25, 0.15, 0.35, 0.18, 0.07])
smoking_status           = draw(smoke_opts, probs=[0.10, 0.14, 0.76])
physical_activity_level  = draw(pa_opts,    probs=[0.40, 0.38, 0.22])
employment_status        = draw(emp_opts,   probs=[0.88, 0.12])
alcohol_consumption      = draw(alc_opts,   probs=[0.45, 0.40, 0.15])
dietary_habits           = draw(diet_opts,  probs=[0.25, 0.40, 0.35])
sleep_patterns           = draw(sleep_opts, probs=[0.35, 0.45, 0.20])
history_of_mental        = draw(yn_opts,    probs=[0.12, 0.88])
history_of_substance     = draw(yn_opts,    probs=[0.08, 0.92])
family_hist_dep          = draw(yn_opts,    probs=[0.16, 0.84])
chronic_med              = draw(yn_opts,    probs=[0.18, 0.82])

# Assemble raw DataFrame
df = pd.DataFrame({
    "age": age,
    "marital_status": marital_status,
    "education_level": education_level,
    "number_of_children": kids,
    "smoking_status": smoking_status,
    "physical_activity_level": physical_activity_level,
    "employment_status": employment_status,
    "income": income,
    "alcohol_consumption": alcohol_consumption,
    "dietary_habits": dietary_habits,
    "sleep_patterns": sleep_patterns,
    "history_of_mental_illness": history_of_mental,
    "history_of_substance_abuse": history_of_substance,
    "family_history_of_depression": family_hist_dep,
    "chronic_medical_conditions": chronic_med,
})



def map3(x, a, b, c):  
    return np.select([x==a, x==b, x==c], [0.0, 0.5, 1.0], default=0.5)

def mapYN(x):
    return (x == "Yes").astype(float)


support = np.select(
    [df["marital_status"]=="Married",
     df["marital_status"].isin(["Single","Divorced","Widowed"])],
    [0.0, 0.3], default=0.15
)

# Lifestyle contributors (higher -> more risk)
diet_r  = map3(df["dietary_habits"], "Healthy", "Moderate", "Unhealthy")      # Healthy->0, Unhealthy->1
sleep_r = map3(df["sleep_patterns"],  "Good", "Fair", "Poor")                 # Good->0, Poor->1
pa_r    = map3(df["physical_activity_level"], "Active", "Moderate", "Sedentary")[::-1]  # Sedentary risk↑ (invert)
# invert activity correctly (above line reverses array order inadvertently). Fix:
pa_raw  = map3(df["physical_activity_level"], "Sedentary", "Moderate", "Active")  # Sed->1, Active->0

alc_r   = map3(df["alcohol_consumption"], "Low", "Moderate", "High")
smk_r   = map3(df["smoking_status"], "Non-smoker", "Former", "Smoker")

# Health/burden contributors
hist_ment = mapYN(df["history_of_mental_illness"])
hist_sub  = mapYN(df["history_of_substance_abuse"])
fam_dep   = mapYN(df["family_history_of_depression"])
chronic   = mapYN(df["chronic_medical_conditions"])

# Employment & income contributors
unemp  = (df["employment_status"] == "Unemployed").astype(float)
inc_r  = 1.0 - np.clip((df["income"] - 10000) / 90000.0, 0, 1)  # 10k->1 risk, 100k+ -> ~0 risk

# Family load
kids_r = np.clip(df["number_of_children"] / 5.0, 0, 1)

# Combine (weights sum ~1.0). Add small noise, clip to [0,1]
risk = (
    0.20 * inc_r +
    0.12 * unemp +
    0.10 * diet_r +
    0.10 * sleep_r +
    0.08 * pa_raw +
    0.06 * smk_r +
    0.05 * alc_r +
    0.10 * hist_ment +
    0.05 * hist_sub +
    0.06 * fam_dep +
    0.06 * chronic +
    0.07 * kids_r +
    0.05 * support
)

risk = np.clip(risk + rng.normal(0, 0.03, size=n), 0, 1)


numeric_features = ["age", "number_of_children", "income"]
categorical_features = [c for c in FEATURES if c not in numeric_features]

preprocess = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ]
)

model = Pipeline(steps=[
    ("prep", preprocess),
    ("rf", RandomForestRegressor(
        n_estimators=200,
        max_depth=None,
        random_state=7,
        n_jobs=-1
    ))
])

X_train, X_test, y_train, y_test = train_test_split(df, risk, test_size=0.2, random_state=123)
model.fit(X_train, y_train)


models_dir = os.path.join(os.path.dirname(__file__), "..", "app", "models")
os.makedirs(models_dir, exist_ok=True)

joblib.dump(model,    os.path.join(models_dir, "model.pkl"),    compress=7)
joblib.dump(FEATURES, os.path.join(models_dir, "features.pkl"), compress=5)

print("✅ Saved model.pkl and features.pkl to:", os.path.abspath(models_dir))


pred_demo = model.predict(X_test.iloc[:3])
print("Sample predictions:", np.round(pred_demo, 3))
print("NOTE: Values are in [0,1] and interpreted as risk scores (Low/Med/High in UI).")
