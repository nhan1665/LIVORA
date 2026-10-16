import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  private readonly http = inject(HttpClient);

  facebookUrl = 'https://facebook.com/livora';
  instagramUrl = 'https://instagram.com/livora';
  zaloUrl = 'https://zalo.me/0901234567';
  phone = '0901234567';

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/homepage/footers`).subscribe({
      next: (res) => {
        const footers = res.data || [];
        footers.forEach((item: any) => {
          if (item.status === 'Hiển thị') {
            if (item.key === 'facebook' && item.value) this.facebookUrl = item.value;
            if (item.key === 'instagram' && item.value) this.instagramUrl = item.value;
            if (item.key === 'zalo' && item.value) this.zaloUrl = item.value;
            if (item.key === 'phone' && item.value) this.phone = item.value;
          }
        });
      },
      error: () => {},
    });
  }
}
