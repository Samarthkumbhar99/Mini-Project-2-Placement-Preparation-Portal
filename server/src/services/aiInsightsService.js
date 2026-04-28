import { StudentProfile } from "../models/StudentProfile.js";
import { ReadinessReport } from "../models/ReadinessReport.js";
import { InterviewSession } from "../models/InterviewSession.js";

export const generateAIInsights = async (userId) => {
  try {
    // Get student data
    const profile = await StudentProfile.findOne({ user: userId }).populate('user');
    const readiness = await ReadinessReport.findOne({ student: profile._id });
    const interviewSessions = await InterviewSession.find({ student: profile._id })
      .sort({ createdAt: -1 })
      .limit(10);

    if (!profile) {
      return {
        insights: [],
        suggestions: [],
        error: "No profile data found"
      };
    }

    const insights = [];
    const suggestions = [];

    // Analyze productivity patterns
    const productivityAnalysis = analyzeProductivityPatterns(interviewSessions, readiness);
    insights.push(...productivityAnalysis.insights);
    suggestions.push(...productivityAnalysis.suggestions);

    // Analyze skills and subjects
    const skillsAnalysis = analyzeSkillsAndSubjects(profile, readiness);
    insights.push(...skillsAnalysis.insights);
    suggestions.push(...skillsAnalysis.suggestions);

    // Analyze study patterns
    const studyAnalysis = analyzeStudyPatterns(profile, interviewSessions);
    insights.push(...studyAnalysis.insights);
    suggestions.push(...studyAnalysis.suggestions);

    // Generate overall recommendations
    const overallRecommendations = generateOverallRecommendations(profile, readiness);
    suggestions.push(...overallRecommendations);

    return {
      insights: insights.slice(0, 5), // Limit to top 5 insights
      suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
      lastAnalyzed: new Date().toISOString()
    };

  } catch (error) {
    console.error("Error generating AI insights:", error);
    return {
      insights: ["Unable to generate insights at the moment. Please try again later."],
      suggestions: ["Continue with your current study plan."],
      error: error.message
    };
  }
};

const analyzeProductivityPatterns = (interviewSessions, readiness) => {
  const insights = [];
  const suggestions = [];

  if (interviewSessions.length > 0) {
    // Analyze day-wise productivity
    const dayProductivity = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    interviewSessions.forEach(session => {
      const dayName = dayNames[session.createdAt.getDay()];
      dayProductivity[dayName] = (dayProductivity[dayName] || 0) + 1;
    });

    const mostProductiveDay = Object.entries(dayProductivity)
      .sort((a, b) => b[1] - a[1])[0];

    if (mostProductiveDay) {
      insights.push(`You are most productive on ${mostProductiveDay[0]}s with ${mostProductiveDay[1]} practice sessions`);
    }

    // Analyze streak consistency
    const recentSessions = interviewSessions.slice(0, 7);
    if (recentSessions.length >= 5) {
      insights.push("Great consistency! You've been practicing regularly this week");
    } else if (recentSessions.length < 3) {
      suggestions.push("Try to maintain a daily practice streak for better results");
    }
  }

  // Analyze readiness score
  if (readiness) {
    if (readiness.score >= 70) {
      insights.push("Your overall readiness is strong - keep up the great work!");
    } else if (readiness.score >= 40) {
      suggestions.push("Focus on weak areas to improve your readiness score");
    } else {
      suggestions.push("Consider creating a structured study plan to boost your readiness");
    }
  }

  return { insights, suggestions };
};

const analyzeSkillsAndSubjects = (profile, readiness) => {
  const insights = [];
  const suggestions = [];

  // Analyze skills
  if (profile.skills && profile.skills.length > 0) {
    const techSkills = profile.skills.filter(skill => 
      ['JavaScript', 'React', 'Java', 'Python', 'SQL', 'Node.js'].includes(skill)
    );
    const dsaSkills = profile.skills.filter(skill => 
      ['Data Structures', 'Algorithms', 'DSA'].some(dsa => skill.toLowerCase().includes(dsa.toLowerCase()))
    );

    if (dsaSkills.length > 0 && techSkills.length > 0) {
      insights.push("You have a balanced skill set covering both DSA and technical skills");
    } else if (dsaSkills.length > 0) {
      insights.push("Your DSA consistency is strong");
      if (techSkills.length === 0) {
        suggestions.push("Consider adding some technical skills to complement your DSA knowledge");
      }
    } else if (techSkills.length > 0) {
      insights.push("You have good technical skills");
      suggestions.push("DSA consistency appears weak - focus on data structures and algorithms");
    }
  }

  // Analyze readiness report details
  if (readiness) {
    if (readiness.strengths && readiness.strengths.length > 0) {
      insights.push(`Key strengths: ${readiness.strengths.slice(0, 2).join(", ")}`);
    }
    
    if (readiness.weaknesses && readiness.weaknesses.length > 0) {
      suggestions.push(`Focus on improving: ${readiness.weaknesses.slice(0, 2).join(", ")}`);
    }

    if (readiness.missingSkills && readiness.missingSkills.length > 0) {
      suggestions.push(`Consider learning: ${readiness.missingSkills.slice(0, 2).join(", ")}`);
    }
  }

  return { insights, suggestions };
};

const analyzeStudyPatterns = (profile, interviewSessions) => {
  const insights = [];
  const suggestions = [];

  // Analyze study time based on session creation times
  if (interviewSessions.length > 0) {
    const hourCounts = {};
    interviewSessions.forEach(session => {
      const hour = session.createdAt.getHours();
      const timeSlot = getTimeSlot(hour);
      hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
    });

    const preferredTimeSlot = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (preferredTimeSlot) {
      insights.push(`You prefer studying during ${preferredTimeSlot[0]}`);
      
      // Suggest optimal study time
      if (preferredTimeSlot[0].includes("Night")) {
        suggestions.push("Try studying earlier in the day for better retention");
      } else if (preferredTimeSlot[0].includes("Morning")) {
        insights.push("Morning study sessions are great for learning!");
      }
    }
  }

  // Analyze project and internship consistency
  if (profile.projects && profile.projects.length > 2) {
    insights.push("Great project portfolio! Practical experience is valuable");
  } else if (profile.projects && profile.projects.length <= 1) {
    suggestions.push("Consider building more projects to strengthen your profile");
  }

  if (profile.internships && profile.internships.length > 0) {
    insights.push("Internship experience gives you a competitive edge");
  } else {
    suggestions.push("Look for internship opportunities to gain practical experience");
  }

  return { insights, suggestions };
};

const generateOverallRecommendations = (profile, readiness) => {
  const suggestions = [];

  // CGPA-based recommendations
  if (profile.cgpa >= 8.0) {
    suggestions.push("Your academic performance is excellent - focus on technical skills now");
  } else if (profile.cgpa >= 6.5) {
    suggestions.push("Good academic standing - balance between studies and skill development");
  } else {
    suggestions.push("Focus on improving academic performance alongside skill building");
  }

  // Graduation year-based recommendations
  const currentYear = new Date().getFullYear();
  if (profile.graduationYear === currentYear + 1) {
    suggestions.push("Final year approaching - intensify your placement preparation");
  } else if (profile.graduationYear > currentYear + 1) {
    suggestions.push("You have time - build strong fundamentals gradually");
  }

  // Study time optimization
  suggestions.push("Optimal study time: 2-3 hours daily with regular breaks");

  return suggestions;
};

const getTimeSlot = (hour) => {
  if (hour >= 5 && hour < 12) return "Morning (5AM-12PM)";
  if (hour >= 12 && hour < 17) return "Afternoon (12PM-5PM)";
  if (hour >= 17 && hour < 22) return "Evening (5PM-10PM)";
  return "Night (10PM-5AM)";
};
