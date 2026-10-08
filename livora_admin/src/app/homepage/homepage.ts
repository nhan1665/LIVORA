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

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  startDate: string;
  endDate: string;
  order: number;
  status: 'Đang hiển thị' | 'Đã ẩn';
}

export interface BrandItem {
  id: string;
  name: string;
  origin: string;
  description: string;
  status: 'Đang hiển thị' | 'Đã ẩn';
}

export interface FooterConfigItem {
  id: string;
  key: 'facebook' | 'instagram' | 'zalo' | 'phone';
  name: string;
  subtitle: string;
  value: string;
  status: 'Hiển thị' | 'Ẩn';
  iconType: 'facebook' | 'instagram' | 'zalo' | 'phone';
}

@Component({
  selector: 'app-homepage',
  imports: [CommonModule, FormsModule, DataTable, FilterBar, FormModal, ConfirmDialog],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
})
export class Homepage implements OnInit, AfterViewInit {
  // Current active tab - defaulted to 'banner' as requested
  activeTab: 'marquee' | 'banner' | 'brand' | 'footer' = 'banner';

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
    order: undefined,
    status: 'Đang hoạt động',
  };

  // Toast / feedback message
  toastMessage: string | null = null;

  // ==========================================
  // BANNER MANAGEMENT STATES & DATA
  // ==========================================
  bannerFilterStatus: string = 'all';
  bannerFilterStartDate: string = '01/01/2026';
  bannerFilterEndDate: string = '31/12/2026';
  bannerCurrentPage: number = 1;
  bannerItemsPerPage: number = 5;

  // Banner Modal States
  isBannerModalOpen: boolean = false;
  bannerModalMode: 'create' | 'edit' = 'create';
  editingBanner: BannerItem | null = null;
  uploadedFileName: string = '';
  uploadedFileSize: string = '';
  isDraggingOver: boolean = false;

  bannerForm: Partial<BannerItem> = {
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    startDate: '',
    endDate: '',
    order: undefined,
    status: 'Đang hiển thị',
  };

  // Mock initial banner dataset matching user reference UI
  bannerList: BannerItem[] = [
    {
      id: '1',
      title: 'Banner Bộ sưu tập Mùa Thu',
      subtitle: 'Chiến dịch Autumn Heritage 2026 - Bản phát hành giới hạn',
      imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/products?collection=autumn-heritage-2026',
      startDate: '01/09/2026',
      endDate: '30/11/2026',
      order: 1,
      status: 'Đang hiển thị',
    },
    {
      id: '2',
      title: 'Banner Khuyến mãi Kiến trúc 2026',
      subtitle: 'Ưu đãi mùa hoàn thiện công trình cho studio và KTS',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/promotions/architecture-2026',
      startDate: '15/03/2026',
      endDate: '30/04/2026',
      order: 2,
      status: 'Đang hiển thị',
    },
    {
      id: '3',
      title: 'Banner Không gian Phòng khách',
      subtitle: 'Bộ sưu tập nội thất The Serene Living phong cách Wabi Sabi',
      imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dADAe4b4ace?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/rooms/living-room',
      startDate: '01/01/2026',
      endDate: '31/12/2026',
      order: 3,
      status: 'Đang hiển thị',
    },
    {
      id: '4',
      title: 'Banner Tri ân Khách hàng VIP',
      subtitle: 'Chương trình Private Salon & Quyền lợi đặc quyền gia chủ Maison',
      imageUrl: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/vip-membership',
      startDate: '01/02/2026',
      endDate: '28/02/2026',
      order: 4,
      status: 'Đang hiển thị',
    },
    {
      id: '5',
      title: 'Banner Khai xuân Phú Quý 2026',
      subtitle: 'Chương trình mừng năm mới - Đã lưu trữ định kỳ',
      imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/events/spring-2026',
      startDate: '01/01/2026',
      endDate: '15/02/2026',
      order: 5,
      status: 'Đã ẩn',
    },
    {
      id: '6',
      title: 'Banner Bộ sưu tập Mùa Hè Địa Trung Hải',
      subtitle: 'Hơi thở biển cả trong từng đường nét gỗ tếch và mây tre đan',
      imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/collections/mediterranean',
      startDate: '01/06/2026',
      endDate: '31/08/2026',
      order: 6,
      status: 'Đã ẩn',
    },
    {
      id: '7',
      title: 'Banner Ánh Sáng Tinh Tế & Đèn Decor',
      subtitle: 'Tuyển tập các tuyệt tác đèn trần thủ công từ Ý',
      imageUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/categories/lighting',
      startDate: '01/05/2026',
      endDate: '30/06/2026',
      order: 7,
      status: 'Đã ẩn',
    },
    {
      id: '8',
      title: 'Banner Tri Ân Nhà Thiết Kế Đối Tác',
      subtitle: 'Mạng lưới kết nối các kiến trúc sư danh tiếng toàn quốc',
      imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80',
      linkUrl: '/partners',
      startDate: '15/01/2026',
      endDate: '28/02/2026',
      order: 8,
      status: 'Đã ẩn',
    },
  ];

  // ==========================================
  // BRAND MANAGEMENT STATES & DATA
  // ==========================================
  brandFilterKeyword: string = '';
  brandFilterStatus: string = 'all';
  brandCurrentPage: number = 1;
  brandItemsPerPage: number = 5;

  isBrandModalOpen: boolean = false;
  brandModalMode: 'create' | 'edit' = 'create';
  editingBrand: BrandItem | null = null;
  brandForm: Partial<BrandItem> = {
    name: '',
    origin: '',
    description: '',
    status: 'Đang hiển thị',
  };

  brandList: BrandItem[] = [
    {
      id: '1',
      name: 'B&B Italia',
      origin: 'MEDA, LOMBARDY',
      description:
        'Biểu tượng di sản kiến trúc đương đại nước Ý từ năm 1966. Thiết kế đột phá bởi Antonio Citterio và Mario Bellini, tập trung vào kỹ thuật đúc bọt polyurethane và các cấu trúc module thư thái vượt thời gian.',
      status: 'Đang hiển thị',
    },
    {
      id: '2',
      name: 'Minotti',
      origin: 'BRIANZA, Ý',
      description:
        'Đỉnh cao của sự cân bằng thị giác và nghệ thuật may đo thủ công tinh xảo dưới sự định hình của Rodolfo Dordoni. Nổi danh với các đường nét kiến trúc tinh giản, vải dệt cao cấp và bề mặt hoàn thiện tự nhiên.',
      status: 'Đang hiển thị',
    },
    {
      id: '3',
      name: 'Poliform',
      origin: 'INVERIGO, COMO',
      description:
        'Chuẩn mực thiết kế không gian sống liền mạch với triết lý kiến trúc tổng thể. Nổi bật nhờ hệ thống tủ âm tường không tay nắm, mặt đá cẩm thạch chải mờ và hệ bàn tiệc gỗ sồi chưng cất phong vị tối giản ấm áp.',
      status: 'Đang hiển thị',
    },
    {
      id: '4',
      name: 'Cassina',
      origin: 'MEDA, Ý',
      description:
        'Hãng sản xuất nắm giữ bản quyền bộ sưu tập kiệt tác "I Maestri" của Le Corbusier, Pierre Jeanneret và Charlotte Perriand. Giao thoa uyển chuyển giữa tính hợp lý của kết cấu công nghiệp và nghệ thuật mộc danh giá.',
      status: 'Đã ẩn',
    },
    {
      id: '5',
      name: 'Flexform',
      origin: 'LOMBARDY, Ý',
      description:
        'Chuyên sâu vào các thiết kế salon và sofa cao cấp tôn vinh cảm giác êm ái tự nhiên. Ngôn ngữ thiết kế nhấn mạnh vật liệu lanh thô, da thuộc cognac và khung gỗ tần bì tạo nên bầu không khí ấm cúng tĩnh lặng.',
      status: 'Đang hiển thị',
    },
    {
      id: '6',
      name: 'Molteni&C',
      origin: 'GIUSSANO, MONZA',
      description:
        'Di sản chế tác đồ gỗ cao cấp cùng sự dẫn dắt của giám đốc sáng tạo Vincent Van Duysen. Nghệ thuật kết hợp vật liệu gỗ óc chó Canaletto, kính đồng thau và da thủ công.',
      status: 'Đang hiển thị',
    },
    {
      id: '7',
      name: 'Giorgetti',
      origin: 'MEDA, Ý',
      description:
        'Lịch sử hơn 120 năm tôn vinh nghệ thuật uốn cong gỗ phong và các kết cấu hữu cơ phức tạp. Sự hòa quyện giữa kỹ nghệ thủ công độc bản và tinh hoa thiết kế thời đại.',
      status: 'Đang hiển thị',
    },
    {
      id: '8',
      name: 'Rimadesio',
      origin: 'GIUSSANO, Ý',
      description:
        'Đỉnh cao trong chế tác cửa trượt và hệ thống ngăn phòng bằng nhôm định hình và kính cường lực khắc axit cao cấp từ vùng Brianza.',
      status: 'Đang hiển thị',
    },
    {
      id: '9',
      name: 'Boffi',
      origin: 'LENTATE SUL SEVESO',
      description:
        'Thương hiệu tiên phong trong thiết kế hệ tủ bếp và phòng tắm điêu khắc tối giản, kết hợp đá Granite nguyên khối và thép không gỉ xử lý bề mặt độc quyền.',
      status: 'Đang hiển thị',
    },
    {
      id: '10',
      name: 'Porro',
      origin: 'MONTESOLARO, COMO',
      description:
        'Triết lý hình học chuẩn xác và tinh khiết trong không gian lưu trữ hiện đại, được chỉ đạo nghệ thuật bởi bậc thầy kiến trúc Piero Lissoni.',
      status: 'Đang hiển thị',
    },
  ];

  // ==========================================
  // FOOTER CONFIG STATES & DATA
  // ==========================================
  footerConfig: FooterConfigItem[] = [
    {
      id: '1',
      key: 'facebook',
      name: 'Facebook',
      subtitle: 'Trang cộng đồng',
      value: 'https://facebook.com/maisonatelier.vn',
      status: 'Hiển thị',
      iconType: 'facebook',
    },
    {
      id: '2',
      key: 'instagram',
      name: 'Instagram',
      subtitle: 'Bộ sưu tập hình ảnh',
      value: 'https://instagram.com/maisonatelier.vn',
      status: 'Hiển thị',
      iconType: 'instagram',
    },
    {
      id: '3',
      key: 'zalo',
      name: 'Zalo Official',
      subtitle: 'Hỗ trợ khách hàng',
      value: 'https://zalo.me/maisonatelier',
      status: 'Hiển thị',
      iconType: 'zalo',
    },
    {
      id: '4',
      key: 'phone',
      name: 'Số điện thoại',
      subtitle: 'Hotline showroom',
      value: '1900 6868 - 0918.421.xxx',
      status: 'Hiển thị',
      iconType: 'phone',
    },
  ];

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
  confirmText: string = 'Đồng ý ẩn';
  confirmType: 'warning' | 'danger' | 'info' = 'warning';
  pendingAction: (() => void) | null = null;

  // ==========================================
  // BANNER COMPUTED / GETTERS
  // ==========================================
  get filteredBannerList(): BannerItem[] {
    return this.bannerList.filter((item) => {
      const matchStatus =
        this.bannerFilterStatus === 'all' || item.status === this.bannerFilterStatus;
      return matchStatus;
    });
  }

  get paginatedBannerList(): BannerItem[] {
    const start = (this.bannerCurrentPage - 1) * this.bannerItemsPerPage;
    return this.filteredBannerList.slice(start, start + this.bannerItemsPerPage);
  }

  get bannerTotalPages(): number {
    return Math.ceil(this.filteredBannerList.length / this.bannerItemsPerPage) || 1;
  }

  get bannerPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.bannerTotalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get bannerStartIdx(): number {
    if (this.filteredBannerList.length === 0) return 0;
    return (this.bannerCurrentPage - 1) * this.bannerItemsPerPage + 1;
  }

  get bannerEndIdx(): number {
    return Math.min(
      this.bannerCurrentPage * this.bannerItemsPerPage,
      this.filteredBannerList.length
    );
  }

  // ==========================================
  // BANNER FILTER & PAGINATION
  // ==========================================
  onBannerFilter(): void {
    this.bannerCurrentPage = 1;
  }

  onBannerResetFilter(): void {
    this.bannerFilterStatus = 'all';
    this.bannerFilterStartDate = '01/01/2026';
    this.bannerFilterEndDate = '31/12/2026';
    this.bannerCurrentPage = 1;
  }

  onBannerPageChange(page: number): void {
    if (page >= 1 && page <= this.bannerTotalPages) {
      this.bannerCurrentPage = page;
    }
  }

  // ==========================================
  // BANNER MODAL & CRUD
  // ==========================================
  openCreateBannerModal(): void {
    this.bannerModalMode = 'create';
    this.editingBanner = null;
    this.uploadedFileName = '';
    this.uploadedFileSize = '';
    this.bannerForm = {
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      startDate: '',
      endDate: '',
      order: undefined,
      status: 'Đang hiển thị',
    };
    this.isBannerModalOpen = true;
  }

  openEditBannerModal(banner: BannerItem): void {
    this.bannerModalMode = 'edit';
    this.editingBanner = banner;
    this.uploadedFileName = 'banner-image.webp';
    this.uploadedFileSize = '1.8 MB';
    this.bannerForm = { ...banner };
    this.isBannerModalOpen = true;
  }

  closeBannerModal(): void {
    this.isBannerModalOpen = false;
    this.editingBanner = null;
  }

  onBannerBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('bm-modal-backdrop')) {
      this.closeBannerModal();
    }
  }

  toggleBannerFormStatus(): void {
    this.bannerForm.status =
      this.bannerForm.status === 'Đang hiển thị' ? 'Đã ẩn' : 'Đang hiển thị';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadedFileName = file.name;
      this.uploadedFileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bannerForm.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      this.uploadedFileName = file.name;
      this.uploadedFileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bannerForm.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveBanner(): void {
    if (!this.bannerForm.title?.trim()) {
      alert('Vui lòng nhập tiêu đề banner!');
      return;
    }
    if (!this.bannerForm.imageUrl?.trim()) {
      alert('Vui lòng cung cấp đường dẫn ảnh cho banner!');
      return;
    }

    if (this.bannerModalMode === 'create') {
      const newBanner: BannerItem = {
        id: Date.now().toString(),
        title: this.bannerForm.title.trim(),
        subtitle: this.bannerForm.subtitle?.trim() || '',
        imageUrl: this.bannerForm.imageUrl.trim(),
        linkUrl: this.bannerForm.linkUrl?.trim() || '',
        startDate: this.bannerForm.startDate?.trim() || '01/01/2026',
        endDate: this.bannerForm.endDate?.trim() || '31/12/2026',
        order: Number(this.bannerForm.order) || this.bannerList.length + 1,
        status: this.bannerForm.status || 'Đang hiển thị',
      };
      this.bannerList.unshift(newBanner);
      this.showToast(`Đã thêm mới "${newBanner.title}"`);
    } else if (this.editingBanner) {
      Object.assign(this.editingBanner, {
        title: this.bannerForm.title.trim(),
        subtitle: this.bannerForm.subtitle?.trim() || '',
        imageUrl: this.bannerForm.imageUrl.trim(),
        linkUrl: this.bannerForm.linkUrl?.trim() || '',
        startDate: this.bannerForm.startDate?.trim() || '',
        endDate: this.bannerForm.endDate?.trim() || '',
        order: Number(this.bannerForm.order) || 1,
        status: this.bannerForm.status || 'Đang hiển thị',
      });
      this.showToast(`Đã cập nhật "${this.editingBanner.title}"`);
    }

    this.closeBannerModal();
  }

  // Toggle Hide / Show Banner
  promptToggleBanner(banner: BannerItem): void {
    if (banner.status === 'Đang hiển thị') {
      this.confirmTitle = 'Ẩn banner trang chủ';
      this.confirmMessage = `Bạn có chắc muốn ẩn "${banner.title}" khỏi slider trang chủ không?`;
      this.confirmText = 'Đồng ý ẩn';
      this.confirmType = 'warning';
      this.pendingAction = () => {
        banner.status = 'Đã ẩn';
        this.showToast(`Đã ẩn banner "${banner.title}"`);
      };
      this.isConfirmOpen = true;
    } else {
      banner.status = 'Đang hiển thị';
      this.showToast(`Đã kích hoạt hiển thị banner "${banner.title}"`);
    }
  }

  // Delete Banner
  promptDeleteBanner(banner: BannerItem): void {
    this.confirmTitle = 'Xác nhận xóa banner';
    this.confirmMessage = `Bạn có chắc muốn xóa vĩnh viễn "${banner.title}"? Thao tác này không thể hoàn tác.`;
    this.confirmText = 'Xóa banner';
    this.confirmType = 'danger';
    this.pendingAction = () => {
      this.bannerList = this.bannerList.filter((b) => b.id !== banner.id);
      this.showToast(`Đã xóa banner "${banner.title}"`);
    };
    this.isConfirmOpen = true;
  }

  onBannerImgError(event: Event): void {
    const imgEl = event.target as HTMLImageElement;
    imgEl.src = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80';
  }

  // ==========================================
  // BRAND COMPUTED / GETTERS
  // ==========================================
  get filteredBrandList(): BrandItem[] {
    return this.brandList.filter((item) => {
      const matchKeyword =
        !this.brandFilterKeyword ||
        item.name.toLowerCase().includes(this.brandFilterKeyword.trim().toLowerCase()) ||
        item.origin.toLowerCase().includes(this.brandFilterKeyword.trim().toLowerCase()) ||
        item.description.toLowerCase().includes(this.brandFilterKeyword.trim().toLowerCase());
      const matchStatus =
        this.brandFilterStatus === 'all' || item.status === this.brandFilterStatus;
      return matchKeyword && matchStatus;
    });
  }

  get paginatedBrandList(): BrandItem[] {
    const start = (this.brandCurrentPage - 1) * this.brandItemsPerPage;
    return this.filteredBrandList.slice(start, start + this.brandItemsPerPage);
  }

  get brandTotalPages(): number {
    return Math.ceil(this.filteredBrandList.length / this.brandItemsPerPage) || 1;
  }

  get brandPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.brandTotalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get brandStartIdx(): number {
    if (this.filteredBrandList.length === 0) return 0;
    return (this.brandCurrentPage - 1) * this.brandItemsPerPage + 1;
  }

  get brandEndIdx(): number {
    return Math.min(
      this.brandCurrentPage * this.brandItemsPerPage,
      this.filteredBrandList.length
    );
  }

  // Brand Filter & Pagination handlers
  onBrandFilter(): void {
    this.brandCurrentPage = 1;
  }

  onBrandResetFilter(): void {
    this.brandFilterKeyword = '';
    this.brandFilterStatus = 'all';
    this.brandCurrentPage = 1;
  }

  onBrandPageChange(page: number): void {
    if (page >= 1 && page <= this.brandTotalPages) {
      this.brandCurrentPage = page;
    }
  }

  // Brand Modal & CRUD
  openCreateBrandModal(): void {
    this.brandModalMode = 'create';
    this.editingBrand = null;
    this.brandForm = {
      name: '',
      origin: '',
      description: '',
      status: 'Đang hiển thị',
    };
    this.isBrandModalOpen = true;
  }

  openEditBrandModal(brand: BrandItem): void {
    this.brandModalMode = 'edit';
    this.editingBrand = brand;
    this.brandForm = { ...brand };
    this.isBrandModalOpen = true;
  }

  closeBrandModal(): void {
    this.isBrandModalOpen = false;
    this.editingBrand = null;
  }

  onBrandBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('bm-modal-backdrop')) {
      this.closeBrandModal();
    }
  }

  saveBrand(): void {
    if (!this.brandForm.name?.trim()) {
      alert('Vui lòng nhập tiêu đề thương hiệu đối tác!');
      return;
    }
    if (!this.brandForm.description?.trim()) {
      alert('Vui lòng nhập nội dung giới thiệu thương hiệu!');
      return;
    }

    if (this.brandModalMode === 'create') {
      const newBrand: BrandItem = {
        id: Date.now().toString(),
        name: this.brandForm.name.trim(),
        origin: this.brandForm.origin?.trim() || 'Ý',
        description: this.brandForm.description.trim(),
        status: this.brandForm.status || 'Đang hiển thị',
      };
      this.brandList.unshift(newBrand);
      this.showToast(`Đã thêm mới thương hiệu "${newBrand.name}"`);
    } else if (this.editingBrand) {
      Object.assign(this.editingBrand, {
        name: this.brandForm.name.trim(),
        origin: this.brandForm.origin?.trim() || this.editingBrand.origin,
        description: this.brandForm.description.trim(),
        status: this.brandForm.status || 'Đang hiển thị',
      });
      this.showToast(`Đã cập nhật thương hiệu "${this.editingBrand.name}"`);
    }
    this.closeBrandModal();
  }

  promptToggleBrand(brand: BrandItem): void {
    if (brand.status === 'Đang hiển thị') {
      this.confirmTitle = 'Ẩn thương hiệu';
      this.confirmMessage = `Bạn có chắc muốn ẩn thương hiệu "${brand.name}" khỏi danh mục trang chủ không?`;
      this.confirmText = 'Đồng ý ẩn';
      this.confirmType = 'warning';
      this.pendingAction = () => {
        brand.status = 'Đã ẩn';
        this.showToast(`Đã ẩn thương hiệu "${brand.name}"`);
      };
      this.isConfirmOpen = true;
    } else {
      brand.status = 'Đang hiển thị';
      this.showToast(`Đã kích hoạt hiển thị thương hiệu "${brand.name}"`);
    }
  }

  promptDeleteBrand(brand: BrandItem): void {
    this.confirmTitle = 'Xác nhận xóa thương hiệu';
    this.confirmMessage = `Bạn có chắc muốn xóa thương hiệu "${brand.name}"? Thao tác này không thể hoàn tác.`;
    this.confirmText = 'Xóa thương hiệu';
    this.confirmType = 'danger';
    this.pendingAction = () => {
      this.brandList = this.brandList.filter((b) => b.id !== brand.id);
      this.showToast(`Đã xóa thương hiệu "${brand.name}"`);
    };
    this.isConfirmOpen = true;
  }

  // ==========================================
  // FOOTER ACTIONS
  // ==========================================
  saveFooterConfig(): void {
    this.showToast('Thay đổi cấu hình Footer đã được lưu thành công!');
  }

  resetFooterConfig(): void {
    this.footerConfig = [
      {
        id: '1',
        key: 'facebook',
        name: 'Facebook',
        subtitle: 'Trang cộng đồng',
        value: 'https://facebook.com/maisonatelier.vn',
        status: 'Hiển thị',
        iconType: 'facebook',
      },
      {
        id: '2',
        key: 'instagram',
        name: 'Instagram',
        subtitle: 'Bộ sưu tập hình ảnh',
        value: 'https://instagram.com/maisonatelier.vn',
        status: 'Hiển thị',
        iconType: 'instagram',
      },
      {
        id: '3',
        key: 'zalo',
        name: 'Zalo Official',
        subtitle: 'Hỗ trợ khách hàng',
        value: 'https://zalo.me/maisonatelier',
        status: 'Hiển thị',
        iconType: 'zalo',
      },
      {
        id: '4',
        key: 'phone',
        name: 'Số điện thoại',
        subtitle: 'Hotline showroom',
        value: '1900 6868 - 0918.421.xxx',
        status: 'Hiển thị',
        iconType: 'phone',
      },
    ];
    this.showToast('Đã khôi phục cài đặt Footer ban đầu.');
  }

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
      startDate: '',
      endDate: '',
      order: undefined,
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
