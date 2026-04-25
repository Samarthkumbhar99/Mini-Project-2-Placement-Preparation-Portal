export const buildAnalytics = ({ students, reports, companies, roles }) => {
  const readinessDistribution = { Low: 0, Medium: 0, High: 0 };
  const skillFrequency = {};
  const branchFrequency = {};

  reports.forEach((report) => {
    readinessDistribution[report.category] += 1;
  });

  students.forEach((student) => {
    student.skills.forEach((skill) => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
    if (student.branch) {
      branchFrequency[student.branch] = (branchFrequency[student.branch] || 0) + 1;
    }
  });

  const avgReadiness = reports.length
    ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length)
    : 0;

  return {
    stats: {
      totalStudents: students.length,
      totalCompanies: companies.length,
      totalRoles: roles.length,
      averageReadiness: avgReadiness
    },
    readinessDistribution,
    topSkills: Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count })),
    branchDistribution: Object.entries(branchFrequency).map(([branch, count]) => ({ branch, count }))
  };
};

