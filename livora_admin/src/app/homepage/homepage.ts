import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTable, TableColumn, TableActionEvent } from '../shared/data-table/data-table';
import { FilterBar } from '../shared/filter-bar/filter-bar';
import { FormModal } from '../shared/form-modal/form-modal';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';

export interface MarqueeItem {
  id: string;
  code: string;
  title: string;
  iconType: 'truck' | 'sparkle' | 'user' | 'sofa' | 'discount' | 'bell';
  startDate: string;
  endDate: string;
  order: number;
  status: 'Đang hoạt động' | 'Đã ẩn';
}

@Component({
  selector: 'app-homepage',
  imports: [CommonModule, FormsModule, DataTable, FilterBar, FormModal, ConfirmDialog],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage implements OnInit, AfterViewInit {
  // Current active tab
  activeTab: 'marquee' | 'banner' | 'brand' | 'footer' = 'marquee';

  // Template references for custom cell rendering
  @ViewChild('codeTemplate', { static: true }) codeTemplate!: TemplateRef<any>;
  @ViewChild('titleTemplate', { static: true }) titleTemplate!: TemplateRef<any>;
  @ViewChild('orderTemplate', { static: true }) orderTemplate!: TemplateRef<any>;

  // Columns definition for DataTable
  columns: TableColumn<MarqueeItem>[] = [];

  // Filter states
  filterKeyword: string = '';
  filterStatus: string = 'all';

  // Pagination states
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Modal states
  isModalOpen: boolean = false;
  modalMode: 'create' | 'edit' = 'create';
  editingItem: MarqueeItem | null = null;
  notificationForm: Partial<MarqueeItem> = {
    code: '',
    title: '',
    iconType: 'truck',
    startDate: '',
    endDate: '',
    order: 1,
    status: 'Đang hoạt động',
  };

  // Toast / feedback message
  toastMessage: string | null = null;

  // Mock initial dataset matching reference screenshot
  marqueeList: MarqueeItem[] = [
    {
      id: '1',
      code: '#MQ-081',
      title: 'Miễn phí vận chuyển và lắp đặt toàn quốc cho đơn hàng từ 5.000.000đ',
      iconType: 'truck',
      startDate: '01/10/2024',
      endDate: '31/12/2024',
      order: 1,
      status: 'Đang hoạt động',
    },
    {
      id: '2',
      code: '#MQ-082',
      title: 'Trưng bày BST Thu Đông 2024 - Khám phá không gian sống đương đại',
      iconType: 'sparkle',
      startDate: '15/10/2024',
      endDate: '15/11/2024',
      order: 2,
      status: 'Đang hoạt động',
    },
    {
      id: '3',
      code: '#MQ-083',
      title: 'Đặt lịch tư vấn không gian nội thất cùng chuyên gia kiến trúc sư Livora',
      iconType: 'user',
      startDate: '01/09/2024',
      endDate: '31/10/2024',
      order: 3,
      status: 'Đang hoạt động',
    },
    {
      id: '4',
      code: '#MQ-084',
      title: 'Ra mắt dòng sofa mô-đun cao cấp phong cách Bắc Âu tối giản',
      iconType: 'sofa',
      startDate: '20/10/2024',
      endDate: '20/11/2024',
      order: 4,
      status: 'Đang hoạt động',
    },
    {
      id: '5',
      code: '#MQ-079',
      title: 'Ưu đãi giảm 10% khi kết hợp bàn trà cùng dòng thảm len dệt thủ công',
      iconType: 'discount',
      startDate: '01/08/2024',
      endDate: '31/08/2024',
      order: 5,
      status: 'Đã ẩn',
    },
    {
      id: '6',
      code: '#MQ-078',
      title: 'Chính sách bảo hành 5 năm toàn diện cho tất cả kết cấu khung gỗ sồi',
      iconType: 'bell',
      startDate: '01/07/2024',
      endDate: '31/07/2024',
      order: 6,
      status: 'Đã ẩn',
    },
    {
      id: '7',
      code: '#MQ-077',
      title: 'Bộ sưu tập đèn thả trần đồng thau nguyên khối phiên bản giới hạn',
      iconType: 'sparkle',
      startDate: '15/06/2024',
      endDate: '15/07/2024',
      order: 7,
      status: 'Đã ẩn',
    },
    {
      id: '8',
      code: '#MQ-076',
      title: 'Khám phá giải pháp lưu trữ thông minh cho căn hộ diện tích vừa',
      iconType: 'sofa',
      startDate: '01/06/2024',
      endDate: '30/06/2024',
      order: 8,
      status: 'Đã ẩn',
    },
    {
      id: '9',
      code: '#MQ-075',
      title: 'Tặng bộ nến thơm cao cấp hương gỗ đàn hương cho thành viên mới',
      iconType: 'discount',
      startDate: '10/05/2024',
      endDate: '31/05/2024',
      order: 9,
      status: 'Đã ẩn',
    },
    {
      id: '10',
      code: '#MQ-074',
      title: 'Hội thảo kiến trúc: Nghệ thuật cân bằng ánh sáng tự nhiên',
      iconType: 'user',
      startDate: '01/05/2024',
      endDate: '15/05/2024',
      order: 10,
      status: 'Đã ẩn',
    },
    {
      id: '11',
      code: '#MQ-073',
      title: 'Tuần lễ tri ân khách hàng: Miễn phí vệ sinh đồ da tại gia',
      iconType: 'truck',
      startDate: '15/04/2024',
      endDate: '30/04/2024',
      order: 11,
      status: 'Đã ẩn',
    },
    {
      id: '12',
      code: '#MQ-072',
      title: 'Chào đón showroom thứ 5 của Livora tại trung tâm thương mại Lotte',
      iconType: 'bell',
      startDate: '01/04/2024',
      endDate: '15/04/2024',
      order: 12,
      status: 'Đã ẩn',
    },
  ];

  ngOnInit(): void {
    this.initColumns();
  }

  ngAfterViewInit(): void {
    // Re-initialize columns to ensure template references are cleanly attached
    this.initColumns();
  }

  private initColumns(): void {
    this.columns = [
      {
        key: 'code',
        label: 'MÃ',
        width: '110px',
        type: 'custom',
        cellTemplate: this.codeTemplate,
      },
      {
        key: 'title',
        label: 'THÔNG BÁO',
        type: 'custom',
        cellTemplate: this.titleTemplate,
      },
      {
        key: 'startDate',
        label: 'TỪ NGÀY',
        width: '130px',
        type: 'text',
      },
      {
        key: 'endDate',
        label: 'ĐẾN NGÀY',
        width: '130px',
        type: 'text',
      },
      {
        key: 'order',
        label: 'THỨ TỰ',
        width: '90px',
        align: 'center',
        type: 'custom',
        cellTemplate: this.orderTemplate,
      },
      {
        key: 'status',
        label: 'TRẠNG THÁI',
        width: '160px',
        align: 'center',
        type: 'badge',
      },
      {
        key: 'actions',
        label: 'THAO TÁC',
        width: '110px',
        align: 'center',
        type: 'actions',
        actions: [
          {
            id: 'edit',
            label: 'Chỉnh sửa',
            variant: 'edit',
          },
          {
            id: 'hide',
            label: 'Ẩn thông báo',
            variant: 'hide',
            show: (row: MarqueeItem) => row.status === 'Đang hoạt động',
          },
          {
            id: 'show',
            label: 'Hiện thông báo',
            variant: 'view',
            show: (row: MarqueeItem) => row.status === 'Đã ẩn',
          },
        ],
      },
    ];
  }

  // Active count & quota calculation
  get activeCount(): number {
    return this.marqueeList.filter((item) => item.status === 'Đang hoạt động').length;
  }

  get activeQuotaPercentage(): number {
    const maxQuota = 5;
    return Math.min(100, Math.round((this.activeCount / maxQuota) * 100));
  }

  // Filtered dataset
  get filteredData(): MarqueeItem[] {
    return this.marqueeList.filter((item) => {
      const matchKeyword =
        !this.filterKeyword ||
        item.title.toLowerCase().includes(this.filterKeyword.trim().toLowerCase()) ||
        item.code.toLowerCase().includes(this.filterKeyword.trim().toLowerCase());

      const matchStatus =
        this.filterStatus === 'all' || item.status === this.filterStatus;

      return matchKeyword && matchStatus;
    });
  }

  // Paginated dataset
  get paginatedData(): MarqueeItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  // Tab switching
  setTab(tab: 'marquee' | 'banner' | 'brand' | 'footer'): void {
    this.activeTab = tab;
  }

  // Filter handlers
  onFilter(): void {
    this.currentPage = 1;
  }

  onResetFilter(): void {
    this.filterKeyword = '';
    this.filterStatus = 'all';
    this.currentPage = 1;
  }

  // Pagination handler
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // Confirm dialog states
  isConfirmOpen: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  pendingAction: (() => void) | null = null;

  // Row Action handler
  handleAction(event: TableActionEvent<MarqueeItem>): void {
    const item = event.row;
    if (event.action === 'edit') {
      this.openEditModal(item);
    } else if (event.action === 'hide') {
      this.promptHideItem(item);
    } else if (event.action === 'show') {
      if (this.activeCount >= 5) {
        this.showToast('Hạn ngạch đã đạt tối đa 5 thông báo đang hoạt động!');
        return;
      }
      this.toggleStatus(item, 'Đang hoạt động');
    }
  }

  promptHideItem(item: MarqueeItem): void {
    this.confirmTitle = 'Xác nhận ẩn thông báo';
    this.confirmMessage = `Bạn có chắc chắn muốn ẩn thông báo "${item.code}" khỏi thanh chạy trang chủ không?`;
    this.pendingAction = () => this.toggleStatus(item, 'Đã ẩn');
    this.isConfirmOpen = true;
  }

  onConfirmAction(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.isConfirmOpen = false;
  }

  onCancelConfirm(): void {
    this.pendingAction = null;
    this.isConfirmOpen = false;
  }

  private toggleStatus(item: MarqueeItem, newStatus: 'Đang hoạt động' | 'Đã ẩn'): void {
    item.status = newStatus;
    this.showToast(
      newStatus === 'Đang hoạt động'
        ? `Đã kích hoạt thông báo ${item.code}`
        : `Đã ẩn thông báo ${item.code}`
    );
  }

  // Modal Open/Close
  openCreateModal(): void {
    if (this.activeCount >= 5) {
      this.showToast('Hạn ngạch đã đạt tối đa 5 thông báo! Vui lòng ẩn bớt thông báo cũ.');
    }
    this.modalMode = 'create';
    this.editingItem = null;
    const nextNum = this.marqueeList.length + 1;
    const code = `#MQ-0${nextNum < 100 ? (nextNum < 10 ? '0' + nextNum : nextNum) : nextNum}`;
    this.notificationForm = {
      code,
      title: '',
      iconType: 'truck',
      startDate: this.formatTodayDate(),
      endDate: '31/12/2024',
      order: this.activeCount + 1,
      status: this.activeCount < 5 ? 'Đang hoạt động' : 'Đã ẩn',
    };
    this.isModalOpen = true;
  }

  openEditModal(item: MarqueeItem): void {
    this.modalMode = 'edit';
    this.editingItem = item;
    this.notificationForm = { ...item };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingItem = null;
  }

  saveNotification(): void {
    if (!this.notificationForm.title?.trim()) {
      alert('Vui lòng nhập nội dung thông báo!');
      return;
    }

    if (this.modalMode === 'create') {
      const newItem: MarqueeItem = {
        id: Date.now().toString(),
        code: this.notificationForm.code || `#MQ-${Math.floor(100 + Math.random() * 900)}`,
        title: this.notificationForm.title.trim(),
        iconType: this.notificationForm.iconType || 'truck',
        startDate: this.notificationForm.startDate || this.formatTodayDate(),
        endDate: this.notificationForm.endDate || '31/12/2024',
        order: Number(this.notificationForm.order) || 1,
        status: this.notificationForm.status || 'Đang hoạt động',
      };
      this.marqueeList.unshift(newItem);
      this.showToast(`Đã thêm mới thông báo ${newItem.code}`);
    } else if (this.editingItem) {
      Object.assign(this.editingItem, {
        title: this.notificationForm.title.trim(),
        iconType: this.notificationForm.iconType,
        startDate: this.notificationForm.startDate,
        endDate: this.notificationForm.endDate,
        order: Number(this.notificationForm.order),
        status: this.notificationForm.status,
      });
      this.showToast(`Đã cập nhật thông báo ${this.editingItem.code}`);
    }

    this.closeModal();
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 3500);
  }

  private formatTodayDate(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
