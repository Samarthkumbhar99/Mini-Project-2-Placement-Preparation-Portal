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

const COLORS = ["#4e6cff", "#ff8a5b", "#ffc15e", "#17b38a"];

const splitTextarea = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "Not available";

const getStudentProfileCompleteness = (student) => {
  const checks = [
    Boolean(student.branch),
    Number(student.cgpa) > 0,
    Boolean(student.phone),
    Boolean(student.skills?.length),
    Boolean(student.projects?.length),
    Boolean(student.internships?.length),
    Boolean(student.certifications?.length),
    Boolean(student.resume?.uploadedAt)
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [students, setStudents] = useState([]);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    domain: "",
    location: "",
    salaryRange: "",
    minCgpa: 6,
    eligibleBranches: "Computer\nIT\nENTC",
    description: ""
  });
  const [roleForm, setRoleForm] = useState({
    company: "",
    title: "",
    requiredSkills: "Java\nSQL\nCommunication",
    preferredSkills: "Git",
    aptitudeFocus: "Logical Reasoning",
    coreSubjects: "DBMS\nOOP",
    minCgpa: 6,
    description: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [studentStatusFilter, setStudentStatusFilter] = useState("All");

  const deferredStudentSearch = useDeferredValue(studentSearch);

  const loadAdminData = async () => {
    try {
      const [analyticsRes, companiesRes, rolesRes, studentsRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/companies"),
        api.get("/admin/job-roles"),
        api.get("/admin/students")
      ]);

      setAnalytics(analyticsRes.data);
      setCompanies(companiesRes.data);
      setRoles(rolesRes.data);
      setStudents(studentsRes.data);

      if (!roleForm.company && companiesRes.data[0]?._id) {
        setRoleForm((current) => ({ ...current, company: companiesRes.data[0]._id }));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load admin data.");
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const readinessChartData = useMemo(() => {
    if (!analytics?.readinessDistribution) return [];
    return Object.entries(analytics.readinessDistribution).map(([name, value]) => ({ name, value }));
  }, [analytics]);

  const branchChartData = analytics?.branchDistribution || [];

  const assessedStudents = students.filter((student) => student.readiness);
  const assessedRate = students.length ? Math.round((assessedStudents.length / students.length) * 100) : 0;
  const highReadyStudents = assessedStudents.filter((student) => student.readiness?.category === "High");
  const unassessedStudents = students.filter((student) => !student.readiness);
  const atRiskStudents = students.filter((student) => {
    if (!student.readiness) return true;
    return (
      student.readiness.score < 55 ||
      (student.readiness.missingSkills?.length || 0) > 4 ||
      (student.skills?.length || 0) < 3
    );
  });

  const placementHealthScore = Math.round(((analytics?.stats?.averageReadiness || 0) * 0.65) + (assessedRate * 0.35));

  const companyCoverage = useMemo(
    () =>
      companies.map((company) => {
        const companyRoles = roles.filter((role) => role.company?._id === company._id || role.company === company._id);
        return {
          ...company,
          roleCount: companyRoles.length,
          averageMinCgpa: companyRoles.length
            ? (
                companyRoles.reduce((total, role) => total + Number(role.minCgpa || 0), 0) /
                companyRoles.length
              ).toFixed(1)
            : company.minCgpa?.toFixed?.(1) || company.minCgpa || 0
        };
      }),
    [companies, roles]
  );

  const skillDemand = useMemo(() => {
    const demandMap = {};

    roles.forEach((role) => {
      [...(role.requiredSkills || []), ...(role.preferredSkills || [])].forEach((skill) => {
        demandMap[skill] = (demandMap[skill] || 0) + 1;
      });
    });

    return Object.entries(demandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));
  }, [roles]);

  const branchOptions = useMemo(
    () => ["All", ...new Set(students.map((student) => student.branch).filter(Boolean))],
    [students]
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = deferredStudentSearch.trim().toLowerCase();

    return students.filter((student) => {
      const profileStatus = !student.readiness
        ? "Unassessed"
        : student.readiness.score >= 70
          ? "Ready"
          : student.readiness.score >= 50
            ? "Watchlist"
            : "At Risk";

      const matchesBranch = branchFilter === "All" ? true : student.branch === branchFilter;
      const matchesStatus = studentStatusFilter === "All" ? true : profileStatus === studentStatusFilter;
      const haystack = `${student.user?.name || ""} ${student.user?.email || ""} ${student.branch || ""}`.toLowerCase();
      const matchesSearch = normalizedSearch ? haystack.includes(normalizedSearch) : true;

      return matchesBranch && matchesStatus && matchesSearch;
    });
  }, [branchFilter, deferredStudentSearch, studentStatusFilter, students]);

  const supportQueue = useMemo(
    () =>
      [...students]
        .map((student) => ({
          ...student,
          profileCompleteness: getStudentProfileCompleteness(student),
          supportScore: !student.readiness
            ? 100
            : Math.max(
                0,
                100 - Number(student.readiness.score || 0) + Math.max(0, 60 - getStudentProfileCompleteness(student))
              )
        }))
        .sort((a, b) => b.supportScore - a.supportScore)
        .slice(0, 5),
    [students]
  );

  const operationsNotes = [
    `${assessedRate}% of students have been assessed so far.`,
    `${highReadyStudents.length} students are currently in the High readiness band.`,
    `${unassessedStudents.length} students still need their first analysis run.`,
    `${roles.length} active role templates are available across ${companies.length} companies.`
  ];

  const handleCompanySubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/admin/companies", {
        name: companyForm.name,
        domain: companyForm.domain,
        location: companyForm.location,
        salaryRange: companyForm.salaryRange,
        minCgpa: Number(companyForm.minCgpa),
        eligibleBranches: splitTextarea(companyForm.eligibleBranches),
        description: companyForm.description
      });

      setMessage("Company added successfully.");
      setCompanyForm({
        name: "",
        domain: "",
        location: "",
        salaryRange: "",
        minCgpa: 6,
        eligibleBranches: "Computer\nIT\nENTC",
        description: ""
      });
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add company.");
    }
  };

  const handleRoleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/admin/job-roles", {
        company: roleForm.company,
        title: roleForm.title,
        requiredSkills: splitTextarea(roleForm.requiredSkills),
        preferredSkills: splitTextarea(roleForm.preferredSkills),
        aptitudeFocus: splitTextarea(roleForm.aptitudeFocus),
        coreSubjects: splitTextarea(roleForm.coreSubjects),
        minCgpa: Number(roleForm.minCgpa),
        description: roleForm.description || "New admin-managed role"
      });

      setMessage("Job role added successfully.");
      setRoleForm((current) => ({
        ...current,
        title: "",
        requiredSkills: "Java\nSQL\nCommunication",
        preferredSkills: "Git",
        aptitudeFocus: "Logical Reasoning",
        coreSubjects: "DBMS\nOOP",
        minCgpa: 6,
        description: ""
      }));
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add job role.");
    }
  };

  return (
    <main className="dashboard-page admin-dashboard">
      <section className="panel dashboard-hero-card admin-hero-card">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Placement Cell Dashboard</p>
          <h1>Run placement operations with clearer visibility, better signals, and faster interventions.</h1>
          <p className="dashboard-hero-text">
            This view is structured for oversight: readiness coverage, branch mix, support queue,
            company-role management, and demand signals across the hiring pipeline.
          </p>
        </div>
        <aside className="dashboard-hero-aside">
          <div className="hero-status-card">
            <span className="hero-status-label">Placement Health</span>
            <strong>{placementHealthScore}%</strong>
            <p>Composite score derived from average readiness and how many students have been assessed.</p>
          </div>
          <div className="hero-status-card accent-card">
            <span className="hero-status-label">Immediate Attention</span>
            <strong>{supportQueue.length} students in support queue</strong>
            <p>Use the intelligence panel below to identify unassessed, low-score, and profile-incomplete students.</p>
          </div>
        </aside>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="dashboard-stat-grid">
        <div className="metric-card dashboard-stat-card">
          <span>Total Students</span>
          <strong>{analytics?.stats?.totalStudents ?? 0}</strong>
          <p>Current student profiles inside the placement workspace.</p>
        </div>
        <div className="metric-card dashboard-stat-card">
          <span>Assessed Coverage</span>
          <strong>{assessedRate}%</strong>
          <p>{assessedStudents.length} students have a readiness report.</p>
        </div>
        <div className="metric-card dashboard-stat-card">
          <span>Average Readiness</span>
          <strong>{analytics?.stats?.averageReadiness ?? 0}%</strong>
          <p>Useful for tracking batch-level movement over time.</p>
        </div>
        <div className="metric-card dashboard-stat-card">
          <span>High Readiness</span>
          <strong>{highReadyStudents.length}</strong>
          <p>Students currently best positioned for near-term opportunities.</p>
        </div>
        <div className="metric-card dashboard-stat-card">
          <span>Watchlist + At Risk</span>
          <strong>{atRiskStudents.length}</strong>
          <p>Students who need assessment, profile completion, or targeted coaching.</p>
        </div>
        <div className="metric-card dashboard-stat-card">
          <span>Roles per Company</span>
          <strong>{companies.length ? (roles.length / companies.length).toFixed(1) : "0.0"}</strong>
          <p>Signals the breadth of your company-role coverage.</p>
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <h3>Readiness Distribution</h3>
          <p className="inline-hint">Quick view of how the current batch is spread across Low, Medium, and High readiness bands.</p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={readinessChartData} dataKey="value" nameKey="name" outerRadius={85}>
                  {readinessChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3>Branch Coverage</h3>
          <p className="inline-hint">See where the current student base is concentrated so outreach and role curation stay balanced.</p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={branchChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#17b38a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <div className="section-row">
            <div>
              <h3>Student Intelligence</h3>
              <p className="inline-hint">Search students, segment the batch, and quickly spot who needs support or who is placement-ready.</p>
            </div>
            <span className="tag">{filteredStudents.length} visible</span>
          </div>

          <div className="dashboard-filter-row">
            <label className="filter-control">
              Search student
              <input
                placeholder="Name, email, branch"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
              />
            </label>
            <label className="filter-control">
              Branch
              <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-control">
              Status
              <select value={studentStatusFilter} onChange={(event) => setStudentStatusFilter(event.target.value)}>
                <option value="All">All</option>
                <option value="Ready">Ready</option>
                <option value="Watchlist">Watchlist</option>
                <option value="At Risk">At Risk</option>
                <option value="Unassessed">Unassessed</option>
              </select>
            </label>
          </div>

          <div className="list-stack intelligence-list">
            {filteredStudents.length ? (
              filteredStudents.slice(0, 8).map((student) => {
                const readinessScore = student.readiness?.score ?? null;
                const readinessLabel = !student.readiness
                  ? "Unassessed"
                  : readinessScore >= 70
                    ? "Ready"
                    : readinessScore >= 50
                      ? "Watchlist"
                      : "At Risk";

                return (
                  <article key={student._id} className="match-card intelligence-card">
                    <div>
                      <h4>{student.user?.name || "Student"}</h4>
                      <p>{student.user?.email || "No email available"}</p>
                      <div className="tag-wrap">
                        <span className={`tag ${readinessLabel === "Ready" ? "positive" : readinessLabel === "At Risk" ? "warning" : ""}`}>
                          {readinessLabel}
                        </span>
                        <span className="tag">{student.branch || "No branch"}</span>
                        <span className="tag">{getStudentProfileCompleteness(student)}% profile</span>
                      </div>
                    </div>
                    <div className="opportunity-stats">
                      <strong>{readinessScore ?? "--"}%</strong>
                      <p>{student.readiness?.selectedCompany?.companyName || "No selected company"}</p>
                      <p>
                        Skills: {student.skills?.slice(0, 3).join(", ") || "No skills yet"}
                      </p>
                      <p>
                        Latest interview: {student.latestInterview?.overallScore ?? "--"}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="inline-hint">No students matched the current filters.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <h3>Operations Briefing</h3>
          <div className="action-list">
            {operationsNotes.map((note) => (
              <article key={note} className="action-card">
                <div className="action-indicator" />
                <div>
                  <h4>{note}</h4>
                  <p>Use this signal to shape coaching, analysis coverage, and company-role planning.</p>
                </div>
              </article>
            ))}
          </div>

          <div className="section-row">
            <h4>Role Demand Signals</h4>
            <span className="tag">{skillDemand.length} tracked skills</span>
          </div>
          <div className="tag-wrap">
            {skillDemand.map((item) => (
              <span key={item.skill} className="tag">
                {item.skill} ({item.count})
              </span>
            ))}
          </div>

          <div className="section-row admin-subsection">
            <h4>Support Queue</h4>
            <span className="tag warning">{supportQueue.length} priority cases</span>
          </div>
          <div className="list-stack">
            {supportQueue.map((student) => (
              <article key={student._id} className="support-card">
                <div>
                  <strong>{student.user?.name || "Student"}</strong>
                  <p>{student.branch || "Branch not set"}</p>
                </div>
                <div>
                  <strong>{student.readiness?.score ?? "--"}%</strong>
                  <p>Profile {student.profileCompleteness}% complete</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-two">
        <form className="panel" onSubmit={handleCompanySubmit}>
          <h3>Add Company</h3>
          <p className="inline-hint">Capture branch eligibility and company context so the recommendation engine stays useful.</p>
          <label>
            Name
            <input
              value={companyForm.name}
              onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })}
              required
            />
          </label>
          <label>
            Domain
            <input
              value={companyForm.domain}
              onChange={(event) => setCompanyForm({ ...companyForm, domain: event.target.value })}
              required
            />
          </label>
          <div className="form-grid">
            <label>
              Location
              <input
                value={companyForm.location}
                onChange={(event) => setCompanyForm({ ...companyForm, location: event.target.value })}
                required
              />
            </label>
            <label>
              Salary Range
              <input
                value={companyForm.salaryRange}
                onChange={(event) => setCompanyForm({ ...companyForm, salaryRange: event.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Minimum CGPA
              <input
                type="number"
                step="0.1"
                value={companyForm.minCgpa}
                onChange={(event) => setCompanyForm({ ...companyForm, minCgpa: event.target.value })}
              />
            </label>
            <label>
              Eligible Branches
              <textarea
                rows="3"
                value={companyForm.eligibleBranches}
                onChange={(event) => setCompanyForm({ ...companyForm, eligibleBranches: event.target.value })}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              rows="3"
              value={companyForm.description}
              onChange={(event) => setCompanyForm({ ...companyForm, description: event.target.value })}
            />
          </label>
          <button type="submit" className="primary-button">
            Save Company
          </button>
        </form>

        <form className="panel" onSubmit={handleRoleSubmit}>
          <h3>Add Job Role</h3>
          <p className="inline-hint">Build more complete role profiles so student analyses become sharper and more realistic.</p>
          <label>
            Company
            <select value={roleForm.company} onChange={(event) => setRoleForm({ ...roleForm, company: event.target.value })}>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role Title
            <input
              value={roleForm.title}
              onChange={(event) => setRoleForm({ ...roleForm, title: event.target.value })}
              required
            />
          </label>
          <label>
            Required Skills
            <textarea
              rows="4"
              value={roleForm.requiredSkills}
              onChange={(event) => setRoleForm({ ...roleForm, requiredSkills: event.target.value })}
            />
          </label>
          <label>
            Preferred Skills
            <textarea
              rows="3"
              value={roleForm.preferredSkills}
              onChange={(event) => setRoleForm({ ...roleForm, preferredSkills: event.target.value })}
            />
          </label>
          <div className="form-grid">
            <label>
              Aptitude Focus
              <textarea
                rows="3"
                value={roleForm.aptitudeFocus}
                onChange={(event) => setRoleForm({ ...roleForm, aptitudeFocus: event.target.value })}
              />
            </label>
            <label>
              Core Subjects
              <textarea
                rows="3"
                value={roleForm.coreSubjects}
                onChange={(event) => setRoleForm({ ...roleForm, coreSubjects: event.target.value })}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Minimum CGPA
              <input
                type="number"
                step="0.1"
                value={roleForm.minCgpa}
                onChange={(event) => setRoleForm({ ...roleForm, minCgpa: event.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                value={roleForm.description}
                onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
              />
            </label>
          </div>
          <button type="submit" className="primary-button">
            Save Role
          </button>
        </form>
      </section>

      <section className="grid-two">
        <div className="panel">
          <div className="section-row">
            <h3>Company Coverage</h3>
            <span className="tag">{companyCoverage.length} companies</span>
          </div>
          <div className="list-stack">
            {companyCoverage.map((company) => (
              <article key={company._id} className="match-card intelligence-card">
                <div>
                  <h4>{company.name}</h4>
                  <p>{company.domain}</p>
                  <div className="tag-wrap">
                    {company.eligibleBranches?.slice(0, 3).map((branch) => (
                      <span key={branch} className="tag">
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="opportunity-stats">
                  <strong>{company.roleCount} roles</strong>
                  <p>{company.location}</p>
                  <p>Avg min CGPA {company.averageMinCgpa}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-row">
            <h3>Role Library Snapshot</h3>
            <span className="tag">{roles.length} roles</span>
          </div>
          <div className="list-stack">
            {roles.slice(0, 8).map((role) => (
              <article key={role._id} className="match-card intelligence-card">
                <div>
                  <h4>{role.title}</h4>
                  <p>{role.company?.name || "Company unavailable"}</p>
                  <div className="tag-wrap">
                    {(role.requiredSkills || []).slice(0, 3).map((skill) => (
                      <span key={skill} className="tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="opportunity-stats">
                  <strong>Min CGPA {role.minCgpa}</strong>
                  <p>{(role.preferredSkills || []).slice(0, 2).join(", ") || "No preferred skills"}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
