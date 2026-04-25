export const buildRoleMatches = (profile, roles) => {
  const studentSkills = new Set((profile.skills || []).map((skill) => skill.toLowerCase()));

  return roles
    .map((role) => {
      const requiredSkills = role.requiredSkills || [];
      const matchedSkills = requiredSkills.filter((skill) => studentSkills.has(skill.toLowerCase()));
      const missingSkills = requiredSkills.filter((skill) => !studentSkills.has(skill.toLowerCase()));
      const matchPercentage = requiredSkills.length
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 0;
      const isEligible =
        (profile.cgpa || 0) >= (role.minCgpa || 0) &&
        (!role.company?.eligibleBranches?.length || role.company.eligibleBranches.includes(profile.branch));

      return {
        roleId: role._id,
        companyId: role.company?._id,
        companyName: role.company?.name,
        roleTitle: role.title,
        matchPercentage,
        missingSkills,
        matchedSkills,
        isEligible,
        salaryRange: role.company?.salaryRange || ""
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

