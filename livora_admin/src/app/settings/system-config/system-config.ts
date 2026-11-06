import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormModal } from '../../shared/form-modal/form-modal';
import { ActivityLogComponent } from '../../shared/activity-log/activity-log';

export interface SystemConfigItem {
  id: string;
  key: string;
  name: string;        // Trường 1: Tên cấu hình (Set cứng)
  value: string | number; // Trường 2: Thông số (Cho phép edit và lưu)
  originalValue: string | number;
  unit: string;        // Trường 3: Đơn vị (Set cứng)
  category: string;
  description: string;
  exampleText: string;
  updatedAt: string;
  updatedBy: string;
}

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [CommonModule, FormsModule, FormModal, ActivityLogComponent],
  templateUrl: './system-config.html',
})
export class SystemConfig {
  // Danh sách cấu hình hệ thống chuẩn theo phân tích
  private readonly initialConfigs: SystemConfigItem[] = [
    {
      id: 'CFG-001',
      key: 'PAYMENT_TIMEOUT_MINUTES',
      name: 'Thời gian giữ đơn hàng chờ thanh toán',
      value: 5,
      originalValue: 5,
      unit: 'phút',
      category: 'Đơn hàng & Thanh toán',
      description: 'Khoảng thời gian giữ sản phẩm và đơn hàng chờ khách thanh toán qua cổng VNPay/MoMo trước khi tự động hủy',
      exampleText: 'Thanh toán trong vòng 5 phút',
      updatedAt: '06/11/2026 14:30',
      updatedBy: 'SUPER ADMIN',
    },
    {
      id: 'CFG-002',
      key: 'ORDER_RETURN_DAYS',
      name: 'Thời hạn cho phép yêu cầu đổi trả hàng',
      value: 7,
      originalValue: 7,
      unit: 'ngày',
      category: 'Đơn hàng & Thanh toán',
      description: 'Số ngày tối đa tính từ lúc khách nhận hàng để gửi yêu cầu hoàn tiền hoặc trả hàng',
      exampleText: 'Yêu cầu đổi trả trong vòng 7 ngày',
      updatedAt: '06/11/2026 10:15',
      updatedBy: 'QUẢN TRỊ VIÊN',
    },
    {
      id: 'CFG-003',
      key: 'MAX_3D_MODEL_FILE_SIZE_MB',
      name: 'Dung lượng tải lên tối đa tệp mô hình 3D AR (.GLB)',
      value: 50,
      originalValue: 50,
      unit: 'MB',
      category: 'Mô hình 3D AR & Media',
      description: 'Giới hạn dung lượng tệp .glb để tối ưu hóa tốc độ tải trang và trải nghiệm AR trên thiết bị di động',
      exampleText: 'Tải tệp không vượt quá 50 MB',
      updatedAt: '05/11/2026 17:00',
      updatedBy: 'NHÂN VIÊN NỘI DUNG',
    },
    {
      id: 'CFG-004',
      key: 'AUTO_COMPLETE_ORDER_DAYS',
      name: 'Thời gian tự động xác nhận hoàn tất đơn giao',
      value: 3,
      originalValue: 3,
      unit: 'ngày',
      category: 'Vận chuyển & Vận hành',
      description: 'Sau khi đơn vị vận chuyển báo giao thành công, đơn sẽ tự động chuyển thành Hoàn tất nếu khách không khiếu nại',
      exampleText: 'Tự động hoàn tất sau 3 ngày nhận hàng',
      updatedAt: '04/11/2026 09:20',
      updatedBy: 'NHÂN VIÊN VẬN HÀNH',
    },
    {
      id: 'CFG-005',
      key: 'LOYALTY_POINTS_PER_100K',
      name: 'Điểm tích lũy thành viên cho mỗi 100.000 VNĐ chi tiêu',
      value: 1,
      originalValue: 1,
      unit: 'điểm',
      category: 'Tài khoản & Hội viên',
      description: 'Hệ thống tự động cộng điểm thưởng vào tài khoản khách hàng tương ứng với giá trị đơn hàng thực tế',
      exampleText: 'Tích lũy 1 điểm mỗi 100.000 VNĐ',
      updatedAt: '03/11/2026 11:45',
      updatedBy: 'QUẢN TRỊ VIÊN',
    },
    {
      id: 'CFG-006',
      key: 'DEFAULT_STANDARD_SHIPPING_FEE',
      name: 'Phí vận chuyển tiêu chuẩn mặc định',
      value: 30000,
      originalValue: 30000,
      unit: 'VNĐ',
      category: 'Vận chuyển & Vận hành',
      description: 'Mức phí giao hàng tiêu chuẩn áp dụng cho các đơn hàng thông thường khi chưa tính phụ phí cồng kềnh',
      exampleText: 'Phí ship cơ bản 30.000 VNĐ',
      updatedAt: '02/11/2026 15:30',
      updatedBy: 'KẾ TOÁN',
    },
    {
      id: 'CFG-007',
      key: 'FREE_SHIPPING_MIN_ORDER_VALUE',
      name: 'Giá trị đơn hàng tối thiểu để được miễn phí vận chuyển',
      value: 5000000,
      originalValue: 5000000,
      unit: 'VNĐ',
      category: 'Đơn hàng & Thanh toán',
      description: 'Hệ thống tự động áp dụng miễn phí ship toàn quốc nếu tổng thanh toán sản phẩm đạt ngưỡng này',
      exampleText: 'Freeship cho đơn từ 5.000.000 VNĐ',
      updatedAt: '01/11/2026 16:00',
      updatedBy: 'SUPER ADMIN',
    },
    {
      id: 'CFG-008',
      key: 'MAX_VOUCHER_TRY_PER_HOUR',
      name: 'Số lượt thử nhập mã voucher tối đa trong 1 giờ',
      value: 10,
      originalValue: 10,
      unit: 'lần',
      category: 'Bảo mật & Hệ thống',
      description: 'Hạn chế các hành vi dò mã giảm giá tự động hoặc spam mã khuyến mãi từ cùng một tài khoản / IP',
      exampleText: 'Tối đa 10 lần thử mã / giờ',
      updatedAt: '31/10/2026 14:10',
      updatedBy: 'SUPER ADMIN',
    },
    {
      id: 'CFG-009',
      key: 'ADMIN_SESSION_TIMEOUT_MINUTES',
      name: 'Thời gian chờ hết hạn phiên đăng nhập quản trị',
      value: 120,
      originalValue: 120,
      unit: 'phút',
      category: 'Bảo mật & Hệ thống',
      description: 'Sau khoảng thời gian không tương tác, phiên quản trị viên sẽ tự động đăng xuất để đảm bảo an toàn dữ liệu',
      exampleText: 'Tự động đăng xuất sau 120 phút',
      updatedAt: '30/10/2026 18:20',
      updatedBy: 'SUPER ADMIN',
    },
    {
      id: 'CFG-010',
      key: 'CUSTOM_DESIGN_MIN_DEPOSIT_PERCENT',
      name: 'Tỷ lệ đặt cọc tối thiểu cho đơn thiết kế đặt làm riêng',
      value: 30,
      originalValue: 30,
      unit: 'tiền cọc (%)',
      category: 'Đơn hàng & Thanh toán',
      description: 'Phần trăm khách hàng bắt buộc phải cọc trước khi xưởng bắt đầu sản xuất đồ gỗ nội thất theo thiết kế AR',
      exampleText: 'Đặt cọc tối thiểu 30% giá trị',
      updatedAt: '28/10/2026 08:50',
      updatedBy: 'KẾ TOÁN',
    },
    {
      id: 'CFG-011',
      key: 'MAX_INSPIRATION_PINS_COUNT',
      name: 'Số điểm ghim sản phẩm tối đa trên 1 ảnh cảm hứng',
      value: 12,
      originalValue: 12,
      unit: 'điểm',
      category: 'Mô hình 3D AR & Media',
      description: 'Giới hạn số điểm hotspot gắn trên phối cảnh để giao diện tương tác trực quan và không bị chồng chéo',
      exampleText: 'Tối đa 12 điểm ghim / ảnh',
      updatedAt: '26/10/2026 13:40',
      updatedBy: 'NHÂN VIÊN NỘI DUNG',
    },
    {
      id: 'CFG-012',
      key: 'AUTO_CANCEL_UNPAID_ORDER_HOURS',
      name: 'Thời gian tự động hủy đơn đặt cọc chưa chuyển khoản',
      value: 24,
      originalValue: 24,
      unit: 'giờ',
      category: 'Đơn hàng & Thanh toán',
      description: 'Đơn hàng chọn hình thức chuyển khoản thủ công sau thời gian này nếu chưa có ủy nhiệm chi sẽ tự hủy',
      exampleText: 'Tự hủy sau 24 giờ không chuyển khoản',
      updatedAt: '25/10/2026 10:00',
      updatedBy: 'KẾ TOÁN',
    },
  ];

  // State Signals
  configs = signal<SystemConfigItem[]>(JSON.parse(JSON.stringify(this.initialConfigs)));
  searchKeyword = signal<string>('');
  selectedCategory = signal<string>('all');
  toastMessage = signal<string>('');

  // Categories list
  readonly categories: string[] = [
    'Tất cả nhóm',
    'Đơn hàng & Thanh toán',
    'Vận chuyển & Vận hành',
    'Mô hình 3D AR & Media',
    'Tài khoản & Hội viên',
    'Bảo mật & Hệ thống',
  ];

  // Modal State
  selectedConfig = signal<SystemConfigItem | null>(null);
  activeModalTab = signal<'info' | 'history'>('info');

  // Computed Values
  filteredConfigs = computed(() => {
    const kw = this.searchKeyword().toLowerCase().trim();
    const cat = this.selectedCategory();
    let list = this.configs();

    if (cat !== 'all' && cat !== 'Tất cả nhóm') {
      list = list.filter((c) => c.category === cat);
    }

    if (kw) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.key.toLowerCase().includes(kw) ||
          c.description.toLowerCase().includes(kw) ||
          c.unit.toLowerCase().includes(kw)
      );
    }

    return list;
  });

  hasChanges = computed(() => {
    return this.configs().some((c) => String(c.value) !== String(c.originalValue));
  });

  changedCount = computed(() => {
    return this.configs().filter((c) => String(c.value) !== String(c.originalValue)).length;
  });

  // Action Methods
  isItemChanged(item: SystemConfigItem): boolean {
    return String(item.value) !== String(item.originalValue);
  }

  saveItem(item: SystemConfigItem): void {
    item.originalValue = item.value;
    item.updatedAt = new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    item.updatedBy = 'SUPER ADMIN';

    this.configs.set([...this.configs()]);
    this.showToast(`Đã lưu thành công: "${item.name}" thành ${item.value} ${item.unit}!`);
  }

  resetItem(item: SystemConfigItem): void {
    item.value = item.originalValue;
    this.configs.set([...this.configs()]);
    this.showToast(`Đã hoàn tác thông số cấu hình "${item.name}".`);
  }

  saveAll(): void {
    const nowStr = new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updated = this.configs().map((c) => {
      if (String(c.value) !== String(c.originalValue)) {
        return {
          ...c,
          originalValue: c.value,
          updatedAt: nowStr,
          updatedBy: 'SUPER ADMIN',
        };
      }
      return c;
    });

    this.configs.set(updated);
    this.showToast('Đã lưu toàn bộ các thông số cấu hình hệ thống thành công!');
  }

  resetAll(): void {
    const updated = this.configs().map((c) => ({
      ...c,
      value: c.originalValue,
    }));
    this.configs.set(updated);
    this.showToast('Đã khôi phục toàn bộ thông số về mặc định.');
  }

  // Modal details & history
  openDetail(item: SystemConfigItem): void {
    this.selectedConfig.set(item);
    this.activeModalTab.set('info');
  }

  closeModal(): void {
    this.selectedConfig.set(null);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set('');
    }, 3200);
  }
}

