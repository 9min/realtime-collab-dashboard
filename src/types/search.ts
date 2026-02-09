export interface SearchResultProject {
  type: 'project'
  id: string
  name: string
  description: string | null
}

export interface SearchResultTask {
  type: 'task'
  id: string
  title: string
  projectId: string
  projectName: string
  columnId: string
}

export interface SearchResultComment {
  type: 'comment'
  id: string
  content: string
  taskId: string
  taskTitle: string
  projectId: string
}

export type SearchResult = SearchResultProject | SearchResultTask | SearchResultComment

export interface SearchResults {
  projects: SearchResultProject[]
  tasks: SearchResultTask[]
  comments: SearchResultComment[]
}
