export enum TaskStatus {
  Pending = "Pending",
  Completed = "Completed",
}

export enum TaskDivision {
  Client = "Client",
  Attorney = "Attorney",
}

export interface Task {
  assignee: {
    fullname: string;
    id: string;
    email: string;
    division: TaskDivision;
  };
  description: string;
  dueDate: string;
  priority: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
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
