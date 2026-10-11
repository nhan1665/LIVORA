import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  Customer,
  CustomerAddress,
  CustomerDraft,
  CustomerListQuery,
  CustomerListResponse,
  CustomerListSummary,
  CustomerOrder,
} from './customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly customers$ = new BehaviorSubject<Customer[]>(this.generateInitialFixtures());

  /**
   * Retrieves summary metrics across all customers.
   */
  getSummary(): Observable<CustomerListSummary> {
    return this.customers$.pipe(
      map((customers) => {
        const totalCustomers = customers.length;
        const registeredCustomers = customers.filter((c) => c.customerType === 'registered').length;
        const guestCustomers = customers.filter((c) => c.customerType === 'guest').length;
        const activeThisMonth = customers.filter((c) => c.activeThisMonth).length;

        return {
          totalCustomers,
          registeredCustomers,
          guestCustomers,
          activeThisMonth,
        };
      })
    );
  }

  /**
   * Queries customer list with filtering, searching, and pagination.
   */
  listCustomers(query: CustomerListQuery): Observable<CustomerListResponse> {
    return this.customers$.pipe(
      map((customers) => {
        let filtered = [...customers];

        // Search filter: keyword against code, name, phone, email
        if (query.search && query.search.trim()) {
          const term = query.search.trim().toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.code.toLowerCase().includes(term) ||
              c.fullName.toLowerCase().includes(term) ||
              c.phone.toLowerCase().includes(term) ||
              c.email.toLowerCase().includes(term)
          );
        }

        // Customer type filter
        if (query.customerType && query.customerType !== 'all') {
          filtered = filtered.filter((c) => c.customerType === query.customerType);
        }

        // Status filter
        if (query.status && query.status !== 'all') {
          filtered = filtered.filter((c) => c.status === query.status);
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const currentPage = Math.min(Math.max(1, query.page), totalPages);

        const startIndex = (currentPage - 1) * query.pageSize;
        const items = filtered.slice(startIndex, startIndex + query.pageSize);

        // Overall summary
        const totalCustomers = customers.length;
        const registeredCustomers = customers.filter((c) => c.customerType === 'registered').length;
        const guestCustomers = customers.filter((c) => c.customerType === 'guest').length;
        const activeThisMonth = customers.filter((c) => c.activeThisMonth).length;

        return {
          items,
          page: currentPage,
          pageSize: query.pageSize,
          totalItems,
          totalPages,
          summary: {
            totalCustomers,
            registeredCustomers,
            guestCustomers,
            activeThisMonth,
          },
        };
      })
    );
  }

  /**
   * Retrieves single customer by ID or code.
   */
  getCustomerById(idOrCode: string): Observable<Customer | null> {
    return this.customers$.pipe(
      map((customers) => customers.find((c) => c.id === idOrCode || c.code === idOrCode) || null)
    );
  }

  /**
   * Updates customer profile in current session.
   */
  updateCustomer(id: string, draft: Partial<CustomerDraft>): Observable<Customer> {
    const list = this.customers$.getValue();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with ID ${id} not found.`);
    }

    const current = list[index];
    const updated: Customer = {
      ...current,
      fullName: draft.fullName !== undefined ? draft.fullName.trim() : current.fullName,
      initials: draft.fullName ? this.extractInitials(draft.fullName) : current.initials,
      phone: draft.phone !== undefined ? draft.phone.trim() : current.phone,
      email: draft.email !== undefined ? draft.email.trim() : current.email,
      birthDate: draft.birthDate !== undefined ? draft.birthDate : current.birthDate,
      gender: draft.gender !== undefined ? draft.gender : current.gender,
      status: draft.status !== undefined ? draft.status : current.status,
      customerType: draft.customerType !== undefined ? draft.customerType : current.customerType,
      tierSubtitle: draft.tierSubtitle !== undefined ? draft.tierSubtitle : current.tierSubtitle,
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.customers$.next(nextList);

    return of(updated);
  }

  /**
   * Sets default shipping address for a customer.
   */
  setDefaultAddress(customerId: string, addressId: string): Observable<Customer> {
    const list = this.customers$.getValue();
    const index = list.findIndex((c) => c.id === customerId);
    if (index === -1) {
      throw new Error(`Customer with ID ${customerId} not found.`);
    }

    const current = list[index];
    const updatedAddresses = current.addresses.map((addr) => ({
      ...addr,
      isDefault: addr.addressId === addressId,
    }));

    const updated: Customer = {
      ...current,
      addresses: updatedAddresses,
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.customers$.next(nextList);

    return of(updated);
  }

  /**
   * Adds new address for a customer in session.
   */
  addAddress(customerId: string, address: Omit<CustomerAddress, 'addressId'>): Observable<Customer> {
    const list = this.customers$.getValue();
    const index = list.findIndex((c) => c.id === customerId);
    if (index === -1) {
      throw new Error(`Customer with ID ${customerId} not found.`);
    }

    const current = list[index];
    const newAddressId = `addr-${Date.now()}`;
    const newAddr: CustomerAddress = {
      ...address,
      addressId: newAddressId,
    };

    let updatedAddresses = [...current.addresses];
    if (newAddr.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddr);

    const updated: Customer = {
      ...current,
      addresses: updatedAddresses,
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.customers$.next(nextList);

    return of(updated);
  }

  /**
   * Toggles status between active and inactive.
   */
  toggleStatus(id: string): Observable<Customer> {
    const list = this.customers$.getValue();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with ID ${id} not found.`);
    }

    const current = list[index];
    const newStatus = current.status === 'active' ? 'inactive' : 'active';
    const updated: Customer = {
      ...current,
      status: newStatus,
    };

    const nextList = [...list];
    nextList[index] = updated;
    this.customers$.next(nextList);

    return of(updated);
  }

  private extractInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'KH';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Generates initial in-memory fixture dataset.
   * Matches the reference screenshot:
   * - Total: 125 customers
   * - Registered: 94
   * - Guest: 31
   * - Active this month: 118
   * - Page 1 contains the 8 exact customers shown in the reference image.
   */
  private generateInitialFixtures(): Customer[] {
    const primaryCustomers: Customer[] = [
      {
        id: 'cust-001',
        code: '270926-001',
        fullName: 'KTS. Hoàng Nam',
        initials: 'HN',
        phone: '0918.421.xxx',
        email: 'hoangnam.arch@gmail.com',
        customerType: 'registered',
        status: 'active',
        createdAt: '27/09/2026',
        firstOrderNote: '(Đơn đặt hàng đầu tiên)',
        registeredAt: '30/09/2026',
        registerNote: '* Đăng ký trực tuyến trên Cổng thành viên Maison Atelier.',
        birthDate: '14/08/1988',
        gender: 'Nam',
        tierSubtitle: 'HỒ SƠ ĐỊNH DANH MAISON ATELIER VIP',
        activeThisMonth: true,
        addresses: [
          {
            addressId: 'addr-001-1',
            label: 'Địa chỉ 1 (Nhà riêng & Studio)',
            recipientName: 'KTS. Hoàng Nam',
            recipientPhone: '0918.421.xxx',
            street: '124 Pasteur',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            province: 'TP. Hồ Chí Minh',
            fullAddress: '124 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
            isDefault: true,
          },
          {
            addressId: 'addr-001-2',
            label: 'Địa chỉ 2 (Biệt thự công trình)',
            recipientName: 'KTS. Hoàng Nam',
            recipientPhone: '0918.421.xxx',
            street: 'Villa B3-12 Chateau',
            ward: 'Tân Phú',
            district: 'Quận 7',
            province: 'TP. Hồ Chí Minh',
            fullAddress: 'Villa B3-12 Chateau, Phú Mỹ Hưng, Quận 7, TP. Hồ Chí Minh',
            note: 'Liên hệ trợ lý giám sát nhận hàng tại công trình',
            isDefault: false,
          },
        ],
        orders: [
          {
            orderId: 'ord-001-1',
            orderCode: 'LIV-88219',
            orderDate: '27/09/2026',
            productDetails: 'Sofa Modular Atelier (x1), Bàn trà Deco (x1)',
            totalAmount: 148500000,
            status: 'Đã giao hàng',
          },
          {
            orderId: 'ord-001-2',
            orderCode: 'LIV-88102',
            orderDate: '15/09/2026',
            productDetails: 'Ghế bành Velvet Lounge (x2)',
            totalAmount: 42000000,
            status: 'Đã giao hàng',
          },
          {
            orderId: 'ord-001-3',
            orderCode: 'LIV-87940',
            orderDate: '02/09/2026',
            productDetails: 'Bàn ăn Walnut Grand (x1), Ghế ăn Dining Chair (x6)',
            totalAmount: 185000000,
            status: 'Đã giao hàng',
          },
          {
            orderId: 'ord-001-4',
            orderCode: 'LIV-87512',
            orderDate: '18/08/2026',
            productDetails: 'Đèn chùm Minimalist Halo (x1)',
            totalAmount: 82000000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 457500000,
      },
      {
        id: 'cust-002',
        code: '270926-002',
        fullName: 'Chị Đỗ Minh Châu',
        initials: 'MC',
        phone: '0903.882.xxx',
        email: 'minhchau.do@thaodienvilla.vn',
        customerType: 'registered',
        status: 'active',
        createdAt: '27/09/2026',
        firstOrderNote: '(Đơn đặt hàng đầu tiên)',
        registeredAt: '28/09/2026',
        birthDate: '22/11/1990',
        gender: 'Nữ',
        tierSubtitle: 'HỒ SƠ KHÁCH HÀNG THÂN THIẾT - THẢO ĐIỀN',
        activeThisMonth: true,
        addresses: [
          {
            addressId: 'addr-002-1',
            label: 'Địa chỉ 1 (Biệt thự Thảo Điền)',
            recipientName: 'Đỗ Minh Châu',
            recipientPhone: '0903.882.xxx',
            street: '45 Nguyễn Văn Hưởng',
            ward: 'Thảo Điền',
            district: 'TP. Thủ Đức',
            province: 'TP. Hồ Chí Minh',
            fullAddress: '45 Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
            isDefault: true,
          },
        ],
        orders: [
          {
            orderId: 'ord-002-1',
            orderCode: 'LIV-88220',
            orderDate: '27/09/2026',
            productDetails: 'Giường ngủ King Suite Modern (x1)',
            totalAmount: 98000000,
            status: 'Đang vận chuyển',
          },
          {
            orderId: 'ord-002-2',
            orderCode: 'LIV-88050',
            orderDate: '10/09/2026',
            productDetails: 'Tủ đầu giường Nordic (x2)',
            totalAmount: 24000000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 122000000,
      },
      {
        id: 'cust-003',
        code: '260926-003',
        fullName: 'Anh Lê Quốc Bảo',
        initials: 'QB',
        phone: '0979.112.xxx',
        email: 'lequocbao.sky@outlook.com',
        customerType: 'registered',
        status: 'active',
        createdAt: '26/09/2026',
        firstOrderNote: '(Đơn đặt hàng đầu tiên)',
        registeredAt: '26/09/2026',
        birthDate: '05/03/1985',
        gender: 'Nam',
        tierSubtitle: 'HỒ SƠ KHÁCH HÀNG THÀNH VIÊN',
        activeThisMonth: true,
        addresses: [
          {
            addressId: 'addr-003-1',
            label: 'Địa chỉ 1 (Căn hộ Sky Garden)',
            recipientName: 'Lê Quốc Bảo',
            recipientPhone: '0979.112.xxx',
            street: 'Sky Garden 3, Phú Mỹ Hưng',
            ward: 'Tân Phong',
            district: 'Quận 7',
            province: 'TP. Hồ Chí Minh',
            fullAddress: 'Sky Garden 3, Tân Phong, Quận 7, TP. Hồ Chí Minh',
            isDefault: true,
          },
        ],
        orders: [
          {
            orderId: 'ord-003-1',
            orderCode: 'LIV-88201',
            orderDate: '26/09/2026',
            productDetails: 'Bàn làm việc Ergonomic Executive (x1)',
            totalAmount: 38500000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 38500000,
      },
      {
        id: 'cust-004',
        code: '250926-004',
        fullName: 'Studio Kiến Trúc A+',
        initials: 'A+',
        phone: '028.3822.xxxx',
        email: 'contact@aplus-architects.com',
        customerType: 'guest',
        status: 'active',
        createdAt: '25/09/2026',
        firstOrderNote: '(Đơn đặt hàng dự án)',
        birthDate: '',
        gender: 'Khác',
        tierSubtitle: 'HỒ SƠ ĐỐI TÁC THIẾT KẾ & THI CÔNG',
        activeThisMonth: true,
        addresses: [
          {
            addressId: 'addr-004-1',
            label: 'Địa chỉ Studio',
            recipientName: 'Đại diện Studio A+',
            recipientPhone: '028.3822.xxxx',
            street: '88 Lê Thị Hồng Gấm',
            ward: 'Nguyễn Thái Bình',
            district: 'Quận 1',
            province: 'TP. Hồ Chí Minh',
            fullAddress: '88 Lê Thị Hồng Gấm, Phường Nguyễn Thái Bình, Quận 1, TP. Hồ Chí Minh',
            isDefault: true,
          },
        ],
        orders: [
          {
            orderId: 'ord-004-1',
            orderCode: 'LIV-88180',
            orderDate: '25/09/2026',
            productDetails: 'Combo nội thất văn phòng sáng tạo A-Studio (x1)',
            totalAmount: 215000000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 215000000,
      },
      {
        id: 'cust-005',
        code: '220926-005',
        fullName: 'Chị Vũ Thanh Mai',
        initials: 'TM',
        phone: '0912.654.xxx',
        email: 'thanhmai.vu89@gmail.com',
        customerType: 'registered',
        status: 'active',
        createdAt: '22/09/2026',
        firstOrderNote: '(Đơn đặt hàng đầu tiên)',
        registeredAt: '22/09/2026',
        birthDate: '19/07/1989',
        gender: 'Nữ',
        tierSubtitle: 'HỒ SƠ KHÁCH HÀNG THÂN THIẾT',
        activeThisMonth: true,
        addresses: [
          {
            addressId: 'addr-005-1',
            label: 'Địa chỉ nhà riêng',
            recipientName: 'Vũ Thanh Mai',
            recipientPhone: '0912.654.xxx',
            street: '15/2 Hoàng Hoa Thám',
            ward: 'Phường 7',
            district: 'Quận Bình Thạnh',
            province: 'TP. Hồ Chí Minh',
            fullAddress: '15/2 Hoàng Hoa Thám, Phường 7, Quận Bình Thạnh, TP. Hồ Chí Minh',
            isDefault: true,
          },
        ],
        orders: [
          {
            orderId: 'ord-005-1',
            orderCode: 'LIV-88145',
            orderDate: '22/09/2026',
            productDetails: 'Đèn sàn Nordic Tripod (x1), Thảm len dệt tay 2x3m (x1)',
            totalAmount: 28900000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 28900000,
      },
      {
        id: 'cust-006',
        code: '180926-006',
        fullName: 'KTS. Đặng Thu Thảo',
        initials: 'TT',
        phone: '0938.990.xxx',
        email: 'dthuthao@dconcept.design',
        customerType: 'guest',
        status: 'inactive',
        createdAt: '18/09/2026',
        firstOrderNote: '(Đơn đặt hàng mẫu)',
        birthDate: '02/10/1992',
        gender: 'Nữ',
        tierSubtitle: 'HỒ SƠ THIẾT KẾ TẠM NGƯNG',
        activeThisMonth: false,
        addresses: [
          {
            addressId: 'addr-006-1',
            label: 'Địa chỉ văn phòng',
            recipientName: 'Đặng Thu Thảo',
            recipientPhone: '0938.990.xxx',
            street: '22 Bis Trương Định',
            ward: 'Võ Thị Sáu',
            district: 'Quận 3',
            province: 'TP. Hồ Chí Minh',
            fullAddress: '22 Bis Trương Định, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
            isDefault: true,
          },
        ],
        orders: [
          {
            orderId: 'ord-006-1',
            orderCode: 'LIV-88090',
            orderDate: '18/09/2026',
            productDetails: 'Mẫu vật liệu da & gỗ sồi tự nhiên (x5)',
            totalAmount: 12500000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 12500000,
      },
      {
        id: 'cust-007',
        code: '150926-007',
        fullName: 'Anh Trần Tuấn Kiệt',
        initials: 'TK',
        phone: '0908.761.xxx',
        email: 'tuankiet.tran@vinhomes.vn',
        customerType: 'registered',
        status: 'active',
        createdAt: '15/09/2026',
        firstOrderNote: '(Đơn đặt hàng đầu tiên)',
        registeredAt: '16/09/2026',
        birthDate: '30/04/1987',
        gender: 'Nam',
        tierSubtitle: 'HỒ SƠ CƯ DÂN VINHOMES GOLD',
        activeThisMonth: true,
        addresses: [
          {
            addressId: 'addr-007-1',
            label: 'Địa chỉ Vinhomes Grand Park',
            recipientName: 'Trần Tuấn Kiệt',
            recipientPhone: '0908.761.xxx',
            street: 'Tòa S5.02, Vinhomes Grand Park',
            ward: 'Long Thạnh Mỹ',
            district: 'TP. Thủ Đức',
            province: 'TP. Hồ Chí Minh',
            fullAddress: 'Tòa S5.02, Vinhomes Grand Park, TP. Thủ Đức, TP. Hồ Chí Minh',
            isDefault: true,
          },
        ],
        orders: [
          {
            orderId: 'ord-007-1',
            orderCode: 'LIV-88044',
            orderDate: '15/09/2026',
            productDetails: 'Kệ tivi gỗ óc chó Walnut Lowboard (x1)',
            totalAmount: 36000000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 36000000,
      },
      {
        id: 'cust-008',
        code: '100926-008',
        fullName: 'Chị Phạm Bích Ngọc',
        initials: 'BN',
        phone: '0983.455.xxx',
        email: 'bichngoc.ciputra@yahoo.com',
        customerType: 'guest',
        status: 'active',
        createdAt: '10/09/2026',
        firstOrderNote: '(Đơn đặt hàng cá nhân)',
        birthDate: '11/12/1991',
        gender: 'Nữ',
        tierSubtitle: 'HỒ SƠ KHÁCH HÀNG CIPUTRA HÀ NỘI',
        activeThisMonth: true,
        addresses: [
          {
            addressId: 'addr-008-1',
            label: 'Địa chỉ Ciputra',
            recipientName: 'Phạm Bích Ngọc',
            recipientPhone: '0983.455.xxx',
            street: 'Biệt thự khu Q, Ciputra',
            ward: 'Xuân Đỉnh',
            district: 'Quận Bắc Từ Liêm',
            province: 'Hà Nội',
            fullAddress: 'Biệt thự khu Q, Ciputra, Xuân Đỉnh, Bắc Từ Liêm, Hà Nội',
            isDefault: true,
          },
        ],
        orders: [
          {
            orderId: 'ord-008-1',
            orderCode: 'LIV-87980',
            orderDate: '10/09/2026',
            productDetails: 'Gương tròn trang trí nghệ thuật Soleil (x2)',
            totalAmount: 18600000,
            status: 'Đã giao hàng',
          },
        ],
        totalOrderValue: 18600000,
      },
    ];

    // Additional realistic records to bring total to exactly 125 customers:
    // 94 registered, 31 guests, 118 active this month (7 inactive).
    // Currently primaryCustomers has:
    // 5 registered (cust 1, 2, 3, 5, 7)
    // 3 guest (cust 4, 6, 8)
    // 7 active, 1 inactive (cust 6)
    const list: Customer[] = [...primaryCustomers];

    // Need 94 - 5 = 89 more registered
    // Need 31 - 3 = 28 more guest
    // Need 118 - 7 = 111 active, and 7 - 1 = 6 inactive among remaining 117
    const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
    const midNames = ['Văn', 'Thị', 'Đình', 'Hữu', 'Ngọc', 'Quốc', 'Thanh', 'Minh', 'Hồng', 'Gia'];
    const lastNames = ['Hải', 'Linh', 'Dũng', 'Hương', 'Phong', 'Trang', 'Khánh', 'Chi', 'Tùng', 'Yến', 'Quang', 'Mai', 'Thắng', 'Tâm', 'Huy', 'Phương'];

    let registeredNeeded = 89;
    let guestNeeded = 28;
    let inactiveNeeded = 6;

    for (let i = 9; i <= 125; i++) {
      const isRegistered = registeredNeeded > 0 && (guestNeeded === 0 || Math.random() < 0.76);
      if (isRegistered) {
        registeredNeeded--;
      } else {
        guestNeeded--;
      }

      const isInactive = inactiveNeeded > 0 && Math.random() < 0.1;
      if (isInactive) {
        inactiveNeeded--;
      }

      const fn = firstNames[i % firstNames.length];
      const mn = midNames[(i * 3) % midNames.length];
      const ln = lastNames[(i * 7) % lastNames.length];
      const name = `${fn} ${mn} ${ln}`;
      const initials = `${fn[0]}${ln[0]}`.toUpperCase();

      const day = (10 + (i % 18)).toString().padStart(2, '0');
      const code = `${day}0926-${i.toString().padStart(3, '0')}`;
      const phone = `09${(10 + (i % 80)).toString().padStart(2, '0')}.${(200 + i * 3).toString().slice(-3)}.xxx`;
      const email = `${ln.toLowerCase()}.${fn.toLowerCase()}${i}@gmail.com`;

      const orderCount = 1 + (i % 4);
      const orders: CustomerOrder[] = [];
      let totalValue = 0;
      for (let o = 1; o <= orderCount; o++) {
        const orderVal = 15000000 + ((i * 17 + o * 23) % 85) * 1000000;
        totalValue += orderVal;
        orders.push({
          orderId: `ord-${i}-${o}`,
          orderCode: `LIV-${87000 + i * 10 + o}`,
          orderDate: `${day}/09/2026`,
          productDetails: `Bộ nội thất cao cấp LIVORA Series ${o}`,
          totalAmount: orderVal,
          status: o === 1 ? 'Đã giao hàng' : 'Đang vận chuyển',
        });
      }

      list.push({
        id: `cust-${i.toString().padStart(3, '0')}`,
        code,
        fullName: name,
        initials,
        phone,
        email,
        customerType: isRegistered ? 'registered' : 'guest',
        status: isInactive ? 'inactive' : 'active',
        createdAt: `${day}/09/2026`,
        firstOrderNote: isRegistered ? '(Đơn đặt hàng đầu tiên)' : '(Đơn đặt hàng vãng lai)',
        registeredAt: isRegistered ? `${day}/09/2026` : undefined,
        birthDate: `15/0${1 + (i % 9)}/199${i % 10}`,
        gender: i % 2 === 0 ? 'Nam' : 'Nữ',
        tierSubtitle: isRegistered ? 'HỒ SƠ KHÁCH HÀNG THÀNH VIÊN' : 'HỒ SƠ KHÁCH HÀNG VÃNG LAI',
        activeThisMonth: !isInactive,
        addresses: [
          {
            addressId: `addr-${i}-1`,
            label: 'Địa chỉ nhận hàng',
            recipientName: name,
            recipientPhone: phone,
            street: `${10 + (i % 90)} Đường số ${1 + (i % 20)}`,
            ward: 'Phường 1',
            district: 'Quận Bình Thạnh',
            province: 'TP. Hồ Chí Minh',
            fullAddress: `${10 + (i % 90)} Đường số ${1 + (i % 20)}, Phường 1, Bình Thạnh, TP. Hồ Chí Minh`,
            isDefault: true,
          },
        ],
        orders,
        totalOrderValue: totalValue,
      });
    }

    return list;
  }
}
