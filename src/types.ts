import { Timestamp } from "firebase/firestore";

export interface UserDoc {
  name: string;
  email: string;
  role: "student" | "admin";
  status: "pending" | "approved" | "rejected";
  enrolledCourses: { courseId: string; enrolledAt: Timestamp }[];
  activeCourseId: string;
  paymentInfo: {
    method: string;
    paymentNumber: string;
    transactionId: string;
    screenshot: string;
  };
  createdAt: Timestamp;
  phone?: string;
}

export interface Course {
  id: string;
  courseName: string;
  thumbnail: string;
  price: number;
  overview: string[];
  subjects: CourseSubject[];
  instructors: Instructor[];
  routinePDF: string;
  allMaterialsLink?: string;
  discussionGroups?: { name: string; link: string }[];
  createdAt?: Timestamp;
}

export interface CourseSubject {
  subjectId: string;
  subjectName: string;
  chapters?: { chapterId: string; chapterName: string }[];
}

export interface Instructor {
  name: string;
  subject: string;
  image: string;
}

export interface Video {
  id: string;
  courseId: string;
  subjectId: string;
  chapterId?: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  pdfUrl?: string;
  order?: number;
  createdAt?: Timestamp;
}

export interface AppSettings {
  appName: string;
  appLogo: string;
  youtubeChannel: string;
  googleDrive: string;
  paymentMethods: { name: string; number: string }[];
  socialLinks: { name: string; link: string }[];
  usefulLinks: { name: string; link: string }[];
}

export interface EnrollRequest {
  id: string;
  userId: string;
  courseId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  paymentInfo: {
    method: string;
    paymentNumber: string;
    transactionId: string;
    screenshot: string;
  };
  createdAt: Timestamp;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  subjectId?: string;
  duration: number; // minutes
  questions: ExamQuestion[];
  isActive: boolean;
  createdAt?: Timestamp;
  type?: "mcq" | "written" | "mixed";
}

export interface ExamQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
  marks: number;
  type?: "mcq" | "written";
}

export interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  userName: string;
  answers: Record<string, any>;
  score?: number;
  totalMarks: number;
  submittedAt: Timestamp;
  securityLogs?: any[];
}
