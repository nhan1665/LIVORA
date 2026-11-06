import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, CustomerAddress } from '../../services/auth.service';
import { UserOrderService, UserOrder, UserOrderItem } from '../../services/user-order.service';
import { ReviewService, UserReviewItem } from '../../services/review.service';
import { VIETNAM_PROVINCE_NAMES, getWardsForProvince } from '../../shared/data/vietnam-locations';

@Component({
  selector: 'app-module-5',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './module-5.html',
  styleUrl: './module-5.css',
})
export class Module5 implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  public readonly authService = inject(AuthService);
  private readonly userOrderService = inject(UserOrderService);
  private readonly reviewService = inject(ReviewService);
  private readonly cdr = inject(ChangeDetectorRef);

  isEditingPersonal = false;
  isAddingAddress = false;
  activeTab: 'personal' | 'history' | 'reviews' = 'personal';
  activeFilter = 'all';
  reviewFilter: 'not_reviewed' | 'reviewed' = 'not_reviewed';
  showLogoutConfirm = false;
  profileForm = { fullName: '', phone: '', birthDate: '', gender: '' };
  profileError = '';
  profileSuccess = '';
  profileLoading = false;
  profileSaving = false;

  // State Đơn hàng & Đánh giá thật từ Database
  orders: UserOrder[] = [];
  userReviews: UserReviewItem[] = [];
  loadingOrders = false;
  loadingReviews = false;
  reviewedKeys = new Set<string>();

  // Modal Đánh giá
  isReviewModalOpen = false;
  reviewingTarget: {
    orderId: string;
    orderCode: string;
    productId: string;
    productName: string;
    productThumbnail: string;
    sku: string;
  } | null = null;
  reviewRating = 5;
  reviewComment = '';
  reviewImages: string[] = [];
  reviewVideos: string[] = [];
  reviewSubmitting = false;
  reviewModalError = '';

  get addresses(): CustomerAddress[] {
    return this.authService.currentUser()?.addresses || [];
  }

  async ngOnInit(): Promise<void> {
    this.profileLoading = true;
    this.cdr.detectChanges();

    // Hỗ trợ query params: /profile?tab=reviews hoặc tab=history
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'reviews' || params['tab'] === 'history' || params['tab'] === 'personal') {
        this.activeTab = params['tab'];
      }
      this.cdr.detectChanges();
    });

    try {
      const user = await this.authService.refreshProfile();
      this.setProfileForm(user);
      this.loadUserOrders();
      this.loadUserReviews();
    } catch (error) {
      this.profileError = error instanceof Error ? error.message : 'Không thể tải hồ sơ.';
    } finally {
      this.profileLoading = false;
      this.cdr.detectChanges();
    }
  }

  private setProfileForm(user: { fullName: string; phone: string; birthDate?: string | null; gender?: string }): void {
    this.profileForm = {
      fullName: user.fullName || '',
      phone: user.phone || '',
      birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
      gender: user.gender || '',
    };
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        const base64 = e.target.result as string;
        try {
          await this.authService.updateProfile({ avatar: base64 });
          this.cdr.detectChanges();
        } catch (err: any) {
          alert(err.message || 'Không thể cập nhật ảnh đại diện.');
        }
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  startProfileEdit(): void {
    const user = this.authService.currentUser();
    if (user) this.setProfileForm(user);
    this.profileError = '';
    this.profileSuccess = '';
    this.isEditingPersonal = true;
    this.cdr.detectChanges();
  }

  cancelProfileEdit(): void {
    this.isEditingPersonal = false;
    this.profileError = '';
    this.cdr.detectChanges();
  }

  async saveProfile(): Promise<void> {
    const fullName = this.profileForm.fullName.trim();
    const phone = this.profileForm.phone.trim();

    if (fullName.length > 120) {
      this.profileError = 'Họ tên không được vượt quá 120 ký tự.';
      return;
    }

    if (phone && !/^0\d{9,10}$/.test(phone)) {
      this.profileError = 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).';
      return;
    }

    this.profileSaving = true;
    this.profileError = '';
    this.profileSuccess = '';
    this.cdr.detectChanges();

    try {
      const user = await this.authService.updateProfile({
        fullName,
        phone,
        birthDate: this.profileForm.birthDate || null,
        gender: this.profileForm.gender,
      });
      this.setProfileForm(user);
      this.isEditingPersonal = false;
      this.profileSuccess = 'Đã lưu thông tin cá nhân vào cơ sở dữ liệu thành công.';
    } catch (error) {
      this.profileError = error instanceof Error ? error.message : 'Không thể lưu hồ sơ.';
    } finally {
      this.profileSaving = false;
      this.cdr.detectChanges();
    }
  }

  // Quản lý địa chỉ giao hàng
  provinces: string[] = VIETNAM_PROVINCE_NAMES;
  availableAddressWards: string[] = [];

  addressForm = {
    recipientName: '',
    recipientPhone: '',
    province: '',
    district: '',
    ward: '',
    addressLine: '',
    isDefault: false,
  };
  addressSaving = false;
  addressError = '';

  openAddAddress(): void {
    this.startAddAddress();
  }

  onAddressProvinceChange(): void {
    if (this.addressForm.province) {
      this.availableAddressWards = getWardsForProvince(this.addressForm.province);
      if (!this.availableAddressWards.includes(this.addressForm.ward)) {
        this.addressForm.ward = '';
      }
    } else {
      this.availableAddressWards = [];
      this.addressForm.ward = '';
    }
    this.cdr.detectChanges();
  }

  resetAddressForm(): void {
    const user = this.authService.currentUser();
    this.addressForm = {
      recipientName: user?.fullName || '',
      recipientPhone: user?.phone || '',
      province: '',
      district: '',
      ward: '',
      addressLine: '',
      isDefault: false,
    };
    this.availableAddressWards = [];
    this.addressError = '';
    this.cdr.detectChanges();
  }

  startAddAddress(): void {
    this.resetAddressForm();
    this.isAddingAddress = true;
    this.cdr.detectChanges();
  }

  cancelAddAddress(): void {
    this.isAddingAddress = false;
    this.resetAddressForm();
    this.cdr.detectChanges();
  }

  async saveNewAddress(): Promise<void> {
    const { recipientName, recipientPhone, province, ward, addressLine, isDefault } = this.addressForm;

    if (!recipientName.trim()) {
      this.addressError = 'Vui lòng nhập tên người nhận.';
      return;
    }
    if (!recipientPhone.trim() || !/^0\d{9,10}$/.test(recipientPhone.trim())) {
      this.addressError = 'Số điện thoại người nhận không hợp lệ (10 số, bắt đầu bằng 0).';
      return;
    }
    if (!province) {
      this.addressError = 'Vui lòng chọn Tỉnh / Thành phố.';
      return;
    }
    if (!ward) {
      this.addressError = 'Vui lòng chọn Phường / Xã.';
      return;
    }
    if (!addressLine.trim()) {
      this.addressError = 'Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường).';
      return;
    }

    this.addressSaving = true;
    this.addressError = '';
    this.cdr.detectChanges();

    try {
      const currentAddresses = [...(this.addresses || [])];
      const newAddressItem: CustomerAddress = {
        addressId: 'addr_' + Date.now(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        fullName: recipientName.trim(),
        phone: recipientPhone.trim(),
        province,
        district: ward,
        ward,
        addressLine: addressLine.trim(),
        street: addressLine.trim(),
        isDefault: isDefault || currentAddresses.length === 0,
      };

      if (newAddressItem.isDefault) {
        currentAddresses.forEach((a) => (a.isDefault = false));
      }
      currentAddresses.push(newAddressItem);

      await this.authService.updateProfile({ addresses: currentAddresses });
      this.isAddingAddress = false;
      this.resetAddressForm();
      this.profileSuccess = 'Đã thêm địa chỉ giao hàng mới thành công.';
    } catch (error) {
      this.addressError = error instanceof Error ? error.message : 'Không thể lưu địa chỉ.';
    } finally {
      this.addressSaving = false;
      this.cdr.detectChanges();
    }
  }

  async setDefaultAddress(idOrIndex: any): Promise<void> {
    try {
      const currentAddresses = (this.addresses || []).map((addr, idx) => {
        const isTarget = typeof idOrIndex === 'number'
          ? idx === idOrIndex
          : (addr.addressId === idOrIndex || (addr as any).id === idOrIndex || (addr as any)._id === idOrIndex);
        return {
          ...addr,
          isDefault: isTarget,
        };
      });

      await this.authService.updateProfile({ addresses: currentAddresses });
      this.profileSuccess = 'Đã cập nhật địa chỉ mặc định.';
      this.cdr.detectChanges();
    } catch (error) {
      this.profileError = error instanceof Error ? error.message : 'Không thể đặt mặc định.';
      this.cdr.detectChanges();
    }
  }

  async deleteAddress(idOrIndex: any): Promise<void> {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      const currentAddresses = (this.addresses || []).filter((addr, idx) => {
        if (typeof idOrIndex === 'number') return idx !== idOrIndex;
        return addr.addressId !== idOrIndex && (addr as any).id !== idOrIndex && (addr as any)._id !== idOrIndex;
      });

      await this.authService.updateProfile({ addresses: currentAddresses });
      this.profileSuccess = 'Đã xóa địa chỉ thành công.';
      this.cdr.detectChanges();
    } catch (error) {
      this.profileError = error instanceof Error ? error.message : 'Không thể xóa địa chỉ.';
      this.cdr.detectChanges();
    }
  }

  // Tải danh sách đơn hàng thật từ Database
  loadUserOrders(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.loadingOrders = true;
    this.cdr.detectChanges();
    this.userOrderService.getUserOrders(user.id, user.phone).subscribe({
      next: (orders: UserOrder[]) => {
        this.orders = orders || [];
        this.loadingOrders = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Không thể tải đơn hàng:', err);
        this.loadingOrders = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Tải danh sách đánh giá của khách hàng từ Database
  loadUserReviews(): void {
    const user = this.authService.currentUser();
    this.loadingReviews = true;
    this.cdr.detectChanges();
    this.reviewService.getCustomerReviews(user?.id, user?.phone).subscribe({
      next: (reviews: UserReviewItem[]) => {
        this.userReviews = reviews || [];
        this.loadingReviews = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Không thể tải danh sách đánh giá:', err);
        this.loadingReviews = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Lọc đơn hàng theo tab trạng thái
  get filteredOrders(): UserOrder[] {
    if (this.activeFilter === 'all') return this.orders;
    if (this.activeFilter === 'pending') {
      return this.orders.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.orderStatus));
    }
    if (this.activeFilter === 'delivering') {
      return this.orders.filter((o) => o.orderStatus === 'shipping');
    }
    return this.orders.filter((o) => o.orderStatus === this.activeFilter);
  }

  // Kiểm tra xem sản phẩm trong đơn hàng đã được đánh giá hay chưa
  isItemReviewed(orderId: any, itemOrProductId: any): boolean {
    const oId = orderId ? String(orderId).trim() : '';
    let pId = '';
    let pName = '';
    let pSku = '';

    if (itemOrProductId && typeof itemOrProductId === 'object') {
      pId = itemOrProductId.productId ? String(itemOrProductId.productId).trim() : '';
      pName = (itemOrProductId.productName || itemOrProductId.name || '').trim().toLowerCase();
      pSku = (itemOrProductId.sku || '').trim().toLowerCase();
    } else if (itemOrProductId) {
      pId = String(itemOrProductId).trim();
    }

    // 1. Kiểm tra cache đánh giá tức thời (Optimistic)
    if (oId && pId && this.reviewedKeys.has(`${oId}_${pId}`)) return true;
    if (oId && pSku && this.reviewedKeys.has(`${oId}_${pSku}`)) return true;
    if (oId && pName && this.reviewedKeys.has(`${oId}_${pName}`)) return true;

    // 2. Kiểm tra trong danh sách đánh giá từ database
    return this.userReviews.some((r) => {
      const revOrderId = r.orderId ? String(r.orderId).trim() : '';
      const matchOrder = !revOrderId || !oId || revOrderId === oId;
      if (!matchOrder) return false;

      // Khớp theo ID sản phẩm
      if (pId && pId !== '[object Object]' && r.productId && String(r.productId).trim() === pId) {
        return true;
      }
      // Khớp dự phòng theo SKU
      if (pSku && r.productSku && r.productSku.trim().toLowerCase() === pSku) {
        return true;
      }
      // Khớp dự phòng theo Tên sản phẩm
      if (pName && r.productName && r.productName.trim().toLowerCase() === pName) {
        return true;
      }

      return false;
    });
  }

  // Lấy danh sách sản phẩm chưa đánh giá từ các đơn hàng đã giao (orderStatus === 'delivered')
  get unreviewedItems(): { order: UserOrder; item: UserOrderItem }[] {
    const deliveredOrders = this.orders.filter((o) => o.orderStatus === 'delivered');
    const list: { order: UserOrder; item: UserOrderItem }[] = [];
    for (const order of deliveredOrders) {
      for (const item of order.items || []) {
        if (!this.isItemReviewed(order.id || order._id, item)) {
          list.push({ order, item });
        }
      }
    }
    return list;
  }

  // Lấy danh sách sản phẩm đã đánh giá
  get reviewedItems(): UserReviewItem[] {
    return this.userReviews;
  }

  // Mở modal đánh giá
  openReviewModal(order: UserOrder, item: UserOrderItem): void {
    this.reviewingTarget = {
      orderId: order.id || order._id,
      orderCode: order.orderCode,
      productId: item.productId,
      productName: item.productName || item.name,
      productThumbnail: item.thumbnail || item.image,
      sku: item.sku || '',
    };
    this.reviewRating = 5;
    this.reviewComment = '';
    this.reviewImages = [];
    this.reviewVideos = [];
    this.reviewModalError = '';
    this.isReviewModalOpen = true;
    this.cdr.detectChanges();
  }

  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.reviewingTarget = null;
    this.reviewImages = [];
    this.reviewVideos = [];
    this.reviewModalError = '';
    this.cdr.detectChanges();
  }

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
    this.cdr.detectChanges();
  }

  // Xử lý chọn hình ảnh (tối đa 5 ảnh, <= 5MB mỗi ảnh)
  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    if (this.reviewImages.length + files.length > 5) {
      this.reviewModalError = 'Bạn chỉ có thể tải lên tối đa 5 hình ảnh.';
      this.cdr.detectChanges();
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        this.reviewModalError = `Ảnh "${file.name}" vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`;
        this.cdr.detectChanges();
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.reviewImages.push(e.target.result as string);
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeReviewImage(index: number): void {
    this.reviewImages.splice(index, 1);
    this.cdr.detectChanges();
  }

  // Xử lý chọn video (tối đa 1 video, <= 20MB)
  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    if (this.reviewVideos.length + files.length > 1) {
      this.reviewModalError = 'Bạn chỉ có thể tải lên tối đa 1 video.';
      this.cdr.detectChanges();
      return;
    }

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        this.reviewModalError = `Video "${file.name}" vượt quá 20MB. Vui lòng chọn video có dung lượng nhỏ hơn.`;
        this.cdr.detectChanges();
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.reviewVideos.push(e.target.result as string);
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeReviewVideo(index: number): void {
    this.reviewVideos.splice(index, 1);
    this.cdr.detectChanges();
  }

  submitProductReview(): void {
    if (!this.reviewingTarget) return;
    const comment = this.reviewComment.trim();
    if (!comment) {
      this.reviewModalError = 'Vui lòng nhập nội dung đánh giá của bạn.';
      this.cdr.detectChanges();
      return;
    }

    const user = this.authService.currentUser();
    this.reviewSubmitting = true;
    this.reviewModalError = '';
    this.cdr.detectChanges();

    const target = { ...this.reviewingTarget };
    const selectedImgs = [...this.reviewImages];
    const selectedVids = [...this.reviewVideos];
    const selectedRate = this.reviewRating;

    const payload = {
      productId: target.productId,
      productName: target.productName,
      productThumbnail: target.productThumbnail,
      productSku: target.sku,
      orderId: target.orderId,
      customerId: user?.id,
      customerName: user?.fullName || user?.email || 'Khách hàng Livora',
      customerPhone: user?.phone || '',
      rating: selectedRate,
      comment: comment,
      images: selectedImgs,
      videos: selectedVids,
    };

    this.reviewService.submitReview(payload).subscribe({
      next: (res: any) => {
        this.reviewSubmitting = false;

        // Lưu khóa để đổi trạng thái tức thời không cần chờ reload
        const oId = target.orderId ? String(target.orderId).trim() : '';
        const pId = target.productId ? String(target.productId).trim() : '';
        const pSku = target.sku ? String(target.sku).trim() : '';
        const pName = target.productName ? String(target.productName).trim() : '';

        if (oId && pId) this.reviewedKeys.add(`${oId}_${pId}`);
        if (oId && pSku) this.reviewedKeys.add(`${oId}_${pSku}`);
        if (oId && pName) this.reviewedKeys.add(`${oId}_${pName}`);

        // Đưa ngay vào danh sách đã đánh giá
        const newReview: UserReviewItem = {
          id: res?.id || 'rev_' + Date.now(),
          code: res?.code || 'DG-MOI',
          productId: pId,
          productName: target.productName,
          productSku: target.sku,
          productThumbnail: target.productThumbnail,
          orderId: oId || null,
          rating: selectedRate,
          comment: comment,
          images: selectedImgs,
          videos: selectedVids,
          status: 'visible',
          customerName: user?.fullName || 'Khách hàng',
          customerContext: 'Đã mua hàng tại Livora',
          createdAt: new Date().toISOString(),
        };
        this.userReviews = [newReview, ...this.userReviews.filter((r) => r.id !== newReview.id)];

        this.closeReviewModal();
        this.profileSuccess = 'Cảm ơn bạn! Đánh giá đã được gửi thành công.';
        this.reviewFilter = 'reviewed';

        this.loadUserReviews();
        this.loadUserOrders();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.reviewSubmitting = false;
        this.reviewModalError = err.error?.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.';
        this.cdr.detectChanges();
      },
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' ₫';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  getOrderStatusText(status: string): string {
    switch (status) {
      case 'pending':
      case 'confirmed':
      case 'processing':
        return 'Chờ xử lý';
      case 'shipping':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Đã tiếp nhận';
    }
  }

  setActiveTab(tab: 'personal' | 'history' | 'reviews') {
    this.activeTab = tab;
    if (tab === 'history') this.loadUserOrders();
    if (tab === 'reviews') {
      this.loadUserOrders();
      this.loadUserReviews();
    }
    this.cdr.detectChanges();
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.cdr.detectChanges();
  }

  setReviewFilter(filter: 'not_reviewed' | 'reviewed') {
    this.reviewFilter = filter;
    this.cdr.detectChanges();
  }

  logout(event: Event) {
    event.preventDefault();
    this.showLogoutConfirm = true;
    this.cdr.detectChanges();
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
    this.cdr.detectChanges();
  }

  confirmLogout() {
    this.showLogoutConfirm = false;
    this.authService.logout();
    this.cdr.detectChanges();
  }
}
