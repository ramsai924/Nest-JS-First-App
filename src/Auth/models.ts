export interface IUser {
    id: string;
    username: string;
    email: string;
    password: string;
    token?: string;
    role: 'user' | 'admin';
}