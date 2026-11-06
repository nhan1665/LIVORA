import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityLogItem, ActivityLogService } from './activity-log.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-log.html',
  styleUrl: './activity-log.css',
})
export class ActivityLogComponent implements OnInit, OnChanges {
  private readonly activityService = inject(ActivityLogService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() entityType: string = '';
  @Input() entityId: string = '';
  @Input() entityCode: string = '';
  @Input() initialLogs: any[] = [];

  readonly logs = signal<ActivityLogItem[]>([]);
  readonly loading = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['entityId'] && !changes['entityId'].firstChange) ||
      (changes['entityType'] && !changes['entityType'].firstChange) ||
      (changes['entityCode'] && !changes['entityCode'].firstChange)
    ) {
      this.fetchLogs();
    }
  }

  fetchLogs(): void {
    if (!this.entityType && !this.entityId && !this.entityCode) return;

    this.loading.set(true);
    this.activityService.getLogs(this.entityType, this.entityId, this.entityCode).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.logs.set(data);
        } else if (this.initialLogs && this.initialLogs.length > 0) {
          const mapped = this.initialLogs.map((item) => ({
            entityType: this.entityType,
            entityId: this.entityId,
            entityCode: this.entityCode,
            action: item.note || item.action || `Cập nhật trạng thái: ${item.status || ''}`,
            performedBy: item.updatedBy || 'Quản trị viên',
            role: (item.role || 'admin') as any,
            details: item.details || '',
            createdAt: item.timestamp || item.createdAt || new Date(),
          }));
          this.logs.set(mapped);
        } else {
          this.logs.set([]);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  getRoleBadge(role: string): { label: string; cssClass: string } {
    switch (role) {
      case 'system':
        return { label: 'Hệ thống', cssClass: 'badge-system' };
      case 'admin':
        return { label: 'Quản trị viên', cssClass: 'badge-admin' };
      case 'staff':
        return { label: 'Nhân viên CSKH', cssClass: 'badge-staff' };
      case 'customer':
        return { label: 'Khách hàng', cssClass: 'badge-customer' };
      default:
        return { label: 'Hệ thống', cssClass: 'badge-system' };
    }
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
    } catch {
      return String(dateVal);
    }
  }
}

