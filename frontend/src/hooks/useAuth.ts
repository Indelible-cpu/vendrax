import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  fullname: string;
  role: string;
  role_id: number;
  branch_id?: number | null;
  branch_name?: string | null;
  profile_pic: string | null;
  phone?: string | null;
  mustChangePassword?: boolean;
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
