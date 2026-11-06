import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormModal } from '../../shared/form-modal/form-modal';
import { ActivityLogComponent } from '../../shared/activity-log/activity-log';

export interface RoleOption {
  code: string;
  name: string;
  description: string;
  badgeClass: string;
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
export class Permission {
  // 6 vai trò chính xác theo phân tích hệ thống
  readonly roles: RoleOption[] = [
    { code: 'SUPER_ADMIN', name: 'SUPER ADMIN', description: 'Toàn quyền tối cao trên toàn bộ hệ thống LIVORA', badgeClass: 'badge-super' },
    { code: 'QUAN_TRI_VIEN', name: 'QUẢN TRỊ VIÊN', description: 'Quản lý toàn bộ danh mục, vận hành, người dùng và báo cáo', badgeClass: 'badge-admin' },
    { code: 'KE_TOAN', name: 'KẾ TOÁN', description: 'Kiểm soát doanh thu, đối soát thanh toán và xử lý yêu cầu hoàn tiền', badgeClass: 'badge-finance' },
    { code: 'NHAN_VIEN_VAN_HANH', name: 'NHÂN VIÊN VẬN HÀNH', description: 'Theo dõi xử lý đơn hàng, đóng gói, bàn giao vận chuyển và kho', badgeClass: 'badge-ops' },
    { code: 'NHAN_VIEN_NOI_DUNG', name: 'NHÂN VIÊN NỘI DUNG', description: 'Biên tập sản phẩm, mô hình 3D AR, phối cảnh cảm hứng và trang chủ', badgeClass: 'badge-content' },
    { code: 'CSKH', name: 'CSKH', description: 'Chăm sóc khách hàng, giải đáp liên hệ, phản hồi đánh giá và hỗ trợ khiếu nại', badgeClass: 'badge-cskh' },
  ];

  // Danh sách nhân viên mẫu
  readonly staffList: StaffMember[] = [
    { id: 'NV001', code: 'NV-LIV-001', name: 'Nguyễn Văn An', roleCode: 'SUPER_ADMIN', roleName: 'SUPER ADMIN', email: 'an.nguyen@livora.vn', avatar: 'NA' },
    { id: 'NV002', code: 'NV-LIV-002', name: 'Trần Thị Mai', roleCode: 'KE_TOAN', roleName: 'KẾ TOÁN', email: 'mai.tran@livora.vn', avatar: 'TM' },
    { id: 'NV003', code: 'NV-LIV-003', name: 'Lê Hoàng Nam', roleCode: 'NHAN_VIEN_VAN_HANH', roleName: 'NHÂN VIÊN VẬN HÀNH', email: 'nam.le@livora.vn', avatar: 'LN' },
    { id: 'NV004', code: 'NV-LIV-004', name: 'Phạm Minh Đức', roleCode: 'QUAN_TRI_VIEN', roleName: 'QUẢN TRỊ VIÊN', email: 'duc.pham@livora.vn', avatar: 'MD' },
    { id: 'NV005', code: 'NV-LIV-005', name: 'Đặng Thu Hà', roleCode: 'NHAN_VIEN_NOI_DUNG', roleName: 'NHÂN VIÊN NỘI DUNG', email: 'ha.dang@livora.vn', avatar: 'TH' },
    { id: 'NV006', code: 'NV-LIV-006', name: 'Vũ Thùy Linh', roleCode: 'CSKH', roleName: 'CSKH', email: 'linh.vu@livora.vn', avatar: 'TL' },
    { id: 'NV007', code: 'NV-LIV-007', name: 'Bùi Tiến Dũng', roleCode: 'NHAN_VIEN_VAN_HANH', roleName: 'NHÂN VIÊN VẬN HÀNH', email: 'dung.bui@livora.vn', avatar: 'TD' },
  ];

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
    { featureId: 'HOME', featureName: 'Quản lý trang chủ', category: 'Nội dung & Trưng bày', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: false } },
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
    { featureId: 'PERMISSION', featureName: 'Phân quyền & Vai trò', category: 'Hệ thống', actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true } },
    { featureId: 'SYSTEM_CONFIG', featureName: 'Cấu hình động hệ thống', category: 'Hệ thống', actions: { view: true, create: false, edit: true, delete: false, approve: true, export: true } },
  ];

  // State Signals
  selectedRoleCode = signal<string>('KE_TOAN');
  selectedStaffId = signal<string>('all');
  searchKeyword = signal<string>('');
  permissionsMatrix = signal<FeaturePermission[]>(JSON.parse(JSON.stringify(this.defaultFeatures)));
  hasUnsavedChanges = signal<boolean>(false);
  toastMessage = signal<string>('');

  // History / Detail Modal
  isModalOpen = signal<boolean>(false);
  activeModalTab = signal<'info' | 'history'>('info');

  // Computed Values
  currentRole = computed(() => {
    return this.roles.find((r) => r.code === this.selectedRoleCode()) || this.roles[0];
  });

  currentStaff = computed(() => {
    if (this.selectedStaffId() === 'all') return null;
    return this.staffList.find((s) => s.id === this.selectedStaffId()) || null;
  });

  filteredStaffList = computed(() => {
    return this.staffList.filter((s) => s.roleCode === this.selectedRoleCode());
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

  constructor() {
    this.applyRolePreset(this.selectedRoleCode());
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
      const staff = this.staffList.find((s) => s.id === staffId);
      if (staff && staff.roleCode !== this.selectedRoleCode()) {
        this.selectedRoleCode.set(staff.roleCode);
        this.applyRolePreset(staff.roleCode);
      }
    }
    this.hasUnsavedChanges.set(false);
  }

  // Preset generator by 6 roles
  private applyRolePreset(roleCode: string): void {
    const cloned: FeaturePermission[] = JSON.parse(JSON.stringify(this.defaultFeatures));

    cloned.forEach((item) => {
      if (roleCode === 'SUPER_ADMIN') {
        item.actions = { view: true, create: true, edit: true, delete: true, approve: true, export: true };
      } else if (roleCode === 'QUAN_TRI_VIEN') {
        item.actions = {
          view: true,
          create: item.featureId !== 'SYSTEM_CONFIG',
          edit: true,
          delete: !['PERMISSION', 'SYSTEM_CONFIG'].includes(item.featureId),
          approve: true,
          export: true,
        };
      } else if (roleCode === 'KE_TOAN') {
        const isFinance = ['ORDER', 'REFUND', 'VOUCHER'].includes(item.featureId);
        item.actions = {
          view: true,
          create: item.featureId === 'VOUCHER',
          edit: isFinance,
          delete: false,
          approve: ['ORDER', 'REFUND'].includes(item.featureId),
          export: true,
        };
      } else if (roleCode === 'NHAN_VIEN_VAN_HANH') {
        const isOps = ['ORDER', 'SHIPPING', 'PRODUCT'].includes(item.featureId);
        item.actions = {
          view: ['ORDER', 'SHIPPING', 'PRODUCT', 'ROOM', 'SPACE', 'CUSTOMER'].includes(item.featureId),
          create: false,
          edit: isOps,
          delete: false,
          approve: ['ORDER', 'SHIPPING'].includes(item.featureId),
          export: isOps,
        };
      } else if (roleCode === 'NHAN_VIEN_NOI_DUNG') {
        const isContent = ['HOME', 'PRODUCT', 'CATEGORY', 'ROOM', 'SPACE', 'INSPIRATION'].includes(item.featureId);
        item.actions = {
          view: true,
          create: isContent,
          edit: isContent,
          delete: ['INSPIRATION'].includes(item.featureId),
          approve: false,
          export: isContent,
        };
      } else if (roleCode === 'CSKH') {
        const isSupport = ['CONTACT', 'REVIEW', 'CUSTOMER', 'ORDER'].includes(item.featureId);
        item.actions = {
          view: isSupport,
          create: false,
          edit: ['CONTACT', 'REVIEW'].includes(item.featureId),
          delete: false,
          approve: ['CONTACT', 'REVIEW'].includes(item.featureId),
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

    this.hasUnsavedChanges.set(false);
    this.showToast(`Đã lưu thiết lập phân quyền thành công cho ${targetName}!`);
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

