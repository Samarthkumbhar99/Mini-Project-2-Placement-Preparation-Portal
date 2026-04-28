import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../services/api";

const initialDailyHabits = [
  { id: "dh-1", label: "Revise DSA concepts", done: true },
  { id: "dh-2", label: "Solve 2 coding problems", done: true },
  { id: "dh-3", label: "Aptitude practice", done: false },
  { id: "dh-4", label: "Mock interview reflection", done: false }
];

const initialWeeklyHabits = [
  { id: "wh-1", label: "Complete one project module", done: true },
  { id: "wh-2", label: "Attend one mock test", done: false },
  { id: "wh-3", label: "Update resume achievements", done: false }
];

const initialStudyTasks = [
  { id: "st-1", subject: "DBMS", task: "Normalization & Transactions", deadline: "2026-04-28", priority: "High", hours: 2, completed: false },
  { id: "st-2", subject: "DSA", task: "Graph BFS/DFS revision", deadline: "2026-04-29", priority: "High", hours: 2, completed: true },
  { id: "st-3", subject: "OS", task: "Process synchronization notes", deadline: "2026-05-01", priority: "Medium", hours: 1.5, completed: false },
  { id: "st-4", subject: "Aptitude", task: "Time-speed-distance set", deadline: "2026-05-02", priority: "Low", hours: 1, completed: false }
];

const weeklyConsistency = [
  { day: "Mon", completed: 3 },
  { day: "Tue", completed: 4 },
  { day: "Wed", completed: 2 },
  { day: "Thu", completed: 5 },
  { day: "Fri", completed: 4 },
  { day: "Sat", completed: 3 },
  { day: "Sun", completed: 2 }
];

const heatmapData = [
  [1, 2, 0, 1, 3, 2, 1],
  [2, 1, 3, 2, 1, 0, 2],
  [3, 2, 2, 1, 3, 2, 1],
  [1, 0, 2, 3, 2, 1, 2],
  [2, 3, 1, 2, 1, 2, 3]
];

export const StudentGrowthPlanner = () => {
  const [dailyHabits, setDailyHabits] = useState(initialDailyHabits);
  const [weeklyHabits, setWeeklyHabits] = useState(initialWeeklyHabits);
  const [studyTasks, setStudyTasks] = useState(initialStudyTasks);
  const [studyForm, setStudyForm] = useState({
    subject: "",
    task: "",
    deadline: "",
    priority: "Medium",
    hours: 1
  });
  const [goals, setGoals] = useState([]);
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    goalType: "time_based",
    targetValue: "",
    unit: "hours",
    deadline: "",
    priority: "Medium",
    category: "Study"
  });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalAlerts, setGoalAlerts] = useState([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  const handleHabitToggle = (habitType, habitId) => {
    if (habitType === "daily") {
      setDailyHabits((current) => current.map((habit) => (habit.id === habitId ? { ...habit, done: !habit.done } : habit)));
      return;
    }
    setWeeklyHabits((current) => current.map((habit) => (habit.id === habitId ? { ...habit, done: !habit.done } : habit)));
  };

  const handleTaskToggle = (taskId) => {
    setStudyTasks((current) => current.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)));
  };

  const handleStudyTaskAdd = (event) => {
    event.preventDefault();
    if (!studyForm.subject.trim() || !studyForm.task.trim() || !studyForm.deadline) return;

    setStudyTasks((current) => [
      {
        id: `st-${Date.now()}`,
        subject: studyForm.subject.trim(),
        task: studyForm.task.trim(),
        deadline: studyForm.deadline,
        priority: studyForm.priority,
        hours: Number(studyForm.hours) || 1,
        completed: false
      },
      ...current
    ]);
    setStudyForm({ subject: "", task: "", deadline: "", priority: "Medium", hours: 1 });
  };

  // Goal management functions
  const loadGoals = async () => {
    setIsLoadingGoals(true);
    try {
      const { data } = await api.get("/student/goals");
      setGoals(data);
    } catch (error) {
      console.error("Failed to load goals:", error);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const loadGoalAlerts = async () => {
    try {
      const { data } = await api.get("/student/goals/alerts");
      setGoalAlerts(data);
    } catch (error) {
      console.error("Failed to load goal alerts:", error);
    }
  };

  const handleGoalCreate = async (event) => {
    event.preventDefault();
    if (!goalForm.title.trim() || !goalForm.targetValue || !goalForm.deadline) return;

    try {
      const { data } = await api.post("/student/goals", {
        ...goalForm,
        targetValue: Number(goalForm.targetValue),
        startDate: new Date().toISOString()
      });
      setGoals([data, ...goals]);
      setGoalForm({
        title: "",
        description: "",
        goalType: "time_based",
        targetValue: "",
        unit: "hours",
        deadline: "",
        priority: "Medium",
        category: "Study"
      });
      setShowGoalForm(false);
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  const handleGoalDelete = async (goalId) => {
    try {
      await api.delete(`/student/goals/${goalId}`);
      setGoals(goals.filter(goal => goal._id !== goalId));
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const handleGoalProgressUpdate = async (goalId, currentValue) => {
    try {
      const { data } = await api.put(`/student/goals/${goalId}`, { currentValue });
      setGoals(goals.map(goal => goal._id === goalId ? data : goal));
    } catch (error) {
      console.error("Failed to update goal progress:", error);
    }
  };

  useEffect(() => {
    loadGoals();
    loadGoalAlerts();
  }, []);

  const totalHabits = dailyHabits.length + weeklyHabits.length;
  const completedHabits = [...dailyHabits, ...weeklyHabits].filter((habit) => habit.done).length;
  const completionRate = totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const completedStudyTasks = studyTasks.filter((task) => task.completed).length;
  const pendingTasks = studyTasks.length - completedStudyTasks;
  const studyHours = studyTasks.reduce((total, task) => total + Number(task.hours || 0), 0);
  const completedStudyHours = studyTasks.filter((task) => task.completed).reduce((total, task) => total + Number(task.hours || 0), 0);
  const streak = dailyHabits.filter((habit) => habit.done).length + 2;

  const subjectProgress = useMemo(
    () =>
      Object.values(
        studyTasks.reduce((acc, task) => {
          if (!acc[task.subject]) {
            acc[task.subject] = { subject: task.subject, total: 0, completed: 0 };
          }
          acc[task.subject].total += 1;
          if (task.completed) acc[task.subject].completed += 1;
          return acc;
        }, {})
      ).map((item) => ({
        subject: item.subject,
        progress: Math.round((item.completed / item.total) * 100)
      })),
    [studyTasks]
  );

  return (
    <main className="dashboard-page">
      <section id="growth-planner" className="panel growth-planner-panel">
        <div className="section-row">
          <div>
            <p className="eyebrow">Student Growth Planner</p>
            <h3>Habit Tracker + Study Planner</h3>
            <p>Plan your study routine, maintain consistency, and monitor weekly progress.</p>
          </div>
          <Link to="/student" className="ghost-button">
            Back to Dashboard
          </Link>
        </div>

        <div className="growth-stats-grid">
          <article className="metric-card">
            <span>Completion Rate</span>
            <strong>{completionRate}%</strong>
          </article>
          <article className="metric-card">
            <span>Current Streak</span>
            <strong>{streak} days</strong>
          </article>
          <article className="metric-card">
            <span>Pending Tasks</span>
            <strong>{pendingTasks}</strong>
          </article>
          <article className="metric-card">
            <span>Study Hours</span>
            <strong>{studyHours}h</strong>
          </article>
        </div>

        <div className="growth-layout">
          <section className="growth-card">
            <h4>Daily Habits</h4>
            <div className="habit-list">
              {dailyHabits.map((habit) => (
                <label key={habit.id} className="habit-item">
                  <input type="checkbox" checked={habit.done} onChange={() => handleHabitToggle("daily", habit.id)} />
                  <span>{habit.label}</span>
                </label>
              ))}
            </div>

            <h4>Weekly Habits</h4>
            <div className="habit-list">
              {weeklyHabits.map((habit) => (
                <label key={habit.id} className="habit-item">
                  <input type="checkbox" checked={habit.done} onChange={() => handleHabitToggle("weekly", habit.id)} />
                  <span>{habit.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="growth-card">
            <div className="section-row">
              <h4>Study Session Planner</h4>
              <span className="tag">{completedStudyTasks}/{studyTasks.length} Completed</span>
            </div>
            <form className="study-form-grid" onSubmit={handleStudyTaskAdd}>
              <input
                placeholder="Subject"
                value={studyForm.subject}
                onChange={(event) => setStudyForm({ ...studyForm, subject: event.target.value })}
              />
              <input
                placeholder="Task"
                value={studyForm.task}
                onChange={(event) => setStudyForm({ ...studyForm, task: event.target.value })}
              />
              <input
                type="date"
                value={studyForm.deadline}
                onChange={(event) => setStudyForm({ ...studyForm, deadline: event.target.value })}
              />
              <select
                value={studyForm.priority}
                onChange={(event) => setStudyForm({ ...studyForm, priority: event.target.value })}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={studyForm.hours}
                onChange={(event) => setStudyForm({ ...studyForm, hours: event.target.value })}
              />
              <button type="submit" className="primary-button">Add Task</button>
            </form>
            <div className="study-task-list">
              {studyTasks.map((task) => (
                <article key={task.id} className="study-task-item">
                  <label className="habit-item">
                    <input type="checkbox" checked={task.completed} onChange={() => handleTaskToggle(task.id)} />
                    <span>
                      <strong>{task.subject}</strong> - {task.task}
                    </span>
                  </label>
                  <div className="task-meta">
                    <span>{task.deadline}</span>
                    <span className={`tag ${task.priority === "High" ? "warning" : task.priority === "Low" ? "positive" : ""}`}>
                      {task.priority}
                    </span>
                    <span>{task.hours}h</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Goals Section */}
        <div className="growth-layout">
          <section className="growth-card">
            <div className="section-row">
              <h3>🎯 Smart Goals</h3>
              <button 
                type="button" 
                className="primary-button" 
                onClick={() => setShowGoalForm(!showGoalForm)}
              >
                {showGoalForm ? "Cancel" : "Create Goal"}
              </button>
            </div>

            {/* Goal Alerts */}
            {goalAlerts.length > 0 && (
              <div className="goal-alerts">
                {goalAlerts.map((alert, index) => (
                  <div key={index} className={`alert alert-${alert.severity}`}>
                    <span>⚠️ {alert.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Goal Creation Form */}
            {showGoalForm && (
              <form className="goal-form" onSubmit={handleGoalCreate}>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Goal title (e.g., Complete DSA in 30 days)"
                    value={goalForm.title}
                    onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={goalForm.description}
                    onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })}
                    rows="2"
                  />
                  <div className="form-row">
                    <select
                      value={goalForm.goalType}
                      onChange={(event) => setGoalForm({ ...goalForm, goalType: event.target.value })}
                    >
                      <option value="time_based">Time Based</option>
                      <option value="task_based">Task Based</option>
                      <option value="skill_based">Skill Based</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Target value"
                      value={goalForm.targetValue}
                      onChange={(event) => setGoalForm({ ...goalForm, targetValue: event.target.value })}
                      min="1"
                      required
                    />
                    <select
                      value={goalForm.unit}
                      onChange={(event) => setGoalForm({ ...goalForm, unit: event.target.value })}
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="tasks">Tasks</option>
                      <option value="problems">Problems</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <input
                      type="date"
                      value={goalForm.deadline}
                      onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <select
                      value={goalForm.priority}
                      onChange={(event) => setGoalForm({ ...goalForm, priority: event.target.value })}
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                    <select
                      value={goalForm.category}
                      onChange={(event) => setGoalForm({ ...goalForm, category: event.target.value })}
                    >
                      <option value="Study">Study</option>
                      <option value="DSA">DSA</option>
                      <option value="Aptitude">Aptitude</option>
                      <option value="Projects">Projects</option>
                      <option value="Interview">Interview</option>
                    </select>
                  </div>
                  <button type="submit" className="primary-button">Create Goal</button>
                </div>
              </form>
            )}

            {/* Goals List */}
            <div className="goals-list">
              {isLoadingGoals ? (
                <div className="loading-text">Loading goals...</div>
              ) : goals.length === 0 ? (
                <div className="empty-state">
                  <p>No goals yet. Create your first goal to get started!</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <article key={goal._id} className="goal-item">
                    <div className="goal-header">
                      <div className="goal-info">
                        <h4>{goal.title}</h4>
                        <div className="goal-meta">
                          <span className={`tag ${goal.priority === "High" ? "warning" : goal.priority === "Low" ? "positive" : ""}`}>
                            {goal.priority}
                          </span>
                          <span className="tag category-tag">{goal.category}</span>
                          <span className="deadline-tag">
                            📅 {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="ghost-button delete-button"
                        onClick={() => handleGoalDelete(goal._id)}
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="goal-progress">
                      <div className="progress-info">
                        <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className={`progress-fill ${!goal.isOnTrack ? 'behind' : ''}`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      {!goal.isOnTrack && (
                        <div className="behind-warning">
                          ⚠️ Falling behind schedule
                        </div>
                      )}
                    </div>

                    {/* Milestones */}
                    <div className="milestones">
                      <h5>🎯 Milestones</h5>
                      <div className="milestone-list">
                        {goal.milestones.map((milestone, index) => (
                          <div key={index} className={`milestone ${milestone.completed ? 'completed' : ''}`}>
                            <div className="milestone-info">
                              <span className="milestone-title">{milestone.title}</span>
                              <span className="milestone-progress">
                                {milestone.currentValue} / {milestone.targetValue}
                              </span>
                            </div>
                            <div className="milestone-status">
                              {milestone.completed ? '✅' : '⏳'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Progress Update */}
                    <div className="quick-progress">
                      <label>Quick Update:</label>
                      <div className="progress-input">
                        <input
                          type="number"
                          min="0"
                          max={goal.targetValue}
                          value={goal.currentValue}
                          onChange={(event) => handleGoalProgressUpdate(goal._id, Number(event.target.value))}
                        />
                        <span>{goal.unit}</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="growth-layout">
          <section className="growth-card">
            <h4>Weekly Progress Trend</h4>
            <div className="chart-box compact-chart">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={weeklyConsistency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#356dff" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="progress-meta">
              <div>
                <span>Weekly Completion</span>
                <strong>{Math.round((weeklyConsistency.reduce((acc, item) => acc + item.completed, 0) / (weeklyConsistency.length * 5)) * 100)}%</strong>
              </div>
              <div>
                <span>Completed Study Hours</span>
                <strong>{completedStudyHours}h</strong>
              </div>
            </div>
          </section>

          <section className="growth-card">
            <h4>Subject Progress</h4>
            <div className="subject-progress-list">
              {subjectProgress.map((subject) => (
                <div key={subject.subject}>
                  <div className="section-row">
                    <span>{subject.subject}</span>
                    <strong>{subject.progress}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${subject.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <h4>Consistency Heatmap</h4>
            <div className="heatmap-grid" aria-label="study consistency heatmap">
              {heatmapData.flat().map((value, index) => (
                <span key={`${value}-${index}`} className={`heat-cell level-${value}`} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};
