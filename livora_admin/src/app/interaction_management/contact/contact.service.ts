import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Contact,
  ContactListQuery,
  ContactListResponse,
  ContactStatus,
} from './contact.model';

/**
 * Session-only Contact service boundary for the Admin Interaction Management module.
 *
 * No backend or API contract exists in the repository (see SYSTEM_DESIGN.md section 7),
 * so this service exposes a typed in-memory registry seeded with demo fixtures. All
 * mutations stay in the current browser session and reset on reload; the typed
 * Observable boundary is kept so an approved API implementation can replace it.
 */
@Injectable({
  providedIn: 'root',
})
export class ContactService {
  /**
   * Demo reference instant used by the relative time filters so the seeded
   * fixture timeline (October 2025, matching the design reference) stays stable
   * instead of drifting with the real system clock.
   */
  private readonly demoNow = new Date('2025-10-24T15:00:00');

  private readonly contacts$ = new BehaviorSubject<Contact[]>(this.generateInitialFixtures());

  /** Queries contacts with keyword, status, relative-time filtering and pagination. */
  listContacts(query: ContactListQuery): Observable<ContactListResponse> {
    return this.contacts$.pipe(
      map((contacts) => {
        let filtered = [...contacts];

        const term = query.search.trim().toLowerCase();
        if (term) {
          filtered = filtered.filter(
            (c) =>
              c.code.toLowerCase().includes(term) ||
              c.fullName.toLowerCase().includes(term) ||
              c.phone.toLowerCase().includes(term) ||
              c.email.toLowerCase().includes(term)
          );
        }

        if (query.status !== 'all') {
          filtered = filtered.filter((c) => c.status === query.status);
        }

        if (query.time !== 'all') {
          filtered = filtered.filter((c) => this.isWithinTimeWindow(c, query.time));
        }

        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const currentPage = Math.min(Math.max(1, query.page), totalPages);
        const startIndex = (currentPage - 1) * query.pageSize;

        return {
          items: filtered.slice(startIndex, startIndex + query.pageSize),
          page: currentPage,
          pageSize: query.pageSize,
          totalItems,
          totalPages,
          pendingCount: contacts.filter((c) => c.status === 'new').length,
        };
      })
    );
  }

  getContactById(idOrCode: string): Observable<Contact | null> {
    return this.contacts$.pipe(
      map((contacts) => contacts.find((c) => c.id === idOrCode || c.code === idOrCode) || null)
    );
  }

  /**
   * Moves a contact from "new" to "resolved" (BPMN 3.3.2.9 "Duyệt xử lý").
   * An already resolved request cannot be processed again (exception flow).
   */
  resolveContact(id: string, respondedBy = 'CSKH — Trần Mai Phương'): Observable<Contact> {
    return of(null).pipe(
      map(() => {
        const contacts = this.contacts$.getValue();
        const index = contacts.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error('Không tìm thấy thông tin liên hệ.');
        }
        if (contacts[index].status === 'resolved') {
          throw new Error('Liên hệ đã được xử lý.');
        }

        const updated: Contact = {
          ...contacts[index],
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          respondedBy,
        };

        const next = [...contacts];
        next[index] = updated;
        this.contacts$.next(next);

        return updated;
      })
    );
  }

  private isWithinTimeWindow(contact: Contact, window: ContactListQuery['time']): boolean {
    const ageMs = this.demoNow.getTime() - new Date(contact.createdAt).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    if (window === 'last7days') {
      return ageMs <= 7 * dayMs;
    }
    return ageMs <= 30 * dayMs;
  }

  private generateInitialFixtures(): Contact[] {
    const referenceRows: Contact[] = [
      {
        id: 'contact-001',
        code: 'LH-2610-089',
        fullName: 'Nguyễn Hoàng Nam',
        customerContext: 'KTS - VIP RESIDENT',
        phone: '0912 849 201',
        email: 'hoangnam.arch@gmail.com',
        subject: 'Cần tư vấn thiết kế',
        message:
          'Tôi đang hoàn thiện căn hộ penthouse tại Vinhomes Central Park và cần LIVORA tư vấn phương án nội thất theo phong cách Modern Indochine. Mong nhận được báo giá sơ bộ và lịch hẹn trải nghiệm tại showroom.',
        status: 'new',
        createdAt: '2025-10-24T14:35:00',
      },
      {
        id: 'contact-002',
        code: 'LH-2610-088',
        fullName: 'Lê Thảo My',
        customerContext: 'Villa Thảo Điền',
        phone: '0988 341 556',
        email: 'thaomy.interior@outlook.com',
        subject: 'Báo giá trọn gói',
        message:
          'Gia đình tôi cần báo giá trọn gói cho biệt thự 4 tầng tại Thảo Điền gồm phòng khách, bếp, 4 phòng ngủ và khu vực sân vườn. Vui lòng gửi danh mục vật liệu và thời gian thi công dự kiến.',
        status: 'new',
        createdAt: '2025-10-24T10:15:00',
      },
      {
        id: 'contact-003',
        code: 'LH-2610-087',
        fullName: 'Trần Quốc Bảo',
        customerContext: 'Khách hàng mới',
        phone: '0903 118 792',
        email: 'baotran.arch@gmail.com',
        subject: 'Hỏi về chính sách',
        message:
          'Tôi muốn tìm hiểu chính sách bảo hành và đổi trả của LIVORA đối với sản phẩm sofa da nhập khẩu. Thời gian bảo hành chính thức là bao lâu và có hỗ trợ vệ sinh định kỳ không?',
        status: 'new',
        createdAt: '2025-10-23T16:40:00',
      },
      {
        id: 'contact-004',
        code: 'LH-2610-086',
        fullName: 'Vũ Minh Hạnh',
        customerContext: 'The Metropole',
        phone: '0938 902 441',
        email: 'hanh.vuminh@yahoo.com',
        subject: 'Đặt lịch hẹn trải nghiệm',
        message:
          'Tôi muốn đặt lịch tham quan showroom LIVORA Atelier vào cuối tuần này để trải nghiệm bộ sưu tập phòng khách mới. Nhờ đội ngũ sắp xếp tư vấn viên phụ trách riêng.',
        status: 'resolved',
        createdAt: '2025-10-23T11:20:00',
        resolvedAt: '2025-10-23T15:45:00',
        respondedBy: 'CSKH — Trần Mai Phương',
      },
      {
        id: 'contact-005',
        code: 'LH-2610-085',
        fullName: 'Phạm Đức Toàn',
        customerContext: 'STUDIO FOUNDER',
        phone: '0977 150 998',
        email: 'toan.pham@designlab.vn',
        subject: 'Đăng ký tài khoản',
        message:
          'Tôi đại diện studio thiết kế muốn đăng ký tài khoản đối tác KTS để nhận chiết khấu dự án. Cần hướng dẫn hồ sơ đăng ký và danh sách quyền lợi của tài khoản VIP Partner.',
        status: 'resolved',
        createdAt: '2025-10-22T09:05:00',
        resolvedAt: '2025-10-22T14:10:00',
        respondedBy: 'CSKH — Trần Mai Phương',
      },
    ];

    const names = [
      'Đặng Thanh Hà',
      'Bùi Nhật Linh',
      'Ngô Quang Dũng',
      'Đinh Khả Tú',
      'Hoàng Bảo Châu',
      'Lý Gia Hân',
      'Mai Xuân Trường',
      'Tạ Thu Giang',
      'Chu Minh Triết',
      'Võ Phương Anh',
      'Đào Trung Kiên',
      'Hồ Bích Ngọc',
      'Cao Văn Lâm',
      'Tống Yến Nhi',
      'Phan Hữu Phước',
      'Lương Kiều Trang',
    ];
    const contexts = [
      'Biệt thự Ciputra',
      'KTS - VIP RESIDENT',
      'Chung cư Sunwah Pearl',
      'Villa Thảo Điền',
      'Khách hàng mới',
      'The Metropole',
      'Nhà phố Quận 3',
      'Penthouse Landmark 81',
    ];
    const topics = [
      {
        subject: 'Tư vấn nội thất phòng khách',
        message:
          'Gia đình tôi cần tư vấn bố trí nội thất phòng khách khoảng 35m2 theo phong cách tối giản Bắc Âu. Nhờ LIVORA gợi ý danh mục sản phẩm phù hợp và chi phí dự kiến.',
      },
      {
        subject: 'Báo giá tủ bếp chữ L',
        message:
          'Tôi muốn báo giá tủ bếp chữ L cho căn hộ chung cư, tổng chiều dài 4.2m, chất liệu MDF chống ẩm phủ melamine. Mong nhận phản hồi trong tuần này.',
      },
      {
        subject: 'Hỏi về chính sách bảo hành',
        message:
          'Sản phẩm bàn ăn gỗ óc chó tôi mua tháng trước có vết xước nhỏ. Không biết hệ thống có chính sách bảo hành hoặc hỗ trợ xử lý bề mặt không?',
      },
      {
        subject: 'Đặt lịch hẹn trải nghiệm',
        message:
          'Tôi muốn đặt lịch tham quan xưởng Atelier Craft & Display để xem quy trình hoàn thiện sản phẩm trước khi ký hợp đồng nội thất.',
      },
      {
        subject: 'Hợp tác dự án KTS',
        message:
          'Tôi là kiến trúc sư đang phụ trách 3 dự án nhà phố tại Quận 7, muốn hợp tác cùng LIVORA về nguồn nội thất độc bản cho các dự án này.',
      },
      {
        subject: 'Cần xuất hoá đơn VAT',
        message:
          'Đơn hàng sofa vừa nhận cần xuất hoá đơn VAT cho công ty. Nhờ bộ phận CSKH hướng dẫn bổ sung thông tin xuất hoá đơn.',
      },
      {
        subject: 'Tư vấn đèn trang trí',
        message:
          'Không gian phòng ăn của tôi hơi tối, cần tư vấn giải pháp đèn thả trần và đèn tường kết hợp hợp lý cho khu vực bàn ăn 6 ghế.',
      },
      {
        subject: 'Kiểm tra tiến độ giao hàng',
        message:
          'Tôi đã đặt thảm trải sàn và kệ TV tuần trước theo thông báo dự kiến giao trong 7 ngày. Nhờ kiểm tra giúp tiến độ hiện tại.',
      },
    ];
    const statusPattern: ContactStatus[] = ['new', 'new', 'resolved'];

    const generated: Contact[] = [];
    for (let i = 6; i <= 48; i++) {
      const name = names[(i - 6) % names.length];
      const topic = topics[(i - 6) % topics.length];
      const created = new Date(this.demoNow.getTime() - ((i - 5) * 5.5 + (i % 4) * 2) * 60 * 60 * 1000);
      const status = statusPattern[(i - 6) % statusPattern.length];
      const resolvedAt =
        status === 'resolved'
          ? new Date(created.getTime() + 4 * 60 * 60 * 1000).toISOString()
          : undefined;

      generated.push({
        id: `contact-${String(i).padStart(3, '0')}`,
        code: `LH-2610-${String(90 - i).padStart(3, '0')}`,
        fullName: name,
        customerContext: contexts[(i - 6) % contexts.length],
        phone: `09${String(10000000 + i * 137911).slice(-8, -4)} ${String(10000000 + i * 137911).slice(-4)}`,
        email: `khachhang${i}@livora-demo.vn`,
        subject: topic.subject,
        message: topic.message,
        status,
        createdAt: created.toISOString(),
        resolvedAt,
        respondedBy: status === 'resolved' ? 'CSKH — Trần Mai Phương' : undefined,
      });
    }

    return [...referenceRows, ...generated];
  }
}
