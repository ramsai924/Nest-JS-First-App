export enum TodoStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed'
}

export interface ITodo {
    id?: string;
    title: string;
    description: string;
    status: TodoStatus;
    userId: string;
    createdAt: Date;
}