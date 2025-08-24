# /backend/scripts/build_demo_model.py
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib

FEATURES = [
    'Age',
    'Employment Status',
    'Income',
    "Education Level_Bachelor's Degree",
    'Education Level_High School',
    "Education Level_Master's Degree",
    'Education Level_PhD',
    'Social_Support',
    'family_personal_health',
    'personal_burden'
]

rng = np.random.default_rng(42)
n = 2500

age = rng.integers(18, 80, size=n)
employment = rng.integers(0, 2, size=n)
income = np.clip(rng.normal(40000, 20000, size=n), 0, None)

edu_idx = rng.integers(0, 4, size=n)
edu_onehot = np.zeros((n, 4), dtype=int)
edu_onehot[np.arange(n), edu_idx] = 1

social_support = np.clip(rng.normal(3.2 + 0.3*employment, 0.8, size=n), 1.0, 5.0)
family_health = np.clip(rng.normal(3.2 + 0.00001*(income-30000), 0.9, size=n), 1.0, 5.0)
personal_burden = np.clip(rng.normal(3.0 - 0.00002*(income-30000) - 0.5*employment, 0.8, size=n), 1.0, 5.0)

X = np.column_stack([age, employment, income, edu_onehot, social_support, family_health, personal_burden])
df = pd.DataFrame(X, columns=FEATURES)

risk_linear = (
    0.25*(1 - df['Employment Status']) +
    0.20*(1 - (df['Income']/80000).clip(0,1)) +
    0.20*((5 - df['Social_Support'])/4) +
    0.15*((5 - df['family_personal_health'])/4) +
    0.15*((df['personal_burden']-1)/4) +
    0.05*((df['Age']-18)/62)
)
y = np.clip(rng.normal(risk_linear, 0.03, size=n), 0, 1)

X_train, X_test, y_train, y_test = train_test_split(df, y, test_size=0.2, random_state=0)

rf = RandomForestRegressor(n_estimators=20, max_depth=10, random_state=0)
rf.fit(X_train, y_train)

models_dir = os.path.join(os.path.dirname(__file__), "..", "app", "models")
os.makedirs(models_dir, exist_ok=True)

joblib.dump(rf, os.path.join(models_dir, "model.pkl"), compress=7)
joblib.dump(FEATURES, os.path.join(models_dir, "features.pkl"), compress=5)

print("Saved model.pkl and features.pkl to", models_dir)
