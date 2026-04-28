import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  dueDate: { type: Date }
});

const goalSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    title: { type: String, required: true },
    description: { type: String },
    goalType: { 
      type: String, 
      enum: ["time_based", "task_based", "skill_based"], 
      required: true 
    },
    targetValue: { type: Number, required: true }, // e.g., 100 hours, 30 days, 50 tasks
    currentValue: { type: Number, default: 0 },
    unit: { type: String, required: true }, // e.g., "hours", "days", "tasks", "problems"
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },
    priority: { 
      type: String, 
      enum: ["Low", "Medium", "High"], 
      default: "Medium" 
    },
    status: { 
      type: String, 
      enum: ["active", "completed", "paused", "cancelled"], 
      default: "active" 
    },
    milestones: [milestoneSchema],
    progress: { type: Number, default: 0 }, // percentage 0-100
    completedAt: { type: Date },
    tags: [{ type: String }],
    category: { type: String }, // e.g., "DSA", "Aptitude", "Projects", "Study"
    isOnTrack: { type: Boolean, default: true },
    lastProgressUpdate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Calculate progress percentage before saving
goalSchema.pre('save', function(next) {
  if (this.targetValue > 0) {
    this.progress = Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
  }
  
  // Check if goal is completed
  if (this.progress >= 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  // Check if goal is on track
  const now = new Date();
  const totalDuration = this.deadline - this.startDate;
  const elapsedDuration = now - this.startDate;
  const expectedProgress = (elapsedDuration / totalDuration) * 100;
  this.isOnTrack = this.progress >= expectedProgress * 0.8; // 80% of expected progress
  
  this.lastProgressUpdate = new Date();
  next();
});

// Static method to generate milestones
goalSchema.statics.generateMilestones = function(goalType, targetValue, deadline, startDate) {
  const milestones = [];
  const totalDays = Math.ceil((deadline - startDate) / (1000 * 60 * 60 * 24));
  const milestoneCount = Math.min(5, Math.max(3, Math.ceil(totalDays / 7))); // 3-5 milestones
  
  for (let i = 1; i <= milestoneCount; i++) {
    const progressPercentage = (i / milestoneCount) * 100;
    const milestoneValue = Math.round((targetValue * progressPercentage) / 100);
    const daysFromStart = Math.ceil((totalDays * progressPercentage) / 100);
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + daysFromStart);
    
    milestones.push({
      title: `Milestone ${i}: ${progressPercentage.toFixed(0)}% Complete`,
      description: `Reach ${milestoneValue} ${goalType === 'time_based' ? 'hours' : goalType === 'task_based' ? 'tasks' : 'problems'}`,
      targetValue: milestoneValue,
      dueDate: dueDate
    });
  }
  
  return milestones;
};

export const Goal = mongoose.model("Goal", goalSchema);
