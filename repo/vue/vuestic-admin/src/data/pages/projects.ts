import { v4 as uuid } from 'uuid'
import { Project } from '../../pages/projects/types'
import projectsDb from './projects-db.json'

export type Pagination = {
  page: number
  perPage: number
  total: number
}

export type Sorting = {
  sortBy: 'project_owner' | 'team' | 'created_at'
  sortingOrder: 'asc' | 'desc' | null
}

// Local offline data layer (adaptation): deterministic in-memory replacement of
// the old fetch-based API. Signatures unchanged; sorting stays client-side in
// useProjects exactly as before. `creation_date` ("20 Nov 2023" style) is
// normalized to ISO `created_at`, which is what the type and all consumers use.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

const toIso = (raw: string): string => {
  const [dayRaw, monthRaw, yearRaw] = raw.trim().split(/\s+/)
  const date = new Date(Date.UTC(Number(yearRaw), MONTHS[(monthRaw || '').toLowerCase()] ?? 0, Number(dayRaw)))
  return date.toISOString()
}

const projectsDbLocal: Project[] = (projectsDb as unknown as Record<string, unknown>[]).map((raw) => ({
  id: raw.id as Project['id'],
  project_name: String(raw.project_name ?? ''),
  project_owner: raw.project_owner as Project['project_owner'],
  team: raw.team as Project['team'],
  status: raw.status as Project['status'],
  created_at: toIso(String(raw.creation_date ?? '')),
}))

export const getProjects = async (options: Partial<Sorting> & Pagination) => {
  await sleep(150)
  return {
    data: clone(projectsDbLocal),
    pagination: {
      page: options.page,
      perPage: options.perPage,
      total: projectsDbLocal.length,
    },
  }
}

export const addProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
  await sleep(150)
  const created = {
    ...clone(project),
    id: uuid() as Project['id'],
    created_at: new Date().toISOString(),
  } as Project
  projectsDbLocal.unshift(created)
  return [clone(created)]
}

export const updateProject = async (project: Omit<Project, 'created_at'>) => {
  await sleep(150)
  const index = projectsDbLocal.findIndex(({ id }) => id === project.id)
  if (index === -1) {
    throw new Error('Project not found')
  }
  const updated = { ...projectsDbLocal[index], ...clone(project) } as Project
  projectsDbLocal.splice(index, 1, updated)
  return [clone(updated)]
}

export const removeProject = async (project: Project) => {
  await sleep(150)
  const index = projectsDbLocal.findIndex(({ id }) => id === project.id)
  if (index !== -1) {
    projectsDbLocal.splice(index, 1)
  }
  return index !== -1
}
