import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const sprint2AdminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const apiPrefix = environment.apiBaseUrl.replace(/\/$/, '');
  const path = request.url.startsWith(`${apiPrefix}/`) ? request.url.slice(apiPrefix.length + 1) : '';
  const resource = path.split(/[/?]/, 1)[0];
  if (!['customers', 'vouchers', 'shipping'].includes(resource)) return next(request);
  const token = localStorage.getItem('livora_admin_token');
  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);
};
