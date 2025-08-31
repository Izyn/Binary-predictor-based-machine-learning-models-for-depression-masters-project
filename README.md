This project presents a machine learning–based web application designed to predict depression risk using patient health records.
The solution integrates data preprocessing, feature engineering, and supervised learning models (Logistic Regression, XGBoost, and Random Forest). After evaluation, the Random Forest model was selected as the best performer with an accuracy of 95% and ROC–AUC of 0.9867.

The project delivers its functionality through a full-stack web app:

Backend: FastAPI handles authentication, API endpoints, and prediction logic using the trained model.

Frontend: React.js provides a user-friendly interface where patients can enter their details and receive a risk score with recommendations.

Database: PostgreSQL stores user information and supports authentication.

The system demonstrates how computational methods can support mental health analysis and shows how machine learning can help identify risk patterns based on lifestyle, socio-economic, and family-related factors.

Steps to run the Project
1: Clone Repository 

git clone https://github.com/Izyn/Binary-predictor-based-machine-learning-models-for-depression-masters-project.git
cd Binary-predictor-based-machine-learning-models-for-depression-masters-project
/DepressionWeb/

2: Backend Setup (FastAPI)

cd backend
python -m venv venv
source venv/bin/activate  
pip install -r requirements.txt
uvicorn app.main:app --reload

3: Frontend Setup (React.js)

cd frontend
npm install
npm run dev

4: Database Setup (PostgreSQL)

DATABASE_URL=postgresql+psycopg2://postgres:izin@localhost:5432/depressionweb

5: Using the Web App

a: Open the frontend (http://localhost:5173).

b: Register/login.

c: Enter details into the form.

d: Click Predict to generate risk score and recommendations.

f: Download a PDF report if needed.


Link to the video - https://atlantictu-my.sharepoint.com/:v:/r/personal/g00473082_atu_ie/Documents/Recordings/ScreencastFinalProjectSub.mp4?csf=1&web=1&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=XvFwhd