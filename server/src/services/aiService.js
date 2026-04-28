import axios from "axios";

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
  timeout: 15000
});

const fallbackScore = (profile) => {
  const skillScore = Math.min((profile.skills?.length || 0) * 6, 45);
  const projectScore = Math.min((profile.projects?.length || 0) * 8, 20);
  const internshipScore = Math.min((profile.internships?.length || 0) * 10, 10);
  const certificationScore = Math.min((profile.certifications?.length || 0) * 5, 10);
  const cgpaScore = Math.min((profile.cgpa || 0) * 1.5, 15);
  const total = Math.round(skillScore + projectScore + internshipScore + certificationScore + cgpaScore);

  return {
    score: total,
    category: total >= 75 ? "High" : total >= 50 ? "Medium" : "Low"
  };
};

export const parseResume = async ({ text, fileName }) => {
  try {
    const { data } = await aiClient.post("/parse-resume", { text, file_name: fileName });
    return data;
  } catch {
    return {
      extracted_skills: [],
      education: [],
      projects: [],
      summary: "AI service unavailable. Resume uploaded successfully."
    };
  }
};

export const analyzeSkillGap = async (payload) => {
  try {
    const { data } = await aiClient.post("/analyze-skill-gap", payload);
    return data;
  } catch {
    return {
      missing_skills: payload.required_skills?.filter((skill) => !payload.student_skills?.includes(skill)) || [],
      weak_skills: [],
      strengths: payload.student_skills?.slice(0, 5) || []
    };
  }
};

export const predictReadiness = async (payload) => {
  try {
    const { data } = await aiClient.post("/predict-readiness", payload);
    return data;
  } catch {
    return fallbackScore(payload);
  }
};

export const generateRoadmap = async (payload) => {
  try {
    const { data } = await aiClient.post("/generate-roadmap", payload);
    return data;
  } catch {
    return {
      focus_areas: payload.missing_skills?.slice(0, 4) || ["DSA", "Aptitude"],
      items: [
        {
          week: 1,
          theme: "Foundation Sprint",
          tasks: ["Solve 10 DSA problems", "Revise DBMS and OOPs"],
          target_skills: payload.missing_skills?.slice(0, 2) || ["Communication", "Problem Solving"]
        },
        {
          week: 2,
          theme: "Project Strengthening",
          tasks: ["Polish resume projects", "Practice aptitude sets"],
          target_skills: payload.missing_skills?.slice(2, 4) || ["SQL", "Aptitude"]
        }
      ]
    };
  }
};

export const generateInterviewQuestions = async (payload) => {
  try {
    const { data } = await aiClient.post("/generate-interview-questions", payload);
    return data;
  } catch {
    const requestedCount = Math.max(1, Number(payload.question_count) || 3);
    const missingSkills = payload.missing_skills || [];
    const roleSkills = payload.role_required_skills || [];
    return {
      questions: [
        {
          prompt: `Explain how your skills fit the ${payload.job_role} role.`,
          type: "HR",
          expected_focus: ["communication", "role fit"]
        },
        {
          prompt: "What is your approach to solving a data structure problem under time pressure?",
          type: "Technical",
          expected_focus: ["DSA", "problem solving"]
        },
        {
          prompt: `Which ${missingSkills[0] || roleSkills[0] || "core"} skill are you improving right now, and what is your plan?`,
          type: "Technical",
          expected_focus: [missingSkills[0] || roleSkills[0] || "learning", "improvement plan"]
        }
      ].slice(0, requestedCount)
    };
  }
};

export const evaluateInterviewAnswer = async (payload) => {
  try {
    const { data } = await aiClient.post("/evaluate-interview-answer", payload);
    return data;
  } catch {
    return {
      score: Math.min(90, Math.max(45, payload.answer.length / 4)),
      feedback: "Good start. Add more structure, concrete examples, and role-specific terminology.",
      improvement_tips: ["Use STAR format", "Mention measurable outcomes", "Connect answer to the role"]
    };
  }
};

