// src/lib/api.ts
// Centralized API client — replaces all Supabase calls

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('geu_token');
}

export function saveToken(token: string) {
  localStorage.setItem('geu_token', token);
}

export function clearToken() {
  localStorage.removeItem('geu_token');
}

function buildHeaders(isFormData = false): Record<string, string> {
  const h: Record<string, string> = {};
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (!isFormData) h['Content-Type'] = 'application/json';
  return h;
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(isFormData),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  register: (email: string, password: string, full_name: string, graduation_year?: number) =>
    request<{ token: string; user: { id: string; email: string } }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, full_name, graduation_year }) }
    ),

  me: () =>
    request<{ id: string; email: string }>('/api/auth/me'),
};

// ─── Profiles ────────────────────────────────────────────────────────────────

export const profilesApi = {
  get: (userId: string) =>
    request<Profile | null>(`/api/profiles/${userId}`),

  all: () =>
    request<Profile[]>('/api/profiles'),

  update: (userId: string, data: Partial<ProfileUpdate>) =>
    request<Profile>(`/api/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadResume: (userId: string, file: File) => {
    const fd = new FormData();
    fd.append('resume', file);
    return request<{ resume_url: string }>(`/api/profiles/${userId}/resume`, {
      method: 'POST',
      body: fd,
    });
  },

  uploadAvatar: (userId: string, file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return request<{ avatar_url: string }>(`/api/profiles/${userId}/avatar`, {
      method: 'POST',
      body: fd,
    });
  },
};

// ─── Posts ───────────────────────────────────────────────────────────────────

export const postsApi = {
  list: () =>
    request<Post[]>('/api/posts'),

  create: (content: string, image?: File | null) => {
    const fd = new FormData();
    fd.append('content', content);
    if (image) fd.append('image', image);
    return request<Post>('/api/posts', { method: 'POST', body: fd });
  },

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/posts/${id}`, { method: 'DELETE' }),

  toggleLike: (id: string) =>
    request<{ liked: boolean }>(`/api/posts/${id}/like`, { method: 'POST' }),

  addComment: (id: string, content: string) =>
    request<{ success: boolean }>(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// ─── Connections ─────────────────────────────────────────────────────────────

export const connectionsApi = {
  list: () =>
    request<Connection[]>('/api/connections'),

  send: (addressee_id: string) =>
    request<{ success: boolean }>('/api/connections', {
      method: 'POST',
      body: JSON.stringify({ addressee_id }),
    }),

  accept: (requesterId: string) =>
    request<{ success: boolean }>(`/api/connections/${requesterId}/accept`, {
      method: 'PUT',
    }),
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const messagesApi = {
  contacts: () =>
    request<Profile[]>('/api/messages/contacts'),

  conversation: (userId: string) =>
    request<Message[]>(`/api/messages/${userId}`),

  send: (receiver_id: string, content: string) =>
    request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id, content }),
    }),
};

// ─── Resumes ─────────────────────────────────────────────────────────────────

export const resumesApi = {
  list: () =>
    request<Profile[]>('/api/resumes'),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  graduation_year: number | null;
  avatar_url: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name: string;
  headline: string;
  bio: string;
  graduation_year: string | number;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; headline: string | null; avatar_url: string | null } | null;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
}

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}
