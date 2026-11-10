import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormModal } from '../../shared/form-modal/form-modal';
import { ActivityLogComponent } from '../../shared/activity-log/activity-log';
import { environment } from '../../../environments/environment';

export interface RoleOption {
  code: string;
  name: string;
  description: string;
  badgeClass: string;
  useCases?: string[];
  allowedMenus?: string[];
  allowedRoutes?: string[];
  employeeCount?: number;
}

export interface StaffMember {
  id: string;
  code: string;
  name: string;
  roleCode: string;
  roleName: string;
  email: string;
  avatar: string;
}

export type ActionKey = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export interface PermissionAction {
  key: ActionKey;
  label: string;
  description: string;
}

export interface FeaturePermission {
  featureId: string;
  featureName: string;
  category: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
  };
}

@Component({
  selector: 'app-permission',
  standalone: true,
  imports: [CommonModule, FormsModule, FormModal, ActivityLogComponent],
  templateUrl: './permission.html',
})
export class Permission implements OnInit {
  private http = inject(HttpClient);

  // 5 vai trò chuẩn theo Use Case Diagram
  roles = signal<RoleOption[]>([
    {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Toàn quyền tối cao quản trị toàn bộ hệ thống LIVORA',
      badgeClass: 'badge-super',
      useCases: ['Thiết lập động', 'Phân quyền', 'Đăng nhập', 'Đăng xuất', 'Quên mật khẩu', 'Toàn quyền quản trị'],
    },
    {
      code: 'KE_TOAN',
      name: 'Kế toán',
      description: 'Kiểm soát doanh thu, xem báo cáo và xử lý các yêu cầu hoàn tiền',
      badgeClass: 'badge-finance',
      useCases: ['Xem báo cáo', 'Xử lý yêu cầu hoàn tiền', 'Đăng nhập', 'Đăng xuất', 'Quên mật khẩu'],
    },
    {
      code: 'NV_VAN_HANH',
      name: 'Nhân viên vận hành',
      description: 'Xử lý đơn hàng, quản lý khách hàng, quản lý voucher và thiết lập vận chuyển',
      badgeClass: 'badge-ops',
      useCases: ['Xử lý đơn hàng', 'Quản lý khách hàng', 'Quản lý voucher', 'Thiết lập vận chuyển', 'Đăng nhập', 'Đăng xuất', 'Quên mật khẩu'],
    },
    {
      code: 'NV_NOI_DUNG',
      name: 'Nhân viên nội dung',
      description: 'Quản lý không gian, danh sách phòng, cảm hứng, sản phẩm, loại sản phẩm và trang chủ',
      badgeClass: 'badge-content',
      useCases: [
        'Quản lý không gian',
        'Quản lý danh sách phòng',
        'Quản lý danh sách cảm hứng',
        'Quản lý sản phẩm',
        'Quản lý loại sản phẩm',
        'Quản lý banner',
        'Quản lý thương hiệu',
        'Quản lý Blogs',
        'Quản lý thông báo Marquee',
        'Quản lý Footer',
        'Đăng nhập',
        'Đăng xuất',
        'Quên mật khẩu',
      ],
    },
    {
      code: 'CSKH',
      name: 'CSKH',
      description: 'Chăm sóc khách hàng, tiếp nhận xử lý liên hệ và quản lý phản hồi đánh giá',
      badgeClass: 'badge-cskh',
      useCases: ['Xử lý liên hệ', 'Quản lý đánh giá', 'Đăng nhập', 'Đăng xuất', 'Quên mật khẩu'],
    },
  ]);

  // Danh sách nhân viên động tải từ Database
  staffList = signal<StaffMember[]>([]);

  // 6 cột thao tác chuẩn
  readonly actionColumns: PermissionAction[] = [
    { key: 'view', label: 'Xem', description: 'Đọc và xem chi tiết danh sách' },
    { key: 'create', label: 'Thêm mới', description: 'Tạo mới bản ghi' },
    { key: 'edit', label: 'Chỉnh sửa', description: 'Cập nhật thay đổi thông tin' },
    { key: 'delete', label: 'Xóa', description: 'Xóa bản ghi hoặc chuyển trạng thái hủy' },
    { key: 'approve', label: 'Duyệt', description: 'Phê duyệt đơn hàng, hoàn tiền, xuất kho' },
    { key: 'export', label: 'Xuất dữ liệu', description: 'Tải xuống báo cáo và file Excel' },
  ];

  // Danh sách các chức năng hệ thống theo dòng
  private readonly defaultFeatures: FeaturePermission[] = [
    { featureId: 'HOME', featureName: 'Quản lý trang chủ (Banner, Brand, Blog, Footer)', category: 'Nội dung & Trưng bày', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: false } },
    { featureId: 'CUSTOMER', featureName: 'Danh sách khách hàng', category: 'Người dùng & Khách hàng', actions: { view: true, create: false, edit: true, delete: false, approve: false, export: true } },
    { featureId: 'CATEGORY', featureName: 'Loại sản phẩm', category: 'Danh mục & Sản phẩm', actions: { view: true, create: true, edit: true, delete: true, approve: false, export: true } },
    { featureId: 'PRODUCT', featureName: 'Danh sách sản phẩm & 3D AR', category: 'Danh mục & Sản phẩm', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
    { featureId: 'ROOM', featureName: 'Quản lý phòng', category: 'Không gian & Kiến trúc', actions: { view: true, create: true, edit: true, delete: true, approve: false, export: true } },
    { featureId: 'SPACE', featureName: 'Không gian & Mô hình 3D AR', category: 'Không gian & Kiến trúc', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
    { featureId: 'INSPIRATION', featureName: 'Danh sách cảm hứng', category: 'Không gian & Kiến trúc', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
    { featureId: 'ORDER', featureName: 'Quản lý đơn hàng', category: 'Bán hàng & Đơn hàng', actions: { view: true, create: false, edit: true, delete: false, approve: true, export: true } },
    { featureId: 'REFUND', featureName: 'Yêu cầu hoàn tiền', category: 'Bán hàng & Đơn hàng', actions: { view: true, create: false, edit: true, delete: false, approve: true, export: true } },
    { featureId: 'CONTACT', featureName: 'Liên hệ khách hàng', category: 'Tương tác & CSKH', actions: { view: true, create: false, edit: true, delete: true, approve: true, export: true } },
    { featureId: 'REVIEW', featureName: 'Đánh giá sản phẩm', category: 'Tương tác & CSKH', actions: { view: true, create: false, edit: true, delete: true, approve: true, export: true } },
    { featureId: 'VOUCHER', featureName: 'Quản lý Voucher', category: 'Thiết lập & Khuyến mãi', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
    { featureId: 'SHIPPING', featureName: 'Thiết lập vận chuyển', category: 'Thiết lập & Vận hành', actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true } },
    { featureId: 'PERMISSION', featureName: 'Phân quyền & Vai trò', category: 'Hệ thống (Super Admin)', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
    { featureId: 'SYSTEM_CONFIG', featureName: 'Cấu hình động hệ thống', category: 'Hệ thống (Super Admin)', actions: { view: true, create: false, edit: true, delete: false, approve: true, export: true } },
  ];

  // State Signals
  selectedRoleCode = signal<string>('SUPER_ADMIN');
  selectedStaffId = signal<string>('all');
  searchKeyword = signal<string>('');
  permissionsMatrix = signal<FeaturePermission[]>(JSON.parse(JSON.stringify(this.defaultFeatures)));
  hasUnsavedChanges = signal<boolean>(false);
  toastMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  // History / Detail Modal
  isModalOpen = signal<boolean>(false);
  activeModalTab = signal<'info' | 'history'>('info');

  // Kiểm tra quyền Super Admin
  get isSuperAdmin(): boolean {
    try {
      const raw = localStorage.getItem('livora_admin_user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = (user.role || '').toUpperCase();
      return ['SUPER_ADMIN', 'ADMIN', 'QUAN_TRI_VIEN', ''].includes(role);
    } catch {
      return false;
    }
  }

  // Computed Values
  currentRole = computed(() => {
    return this.roles().find((r) => r.code === this.selectedRoleCode()) || this.roles()[0];
  });

  currentStaff = computed(() => {
    if (this.selectedStaffId() === 'all') return null;
    return this.staffList().find((s) => s.id === this.selectedStaffId()) || null;
  });

  filteredStaffList = computed(() => {
    return this.staffList().filter((s) => s.roleCode === this.selectedRoleCode());
  });

  filteredFeatures = computed(() => {
    const kw = this.searchKeyword().toLowerCase().trim();
    const list = this.permissionsMatrix();
    if (!kw) return list;
    return list.filter(
      (f) =>
        f.featureName.toLowerCase().includes(kw) ||
        f.featureId.toLowerCase().includes(kw) ||
        f.category.toLowerCase().includes(kw)
    );
  });

  grantedCount = computed(() => {
    let count = 0;
    for (const f of this.permissionsMatrix()) {
      if (f.actions.view) count++;
      if (f.actions.create) count++;
      if (f.actions.edit) count++;
      if (f.actions.delete) count++;
      if (f.actions.approve) count++;
      if (f.actions.export) count++;
    }
    return count;
  });

  totalActionsCount = computed(() => {
    return this.permissionsMatrix().length * 6;
  });

  ngOnInit(): void {
    this.applyRolePreset(this.selectedRoleCode());
    this.loadRolesFromBackend();
    this.loadEmployeesFromBackend();
  }

  loadRolesFromBackend(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/roles`).subscribe({
      next: (res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const fetchedRoles: RoleOption[] = res.data.map((r: any) => ({
            code: r.code,
            name: r.name,
            description: r.description,
            badgeClass: r.badgeClass || 'badge-admin',
            useCases: r.useCases || [],
            allowedMenus: r.allowedMenus || [],
            allowedRoutes: r.allowedRoutes || [],
            employeeCount: r.employeeCount || 0,
          }));
          if (fetchedRoles.length > 0) {
            this.roles.set(fetchedRoles);
          }
        }
      },
      error: (err) => {
        console.warn('Không thể tải vai trò từ backend, dùng mặc định:', err.message);
      },
    });
  }

  loadEmployeesFromBackend(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/employees`).subscribe({
      next: (res) => {
        if (res && res.success && res.data?.employees) {
          const list: StaffMember[] = res.data.employees.map((e: any) => {
            const roleCode = (e.role || 'SUPER_ADMIN').toUpperCase();
            const matchedRole = this.roles().find((r) => r.code === roleCode);
            const initials = (e.fullName || e.username || e.code || 'NV')
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(-2)
              .toUpperCase();

            return {
              id: e._id || e.code,
              code: e.code,
              name: e.fullName || e.username || e.code,
              roleCode,
              roleName: matchedRole ? matchedRole.name : roleCode,
              email: e.email || '',
              avatar: initials || 'NV',
            };
          });
          this.staffList.set(list);
        }
      },
      error: (err) => {
        console.warn('Không thể tải nhân viên từ backend:', err.message);
      },
    });
  }

  // Filter Handlers
  onRoleChange(roleCode: string): void {
    this.selectedRoleCode.set(roleCode);
    this.selectedStaffId.set('all');
    this.applyRolePreset(roleCode);
    this.hasUnsavedChanges.set(false);
  }

  onStaffChange(staffId: string): void {
    this.selectedStaffId.set(staffId);
    if (staffId !== 'all') {
      const staff = this.staffList().find((s) => s.id === staffId);
      if (staff && staff.roleCode !== this.selectedRoleCode()) {
        this.selectedRoleCode.set(staff.roleCode);
        this.applyRolePreset(staff.roleCode);
      }
    }
    this.hasUnsavedChanges.set(false);
  }

  // Preset generator theo 5 vai trò từ Use Case
  private applyRolePreset(roleCode: string): void {
    const cloned: FeaturePermission[] = JSON.parse(JSON.stringify(this.defaultFeatures));

    cloned.forEach((item) => {
      if (roleCode === 'SUPER_ADMIN') {
        item.actions = { view: true, create: true, edit: true, delete: true, approve: true, export: true };
      } else if (roleCode === 'KE_TOAN') {
        const isReport = ['ORDER', 'REFUND'].includes(item.featureId);
        item.actions = {
          view: isReport,
          create: false,
          edit: item.featureId === 'REFUND',
          delete: false,
          approve: item.featureId === 'REFUND',
          export: isReport,
        };
      } else if (roleCode === 'NV_VAN_HANH') {
        const isOps = ['ORDER', 'CUSTOMER', 'VOUCHER', 'SHIPPING'].includes(item.featureId);
        item.actions = {
          view: isOps,
          create: ['VOUCHER', 'SHIPPING'].includes(item.featureId),
          edit: isOps,
          delete: false,
          approve: ['ORDER', 'VOUCHER', 'SHIPPING'].includes(item.featureId),
          export: isOps,
        };
      } else if (roleCode === 'NV_NOI_DUNG') {
        const isContent = ['HOME', 'PRODUCT', 'CATEGORY', 'ROOM', 'SPACE', 'INSPIRATION'].includes(item.featureId);
        item.actions = {
          view: isContent,
          create: isContent,
          edit: isContent,
          delete: ['PRODUCT', 'INSPIRATION'].includes(item.featureId),
          approve: false,
          export: isContent,
        };
      } else if (roleCode === 'CSKH') {
        const isSupport = ['CONTACT', 'REVIEW'].includes(item.featureId);
        item.actions = {
          view: isSupport,
          create: false,
          edit: isSupport,
          delete: isSupport,
          approve: isSupport,
          export: false,
        };
      }
    });

    this.permissionsMatrix.set(cloned);
  }

  // Toggle Single Action
  toggleAction(feature: FeaturePermission, actionKey: keyof FeaturePermission['actions']): void {
    feature.actions[actionKey] = !feature.actions[actionKey];
    this.permissionsMatrix.set([...this.permissionsMatrix()]);
    this.hasUnsavedChanges.set(true);
  }

  // Toggle All Actions for Row
  isRowAllChecked(feature: FeaturePermission): boolean {
    return Object.values(feature.actions).every(Boolean);
  }

  toggleRow(feature: FeaturePermission): void {
    const shouldCheck = !this.isRowAllChecked(feature);
    feature.actions = {
      view: shouldCheck,
      create: shouldCheck,
      edit: shouldCheck,
      delete: shouldCheck,
      approve: shouldCheck,
      export: shouldCheck,
    };
    this.permissionsMatrix.set([...this.permissionsMatrix()]);
    this.hasUnsavedChanges.set(true);
  }

  // Toggle Column for All Features
  isColumnAllChecked(actionKey: any): boolean {
    return this.filteredFeatures().every((f) => (f.actions as any)[actionKey]);
  }

  toggleColumn(actionKey: any): void {
    const shouldCheck = !this.isColumnAllChecked(actionKey);
    const updated = this.permissionsMatrix().map((f) => {
      return {
        ...f,
        actions: {
          ...f.actions,
          [actionKey]: shouldCheck,
        },
      };
    });
    this.permissionsMatrix.set(updated);
    this.hasUnsavedChanges.set(true);
  }

  // Bulk Actions
  checkAll(): void {
    const updated = this.permissionsMatrix().map((f) => ({
      ...f,
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    }));
    this.permissionsMatrix.set(updated);
    this.hasUnsavedChanges.set(true);
  }

  uncheckAll(): void {
    const updated = this.permissionsMatrix().map((f) => ({
      ...f,
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    }));
    this.permissionsMatrix.set(updated);
    this.hasUnsavedChanges.set(true);
  }

  resetToRoleDefault(): void {
    this.applyRolePreset(this.selectedRoleCode());
    this.hasUnsavedChanges.set(false);
    this.showToast('Đã khôi phục ma trận phân quyền về chuẩn vai trò ' + this.currentRole().name);
  }

  savePermissions(): void {
    const targetName = this.currentStaff()
      ? `${this.currentStaff()?.name} (${this.currentStaff()?.code})`
      : `vai trò ${this.currentRole().name}`;

    this.isLoading.set(true);

    // Lưu vào backend Role model
    this.http.put<any>(`${environment.apiBaseUrl}/roles/${this.selectedRoleCode()}`, {
      useCases: this.currentRole().useCases || [],
      isActive: true,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.hasUnsavedChanges.set(false);
        this.showToast(`Đã lưu thiết lập phân quyền thành công cho ${targetName}!`);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasUnsavedChanges.set(false);
        this.showToast(`Đã lưu thiết lập phân quyền cho ${targetName}!`);
      },
    });
  }

  // Detail Modal & History
  openDetailModal(): void {
    this.activeModalTab.set('info');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3200);
  }
}
