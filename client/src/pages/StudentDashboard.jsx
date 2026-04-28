import { Link } from "react-router-dom";
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
  const [showCompanyMatches, setShowCompanyMatches] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [roadmapDurationValue, setRoadmapDurationValue] = useState(1);
  const [roadmapDurationUnit, setRoadmapDurationUnit] = useState("month");
  const [selectedRecommendationKey, setSelectedRecommendationKey] = useState("");
  const [isAnalyzingSelectedCompany, setIsAnalyzingSelectedCompany] = useState(false);
  const [questionCount, setQuestionCount] = useState(3);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

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
      const nextRecommendations = recommendationsRes.data || [];
      setRecommendations(nextRecommendations);
      if (readinessRes.data?.selectedCompany?.companyId && readinessRes.data?.selectedCompany?.roleId) {
        setSelectedRecommendationKey(`${readinessRes.data.selectedCompany.companyId}-${readinessRes.data.selectedCompany.roleId}`);
      } else if (nextRecommendations[0]) {
        setSelectedRecommendationKey(`${nextRecommendations[0].companyId}-${nextRecommendations[0].roleId}`);
      }
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
      if (data.report?.selectedCompany?.companyId && data.report?.selectedCompany?.roleId) {
        setSelectedRecommendationKey(`${data.report.selectedCompany.companyId}-${data.report.selectedCompany.roleId}`);
      } else if (data.matches?.[0]) {
        setSelectedRecommendationKey(`${data.matches[0].companyId}-${data.matches[0].roleId}`);
      }
      setShowRoadmap(false);
      setInterviewSession(null);
      setMessage("Analysis completed successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Analysis failed.");
    }
  };

  const handleGenerateInterview = async () => {
    const selectedRecommendation = recommendations.find(
      (item) => `${item.companyId}-${item.roleId}` === selectedRecommendationKey
    );
    if (!selectedRecommendation) {
      setError("Select a company role first.");
      return;
    }
    if (
      !readiness?.selectedCompany?.companyId ||
      `${readiness.selectedCompany.companyId}-${readiness.selectedCompany.roleId}` !== selectedRecommendationKey
    ) {
      setError("Analyze the selected company roadmap first, then generate interview questions.");
      return;
    }

    try {
      const { data } = await api.post("/student/interview/generate", {
        companyId: selectedRecommendation.companyId,
        jobRoleId: selectedRecommendation.roleId,
        questionCount
      });
      setInterviewSession(data);
      setAnswers(new Array(data.questions.length).fill(""));
      setMessage("Interview questions generated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate interview.");
    }
  };

  const handleAnalyzeSelectedCompany = async () => {
    const selectedRecommendation = recommendations.find(
      (item) => `${item.companyId}-${item.roleId}` === selectedRecommendationKey
    );
    if (!selectedRecommendation) {
      setError("Please select a company role to continue.");
      return;
    }
    setMessage("");
    setError("");
    setIsAnalyzingSelectedCompany(true);
    try {
      const { data } = await api.post("/student/company-analysis", {
        companyId: selectedRecommendation.companyId,
        jobRoleId: selectedRecommendation.roleId
      });
      setReadiness(data.report);
      setRoadmap(data.roadmap);
      setShowRoadmap(true);
      setInterviewSession(null);
      setMessage(`Roadmap and readiness generated for ${selectedRecommendation.companyName} - ${selectedRecommendation.roleTitle}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to analyze selected company.");
    } finally {
      setIsAnalyzingSelectedCompany(false);
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

  const handleGetAIInsights = async () => {
    setIsLoadingInsights(true);
    setError("");
    try {
      const { data } = await api.get("/student/ai-insights");
      setAiInsights(data);
      setMessage("AI insights generated successfully!");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to generate AI insights.");
    } finally {
      setIsLoadingInsights(false);
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
  const roadmapDurationDays =
    roadmapDurationUnit === "week" ? roadmapDurationValue * 7 : roadmapDurationUnit === "month" ? roadmapDurationValue * 30 : roadmapDurationValue;
  const isSelectedCompanyAnalyzed =
    Boolean(readiness?.selectedCompany?.companyId) &&
    `${readiness?.selectedCompany?.companyId}-${readiness?.selectedCompany?.roleId}` === selectedRecommendationKey;
  const hasInterviewSession = Boolean(interviewSession?._id);
  const filteredRoadmapItems = (roadmap?.items || []).filter((item, index) => {
    if (item?.week) {
      return Number(item.week) * 7 <= roadmapDurationDays;
    }
    return (index + 1) * 7 <= roadmapDurationDays;
  });

  return (
    <main className="dashboard-page">
      <section className="panel workflow-panel">
        <h3>Preparation Workflow</h3>
        <div className="workflow-steps">
          <article className={`workflow-step ${showCompanyMatches ? "active" : ""}`}>
            <span className="workflow-step-number">1</span>
            <div>
              <strong>Select Company</strong>
              <p>Open Company Match Engine and choose one company-role.</p>
            </div>
          </article>
          <article className={`workflow-step ${isSelectedCompanyAnalyzed ? "active" : ""}`}>
            <span className="workflow-step-number">2</span>
            <div>
              <strong>Analyze Company</strong>
              <p>Generate readiness and missing skills for selected company.</p>
            </div>
          </article>
          <article className={`workflow-step ${showRoadmap && isSelectedCompanyAnalyzed ? "active" : ""}`}>
            <span className="workflow-step-number">3</span>
            <div>
              <strong>View Roadmap</strong>
              <p>Open roadmap and follow the skill-gap timeline.</p>
            </div>
          </article>
          <article className={`workflow-step ${hasInterviewSession ? "active" : ""}`}>
            <span className="workflow-step-number">4</span>
            <div>
              <strong>Generate Interview</strong>
              <p>Set question count and generate interview practice.</p>
            </div>
          </article>
        </div>
      </section>

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
          <button 
            type="button" 
            className="secondary-button" 
            onClick={handleGetAIInsights}
            disabled={isLoadingInsights}
          >
            {isLoadingInsights ? "Generating..." : "Get AI Suggestion"}
          </button>
          <Link to="/student/growth-planner" className="ghost-button planner-nav-button">
            Student Growth Planner
          </Link>
        </div>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {aiInsights && (
        <section className="panel ai-insights-panel">
          <h3>🤖 AI Productivity Coach Insights</h3>
          <div className="ai-insights-content">
            <div className="insights-section">
              <h4>📊 Daily Insights</h4>
              <ul className="insights-list">
                {aiInsights.insights.map((insight, index) => (
                  <li key={index} className="insight-item">💡 {insight}</li>
                ))}
              </ul>
            </div>
            <div className="suggestions-section">
              <h4>🎯 Personalized Suggestions</h4>
              <ul className="suggestions-list">
                {aiInsights.suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">📝 {suggestion}</li>
                ))}
              </ul>
            </div>
            {aiInsights.lastAnalyzed && (
              <div className="insights-footer">
                <small>Last analyzed: {new Date(aiInsights.lastAnalyzed).toLocaleString()}</small>
              </div>
            )}
          </div>
        </section>
      )}

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
          <p className="readiness-context-text">
            {readiness?.selectedCompany?.companyName
              ? `Showing readiness for ${readiness.selectedCompany.companyName} - ${readiness.selectedCompany.roleTitle}`
              : "Select a company from Company Match Engine to get company-specific readiness."}
          </p>
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
          <div className="section-row">
            <h3>Company Match Engine</h3>
            <button type="button" className="ghost-button" onClick={() => setShowCompanyMatches((current) => !current)}>
              {showCompanyMatches ? "Hide Results" : "Show Results"}
            </button>
          </div>
          {showCompanyMatches ? (
            <>
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
              <div className="section-row">
                <button type="button" className="primary-button" onClick={handleAnalyzeSelectedCompany} disabled={isAnalyzingSelectedCompany}>
                  {isAnalyzingSelectedCompany ? "Analyzing..." : "Analyze Selected Company"}
                </button>
                <p className="inline-hint">Select company -> Analyze -> Roadmap -> Interview</p>
              </div>
              <div className="match-list">
                {recommendations.slice(0, 5).map((item) => (
                  <article key={`${item.companyId}-${item.roleId}`} className="match-card">
                    <div>
                      <label className="match-select-label">
                        <input
                          type="radio"
                          name="selected-company-role"
                          checked={`${item.companyId}-${item.roleId}` === selectedRecommendationKey}
                          onChange={() => setSelectedRecommendationKey(`${item.companyId}-${item.roleId}`)}
                        />
                        <span>Select</span>
                      </label>
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
            </>
          ) : null}
        </div>

        <div className="panel">
          <div className="section-row">
            <h3>Weekly Roadmap</h3>
            <button
              type="button"
              className="ghost-button"
              disabled={!isSelectedCompanyAnalyzed}
              onClick={() => setShowRoadmap((current) => !current)}
            >
              {showRoadmap ? "Hide Results" : "Show Results"}
            </button>
          </div>
          {!isSelectedCompanyAnalyzed ? <p className="inline-hint">Analyze a selected company in Company Match Engine to unlock roadmap.</p> : null}
          {showRoadmap ? (
            <>
              <div className="roadmap-filter">
                <span className="roadmap-filter-label">Roadmap Duration</span>
                <div className="roadmap-filter-controls">
                  <input
                    type="number"
                    min="1"
                    value={roadmapDurationValue}
                    onChange={(event) => setRoadmapDurationValue(Math.max(1, Number(event.target.value) || 1))}
                    aria-label="Roadmap duration number"
                  />
                  <select
                    value={roadmapDurationUnit}
                    onChange={(event) => setRoadmapDurationUnit(event.target.value)}
                    aria-label="Roadmap duration unit"
                  >
                    <option value="day">Days</option>
                    <option value="week">Weeks</option>
                    <option value="month">Months</option>
                  </select>
                </div>
              </div>
              <div className="tag-wrap">
                {(roadmap?.focusAreas || []).map((focus) => (
                  <span key={focus} className="tag">
                    {focus}
                  </span>
                ))}
              </div>
              <div className="roadmap-list roadmap-flow">
                {filteredRoadmapItems.map((item, index) => (
                  <article key={item.week || `${item.theme}-${index}`} className="roadmap-card roadmap-flow-item">
                    <div className="flow-step-badge">Step {index + 1}</div>
                    <h4>
                      {item.week ? `Week ${item.week}` : `Phase ${index + 1}`}: {item.theme}
                    </h4>
                    <p>{item.targetSkills?.join(", ")}</p>
                    <ul>
                      {(item.tasks || []).map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ul>
                  </article>
                ))}
                {!filteredRoadmapItems.length ? <p className="flow-empty-text">No roadmap items available for the selected duration.</p> : null}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="section-row">
          <div>
            <h3>Mock Interview Lab</h3>
            <p>Generate role-specific questions from your selected company and roadmap analysis.</p>
          </div>
          <div className="interview-controls">
            <label>
              Questions
              <input
                type="number"
                min="1"
                max="15"
                value={questionCount}
                onChange={(event) => setQuestionCount(Math.min(15, Math.max(1, Number(event.target.value) || 1)))}
              />
            </label>
            <button type="button" className="primary-button" disabled={!isSelectedCompanyAnalyzed} onClick={handleGenerateInterview}>
              Generate Questions
            </button>
          </div>
        </div>
        {!isSelectedCompanyAnalyzed ? <p className="inline-hint">Complete selected company analysis before generating interview questions.</p> : null}

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

