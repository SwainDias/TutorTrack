const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function getToken(): string | null {
  return localStorage.getItem("tt_jwt");
}

function setToken(token: string | null) {
  if (token) localStorage.setItem("tt_jwt", token);
  else localStorage.removeItem("tt_jwt");
}

async function request<T>(path: string, options: { method?: HttpMethod; body?: any; auth?: boolean } = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }
  return (await res.json()) as T;
}

// Auth
export const apiAuth = {
  async signup(data: { email: string; password: string; name: string; role: "student" | "tutor" | "admin"; department?: string; year_of_study?: number; subject_expertise?: string }) {
    const body: any = { ...data };
    if (data.role === "tutor" && typeof data.subject_expertise === "string") {
      body.subject_expertise = data.subject_expertise;
    }
    const res = await request<{ user: any; token: string }>("/api/auth/signup", { method: "POST", body, auth: false });
    setToken(res.token);
    return res;
  },
  async login(data: { email: string; password: string }) {
    const res = await request<{ user: any; token: string }>("/api/auth/login", { method: "POST", body: data, auth: false });
    setToken(res.token);
    return res;
  },
  async me() {
    return await request<{ user: any }>("/api/auth/me");
  },
  async logout() {
    try { await request<{ message: string }>("/api/auth/logout", { method: "POST" }); } catch {}
    setToken(null);
  },
};

// Users
export const apiUsers = {
  async update(userId: string, updates: any) {
    return await request<any>(`/api/users/${userId}`, { method: "PUT", body: updates });
  },
  async tutors() {
    return await request<any[]>(`/api/tutors`);
  },
};

// Sessions
export const apiSessions = {
  async list() {
    const sessions = await request<any[]>("/api/sessions");
    // Normalize to frontend shape
    return sessions.map((s) => ({
      id: s._id || s.id,
      student_id: s.student_id,
      tutor_id: s.tutor_id,
      subject_name: s.subject_name,
      session_date: s.date || s.session_date,
      session_time: s.time || s.session_time,
      duration: s.duration,
      location: s.location,
      status: s.status,
      created_at: s.created_at,
      student: s.student,
      tutor: s.tutor,
      ratings: s.ratings || [],
    }));
  },
  async create(payload: { tutor_id: string; subject_name: string; date: string; time: string; duration: number; location?: string }) {
    console.log("DEBUG apiSessions.create payload:", payload);
    const s = await request<any>("/api/sessions", { method: "POST", body: payload });
    return {
      id: s._id || s.id,
      student_id: s.student_id,
      tutor_id: s.tutor_id,
      subject_name: s.subject_name,
      session_date: s.date,
      session_time: s.time,
      duration: s.duration,
      location: s.location,
      status: s.status,
      created_at: s.created_at,
      student: s.student,
      tutor: s.tutor,
      ratings: [],
    };
  },
  async update(sessionId: string, updates: any) {
    const s = await request<any>(`/api/sessions/${sessionId}`, { method: "PUT", body: updates });
    return s;
  },
  async remove(sessionId: string) {
    return await request<{ message: string }>(`/api/sessions/${sessionId}`, { method: "DELETE" });
  },
};

// Ratings
export const apiRatings = {
  async list(params?: { tutor_id?: string }) {
    const q = params?.tutor_id ? `?tutor_id=${encodeURIComponent(params.tutor_id)}` : "";
    return await request<any[]>(`/api/ratings${q}`);
  },
  async create(payload: { session_id: string; tutor_id: string; value: number; feedback?: string }) {
    return await request<any>("/api/ratings", { method: "POST", body: payload });
  },
  async update(ratingId: string, updates: any) {
    return await request<any>(`/api/ratings/${ratingId}`, { method: "PUT", body: updates });
  },
};

// Admin
export const apiAdmin = {
  async users() {
    return await request<any[]>("/api/admin/users");
  },
  async stats() {
    return await request<any>("/api/admin/stats");
  },
  async deleteUser(userId: string) {
    return await request<any>(`/api/admin/users/${userId}`, { method: "DELETE" });
  },
  async deleteRating(ratingId: string) {
    return await request<any>(`/api/admin/ratings/${ratingId}`, { method: "DELETE" });
  },

  async ratings() {
    return await request<any[]>("/api/admin/ratings");
  },
};

export function clearAuth() {
  setToken(null);
}


