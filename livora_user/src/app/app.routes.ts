import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Home } from './features/home/home';
import { Module5 } from './features/module-5/module-5';
import { Cart } from './features/module-3/cart/cart';
import { Payment } from './features/module-3/payment/payment';
import { Module3 } from './features/module-3/module-3';
import { Module4 } from './features/module-4/module-4';
import { Module6 } from './features/module-6/module-6';
import { RoomCategories } from './features/rooms/room-categories/room-categories';
import { RoomProductList } from './features/rooms/room-product-list/room-product-list';
import { RoomProductDetail } from './features/rooms/room-product-detail/room-product-detail';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'home', component: Home },
  { path: 'profile', component: Module5, canActivate: [authGuard] },
  { path: 'order-tracking', component: Module6 },
  { path: 'design', component: Module4 },
  { path: 'cart', component: Cart },
  { path: 'payment', component: Payment },
  { path: 'inspiration', component: Module3 },

  // room routes
  { path: 'rooms', component: RoomCategories },
  { path: 'rooms/:roomName/:categoryName', component: RoomProductList },
  { path: 'rooms/:roomName/:categoryName/:productId', component: RoomProductDetail },
  {
    path: 'rooms/:roomName',
    redirectTo: (routeData) => {
      const room = routeData.params['roomName'];

      if (room === 'living-room') return `/rooms/${room}/sofas`; //mockup
      if (room === 'kitchen') return `/rooms/${room}/cabinets`;  //mockup 
      if (room === 'bathroom') return `/rooms/${room}/mirrors`;  //mockup
      if (room === 'dining-room') return `/rooms/${room}/dining-tables`; //mockup

      return `/rooms/${room}/beds`;
    },
    pathMatch: 'full'
  },
];
