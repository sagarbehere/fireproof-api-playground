// This file defines the TodoItem type and a function to create a default TodoItem object.
export interface TodoItem {
  type: 'TodoItem';
  _id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  tags: string[];
};

export function createDefaultTodoItem(obj: Partial<TodoItem>): TodoItem {
  return {
    type: 'TodoItem',
    _id: obj._id || '',
    title: obj.title || '',
    completed: obj.completed || false,
    createdAt: obj.createdAt || new Date(),
    updatedAt: obj.updatedAt || null,
    tags: obj.tags || []
  };
}