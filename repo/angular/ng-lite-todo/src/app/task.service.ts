import { Task } from './task';
import { environment } from '../environments/environment';
import { rbFetch } from './rb-local-api';

let userId = localStorage.getItem('userId');
if (!userId) {
  userId = Math.random().toString(36).substring(2);
  localStorage.setItem('userId', userId);
}
const apiUrl = `${environment.api}/users/${userId}`;

let tasks: Task[] | undefined;

export enum TaskFilter {
  All = 'all',
  Active = 'active',
  Completed = 'completed'
}

export async function getTasks(filter: TaskFilter = TaskFilter.All): Promise<Task[]> {
  if (tasks === undefined) {
    const response = await rbFetch(`${apiUrl}/tasks/`);
    tasks = await response.json() as Task[];
  }

  switch (filter) {
    case TaskFilter.Active:
      return tasks.filter(task => task.completed);
    default:
      return [...tasks].sort((a, b) => a.description.localeCompare(b.description));
  }
}

export async function addTask(description: string) {
  const response = await rbFetch(`${apiUrl}/tasks/`, {
    method: 'POST',
    body: JSON.stringify({ description })
  });
  await response.json();
}

export async function setTaskCompleted(task: Task, completed: boolean) {
  task.completed = completed;
  await rbFetch(`${apiUrl}/tasks/${task.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ done: completed })
  });
}
