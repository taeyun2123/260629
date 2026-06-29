export interface UserData {
  uid: string;
  role: 'STUDENT' | 'TEACHER';
  classCode: string;
  name: string;
  studentId?: string;
  treeLevel: number;
  is_password_changed: boolean;
  is_nudged: boolean;
}

export interface DailyGoal {
  id: string;
  studentUid: string;
  classCode: string;
  date: string; // YYYY-MM-DD
  goalText: string;
  photoUrl: string | null;
  comment: string | null;
  rating: number; // 0 to 5
  createdAt: number;
}
