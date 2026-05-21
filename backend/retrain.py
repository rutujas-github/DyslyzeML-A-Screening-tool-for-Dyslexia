import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

# ── Load data ─────────────────────────────────────────────────────────────────
df = pd.read_csv('C:\\Users\\Rutuja\\OneDrive\\Desktop\\project\\backend\\data.csv')
df.columns = df.columns.str.strip()

feature_cols = [
    'spelling_accuracy',
    'gramatical_accuracy',
    'percentage_of_corrections',
    'percentage_of_phonetic_accuraccy'
]

X = df[feature_cols].values
y = df['presence_of_dyslexia'].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

# ── Heavily regularized RF to prevent overconfidence ─────────────────────────
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(
        n_estimators=100,
        max_depth=4,          # shallow trees — prevents overfitting
        min_samples_split=10, # needs more samples to split
        min_samples_leaf=5,   # needs more samples at leaf
        max_features='sqrt',
        random_state=42,
        class_weight='balanced'
    ))
])

# ── Use sigmoid calibration — better for small datasets ──────────────────────
calibrated = CalibratedClassifierCV(pipe, cv=5, method='sigmoid')
calibrated.fit(X_train, y_train)

y_pred  = calibrated.predict(X_test)
y_proba = calibrated.predict_proba(X_test)[:, 1]

print("Probability range:", y_proba.min().round(3), "→", y_proba.max().round(3))
print("Accuracy:", accuracy_score(y_test, y_pred))
print("AUC:", round(roc_auc_score(y_test, y_proba), 4))
print(classification_report(y_test, y_pred,
      target_names=['No Dyslexia', 'Dyslexia']))

# ── Save ──────────────────────────────────────────────────────────────────────
payload = {
    'model':        calibrated,
    'feature_cols': feature_cols,
    'classes':      ['No Dyslexia', 'Dyslexia'],
}
joblib.dump(payload, 'linguistic_rf_model.pkl')
print("Model saved → linguistic_rf_model.pkl")