export interface IUser {
    _id: string;
    username: string;
    email: string;
    password?: string;
    token?: string;
    role: 'user' | 'admin';
    profilePhoto?: string;
}