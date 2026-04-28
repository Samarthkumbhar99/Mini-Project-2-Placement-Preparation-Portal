import { Goal } from "../models/Goal.js";
import { StudentProfile } from "../models/StudentProfile.js";

export const createGoal = async (goalData, userId) => {
  try {
    // Get student profile
    const profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      throw new Error("Student profile not found");
    }

    // Generate milestones automatically
    const milestones = Goal.generateMilestones(
      goalData.goalType,
      goalData.targetValue,
      new Date(goalData.deadline),
      new Date(goalData.startDate || Date.now())
    );

    // Create goal
    const goal = new Goal({
      ...goalData,
      student: profile._id,
      milestones,
      startDate: new Date(goalData.startDate || Date.now()),
      deadline: new Date(goalData.deadline)
    });

    await goal.save();
    return goal;
  } catch (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }
};

export const getStudentGoals = async (userId) => {
  try {
    const profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      throw new Error("Student profile not found");
    }

    const goals = await Goal.find({ 
      student: profile._id,
      status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 });

    return goals;
  } catch (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }
};

export const updateGoalProgress = async (goalId, progressData) => {
  try {
    const goal = await Goal.findById(goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    // Update current value
    if (progressData.currentValue !== undefined) {
      goal.currentValue = progressData.currentValue;
    }

    // Update milestones
    if (progressData.milestoneUpdates) {
      progressData.milestoneUpdates.forEach(update => {
        const milestone = goal.milestones.id(update.milestoneId);
        if (milestone) {
          milestone.currentValue = update.currentValue;
          if (update.currentValue >= milestone.targetValue && !milestone.completed) {
            milestone.completed = true;
            milestone.completedAt = new Date();
          }
        }
      });
    }

    await goal.save();
    return goal;
  } catch (error) {
    throw new Error(`Failed to update goal progress: ${error.message}`);
  }
};

export const deleteGoal = async (goalId, userId) => {
  try {
    const profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      throw new Error("Student profile not found");
    }

    const goal = await Goal.findOne({ _id: goalId, student: profile._id });
    if (!goal) {
      throw new Error("Goal not found");
    }

    await Goal.findByIdAndDelete(goalId);
    return { message: "Goal deleted successfully" };
  } catch (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
};

export const getGoalAnalytics = async (userId) => {
  try {
    const profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      throw new Error("Student profile not found");
    }

    const goals = await Goal.find({ student: profile._id });
    
    const analytics = {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      onTrackGoals: goals.filter(g => g.isOnTrack).length,
      overdueGoals: goals.filter(g => new Date() > g.deadline && g.status !== 'completed').length,
      averageProgress: goals.length > 0 
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0,
      categoryBreakdown: {},
      upcomingDeadlines: []
    };

    // Category breakdown
    goals.forEach(goal => {
      if (goal.category) {
        analytics.categoryBreakdown[goal.category] = (analytics.categoryBreakdown[goal.category] || 0) + 1;
      }
    });

    // Upcoming deadlines (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    analytics.upcomingDeadlines = goals
      .filter(g => g.deadline <= sevenDaysFromNow && g.status === 'active')
      .sort((a, b) => a.deadline - b.deadline)
      .map(g => ({
        id: g._id,
        title: g.title,
        deadline: g.deadline,
        progress: g.progress,
        daysRemaining: Math.ceil((g.deadline - new Date()) / (1000 * 60 * 60 * 24))
      }));

    return analytics;
  } catch (error) {
    throw new Error(`Failed to get goal analytics: ${error.message}`);
  }
};

export const checkGoalAlerts = async (userId) => {
  try {
    const profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      throw new Error("Student profile not found");
    }

    const goals = await Goal.find({ 
      student: profile._id,
      status: 'active'
    });

    const alerts = [];
    const now = new Date();

    goals.forEach(goal => {
      // Check if goal is falling behind
      if (!goal.isOnTrack) {
        alerts.push({
          type: 'falling_behind',
          goalId: goal._id,
          title: goal.title,
          message: `You're falling behind on "${goal.title}". Current progress: ${goal.progress}%`,
          severity: 'warning'
        });
      }

      // Check deadline proximity
      const daysUntilDeadline = Math.ceil((goal.deadline - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
        alerts.push({
          type: 'deadline_approaching',
          goalId: goal._id,
          title: goal.title,
          message: `"${goal.title}" deadline is in ${daysUntilDeadline} day(s)!`,
          severity: daysUntilDeadline <= 1 ? 'critical' : 'warning'
        });
      }

      // Check overdue goals
      if (daysUntilDeadline < 0 && goal.status !== 'completed') {
        alerts.push({
          type: 'overdue',
          goalId: goal._id,
          title: goal.title,
          message: `"${goal.title}" is overdue by ${Math.abs(daysUntilDeadline)} day(s)!`,
          severity: 'critical'
        });
      }

      // Check milestone completion
      const incompleteMilestones = goal.milestones.filter(m => !m.completed && new Date() > m.dueDate);
      if (incompleteMilestones.length > 0) {
        alerts.push({
          type: 'milestone_missed',
          goalId: goal._id,
          title: goal.title,
          message: `You missed ${incompleteMilestones.length} milestone(s) for "${goal.title}"`,
          severity: 'warning'
        });
      }
    });

    return alerts;
  } catch (error) {
    throw new Error(`Failed to check goal alerts: ${error.message}`);
  }
};
