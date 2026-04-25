from fastapi import FastAPI
from .schemas import (
    InterviewEvaluatePayload,
    InterviewGeneratePayload,
    ReadinessPayload,
    ResumePayload,
    RoadmapPayload,
    SkillGapPayload,
)
from .services import (
    analyze_gap,
    evaluate_interview_answer,
    generate_interview_questions,
    generate_roadmap,
    parse_resume,
    predict_readiness,
)

app = FastAPI(title="Placement Portal AI Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "placement-portal-ai"}


@app.post("/parse-resume")
def parse_resume_endpoint(payload: ResumePayload):
    return parse_resume(payload.text, payload.file_name)


@app.post("/analyze-skill-gap")
def analyze_skill_gap_endpoint(payload: SkillGapPayload):
    return analyze_gap(payload.student_skills, payload.required_skills)


@app.post("/predict-readiness")
def predict_readiness_endpoint(payload: ReadinessPayload):
    return predict_readiness(payload.model_dump())


@app.post("/generate-roadmap")
def generate_roadmap_endpoint(payload: RoadmapPayload):
    return generate_roadmap(payload.model_dump())


@app.post("/generate-interview-questions")
def generate_interview_questions_endpoint(payload: InterviewGeneratePayload):
    return generate_interview_questions(payload.model_dump())


@app.post("/evaluate-interview-answer")
def evaluate_interview_answer_endpoint(payload: InterviewEvaluatePayload):
    return evaluate_interview_answer(payload.model_dump())

