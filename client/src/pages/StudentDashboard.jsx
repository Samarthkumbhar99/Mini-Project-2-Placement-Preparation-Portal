import { Link } from "react-router-dom";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
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

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "Not available";

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Not available";

const getProfileCompleteness = (profile) => {
  const checks = [
    Boolean(profile.branch),
    Boolean(profile.graduationYear),
    Number(profile.cgpa) > 0,
    Boolean(profile.phone),
    Boolean(profile.skills?.length),
    Boolean(profile.projects?.length),
    Boolean(profile.internships?.length),
    Boolean(profile.certifications?.length),
    Boolean(profile.resume?.uploadedAt)
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getReadinessNarrative = (readiness) => {
  if (!readiness) {
    return "Run analysis to generate your placement readiness baseline and company-fit recommendations.";
  }

  if (readiness.category === "High") {
    return "You are in a strong zone. Focus on mock interviews, revision cadence, and sharper company targeting.";
  }

  if (readiness.category === "Medium") {
    return "You have a good base. Closing the top missing skills should materially improve your company-fit score.";
  }

  return "Your dashboard is pointing to foundational gaps. Prioritize profile completion, roadmap execution, and core skills.";
};

export const StudentDashboard = () => {
  const [profile, setProfile] = useState(defaultProfile);
  const [readiness, setReadiness] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [interviewSession, setInterviewSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showCompanyMatches, setShowCompanyMatches] = useState(true);
  const [showRoadmap, setShowRoadmap] = useState(true);
  const [roadmapDurationValue, setRoadmapDurationValue] = useState(1);
  const [roadmapDurationUnit, setRoadmapDurationUnit] = useState("month");
  const [selectedRecommendationKey, setSelectedRecommendationKey] = useState("");
  const [isAnalyzingSelectedCompany, setIsAnalyzingSelectedCompany] = useState(false);
  const [questionCount, setQuestionCount] = useState(3);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [matchSearch, setMatchSearch] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);

  const deferredMatchSearch = useDeferredValue(matchSearch);

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
          certifications: profileRes.data.certifications || [],
          skillsText: (profileRes.data.skills || []).join("\n"),
          projectsText: (profileRes.data.projects || []).join("\n"),
          internshipsText: (profileRes.data.internships || []).join("\n"),
          certificationsText: (profileRes.data.certifications || []).join("\n")
        });
      }

      setReadiness(readinessRes.data);
      setRoadmap(roadmapRes.data);
      const nextRecommendations = recommendationsRes.data || [];
      setRecommendations(nextRecommendations);

      if (readinessRes.data?.selectedCompany?.companyId && readinessRes.data?.selectedCompany?.roleId) {
        setSelectedRecommendationKey(
          `${readinessRes.data.selectedCompany.companyId}-${readinessRes.data.selectedCompany.roleId}`
        );
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
        skills: data.skills || [],
        projects: data.projects || [],
        internships: data.internships || [],
        certifications: data.certifications || [],
        skillsText: (data.skills || []).join("\n"),
        projectsText: (data.projects || []).join("\n"),
        internshipsText: (data.internships || []).join("\n"),
        certificationsText: (data.certifications || []).join("\n")
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
        setSelectedRecommendationKey(
          `${data.report.selectedCompany.companyId}-${data.report.selectedCompany.roleId}`
        );
      } else if (data.matches?.[0]) {
        setSelectedRecommendationKey(`${data.matches[0].companyId}-${data.matches[0].roleId}`);
      }

      setShowCompanyMatches(true);
      setShowRoadmap(true);
      setInterviewSession(null);
      setAiInsights(null);
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
      `${readiness.selectedCompany.companyId}-${readiness.selectedCompany.roleId}` !==
        selectedRecommendationKey
    ) {
      setError("Analyze the selected company roadmap first, then generate interview questions.");
      return;
    }

    setError("");
    setMessage("");

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
      setMessage(
        `Roadmap and readiness generated for ${selectedRecommendation.companyName} - ${selectedRecommendation.roleTitle}.`
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to analyze selected company.");
    } finally {
      setIsAnalyzingSelectedCompany(false);
    }
  };

  const handleEvaluateInterview = async () => {
    setMessage("");
    setError("");

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
    setMessage("");

    try {
      const { data } = await api.get("/student/ai-insights");
      setAiInsights(data);
      setMessage("AI insights generated successfully.");
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

  const profileCompleteness = useMemo(() => getProfileCompleteness(profile), [profile]);
  const skillsCount = profile.skills?.length || 0;
  const projectsCount = profile.projects?.length || 0;
  const certificationsCount = profile.certifications?.length || 0;
  const topMatch = recommendations[0] || null;
  const selectedRecommendation = recommendations.find(
    (item) => `${item.companyId}-${item.roleId}` === selectedRecommendationKey
  );
  const deferredMatchSearchValue = deferredMatchSearch.trim().toLowerCase();

  const filteredRecommendations = useMemo(
    () =>
      recommendations.filter((item) => {
        const passesEligibility = eligibleOnly ? item.isEligible : true;
        const haystack = `${item.companyName} ${item.roleTitle} ${item.missingSkills.join(" ")}`.toLowerCase();
        const passesSearch = deferredMatchSearchValue ? haystack.includes(deferredMatchSearchValue) : true;
        return passesEligibility && passesSearch;
      }),
    [deferredMatchSearchValue, eligibleOnly, recommendations]
  );

  const topMatches = filteredRecommendations.slice(0, 5).map((item) => ({
    name: `${item.companyName} ${item.roleTitle}`,
    value: item.matchPercentage
  }));

  const roadmapDurationDays =
    roadmapDurationUnit === "week"
      ? roadmapDurationValue * 7
      : roadmapDurationUnit === "month"
        ? roadmapDurationValue * 30
        : roadmapDurationValue;

  const isSelectedCompanyAnalyzed =
    Boolean(readiness?.selectedCompany?.companyId) &&
    `${readiness?.selectedCompany?.companyId}-${readiness?.selectedCompany?.roleId}` ===
      selectedRecommendationKey;

  const hasInterviewSession = Boolean(interviewSession?._id);

  const filteredRoadmapItems = (roadmap?.items || []).filter((item, index) => {
    if (item?.week) {
      return Number(item.week) * 7 <= roadmapDurationDays;
    }
    return (index + 1) * 7 <= roadmapDurationDays;
  });

  const roadmapTaskCount = filteredRoadmapItems.reduce(
    (total, item) => total + (item.tasks?.length || 0),
    0
  );

  const interviewAverage = interviewSession?.overallScore ?? null;

  const actionQueue = useMemo(() => {
    const actions = [];

    if (!profile.resume?.uploadedAt) {
      actions.push({
        title: "Upload your latest resume",
        detail: "Resume parsing enriches your skills and gives the analysis engine better raw input."
      });
    }

    if (profileCompleteness < 80) {
      actions.push({
        title: "Complete your profile data",
        detail: `Your profile is ${profileCompleteness}% complete. Add missing academic, project, and proof points.`
      });
    }

    if (!readiness) {
      actions.push({
        title: "Run baseline AI analysis",
        detail: "Generate your readiness score, company matches, and first roadmap."
      });
    }

    if (readiness?.missingSkills?.[0]) {
      actions.push({
        title: `Prioritize ${readiness.missingSkills[0]}`,
        detail: "Your highest-impact missing skill should move to this week's study plan."
      });
    }

    if (selectedRecommendation && !isSelectedCompanyAnalyzed) {
      actions.push({
        title: `Analyze ${selectedRecommendation.companyName} - ${selectedRecommendation.roleTitle}`,
        detail: "Convert the current match into a company-specific roadmap and readiness snapshot."
      });
    }

    if (isSelectedCompanyAnalyzed && !hasInterviewSession) {
      actions.push({
        title: "Generate a mock interview set",
        detail: "Pressure-test your selected role with company-focused questions and targeted feedback."
      });
    }

    return actions.slice(0, 4);
  }, [
    hasInterviewSession,
    isSelectedCompanyAnalyzed,
    profile.resume?.uploadedAt,
    profileCompleteness,
    readiness,
    selectedRecommendation
  ]);

  return (
    <main className="dashboard-page student-dashboard">
      <section className="panel dashboard-hero-card">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Student Command Center</p>
          <h1>{profile.user?.name ? `${profile.user.name}, build a placement plan you can actually execute.` : "Build a placement plan you can actually execute."}</h1>
          <p className="dashboard-hero-text">
            This workspace combines profile quality, opportunity targeting, company-specific readiness,
            roadmap execution, and interview practice in one place.
          </p>
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
              {isLoadingInsights ? "Generating..." : "Generate AI Insights"}
            </button>
            <Link to="/student/growth-planner" className="ghost-button planner-nav-button">
              Open Growth Planner
            </Link>
          </div>
        </div>

        <aside className="dashboard-hero-aside">
          <div className="hero-status-card">
            <span className="hero-status-label">Current Target</span>
            <strong>
              {selectedRecommendation
                ? `${selectedRecommendation.companyName} - ${selectedRecommendation.roleTitle}`
                : topMatch
                  ? `${topMatch.companyName} - ${topMatch.roleTitle}`
                  : "No company selected"}
            </strong>
            <p>
              {selectedRecommendation
                ? `${selectedRecommendation.matchPercentage}% role fit with ${selectedRecommendation.missingSkills.length} skill gaps.`
                : "Select a company-role match to move into roadmap and interview mode."}
            </p>
          </div>
          <div className="hero-status-card accent-card">
            <span className="hero-status-label">Resume Intelligence</span>
            <strong>{profile.resume?.fileName || "Resume not uploaded"}</strong>
            <p>
              {profile.resume?.uploadedAt
                ? `Last processed on ${formatDateTime(profile.resume.uploadedAt)}`
                : "Upload a resume to enrich skills, projects, and extracted evidence."}
            </p>
          </div>
        </aside>
      </section>

      <section className="panel workflow-panel">
        <h3>Preparation Workflow</h3>
        <div className="workflow-steps">
          <article className={`workflow-step ${showCompanyMatches ? "active" : ""}`}>
            <span className="workflow-step-number">1</span>
            <div>
              <strong>Target Opportunity</strong>
              <p>Search, compare, and select the company-role that should drive your preparation.</p>
            </div>
          </article>
          <article className={`workflow-step ${isSelectedCompanyAnalyzed ? "active" : ""}`}>
            <span className="workflow-step-number">2</span>
            <div>
              <strong>Analyze Readiness</strong>
              <p>Generate company-specific readiness, strengths, and missing skills.</p>
            </div>
          </article>
          <article className={`workflow-step ${showRoadmap && isSelectedCompanyAnalyzed ? "active" : ""}`}>
            <span className="workflow-step-number">3</span>
            <div>
              <strong>Execute Roadmap</strong>
              <p>Use the weekly roadmap to structure your next learning window.</p>
            </div>
          </article>
          <article className={`workflow-step ${hasInterviewSession ? "active" : ""}`}>
            <span className="workflow-step-number">4</span>
            <div>
              <strong>Practice Interview</strong>
              <p>Generate role-specific questions and use evaluation feedback to improve fast.</p>
            </div>
          </article>
        </div>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="dashboard-stat-grid">
        <article className="metric-card dashboard-stat-card">
          <span>Profile Completeness</span>
          <strong>{profileCompleteness}%</strong>
          <p>{profileCompleteness >= 80 ? "Strong profile signal" : "Add more details to improve recommendations"}</p>
        </article>
        <article className="metric-card dashboard-stat-card">
          <span>Readiness Score</span>
          <strong>{readiness?.score ?? "--"}%</strong>
          <p>{readiness?.category ? `${readiness.category} readiness band` : "Waiting for first analysis"}</p>
        </article>
        <article className="metric-card dashboard-stat-card">
          <span>Best Match</span>
          <strong>{topMatch ? `${topMatch.matchPercentage}%` : "--"}</strong>
          <p>{topMatch ? `${topMatch.companyName} - ${topMatch.roleTitle}` : "No recommendations yet"}</p>
        </article>
        <article className="metric-card dashboard-stat-card">
          <span>Interview Score</span>
          <strong>{interviewAverage ?? "--"}</strong>
          <p>{interviewAverage ? "Latest evaluated session" : "Generate a mock interview to benchmark"}</p>
        </article>
      </section>

      <section className="grid-two">
        <div className="panel">
          <div className="section-row">
            <div>
              <h3>Priority Action Queue</h3>
              <p className="inline-hint">A short list of the next moves with the highest placement impact.</p>
            </div>
            <button type="button" className="ghost-button" onClick={() => setShowCompanyMatches((current) => !current)}>
              {showCompanyMatches ? "Collapse Radar" : "Open Radar"}
            </button>
          </div>

          <div className="action-list">
            {actionQueue.length ? (
              actionQueue.map((action) => (
                <article key={action.title} className="action-card">
                  <div className="action-indicator" />
                  <div>
                    <h4>{action.title}</h4>
                    <p>{action.detail}</p>
                  </div>
                </article>
              ))
            ) : (
              <article className="action-card">
                <div className="action-indicator success" />
                <div>
                  <h4>You are caught up for the current cycle</h4>
                  <p>Continue with roadmap execution, practice interviews, and growth planner consistency.</p>
                </div>
              </article>
            )}
          </div>

          <div className="mini-kpi-grid">
            <div className="mini-kpi-card">
              <span>Skills</span>
              <strong>{skillsCount}</strong>
            </div>
            <div className="mini-kpi-card">
              <span>Projects</span>
              <strong>{projectsCount}</strong>
            </div>
            <div className="mini-kpi-card">
              <span>Certifications</span>
              <strong>{certificationsCount}</strong>
            </div>
            <div className="mini-kpi-card">
              <span>Resume Skills</span>
              <strong>{profile.resume?.extractedSkills?.length || 0}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Readiness Command Center</h3>
          <p className="readiness-context-text">
            {readiness?.selectedCompany?.companyName
              ? `Showing readiness for ${readiness.selectedCompany.companyName} - ${readiness.selectedCompany.roleTitle}`
              : "Your readiness story will become more useful after a company-specific analysis."}
          </p>
          <p className="dashboard-note">{getReadinessNarrative(readiness)}</p>
          <div className="metric-row compact-metric-row">
            <div className="metric-card">
              <span>Category</span>
              <strong>{readiness?.category ?? "--"}</strong>
            </div>
            <div className="metric-card">
              <span>Top Gap</span>
              <strong>{readiness?.missingSkills?.[0] || "--"}</strong>
            </div>
            <div className="metric-card">
              <span>Last Generated</span>
              <strong>{readiness?.generatedAt ? formatDate(readiness.generatedAt) : "--"}</strong>
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={readinessData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82}>
                  {readinessData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="insight-columns">
            <div>
              <h4>Strength Signals</h4>
              <div className="tag-wrap">
                {(readiness?.strengths || []).length ? (
                  readiness.strengths.map((item) => (
                    <span key={item} className="tag positive">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="tag">No strengths available yet</span>
                )}
              </div>
            </div>
            <div>
              <h4>Missing Skills</h4>
              <div className="tag-wrap">
                {(readiness?.missingSkills || []).length ? (
                  readiness.missingSkills.map((item) => (
                    <span key={item} className="tag warning">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="tag positive">No critical gaps detected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-two">
        <form className="panel" onSubmit={handleProfileSave}>
          <div className="section-row">
            <div>
              <h3>Profile Studio</h3>
              <p className="inline-hint">A stronger profile produces better targeting, cleaner roadmaps, and better-fit interview prompts.</p>
            </div>
            <span className="tag">{profileCompleteness}% complete</span>
          </div>

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

          <div className="section-row">
            <span className="dashboard-note">
              Resume status: {profile.resume?.uploadedAt ? `processed on ${formatDate(profile.resume.uploadedAt)}` : "not uploaded yet"}
            </span>
            <button type="submit" className="primary-button">
              Save Profile
            </button>
          </div>
        </form>

        <div className="panel">
          <div className="section-row">
            <div>
              <h3>Opportunity Radar</h3>
              <p className="inline-hint">Filter role matches, compare fit, then promote one role into analysis mode.</p>
            </div>
            <button type="button" className="ghost-button" onClick={() => setShowCompanyMatches((current) => !current)}>
              {showCompanyMatches ? "Hide Matches" : "Show Matches"}
            </button>
          </div>

          <div className="dashboard-filter-row">
            <label className="filter-control">
              Search company or role
              <input
                placeholder="Search opportunities"
                value={matchSearch}
                onChange={(event) => setMatchSearch(event.target.value)}
              />
            </label>
            <label className="filter-toggle">
              <input
                type="checkbox"
                checked={eligibleOnly}
                onChange={(event) => setEligibleOnly(event.target.checked)}
              />
              <span>Eligible only</span>
            </label>
          </div>

          {showCompanyMatches ? (
            <>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={250}>
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
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleAnalyzeSelectedCompany}
                  disabled={isAnalyzingSelectedCompany || !selectedRecommendation}
                >
                  {isAnalyzingSelectedCompany ? "Analyzing..." : "Analyze Selected Company"}
                </button>
                <p className="inline-hint">
                  {selectedRecommendation
                    ? `${selectedRecommendation.companyName} - ${selectedRecommendation.roleTitle} selected`
                    : "Select a company-role to continue"}
                </p>
              </div>

              <div className="match-list">
                {filteredRecommendations.length ? (
                  filteredRecommendations.slice(0, 6).map((item) => {
                    const itemKey = `${item.companyId}-${item.roleId}`;
                    const isSelected = itemKey === selectedRecommendationKey;
                    return (
                      <article
                        key={itemKey}
                        className={`match-card opportunity-card ${isSelected ? "selected" : ""}`}
                      >
                        <div>
                          <label className="match-select-label">
                            <input
                              type="radio"
                              name="selected-company-role"
                              checked={isSelected}
                              onChange={() => setSelectedRecommendationKey(itemKey)}
                            />
                            <span>{isSelected ? "Selected target" : "Set as target"}</span>
                          </label>
                          <h4>{item.companyName}</h4>
                          <p>{item.roleTitle}</p>
                          <div className="tag-wrap">
                            <span className={`tag ${item.isEligible ? "positive" : "warning"}`}>
                              {item.isEligible ? "Eligible" : "Needs improvement"}
                            </span>
                            <span className="tag">{item.matchedSkills?.length || 0} matched skills</span>
                            <span className="tag">{item.missingSkills?.length || 0} gaps</span>
                          </div>
                        </div>
                        <div className="opportunity-stats">
                          <strong>{item.matchPercentage}% match</strong>
                          <p>Missing: {item.missingSkills.join(", ") || "No major gaps"}</p>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="inline-hint">No opportunities matched the current filters.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <div className="section-row">
            <div>
              <h3>Roadmap Navigator</h3>
              <p className="inline-hint">Limit the planning horizon so your next steps stay realistic and visible.</p>
            </div>
            <button
              type="button"
              className="ghost-button"
              disabled={!isSelectedCompanyAnalyzed}
              onClick={() => setShowRoadmap((current) => !current)}
            >
              {showRoadmap ? "Hide Roadmap" : "Show Roadmap"}
            </button>
          </div>

          {!isSelectedCompanyAnalyzed ? (
            <p className="inline-hint">Analyze a selected company in Opportunity Radar to unlock roadmap planning.</p>
          ) : null}

          {showRoadmap ? (
            <>
              <div className="roadmap-filter">
                <span className="roadmap-filter-label">Roadmap Duration</span>
                <div className="roadmap-filter-controls">
                  <input
                    type="number"
                    min="1"
                    value={roadmapDurationValue}
                    onChange={(event) =>
                      setRoadmapDurationValue(Math.max(1, Number(event.target.value) || 1))
                    }
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

              <div className="mini-kpi-grid">
                <div className="mini-kpi-card">
                  <span>Focus Areas</span>
                  <strong>{roadmap?.focusAreas?.length || 0}</strong>
                </div>
                <div className="mini-kpi-card">
                  <span>Visible Steps</span>
                  <strong>{filteredRoadmapItems.length}</strong>
                </div>
                <div className="mini-kpi-card">
                  <span>Tasks</span>
                  <strong>{roadmapTaskCount}</strong>
                </div>
                <div className="mini-kpi-card">
                  <span>Company</span>
                  <strong>{roadmap?.selectedCompany?.companyName || "--"}</strong>
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
                {filteredRoadmapItems.length ? (
                  filteredRoadmapItems.map((item, index) => (
                    <article
                      key={item.week || `${item.theme}-${index}`}
                      className="roadmap-card roadmap-flow-item"
                    >
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
                  ))
                ) : (
                  <p className="flow-empty-text">No roadmap items are available inside the selected time window.</p>
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="panel">
          <div className="section-row">
            <div>
              <h3>AI Insight Briefing</h3>
              <p className="inline-hint">Use the AI layer for productivity suggestions, personalized nudges, and planning context.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleGetAIInsights}
              disabled={isLoadingInsights}
            >
              {isLoadingInsights ? "Generating..." : "Refresh Insights"}
            </button>
          </div>

          {aiInsights ? (
            <div className="ai-insight-grid">
              <section className="ai-brief-card">
                <h4>Daily Insights</h4>
                <ul className="plain-list">
                  {(aiInsights.insights || []).map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </section>
              <section className="ai-brief-card">
                <h4>Personalized Suggestions</h4>
                <ul className="plain-list">
                  {(aiInsights.suggestions || []).map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </section>
              <p className="dashboard-note">
                Last analyzed: {formatDateTime(aiInsights.lastAnalyzed)}
              </p>
            </div>
          ) : (
            <div className="empty-state-card">
              <h4>No AI briefing generated yet</h4>
              <p>Generate insights to get a fresh summary of daily focus and practical preparation suggestions.</p>
            </div>
          )}

          <div className="insight-columns">
            <div>
              <h4>Strength Cluster</h4>
              <div className="tag-wrap">
                {(readiness?.strengths || profile.skills || []).slice(0, 6).map((item) => (
                  <span key={item} className="tag positive">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4>Practice Priorities</h4>
              <div className="tag-wrap">
                {(readiness?.recommendations || []).length ? (
                  readiness.recommendations.map((item) => <span key={item} className="tag">{item}</span>)
                ) : (
                  <span className="tag">Generate analysis for targeted recommendations</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-row">
          <div>
            <h3>Mock Interview Lab</h3>
            <p>Generate role-specific questions from your selected company analysis and improve using scored feedback.</p>
          </div>
          <div className="interview-controls">
            <label>
              Questions
              <input
                type="number"
                min="1"
                max="15"
                value={questionCount}
                onChange={(event) =>
                  setQuestionCount(Math.min(15, Math.max(1, Number(event.target.value) || 1)))
                }
              />
            </label>
            <button
              type="button"
              className="primary-button"
              disabled={!isSelectedCompanyAnalyzed}
              onClick={handleGenerateInterview}
            >
              Generate Questions
            </button>
          </div>
        </div>

        {!isSelectedCompanyAnalyzed ? (
          <p className="inline-hint">
            Complete selected company analysis before generating interview questions.
          </p>
        ) : null}

        {interviewSession ? (
          <div className="interview-grid">
            <div className="metric-row compact-metric-row">
              <div className="metric-card">
                <span>Selected Role</span>
                <strong>{readiness?.selectedCompany?.roleTitle || "--"}</strong>
              </div>
              <div className="metric-card">
                <span>Company</span>
                <strong>{readiness?.selectedCompany?.companyName || "--"}</strong>
              </div>
              <div className="metric-card">
                <span>Overall Score</span>
                <strong>{interviewSession.overallScore || "--"}</strong>
              </div>
            </div>

            {interviewSession.questions.map((question, index) => (
              <div key={question.prompt} className="interview-card">
                <h4>
                  Q{index + 1}. {question.prompt}
                </h4>
                <textarea
                  rows="4"
                  value={answers[index] ?? question.answer ?? ""}
                  onChange={(event) => {
                    const nextAnswers = [...answers];
                    nextAnswers[index] = event.target.value;
                    setAnswers(nextAnswers);
                  }}
                />
                {question.feedback ? <p className="feedback">{question.feedback}</p> : null}
                {question.score ? <p className="score-text">Score: {question.score}</p> : null}
              </div>
            ))}

            <button type="button" className="primary-button" onClick={handleEvaluateInterview}>
              Evaluate Answers
            </button>

            {interviewSession.improvementTips?.length ? (
              <div className="tip-stack">
                <h4>Improvement Tips</h4>
                <div className="tag-wrap">
                  {interviewSession.improvementTips.map((tip) => (
                    <span key={tip} className="tag">
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="empty-state-card">
            <h4>No interview set generated yet</h4>
            <p>After company analysis, create a question set here and use answer evaluation to sharpen your speaking points.</p>
          </div>
        )}
      </section>
    </main>
  );
};
