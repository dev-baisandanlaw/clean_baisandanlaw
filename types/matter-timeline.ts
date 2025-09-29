import { TaskDivision } from "./task";

export interface MatterTimeline {
  id: string;
  caseId: string;
  createdAt: string;
  updatedAt: string;
  items: MatterTimelineItem[];
}

interface MatterTimelineItem {
  id: string;
  title: string;
  description: string;
  dateAndTime: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    division: TaskDivision;
  };
}
