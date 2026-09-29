export enum TodoStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed'
}

export interface ITodo {
    _id?: string;
    title: string;
    description: string;
    status: TodoStatus;
    userId: string;
}