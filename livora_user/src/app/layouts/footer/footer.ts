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
  whatsappUrl = 'https://wa.me/84901234567';

  showFacebook = true;
  showInstagram = true;
  showZalo = true;
  showPhone = true;

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/homepage/footers`).subscribe({
      next: (res) => {
        const footers = res.data || [];
        footers.forEach((item: any) => {
          const isVisible = item.status === 'Hiển thị';
          const val = (item.value || '').trim();

          if (item.key === 'facebook') {
            this.showFacebook = isVisible;
            if (val) this.facebookUrl = this.normalizeUrl(val);
          } else if (item.key === 'instagram') {
            this.showInstagram = isVisible;
            if (val) this.instagramUrl = this.normalizeInstagramUrl(val);
          } else if (item.key === 'zalo') {
            this.showZalo = isVisible;
            if (val) this.zaloUrl = this.normalizeZaloUrl(val);
          } else if (item.key === 'phone') {
            this.showPhone = isVisible;
            if (val) {
              this.phone = val;
              this.whatsappUrl = this.normalizeWhatsAppUrl(val);
            }
          }
        });
      },
      error: () => {},
    });
  }

  normalizeUrl(url: string): string {
    if (!url) return '';
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
      return 'https://' + url;
    }
    return url;
  }

  normalizeInstagramUrl(url: string): string {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('@')) {
      return `https://instagram.com/${url.substring(1)}`;
    }
    if (!/^https?:\/\//i.test(url)) {
      return 'https://' + url;
    }
    return url;
  }

  normalizeZaloUrl(url: string): string {
    if (!url) return '';
    url = url.trim();
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    if (/^zalo\.me\//i.test(url)) {
      return 'https://' + url;
    }
    // Clean spaces, dots, dashes for phone numbers
    const cleanNumber = url.replace(/[\s.-]/g, '');
    return `https://zalo.me/${cleanNumber}`;
  }

  normalizeWhatsAppUrl(input: string): string {
    if (!input) return '';
    input = input.trim();
    if (/^https?:\/\//i.test(input)) {
      return input;
    }
    if (/^wa\.me\//i.test(input)) {
      return 'https://' + input;
    }
    // Clean non-digits
    let digits = input.replace(/\D/g, '');
    if (!digits) return '';
    // If starts with 0 (e.g. 0901234567), convert to 84 (Vietnam country code)
    if (digits.startsWith('0')) {
      digits = '84' + digits.substring(1);
    }
    return `https://wa.me/${digits}`;
  }
}
