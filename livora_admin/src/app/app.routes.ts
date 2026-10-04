import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Revenue } from './dashboard/revenue/revenue';
import { Homepage } from './homepage/homepage';
import { Customer } from './customer_management/customer/customer';
import { Category } from './product_management/category/category';
import { Product } from './product_management/product/product';
import { Room } from './room_management/room/room';
import { Inspiration } from './room_management/inspiration/inspiration';
import { Space } from './room_management/space/space';
import { Contact } from './interaction_management/contact/contact';
import { Review } from './interaction_management/review/review';
import { Order } from './order_management/order/order';
import { Refund } from './order_management/refund/refund';
import { Voucher } from './settings/voucher/voucher';
import { Shipping } from './settings/shipping/shipping';

export const routes: Routes = [
  // Auth
  { path: 'login', component: Login, title: 'Đăng nhập - Livora Admin' },

  // Dashboard
  { path: 'dashboard', redirectTo: 'dashboard/revenue', pathMatch: 'full' },
  { path: 'dashboard/revenue', component: Revenue, title: 'Báo cáo doanh thu - Livora Admin' },

  // Trang chủ
  { path: 'home-management', component: Homepage, title: 'Quản lý trang chủ - Livora Admin' },

  // Khách hàng
  { path: 'customers', redirectTo: 'customers/list', pathMatch: 'full' },
  { path: 'customers/list', component: Customer, title: 'Danh sách khách hàng - Livora Admin' },

  // Sản phẩm
  { path: 'products', redirectTo: 'products/list', pathMatch: 'full' },
  { path: 'products/categories', component: Category, title: 'Loại sản phẩm - Livora Admin' },
  { path: 'products/list', component: Product, title: 'Danh sách sản phẩm - Livora Admin' },

  // Phòng & Cảm hứng & Không gian
  { path: 'rooms', redirectTo: 'rooms/list', pathMatch: 'full' },
  { path: 'rooms/list', component: Room, title: 'Danh sách phòng - Livora Admin' },
  { path: 'rooms/inspirations', component: Inspiration, title: 'Danh sách cảm hứng - Livora Admin' },
  { path: 'rooms/spaces', component: Space, title: 'Quản lý không gian - Livora Admin' },

  // Tương tác (Liên hệ & Đánh giá)
  { path: 'interactions', redirectTo: 'interactions/contact', pathMatch: 'full' },
  { path: 'interactions/contact', component: Contact, title: 'Liên hệ - Livora Admin' },
  { path: 'interactions/reviews', component: Review, title: 'Đánh giá - Livora Admin' },

  // Đơn hàng
  { path: 'orders', redirectTo: 'orders/list', pathMatch: 'full' },
  { path: 'orders/list', component: Order, title: 'Danh sách đơn hàng - Livora Admin' },
  { path: 'orders/refunds', component: Refund, title: 'Yêu cầu hoàn tiền - Livora Admin' },

  // Thiết lập
  { path: 'settings', redirectTo: 'settings/vouchers', pathMatch: 'full' },
  { path: 'settings/vouchers', component: Voucher, title: 'Voucher - Livora Admin' },
  { path: 'settings/shipping', component: Shipping, title: 'Thiết lập vận chuyển - Livora Admin' },

  // Fallbacks
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

