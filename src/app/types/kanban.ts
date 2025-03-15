export interface KanbanTask {
  id: string;
  title: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  darkColor: string;
  tasks: KanbanTask[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}
