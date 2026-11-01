import { Injectable } from '@angular/core';

export interface ProvinceCodeInfo {
  code: string;
  name: string;
  region: string;
}

export const PROVINCE_DICTIONARY: ProvinceCodeInfo[] = [
  { code: 'TQ', name: 'Toàn quốc', region: 'Áp dụng chung mọi tỉnh thành' },
  { code: 'HCM', name: 'TP. Hồ Chí Minh', region: 'Đông Nam Bộ' },
  { code: 'HN', name: 'Hà Nội', region: 'Đồng bằng sông Hồng' },
  { code: 'DN', name: 'Đà Nẵng', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'HP', name: 'Hải Phòng', region: 'Đồng bằng sông Hồng' },
  { code: 'CT', name: 'Cần Thơ', region: 'Đồng bằng sông Cửu Long' },
  { code: 'AG', name: 'An Giang', region: 'Đồng bằng sông Cửu Long' },
  { code: 'VT', name: 'Bà Rịa - Vũng Tàu', region: 'Đông Nam Bộ' },
  { code: 'BG', name: 'Bắc Giang', region: 'Đông Bắc Bộ' },
  { code: 'BK', name: 'Bắc Kạn', region: 'Đông Bắc Bộ' },
  { code: 'BL', name: 'Bạc Liêu', region: 'Đồng bằng sông Cửu Long' },
  { code: 'BN', name: 'Bắc Ninh', region: 'Đồng bằng sông Hồng' },
  { code: 'BT', name: 'Bến Tre', region: 'Đồng bằng sông Cửu Long' },
  { code: 'BD', name: 'Bình Dương', region: 'Đông Nam Bộ' },
  { code: 'BDI', name: 'Bình Định', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'BP', name: 'Bình Phước', region: 'Đông Nam Bộ' },
  { code: 'BTH', name: 'Bình Thuận', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'CM', name: 'Cà Mau', region: 'Đồng bằng sông Cửu Long' },
  { code: 'CB', name: 'Cao Bằng', region: 'Đông Bắc Bộ' },
  { code: 'DL', name: 'Đắk Lắk', region: 'Tây Nguyên' },
  { code: 'DNO', name: 'Đắk Nông', region: 'Tây Nguyên' },
  { code: 'DB', name: 'Điện Biên', region: 'Tây Bắc Bộ' },
  { code: 'DNI', name: 'Đồng Nai', region: 'Đông Nam Bộ' },
  { code: 'DT', name: 'Đồng Tháp', region: 'Đồng bằng sông Cửu Long' },
  { code: 'GL', name: 'Gia Lai', region: 'Tây Nguyên' },
  { code: 'HG', name: 'Hà Giang', region: 'Đông Bắc Bộ' },
  { code: 'HNA', name: 'Hà Nam', region: 'Đồng bằng sông Hồng' },
  { code: 'HT', name: 'Hà Tĩnh', region: 'Bắc Trung Bộ' },
  { code: 'HD', name: 'Hải Dương', region: 'Đồng bằng sông Hồng' },
  { code: 'HGI', name: 'Hậu Giang', region: 'Đồng bằng sông Cửu Long' },
  { code: 'HB', name: 'Hòa Bình', region: 'Tây Bắc Bộ' },
  { code: 'HY', name: 'Hưng Yên', region: 'Đồng bằng sông Hồng' },
  { code: 'KH', name: 'Khánh Hòa', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'KG', name: 'Kiên Giang', region: 'Đồng bằng sông Cửu Long' },
  { code: 'KT', name: 'Kon Tum', region: 'Tây Nguyên' },
  { code: 'LC', name: 'Lai Châu', region: 'Tây Bắc Bộ' },
  { code: 'LD', name: 'Lâm Đồng', region: 'Tây Nguyên' },
  { code: 'LS', name: 'Lạng Sơn', region: 'Đông Bắc Bộ' },
  { code: 'LCA', name: 'Lào Cai', region: 'Tây Bắc Bộ' },
  { code: 'LA', name: 'Long An', region: 'Đồng bằng sông Cửu Long' },
  { code: 'ND', name: 'Nam Định', region: 'Đồng bằng sông Hồng' },
  { code: 'NA', name: 'Nghệ An', region: 'Bắc Trung Bộ' },
  { code: 'NB', name: 'Ninh Bình', region: 'Đồng bằng sông Hồng' },
  { code: 'NT', name: 'Ninh Thuận', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'PT', name: 'Phú Thọ', region: 'Đông Bắc Bộ' },
  { code: 'PY', name: 'Phú Yên', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'QB', name: 'Quảng Bình', region: 'Bắc Trung Bộ' },
  { code: 'QM', name: 'Quảng Nam', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'QNG', name: 'Quảng Ngãi', region: 'Duyên hải Nam Trung Bộ' },
  { code: 'QN', name: 'Quảng Ninh', region: 'Đông Bắc Bộ' },
  { code: 'QT', name: 'Quảng Trị', region: 'Bắc Trung Bộ' },
  { code: 'ST', name: 'Sóc Trăng', region: 'Đồng bằng sông Cửu Long' },
  { code: 'SL', name: 'Sơn La', region: 'Tây Bắc Bộ' },
  { code: 'TN', name: 'Tây Ninh', region: 'Đông Nam Bộ' },
  { code: 'TB', name: 'Thái Bình', region: 'Đồng bằng sông Hồng' },
  { code: 'TNG', name: 'Thái Nguyên', region: 'Đông Bắc Bộ' },
  { code: 'TH', name: 'Thanh Hóa', region: 'Bắc Trung Bộ' },
  { code: 'TTH', name: 'Thừa Thiên Huế', region: 'Bắc Trung Bộ' },
  { code: 'TG', name: 'Tiền Giang', region: 'Đồng bằng sông Cửu Long' },
  { code: 'TV', name: 'Trà Vinh', region: 'Đồng bằng sông Cửu Long' },
  { code: 'TQG', name: 'Tuyên Quang', region: 'Đông Bắc Bộ' },
  { code: 'VL', name: 'Vĩnh Long', region: 'Đồng bằng sông Cửu Long' },
  { code: 'VP', name: 'Vĩnh Phúc', region: 'Đồng bằng sông Hồng' },
  { code: 'YB', name: 'Yên Bái', region: 'Tây Bắc Bộ' },
];

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  /**
   * Đảm bảo thư viện SheetJS (XLSX) đã sẵn sàng trong môi trường trình duyệt.
   */
  async loadXLSX(): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).XLSX) {
      return (window as any).XLSX;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => {
        if ((window as any).XLSX) {
          resolve((window as any).XLSX);
        } else {
          reject(new Error('Không thể khởi tạo thư viện xử lý file Excel.'));
        }
      };
      script.onerror = () => reject(new Error('Lỗi mạng khi tải thư viện Excel. Vui lòng thử lại.'));
      document.head.appendChild(script);
    });
  }

  /**
   * Tạo và tải xuống file Excel (.xlsx) đa tab (sheets).
   */
  async exportMultiSheet(
    sheets: { name: string; data: any[][] }[],
    fileName: string
  ): Promise<void> {
    const XLSX = await this.loadXLSX();
    const wb = XLSX.utils.book_new();

    for (const sheet of sheets) {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      // Căn chỉnh độ rộng cột tự động
      const colWidths = sheet.data.reduce((widths: number[], row: any[]) => {
        row.forEach((cell, i) => {
          const len = String(cell ?? '').length;
          widths[i] = Math.max(widths[i] || 12, Math.min(len + 4, 45));
        });
        return widths;
      }, []);
      ws['!cols'] = colWidths.map((w: number) => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
    }

    XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
  }

  /**
   * Đọc file Excel (.xlsx / .xls / .csv) được người dùng tải lên, trả về mảng dữ liệu theo từng tab.
   */
  async readWorkbook(file: File): Promise<{ [sheetName: string]: any[][] }> {
    const XLSX = await this.loadXLSX();
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    const result: { [sheetName: string]: any[][] } = {};
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      result[sheetName] = data;
    }

    return result;
  }

  /**
   * Tra cứu tên tỉnh thành chính xác từ Mã tỉnh được người dùng nhập vào.
   * Hỗ trợ tìm kiếm theo Code hoặc Tên tỉnh không phân biệt hoa thường.
   */
  resolveProvinceByCode(codeOrInput: string): { valid: boolean; provinceName: string; code: string } {
    if (!codeOrInput || !codeOrInput.trim()) {
      return { valid: false, provinceName: '', code: '' };
    }

    const clean = codeOrInput.trim().toUpperCase();

    // 1. Khớp theo mã tỉnh chính xác
    const byCode = PROVINCE_DICTIONARY.find((p) => p.code.toUpperCase() === clean);
    if (byCode) {
      return { valid: true, provinceName: byCode.name, code: byCode.code };
    }

    // 2. Một số alias viết tắt phổ biến
    const aliases: { [key: string]: string } = {
      'SG': 'HCM',
      'TPHCM': 'HCM',
      'HANOI': 'HN',
      'DANANG': 'DN',
      'HAIPHONG': 'HP',
      'CANTHO': 'CT',
      'BINHDUONG': 'BD',
      'DONGNAI': 'DNI',
      'VUNGTAU': 'VT',
      'BRVT': 'VT',
      'TOANQUOC': 'TQ',
      'ALL': 'TQ',
    };
    if (aliases[clean]) {
      const aliasMatch = PROVINCE_DICTIONARY.find((p) => p.code === aliases[clean]);
      if (aliasMatch) {
        return { valid: true, provinceName: aliasMatch.name, code: aliasMatch.code };
      }
    }

    // 3. Khớp theo tên tiếng Việt
    const cleanLower = codeOrInput.trim().toLowerCase();
    const byName = PROVINCE_DICTIONARY.find(
      (p) => p.name.toLowerCase() === cleanLower || p.name.toLowerCase().includes(cleanLower)
    );
    if (byName) {
      return { valid: true, provinceName: byName.name, code: byName.code };
    }

    return { valid: false, provinceName: '', code: clean };
  }
}

