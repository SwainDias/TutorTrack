// Simple in-browser data and auth store to replace Supabase during local dev/demo
// Data persisted in localStorage; not secure and not for production use.

type UUID = string;

type Role = "student" | "tutor" | "admin";

export interface LocalUser {
  id: UUID;
  email: string;
  password: string;
  name?: string;
}

export interface UserRole {
  user_id: UUID;
  role: Role;
}

export interface Profile {
  id: UUID; // same as user id
  name?: string;
  email?: string;
  department?: string | null;
  year_of_study?: number | null;
  subject_expertise?: string | null;
  availability_status?: string | null;
}

export interface Session {
  id: UUID;
  student_id: UUID;
  tutor_id: UUID;
  subject_name: string;
  session_date: string;
  session_time: string;
  duration: number;
  location?: string | null;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  created_at: string;
}

export interface Rating {
  id: UUID;
  session_id: UUID;
  student_id: UUID;
  tutor_id: UUID;
  value: number;
  feedback?: string | null;
  created_at: string;
}

type DatabaseShape = {
  users: LocalUser[];
  roles: UserRole[];
  profiles: Profile[];
  sessions: Session[];
  ratings: Rating[];
  currentUserId?: UUID | null;
};

const STORAGE_KEY = "tutortrack_local_db_v1";

function loadDb(): DatabaseShape {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = seed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveDb(db: DatabaseShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function uuid(): UUID {
  // Good-enough UUID for local use
  return crypto.randomUUID ? crypto.randomUUID() : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function seed(): DatabaseShape {
  const adminId = uuid();
  const tutorId = uuid();
  const studentId = uuid();
  const users: LocalUser[] = [
    { id: adminId, email: "admin@example.com", password: "password", name: "Admin User" },
    { id: tutorId, email: "tutor@example.com", password: "password", name: "Taylor Tutor" },
    { id: studentId, email: "student@example.com", password: "password", name: "Sam Student" },
  ];
  const roles: UserRole[] = [
    { user_id: adminId, role: "admin" },
    { user_id: tutorId, role: "tutor" },
    { user_id: studentId, role: "student" },
  ];
  const profiles: Profile[] = [
    { id: adminId, name: "Admin User", email: "admin@example.com", department: null },
    { id: tutorId, name: "Taylor Tutor", email: "tutor@example.com", department: "Mathematics", subject_expertise: "Calculus, Algebra", availability_status: "available" },
    { id: studentId, name: "Sam Student", email: "student@example.com", department: "Computer Science", year_of_study: 2 },
  ];
  const now = new Date().toISOString();
  const sessions: Session[] = [
    {
      id: uuid(),
      student_id: studentId,
      tutor_id: tutorId,
      subject_name: "Calculus I",
      session_date: now.slice(0, 10),
      session_time: "15:00",
      duration: 60,
      location: "Library 201",
      status: "completed",
      created_at: now,
    },
  ];
  const ratings: Rating[] = [
    {
      id: uuid(),
      session_id: sessions[0].id,
      student_id: studentId,
      tutor_id: tutorId,
      value: 5,
      feedback: "Great session!",
      created_at: now,
    },
  ];
  return { users, roles, profiles, sessions, ratings, currentUserId: undefined };
}

// Auth API
export const localAuth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const db = loadDb();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) return { error: new Error("Invalid credentials") } as const;
    db.currentUserId = user.id;
    saveDb(db);
    return { data: { user }, error: null } as const;
  },
  async signUp({ email, password, data }: { email: string; password: string; data?: { name?: string; role?: Role } }) {
    const db = loadDb();
    if (db.users.some((u) => u.email === email)) return { error: new Error("Email already exists") } as const;
    const id = uuid();
    const user: LocalUser = { id, email, password, name: data?.name };
    db.users.push(user);
    db.roles.push({ user_id: id, role: (data?.role as Role) || "student" });
    db.profiles.push({ id, name: data?.name, email });
    db.currentUserId = id;
    saveDb(db);
    return { data: { user }, error: null } as const;
  },
  async getUser() {
    const db = loadDb();
    const user = db.users.find((u) => u.id === db.currentUserId) || null;
    return { data: { user } } as const;
  },
  async signOut() {
    const db = loadDb();
    db.currentUserId = null;
    saveDb(db);
    return { error: null } as const;
  },
};

// Data API
export const localDb = {
  async getUserRole(userId: UUID) {
    const db = loadDb();
    const role = db.roles.find((r) => r.user_id === userId)?.role;
    return { data: role ? { role } : null } as const;
  },
  async listTutorProfiles() {
    const db = loadDb();
    const tutorIds = db.roles.filter((r) => r.role === "tutor").map((r) => r.user_id);
    const profiles = db.profiles.filter((p) => tutorIds.includes(p.id));
    return { data: profiles } as const;
  },
  async getProfile(userId: UUID) {
    const db = loadDb();
    const profile = db.profiles.find((p) => p.id === userId) || null;
    return { data: profile, error: null } as const;
  },
  async updateProfile(userId: UUID, updates: Partial<Profile>) {
    const db = loadDb();
    const idx = db.profiles.findIndex((p) => p.id === userId);
    if (idx === -1) return { error: new Error("Profile not found") } as const;
    db.profiles[idx] = { ...db.profiles[idx], ...updates };
    saveDb(db);
    return { error: null } as const;
  },
  async listStudentSessions(studentId: UUID) {
    const db = loadDb();
    const sessions = db.sessions
      .filter((s) => s.student_id === studentId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return { data: sessions } as const;
  },
  async listTutorSessions(tutorId: UUID) {
    const db = loadDb();
    const sessions = db.sessions
      .filter((s) => s.tutor_id === tutorId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return { data: sessions } as const;
  },
  async insertSession(newSession: Omit<Session, "id" | "created_at" | "status"> & { status?: Session["status"] }) {
    const db = loadDb();
    const session: Session = { id: uuid(), created_at: new Date().toISOString(), status: newSession.status || "pending", ...newSession };
    db.sessions.unshift(session);
    saveDb(db);
    return { data: session, error: null } as const;
  },
  async updateSessionStatus(sessionId: UUID, status: Session["status"]) {
    const db = loadDb();
    const idx = db.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return { error: new Error("Session not found") } as const;
    db.sessions[idx].status = status;
    saveDb(db);
    return { error: null } as const;
  },
  async insertRating(rating: Omit<Rating, "id" | "created_at">) {
    const db = loadDb();
    const newRating: Rating = { id: uuid(), created_at: new Date().toISOString(), ...rating };
    db.ratings.unshift(newRating);
    saveDb(db);
    return { data: newRating, error: null } as const;
  },
  async listAllUsers() {
    const db = loadDb();
    return { data: db.profiles.map((p) => ({ ...p, user_roles: [{ role: db.roles.find((r) => r.user_id === p.id)?.role }] })) } as const;
  },
  async listAllSessions() {
    const db = loadDb();
    return { data: db.sessions } as const;
  },
  async listAllRatings() {
    const db = loadDb();
    return { data: db.ratings } as const;
  },
  async deleteUser(userId: UUID) {
    const db = loadDb();
    db.roles = db.roles.filter((r) => r.user_id !== userId);
    db.users = db.users.filter((u) => u.id !== userId);
    db.profiles = db.profiles.filter((p) => p.id !== userId);
    db.sessions = db.sessions.filter((s) => s.student_id !== userId && s.tutor_id !== userId);
    db.ratings = db.ratings.filter((r) => r.student_id !== userId && r.tutor_id !== userId);
    saveDb(db);
    return { error: null } as const;
  },
  async deleteSession(sessionId: UUID) {
    const db = loadDb();
    db.sessions = db.sessions.filter((s) => s.id !== sessionId);
    db.ratings = db.ratings.filter((r) => r.session_id !== sessionId);
    saveDb(db);
    return { error: null } as const;
  },
  async deleteRating(ratingId: UUID) {
    const db = loadDb();
    db.ratings = db.ratings.filter((r) => r.id !== ratingId);
    saveDb(db);
    return { error: null } as const;
  },
};

export function getDisplaySession(session: Session, db?: DatabaseShape) {
  const state = db || loadDb();
  const student = state.profiles.find((p) => p.id === session.student_id);
  const tutor = state.profiles.find((p) => p.id === session.tutor_id);
  const ratings = state.ratings.filter((r) => r.session_id === session.id);
  return { ...session, student, tutor, ratings } as any;
}




