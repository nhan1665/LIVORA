/** Admin-facing Room contract used by the Room feature's demo service. */
export interface Room {
  id: string;
  /** Provisional business identifier; the backend schema currently defines `slug`, not `code`. */
  code: string;
  name: string;
  description: string;
  thumbnail: string;
  isActive: boolean;
  displayOrder: number;
}

export interface RoomDraft {
  code: string;
  name: string;
  description: string;
  thumbnail: string;
  isActive: boolean;
}

export type RoomStatusFilter = 'all' | 'active' | 'inactive';

export interface RoomListQuery {
  search: string;
  status: RoomStatusFilter;
  page: number;
  pageSize: number;
}

export interface RoomListResponse {
  items: Room[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export class RoomConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomConflictError';
  }
}

export class RoomInUseError extends Error {
  constructor(readonly references: string[]) {
    super(`This room is still referenced by ${references.join(', ')}.`);
    this.name = 'RoomInUseError';
  }
}
