from collections import Counter
import re
from .constants import ROADMAP_THEMES, SECTION_HINTS, SKILL_KEYWORDS


def _normalize(items: list[str]) -> list[str]:
    cleaned = []
    seen = set()
    for item in items:
        value = item.strip()
        if value and value.lower() not in seen:
            seen.add(value.lower())
            cleaned.append(value)
    return cleaned


def extract_skills(text: str) -> list[str]:
    found = []
    lowered = text.lower()
    for skill in SKILL_KEYWORDS:
        if skill.lower() in lowered:
            found.append(skill)
    return _normalize(found)


def extract_projects(text: str) -> list[str]:
    lines = [line.strip(" -\t") for line in text.splitlines() if line.strip()]
    projects = []
    for line in lines:
        if any(hint in line.lower() for hint in SECTION_HINTS["projects"]):
            projects.append(line)
    return _normalize(projects[:4])


def extract_education(text: str) -> list[str]:
    lines = [line.strip(" -\t") for line in text.splitlines() if line.strip()]
    education = []
    for line in lines:
        if any(hint in line.lower() for hint in SECTION_HINTS["education"]):
            education.append(line)
    return _normalize(education[:3])


def parse_resume(text: str, file_name: str) -> dict:
    summary = f"Parsed resume '{file_name or 'uploaded file'}' and identified academic and technical signals."
    return {
        "extracted_skills": extract_skills(text),
        "education": extract_education(text),
        "projects": extract_projects(text),
        "summary": summary
    }


def analyze_gap(student_skills: list[str], required_skills: list[str]) -> dict:
    normalized_student = {skill.lower(): skill for skill in student_skills}
    missing = []
    strengths = []
    for skill in required_skills:
        if skill.lower() in normalized_student:
            strengths.append(skill)
        else:
            missing.append(skill)

    weak_skills = []
    if "communication" not in normalized_student:
        weak_skills.append("Communication")
    if "aptitude" not in normalized_student:
        weak_skills.append("Aptitude")

    return {
        "missing_skills": _normalize(missing),
        "weak_skills": _normalize(weak_skills),
        "strengths": _normalize(strengths or student_skills[:5])
    }


def predict_readiness(payload: dict) -> dict:
    cgpa = payload.get("cgpa", 0)
    skills = payload.get("skills", [])
    projects = payload.get("projects", [])
    internships = payload.get("internships", [])
    certifications = payload.get("certifications", [])

    score = 0
    score += min(len(skills) * 5, 40)
    score += min(len(projects) * 10, 20)
    score += min(len(internships) * 10, 10)
    score += min(len(certifications) * 5, 10)
    score += min(cgpa * 2, 20)
    score = round(min(score, 100))

    category = "Low"
    if score >= 75:
        category = "High"
    elif score >= 50:
        category = "Medium"

    return {"score": score, "category": category}


def generate_roadmap(payload: dict) -> dict:
    missing_skills = payload.get("missing_skills", [])
    current_skills = payload.get("current_skills", [])
    focus_areas = _normalize((missing_skills or [])[:4] + ["DSA", "Aptitude"])
    items = []

    for week, theme in enumerate(ROADMAP_THEMES, start=1):
        target_skills = focus_areas[(week - 1):(week + 1)] or focus_areas[:2]
        tasks = [
            f"Practice 8 problems for {target_skills[0]}" if target_skills else "Practice 8 DSA problems",
            "Revise one core subject topic",
            "Update one resume/project talking point",
        ]
        if week == 2:
            tasks.append("Attempt one aptitude mock test")
        if week == 4:
            tasks.append("Complete one mock interview")

        items.append(
            {
                "week": week,
                "theme": theme,
                "tasks": tasks,
                "target_skills": target_skills,
            }
        )

    if current_skills:
        skill_counter = Counter(current_skills)
        strongest = [item[0] for item in skill_counter.most_common(3)]
    else:
        strongest = []

    return {"focus_areas": focus_areas, "items": items, "strength_summary": strongest}


def generate_interview_questions(payload: dict) -> dict:
    role = payload.get("job_role", "the role")
    company = payload.get("company_name", "the company")
    student_skills = payload.get("student_skills", [])
    missing_skills = payload.get("missing_skills", [])
    role_required_skills = payload.get("role_required_skills", [])
    question_count = max(1, min(15, int(payload.get("question_count", 3) or 3)))
    top_skills = student_skills[:2] or ["Problem Solving", "Communication"]
    top_missing = missing_skills[:2]

    questions = [
        {
            "prompt": f"Introduce yourself and explain why you are a fit for {role} at {company}.",
            "type": "HR",
            "expected_focus": ["communication", "motivation", "role fit"],
        },
        {
            "prompt": f"Describe a project where you used {top_skills[0]}. What challenges did you solve?",
            "type": "Technical",
            "expected_focus": [top_skills[0], "projects", "problem solving"],
        },
        {
            "prompt": f"How would you improve your performance in {role} over the first 90 days?",
            "type": "HR",
            "expected_focus": ["ownership", "learning", "planning"],
        },
        {
            "prompt": f"Pick one missing skill ({top_missing[0] if top_missing else role_required_skills[0] if role_required_skills else 'core skill'}) and describe how you will reach interview readiness.",
            "type": "Technical",
            "expected_focus": [top_missing[0] if top_missing else "upskilling", "roadmap", "execution"],
        },
        {
            "prompt": f"Which project best proves your {top_skills[1] if len(top_skills) > 1 else top_skills[0]} for {role} and what measurable impact did it have?",
            "type": "Technical",
            "expected_focus": [top_skills[1] if len(top_skills) > 1 else top_skills[0], "impact", "ownership"],
        },
    ]
    return {"questions": questions[:question_count]}


def evaluate_interview_answer(payload: dict) -> dict:
    answer = payload.get("answer", "").strip()
    expected_focus = payload.get("expected_focus", [])
    words = re.findall(r"\w+", answer.lower())
    word_count = len(words)

    focus_hits = 0
    for item in expected_focus:
        if item.lower() in answer.lower():
            focus_hits += 1

    base_score = 35
    if word_count >= 25:
        base_score += 20
    if word_count >= 50:
        base_score += 10
    base_score += min(focus_hits * 10, 30)
    score = min(base_score, 95)

    feedback_parts = []
    if word_count < 25:
        feedback_parts.append("Your answer is too short and needs more detail.")
    else:
        feedback_parts.append("Your answer has a useful structure.")

    if focus_hits == 0:
        feedback_parts.append("Connect the answer more clearly to the expected role focus.")
    else:
        feedback_parts.append("You referenced some role-relevant points.")

    tips = [
        "Use the STAR structure for examples.",
        "Mention outcomes or measurable impact.",
        "Relate the answer back to the job role.",
    ]

    return {
        "score": score,
        "feedback": " ".join(feedback_parts),
        "improvement_tips": tips,
    }
