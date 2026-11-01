const VIETNAM_LOCATIONS = [
  { code: '89', name: 'An Giang' },
  { code: '27', name: 'Bắc Ninh' },
  { code: '96', name: 'Cà Mau' },
  { code: '04', name: 'Cao Bằng' },
  { code: '66', name: 'Đắk Lắk' },
  { code: '11', name: 'Điện Biên' },
  { code: '75', name: 'Đồng Nai' },
  { code: '87', name: 'Đồng Tháp' },
  { code: '64', name: 'Gia Lai' },
  { code: '42', name: 'Hà Tĩnh' },
  { code: '33', name: 'Hưng Yên' },
  { code: '56', name: 'Khánh Hòa' },
  { code: '12', name: 'Lai Châu' },
  { code: '68', name: 'Lâm Đồng' },
  { code: '20', name: 'Lạng Sơn' },
  { code: '10', name: 'Lào Cai' },
  { code: '40', name: 'Nghệ An' },
  { code: '37', name: 'Ninh Bình' },
  { code: '25', name: 'Phú Thọ' },
  { code: '51', name: 'Quảng Ngãi' },
  { code: '22', name: 'Quảng Ninh' },
  { code: '45', name: 'Quảng Trị' },
  { code: '14', name: 'Sơn La' },
  { code: '72', name: 'Tây Ninh' },
  { code: '19', name: 'Thái Nguyên' },
  { code: '38', name: 'Thanh Hóa' },
  { code: '92', name: 'Cần Thơ' },
  { code: '48', name: 'Đà Nẵng' },
  { code: '01', name: 'Hà Nội' },
  { code: '31', name: 'Hải Phòng' },
  { code: '79', name: 'TP. Hồ Chí Minh' },
  { code: '46', name: 'Thừa Thiên Huế' },
  { code: '08', name: 'Tuyên Quang' },
  { code: '86', name: 'Vĩnh Long' }
];

const VIETNAM_PROVINCE_NAMES = VIETNAM_LOCATIONS.map(p => p.name);

module.exports = { VIETNAM_LOCATIONS, VIETNAM_PROVINCE_NAMES };

