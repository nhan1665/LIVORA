export interface SpaceRecord {
  id: string;
  /** Provisional Admin identifier: REPORT Table 22 has no code field. */
  code: string;
  name: string;
  roomId: string;
  description: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  /** Session-only file metadata, not a persisted asset URL. */
  modelFile: { name: string; size: number } | null;
  isActive: boolean;
  version: string;
}
export type SpaceDraft = Omit<SpaceRecord, 'id' | 'version'>;
export interface DesignRecord {
  id: string;
  code: string;
  customerCode: string;
  customerName: string;
  name: string;
  spaceId: string;
  roomId: string;
  productCodes: string[];
  createdAt: string;
}
export interface CatalogPage<T> { items: T[]; total: number; page: number; pages: number; }
