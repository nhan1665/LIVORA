import { Injectable } from '@angular/core';

/** Tracks new session-only references across feature services; no backend authority is implied. */
@Injectable({ providedIn: 'root' })
export class RoomUsageService {
  private readonly references = new Map<string, { roomId: string; label: string }>();

  record(key: string, roomId: string, label: string): void { this.references.set(key, { roomId, label }); }
  forRoom(roomId: string): string[] { return [...this.references.values()].filter((item) => item.roomId === roomId).map((item) => item.label); }
}
