export interface Project {
  id: string;
  name: string;
  client: string;
  dueDate: string;
  status: 'In Progress' | 'Not Started' | 'Completed' | 'Reviewed';
  assignedStaff: number;
}

export interface User {
  name: string;
  avatar?: string;
}