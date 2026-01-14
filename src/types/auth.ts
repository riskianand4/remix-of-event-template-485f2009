export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'superadmin' | 'teknisi' | 'cs';
  name: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const DUMMY_USERS: User[] = [
  {
    id: '1',
    username: 'user',
    email: 'user@telnet.co.id',
    role: 'user',
    name: 'Staff User',
  },
  {
    id: '2',
    username: 'superadmin',
    email: 'superadmin@telnet.co.id',
    role: 'superadmin',
    name: 'Super Admin',
  },
  {
    id: '3',
    username: 'teknisi',
    email: 'teknisi@telnet.co.id',
    role: 'teknisi',
    name: 'Ahmad Teknisi',
  },
  {
    id: '4',
    username: 'cs',
    email: 'cs@telnet.co.id',
    role: 'cs',
    name: 'CS Staff',
  },
];

export const DUMMY_CREDENTIALS = [
  { username: 'user', password: 'user123' },
  { username: 'superadmin', password: 'super123' },
  { username: 'teknisi', password: 'teknisi123' },
  { username: 'cs', password: 'cs123' },
];