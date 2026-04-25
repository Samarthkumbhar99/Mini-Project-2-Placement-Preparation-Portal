from pydantic import BaseModel, Field


class ResumePayload(BaseModel):
    text: str = ""
    file_name: str = ""


class SkillGapPayload(BaseModel):
    student_skills: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)


class ReadinessPayload(BaseModel):
    cgpa: float = 0
    skills: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    internships: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    target_role: str = ""


class RoadmapPayload(BaseModel):
    missing_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    target_role: str = ""
    current_skills: list[str] = Field(default_factory=list)


class InterviewGeneratePayload(BaseModel):
    student_skills: list[str] = Field(default_factory=list)
    company_name: str = ""
    job_role: str = ""


class InterviewEvaluatePayload(BaseModel):
    question: str = ""
    answer: str = ""
    expected_focus: list[str] = Field(default_factory=list)

