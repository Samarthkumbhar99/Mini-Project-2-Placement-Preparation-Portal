import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../services/api";

const COLORS = ["#4e6cff", "#ff8a5b", "#ffc15e"];

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
    minCgpa: 6
  });
  const [roleForm, setRoleForm] = useState({
    company: "",
    title: "",
    requiredSkills: "Java\nSQL\nCommunication",
    preferredSkills: "Git",
    aptitudeFocus: "Logical Reasoning",
    coreSubjects: "DBMS\nOOP",
    minCgpa: 6
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const handleCompanySubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/admin/companies", {
        ...companyForm,
        minCgpa: Number(companyForm.minCgpa),
        eligibleBranches: ["Computer", "IT", "ENTC"]
      });
      setMessage("Company added successfully.");
      setCompanyForm({ name: "", domain: "", location: "", salaryRange: "", minCgpa: 6 });
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add company.");
    }
  };

  const handleRoleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/admin/job-roles", {
        company: roleForm.company,
        title: roleForm.title,
        requiredSkills: roleForm.requiredSkills.split("\n").filter(Boolean),
        preferredSkills: roleForm.preferredSkills.split("\n").filter(Boolean),
        aptitudeFocus: roleForm.aptitudeFocus.split("\n").filter(Boolean),
        coreSubjects: roleForm.coreSubjects.split("\n").filter(Boolean),
        minCgpa: Number(roleForm.minCgpa),
        description: "New admin-managed role"
      });
      setMessage("Job role added successfully.");
      setRoleForm((current) => ({ ...current, title: "" }));
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add job role.");
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Placement Cell Dashboard</p>
          <h1>Monitor readiness, manage roles, and guide placement strategy.</h1>
        </div>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="metric-row">
        <div className="metric-card">
          <span>Total Students</span>
          <strong>{analytics?.stats?.totalStudents ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Total Companies</span>
          <strong>{analytics?.stats?.totalCompanies ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Total Roles</span>
          <strong>{analytics?.stats?.totalRoles ?? 0}</strong>
        </div>
        <div className="metric-card">
          <span>Average Readiness</span>
          <strong>{analytics?.stats?.averageReadiness ?? 0}%</strong>
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <h3>Readiness Distribution</h3>
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
          <h3>Top Skills Across Students</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics?.topSkills || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ff8a5b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid-two">
        <form className="panel" onSubmit={handleCompanySubmit}>
          <h3>Add Company</h3>
          <label>
            Name
            <input value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} required />
          </label>
          <label>
            Domain
            <input value={companyForm.domain} onChange={(event) => setCompanyForm({ ...companyForm, domain: event.target.value })} required />
          </label>
          <label>
            Location
            <input value={companyForm.location} onChange={(event) => setCompanyForm({ ...companyForm, location: event.target.value })} required />
          </label>
          <label>
            Salary Range
            <input value={companyForm.salaryRange} onChange={(event) => setCompanyForm({ ...companyForm, salaryRange: event.target.value })} required />
          </label>
          <label>
            Minimum CGPA
            <input type="number" step="0.1" value={companyForm.minCgpa} onChange={(event) => setCompanyForm({ ...companyForm, minCgpa: event.target.value })} />
          </label>
          <button type="submit" className="primary-button">Save Company</button>
        </form>

        <form className="panel" onSubmit={handleRoleSubmit}>
          <h3>Add Job Role</h3>
          <label>
            Company
            <select value={roleForm.company} onChange={(event) => setRoleForm({ ...roleForm, company: event.target.value })}>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label>
            Role Title
            <input value={roleForm.title} onChange={(event) => setRoleForm({ ...roleForm, title: event.target.value })} required />
          </label>
          <label>
            Required Skills
            <textarea rows="4" value={roleForm.requiredSkills} onChange={(event) => setRoleForm({ ...roleForm, requiredSkills: event.target.value })} />
          </label>
          <label>
            Preferred Skills
            <textarea rows="3" value={roleForm.preferredSkills} onChange={(event) => setRoleForm({ ...roleForm, preferredSkills: event.target.value })} />
          </label>
          <button type="submit" className="primary-button">Save Role</button>
        </form>
      </section>

      <section className="grid-two">
        <div className="panel">
          <h3>Managed Companies</h3>
          <div className="list-stack">
            {companies.map((company) => (
              <article key={company._id} className="match-card">
                <div>
                  <h4>{company.name}</h4>
                  <p>{company.domain}</p>
                </div>
                <div>
                  <strong>{company.salaryRange}</strong>
                  <p>{company.location}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Student Summaries</h3>
          <div className="list-stack">
            {students.map((student) => (
              <article key={student._id} className="match-card">
                <div>
                  <h4>{student.user?.name || "Student"}</h4>
                  <p>{student.branch || "Branch not set"}</p>
                </div>
                <div>
                  <strong>CGPA {student.cgpa || 0}</strong>
                  <p>{student.skills?.slice(0, 3).join(", ") || "No skills yet"}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

