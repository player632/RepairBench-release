import { v4 as uuid } from 'uuid'
import { User } from '../../pages/users/types'
import usersDb from './users-db.json'

export type Pagination = {
  page: number
  perPage: number
  total: number
}

export type Sorting = {
  sortBy: keyof User | undefined
  sortingOrder: 'asc' | 'desc' | null
}

export type Filters = {
  isActive: boolean
  search: string
}

// Local offline data layer (adaptation): deterministic in-memory replacement of
// the old fetch-based API. All function signatures are unchanged, so consumers
// (stores/users.ts, useUsers) work without modification.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const normalizeUser = (raw: Record<string, unknown>): User =>
  ({
    id: raw.id as User['id'],
    fullname: String(raw.fullname ?? ''),
    email: String(raw.email ?? ''),
    username: String(raw.username ?? ''),
    role: raw.role as User['role'],
    avatar: typeof raw.avatar === 'string' && raw.avatar.startsWith('http') ? '' : String(raw.avatar ?? ''),
    projects: Array.isArray(raw.projects) ? (raw.projects as User['projects']) : [],
    notes: String(raw.notes ?? ''),
    active: raw.active === true,
  }) as User

const usersDbLocal: User[] = (usersDb as unknown as Record<string, unknown>[]).map((raw) => normalizeUser(raw))

export const getUsers = async (filters: Partial<Filters & Pagination & Sorting>) => {
  const { isActive, search } = filters
  await sleep(150)

  let filteredUsers: User[] = usersDbLocal.filter((user) => user.active === isActive)

  if (search) {
    filteredUsers = filteredUsers.filter((user) => user.fullname.toLowerCase().includes(search.toLowerCase()))
  }

  const { page = 1, perPage = 10 } = filters || {}
  return {
    data: clone(filteredUsers),
    pagination: {
      page,
      perPage,
      total: filteredUsers.length,
    },
  }
}

export const addUser = async (user: User) => {
  await sleep(150)
  const created = clone(user)
  if (!created.id) {
    created.id = uuid() as User['id']
  }
  usersDbLocal.unshift(created)
  return [clone(created)]
}

export const updateUser = async (user: User) => {
  await sleep(150)
  const index = usersDbLocal.findIndex(({ id }) => id === user.id)
  if (index === -1) {
    throw new Error('User not found')
  }
  usersDbLocal.splice(index, 1, clone(user))
  return [clone(user)]
}

export const removeUser = async (user: User) => {
  await sleep(150)
  const index = usersDbLocal.findIndex(({ id }) => id === user.id)
  if (index !== -1) {
    usersDbLocal.splice(index, 1)
  }
  return index !== -1
}

export const uploadAvatar = async (body: FormData) => {
  await sleep(150)
  void body
  return { publicUrl: '' }
}
