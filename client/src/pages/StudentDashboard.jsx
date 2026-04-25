import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../services/api";

const defaultProfile = {
  branch: "Computer",
  graduationYear: 2026,
  cgpa: 8.1,
  phone: "",
  skills: ["Java", "SQL", "React"],
  projects: ["Placement Portal", "Inventory Dashboard"],
  internships: ["Web Development Intern"],
  certifications: ["SQL Basics"]
};

const COLORS = ["#ff8a5b", "#ffc15e", "#4e6cff"];

const splitTextarea = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export const StudentDashboard = () => {
  const [profile, setProfile] = useState(defaultProfile);
  const [readiness, setReadiness] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [interviewSession, setInterviewSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [profileRes, readinessRes, roadmapRes, recommendationsRes] = await Promise.all([
        api.get("/student/profile"),
        api.get("/student/readiness"),
        api.get("/student/roadmap"),
        api.get("/student/recommendations")
      ]);
      if (profileRes.data) {
        setProfile({
          ...defaultProfile,
          ...profileRes.data,
          skills: profileRes.data.skills || [],
          projects: profileRes.data.projects || [],
          internships: profileRes.data.internships || [],
          certifications: profileRes.data.certifications || []
        });
      }
      setReadiness(readinessRes.data);
      setRoadmap(roadmapRes.data);
      setRecommendations(recommendationsRes.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load student data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = {
        branch: profile.branch,
        graduationYear: Number(profile.graduationYear),
        cgpa: Number(profile.cgpa),
        phone: profile.phone,
        skills: splitTextarea(profile.skillsText ?? profile.skills.join("\n")),
        projects: splitTextarea(profile.projectsText ?? profile.projects.join("\n")),
        internships: splitTextarea(profile.internshipsText ?? profile.internships.join("\n")),
        certifications: splitTextarea(profile.certificationsText ?? profile.certifications.join("\n"))
      };
      const { data } = await api.put("/student/profile", payload);
      setProfile({
        ...data,
        skillsText: data.skills.join("\n"),
        projectsText: data.projects.join("\n"),
        internshipsText: data.internships.join("\n"),
        certificationsText: data.certifications.join("\n")
      });
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update profile.");
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const { data } = await api.post("/student/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage(data.message);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Resume upload failed.");
    }
  };

  const handleAnalyze = async () => {
    setMessage("");
    setError("");
    try {
      const { data } = await api.post("/student/analyze");
      setReadiness(data.report);
      setRoadmap({ items: data.roadmap.items, focusAreas: data.roadmap.focus_areas });
      setRecommendations(data.matches || []);
      setMessage("Analysis completed successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Analysis failed.");
    }
  };

  const handleGenerateInterview = async () => {
    if (!recommendations.length) {
      setError("Run analysis first to generate recommended roles.");
      return;
    }

    try {
      const top = recommendations[0];
      const { data } = await api.post("/student/interview/generate", {
        companyId: top.companyId,
        jobRoleId: top.roleId
      });
      setInterviewSession(data);
      setAnswers(new Array(data.questions.length).fill(""));
      setMessage("Interview questions generated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate interview.");
    }
  };

  const handleEvaluateInterview = async () => {
    try {
      const { data } = await api.post("/student/interview/evaluate", {
        sessionId: interviewSession._id,
        answers
      });
      setInterviewSession(data);
      setMessage("Interview answers evaluated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Interview evaluation failed.");
    }
  };

  const readinessData = useMemo(
    () => [
      { name: "Readiness", value: readiness?.score || 0 },
      { name: "Gap", value: Math.max(0, 100 - (readiness?.score || 0)) }
    ],
    [readiness]
  );

  const topMatches = recommendations.slice(0, 5).map((item) => ({
    name: `${item.companyName} - ${item.roleTitle}`,
    value: item.matchPercentage
  }));

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Student Workspace</p>
          <h1>Track readiness, close gaps, and prepare smarter.</h1>
        </div>
        <div className="dashboard-actions">
          <label className="upload-button">
            Upload Resume
            <input type="file" hidden onChange={handleResumeUpload} />
          </label>
          <button type="button" className="primary-button" onClick={handleAnalyze}>
            Run AI Analysis
          </button>
        </div>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="grid-two">
        <form className="panel" onSubmit={handleProfileSave}>
          <h3>Profile Builder</h3>
          <div className="form-grid">
            <label>
              Branch
              <input
                value={profile.branch || ""}
                onChange={(event) => setProfile({ ...profile, branch: event.target.value })}
              />
            </label>
            <label>
              Graduation Year
              <input
                type="number"
                value={profile.graduationYear || ""}
                onChange={(event) => setProfile({ ...profile, graduationYear: event.target.value })}
              />
            </label>
            <label>
              CGPA
              <input
                type="number"
                step="0.1"
                value={profile.cgpa || ""}
                onChange={(event) => setProfile({ ...profile, cgpa: event.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                value={profile.phone || ""}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              />
            </label>
          </div>
          <label>
            Skills
            <textarea
              rows="4"
              value={profile.skillsText ?? (profile.skills || []).join("\n")}
              onChange={(event) => setProfile({ ...profile, skillsText: event.target.value })}
            />
          </label>
          <label>
            Projects
            <textarea
              rows="3"
              value={profile.projectsText ?? (profile.projects || []).join("\n")}
              onChange={(event) => setProfile({ ...profile, projectsText: event.target.value })}
            />
          </label>
          <label>
            Internships
            <textarea
              rows="2"
              value={profile.internshipsText ?? (profile.internships || []).join("\n")}
              onChange={(event) => setProfile({ ...profile, internshipsText: event.target.value })}
            />
          </label>
          <label>
            Certifications
            <textarea
              rows="2"
              value={profile.certificationsText ?? (profile.certifications || []).join("\n")}
              onChange={(event) => setProfile({ ...profile, certificationsText: event.target.value })}
            />
          </label>
          <button type="submit" className="primary-button">
            Save Profile
          </button>
        </form>

        <div className="panel">
          <h3>Readiness Overview</h3>
          <div className="metric-row">
            <div className="metric-card">
              <span>Score</span>
              <strong>{readiness?.score ?? "--"}%</strong>
            </div>
            <div className="metric-card">
              <span>Category</span>
              <strong>{readiness?.category ?? "--"}</strong>
            </div>
            <div className="metric-card">
              <span>Top Missing Skills</span>
              <strong>{readiness?.missingSkills?.slice(0, 2).join(", ") || "--"}</strong>
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={readinessData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80}>
                  {readinessData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="tag-wrap">
            {(readiness?.strengths || []).map((item) => (
              <span key={item} className="tag positive">
                {item}
              </span>
            ))}
            {(readiness?.weaknesses || []).map((item) => (
              <span key={item} className="tag warning">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <h3>Company Match Engine</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topMatches}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4e6cff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="match-list">
            {recommendations.slice(0, 5).map((item) => (
              <article key={`${item.companyId}-${item.roleId}`} className="match-card">
                <div>
                  <h4>{item.companyName}</h4>
                  <p>{item.roleTitle}</p>
                </div>
                <div>
                  <strong>{item.matchPercentage}% match</strong>
                  <p>{item.isEligible ? "Eligible" : "Needs profile improvement"}</p>
                </div>
                <p>Missing: {item.missingSkills.join(", ") || "No major gaps"}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Weekly Roadmap</h3>
          <div className="tag-wrap">
            {(roadmap?.focusAreas || []).map((focus) => (
              <span key={focus} className="tag">
                {focus}
              </span>
            ))}
          </div>
          <div className="roadmap-list">
            {(roadmap?.items || []).map((item) => (
              <article key={item.week} className="roadmap-card">
                <h4>
                  Week {item.week}: {item.theme}
                </h4>
                <p>{item.targetSkills?.join(", ")}</p>
                <ul>
                  {(item.tasks || []).map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-row">
          <div>
            <h3>Mock Interview Lab</h3>
            <p>Generate role-specific questions from your best-matched company profile.</p>
          </div>
          <button type="button" className="primary-button" onClick={handleGenerateInterview}>
            Generate Questions
          </button>
        </div>

        {interviewSession ? (
          <div className="interview-grid">
            {interviewSession.questions.map((question, index) => (
              <div key={question.prompt} className="interview-card">
                <h4>
                  Q{index + 1}. {question.prompt}
                </h4>
                <textarea
                  rows="4"
                  value={answers[index] ?? question.answer ?? ""}
                  onChange={(event) => {
                    const next = [...answers];
                    next[index] = event.target.value;
                    setAnswers(next);
                  }}
                />
                {question.feedback ? <p className="feedback">{question.feedback}</p> : null}
                {question.score ? <p className="score-text">Score: {question.score}</p> : null}
              </div>
            ))}
            <button type="button" className="primary-button" onClick={handleEvaluateInterview}>
              Evaluate Answers
            </button>
            {interviewSession.overallScore ? (
              <div className="metric-row">
                <div className="metric-card">
                  <span>Overall Score</span>
                  <strong>{interviewSession.overallScore}</strong>
                </div>
                <div className="metric-card wide">
                  <span>Tips</span>
                  <strong>{interviewSession.improvementTips.join(", ")}</strong>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
};

