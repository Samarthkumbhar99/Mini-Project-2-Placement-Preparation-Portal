import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
