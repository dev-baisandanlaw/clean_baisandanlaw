export interface Task {
  assignee: string;
  description: string;
  dueDate: string;
  priority: string;
  status: "Pending" | "Completed";
  createdAt: string;
  updatedAt: string;
  taskId: string;
  taskName: string;
}

export interface TaskDetails {
  caseId: string;
  totalTasks: number;
  totalPendingTasks: number;
  totalCompletedTasks: number;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}
