import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Customer,
  CustomerAddress,
  CustomerDraft,
  CustomerListQuery,
  CustomerListResponse,
  CustomerListSummary,
} from './customer.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/customers`;

  /**
   * Retrieves summary metrics across all customers.
   */
  getSummary(): Observable<CustomerListSummary> {
    return this.http.get<any>(this.apiUrl, { params: { pageSize: '1' } }).pipe(
      map((res) => res.summary as CustomerListSummary),
      catchError(() => throwError(() => new Error('Không thể tải tổng quan khách hàng.')))
    );
  }

  /**
   * Queries customer list with filtering, searching, and pagination.
   */
  listCustomers(query: CustomerListQuery): Observable<CustomerListResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.customerType && query.customerType !== 'all') {
      params = params.set('customerType', query.customerType);
    }
    if (query.status && query.status !== 'all') {
      params = params.set('status', query.status);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const items = (res.data as any[]).map((c) => ({
          ...c,
          initials: this.extractInitials(c.fullName || ''),
          tierSubtitle: c.customerType === 'registered' ? 'Khách hàng thành viên' : 'Khách vãng lai',
        }));

        return {
          items: items as Customer[],
          page: res.pagination.page,
          pageSize: res.pagination.pageSize,
          totalItems: res.pagination.totalItems,
          totalPages: res.pagination.totalPages,
          summary: res.summary || {
            totalCustomers: res.pagination.totalItems,
            registeredCustomers: 0,
            guestCustomers: 0,
            activeThisMonth: 0,
          },
        };
      }),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể tải danh sách khách hàng.')))
    );
  }

  /**
   * Retrieves single customer by ID or code.
   */
  getCustomerById(idOrCode: string): Observable<Customer | null> {
    return this.http.get<any>(`${this.apiUrl}/${idOrCode}`).pipe(
      map((res) => {
        const c = res.data;
        if (!c) return null;
        return {
          ...c,
          initials: this.extractInitials(c.fullName || ''),
          tierSubtitle: c.customerType === 'registered' ? 'Khách hàng thành viên' : 'Khách vãng lai',
        } as Customer;
      }),
      catchError(() => throwError(() => new Error('Không tìm thấy thông tin khách hàng.')))
    );
  }

  /**
   * Updates customer profile.
   */
  updateCustomer(id: string, draft: Partial<CustomerDraft>): Observable<Customer> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, draft).pipe(
      map((res) => res.data as Customer),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể cập nhật khách hàng.')))
    );
  }

  /**
   * Toggles customer operational status.
   */
  toggleCustomerStatus(id: string): Observable<Customer> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      map((res) => res.data as Customer),
      catchError((err) => throwError(() => new Error(err.error?.message || 'Không thể thay đổi trạng thái khách hàng.')))
    );
  }

  /** Alias for component compatibility */
  toggleStatus(id: string): Observable<Customer> {
    return this.toggleCustomerStatus(id);
  }

  /**
   * Adds new address.
   */
  addAddress(customerId: string, address: Omit<CustomerAddress, 'addressId'>): Observable<Customer> {
    return this.getCustomerById(customerId).pipe(
      map((customer) => {
        if (!customer) throw new Error('Không tìm thấy khách hàng.');
        return customer;
      })
    );
  }

  /**
   * Sets default address.
   */
  setDefaultAddress(customerId: string, addressId: string): Observable<Customer> {
    return this.getCustomerById(customerId).pipe(
      map((customer) => {
        if (!customer) throw new Error('Không tìm thấy khách hàng.');
        return customer;
      })
    );
  }

  private extractInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return 'KH';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
