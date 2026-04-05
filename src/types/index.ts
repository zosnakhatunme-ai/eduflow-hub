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
}

export interface Course {
  id: string;
  courseName: string;
  thumbnail: string;
  price: number;
  overview: string[];
  subjects: SubjectRef[];
  instructors: Instructor[];
  routinePDF: string;
  allMaterialsLink: string;
  discussionGroups: { name: string; link: string }[];
  createdAt?: Timestamp;
}

export interface SubjectRef {
  subjectId: string;
  subjectName: string;
  chapters?: ChapterRef[];
}

export interface ChapterRef {
  chapterId: string;
  chapterName: string;
}

export interface Subject {
  id: string;
  name: string;
  courseId: string;
  chapters?: { id: string; name: string }[];
}

export interface Instructor {
  name: string;
  subject: string;
  image: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  pdfUrl: string;
  courseId: string;
  subjectId: string;
  subjectName: string;
  chapterId?: string;
  chapterName?: string;
  order: number;
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
  courseName: string;
  userName: string;
  userEmail: string;
  paymentMethod: string;
  paymentNumber: string;
  transactionId: string;
  screenshot: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  subjectId: string;
  subjectName: string;
  duration: number; // minutes
  questions: ExamQuestion[];
  isWritten?: boolean;
  createdAt?: Timestamp;
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  userName: string;
  score: number;
  totalMarks: number;
  answers: number[];
  submittedAt: Timestamp;
  writtenAnswerUrl?: string;
}
