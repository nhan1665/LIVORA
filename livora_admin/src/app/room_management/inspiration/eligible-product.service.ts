import { Injectable } from '@angular/core';

export interface EligibleProduct {
  id: string;
  code: string;
  name: string;
  roomIds: string[];
  saleable: boolean;
}

/** Session fixture only; Product API ownership remains with Product Management. */
@Injectable({ providedIn: 'root' })
export class EligibleProductService {
  readonly products: readonly EligibleProduct[] = [
    { id: 'p-sofa', code: 'SP-SF-0102', name: 'Sofa Da Bò Cognac Atelier', roomIds: ['room-liv-01', 'room-out-05'], saleable: true },
    { id: 'p-table', code: 'SP-TB-0245', name: 'Bàn Trà Calcatta Viola', roomIds: ['room-liv-01'], saleable: true },
    { id: 'p-light', code: 'SP-LT-0156', name: 'Đèn Sàn Nghệ Thuật Brass', roomIds: ['room-liv-01', 'room-bed-02', 'room-wrk-04'], saleable: true },
    { id: 'p-bed', code: 'SP-BD-0312', name: 'Giường ngủ Atelier', roomIds: ['room-bed-02'], saleable: true },
    { id: 'p-desk', code: 'SP-DK-0188', name: 'Bàn làm việc Studio', roomIds: ['room-wrk-04'], saleable: true },
    { id: 'p-dining', code: 'SP-DT-0056', name: 'Bàn ăn gỗ tự nhiên', roomIds: ['room-din-03'], saleable: true },
    { id: 'p-retired', code: 'SP-OLD-0001', name: 'Sofa ngừng kinh doanh', roomIds: ['room-liv-01'], saleable: false },
  ];

  find(id: string): EligibleProduct | undefined { return this.products.find((item) => item.id === id); }
  forRoom(roomId: string): EligibleProduct[] { return this.products.filter((item) => item.saleable && item.roomIds.includes(roomId)); }
}
