export interface ProvinceLocation {
  code: string;
  name: string;
  wards: string[];
}

export const VIETNAM_LOCATIONS: ProvinceLocation[] = [
  {
    code: '89',
    name: 'An Giang',
    wards: [
      'An Biên', 'An Châu', 'An Cư', 'An Minh', 'An Phú', 'Ba Chúc', 'Bình An', 'Bình Đức', 'Bình Giang',
      'Bình Hòa', 'Bình Mỹ', 'Bình Sơn', 'Bình Thạnh Đông', 'Cần Đăng', 'Châu Đốc', 'Châu Phong',
      'Châu Phú', 'Châu Thành', 'Chi Lăng', 'Chợ Mới', 'Chợ Vàm', 'Cô Tô', 'Cù Lao Giêng', 'Định Hòa',
      'Định Mỹ', 'Đông Hòa', 'Đông Hưng', 'Đông Thái', 'Giang Thành', 'Giồng Riềng', 'Gò Quao', 'Hà Tiên',
      'Hòa Điền', 'Hòa Hưng', 'Hòa Lạc', 'Hòa Thuận', 'Hòn Đất', 'Hòn Nghệ', 'Hội An', 'Khánh Bình',
      'Kiên Hải', 'Kiên Lương', 'Long Điền', 'Long Kiến', 'Long Phú', 'Long Thạnh', 'Long Xuyên', 'Mỹ Đức',
      'Mỹ Hòa Hưng', 'Mỹ Thới', 'Mỹ Thuận', 'Ngọc Chúc', 'Nhơn Hội', 'Nhơn Mỹ', 'Núi Cấm', 'Óc Eo', 'Ô Lâm',
      'Phú An', 'Phú Hòa', 'Phú Hữu', 'Phú Lâm', 'Phú Quốc', 'Phú Tân', 'Rạch Giá', 'Sơn Hải', 'Sơn Kiên',
      'Tân An', 'Tân Châu', 'Tân Hiệp', 'Tân Hội', 'Tân Thạnh', 'Tây Phú', 'Tây Yên', 'Thạnh Đông',
      'Thạnh Hưng', 'Thạnh Lộc', 'Thạnh Mỹ Tây', 'Thoại Sơn', 'Thổ Châu', 'Thới Sơn', 'Tiên Hải', 'Tịnh Biên',
      'Tô Châu', 'Tri Tôn', 'U Minh Thượng', 'Vân Khánh', 'Vĩnh An', 'Vĩnh Bình', 'Vĩnh Điều', 'Vĩnh Gia',
      'Vĩnh Hanh', 'Vĩnh Hậu', 'Vĩnh Hòa', 'Vĩnh Hòa Hưng', 'Vĩnh Phong', 'Vĩnh Tế', 'Vĩnh Thạnh Trung',
      'Vĩnh Thông', 'Vĩnh Thuận', 'Vĩnh Trạch', 'Vĩnh Tuy', 'Vĩnh Xương'
    ]
  },
  {
    code: '27',
    name: 'Bắc Ninh',
    wards: [
      'An Lạc', 'Bảo Đài', 'Bắc Giang', 'Bắc Lũng', 'Biển Động', 'Biên Sơn', 'Bố Hạ', 'Bồng Lai',
      'Cảnh Thụy', 'Cao Đức', 'Cẩm Lý', 'Chi Lăng', 'Chũ', 'Dương Hưu', 'Đa Mai', 'Đại Đồng', 'Đại Lai',
      'Đại Sơn', 'Đào Viên', 'Đèo Gia', 'Đông Cứu', 'Đồng Kỳ', 'Đồng Nguyên', 'Đông Phú', 'Đồng Việt',
      'Gia Bình', 'Hạp Lĩnh', 'Hiệp Hòa', 'Hoàng Vân', 'Hợp Thịnh', 'Kép', 'Kiên Lao', 'Kinh Bắc',
      'Lạng Giang', 'Lâm Thao', 'Liên Bão', 'Lục Nam', 'Lục Ngạn', 'Lục Sơn', 'Lương Tài', 'Mão Điền',
      'Mỹ Thái', 'Nam Dương', 'Nam Sơn', 'Nếnh', 'Nghĩa Phương', 'Ngọc Thiện', 'Nhã Nam', 'Nhân Hòa',
      'Nhân Thắng', 'Ninh Xá', 'Phật Tích', 'Phù Khê', 'Phù Lãng', 'Phúc Hòa', 'Phương Liễu', 'Phượng Sơn',
      'Quang Trung', 'Quế Võ', 'Sa Lý', 'Song Liễu', 'Sơn Động', 'Sơn Hải', 'Tam Đa', 'Tam Giang',
      'Tam Sơn', 'Tam Tiến', 'Tân An', 'Tân Chi', 'Tân Dĩnh', 'Tân Sơn', 'Tân Tiến', 'Tân Yên', 'Tây Yên Tử',
      'Thuận Thành', 'Tiên Du', 'Tiên Lục', 'Tiền Phong', 'Trạm Lộ', 'Trí Quả', 'Trung Chính', 'Trung Kênh',
      'Trường Sơn', 'Tuấn Đạo', 'Tự Lạn', 'Từ Sơn', 'Văn Môn', 'Vân Hà', 'Vân Sơn', 'Việt Yên', 'Võ Cường',
      'Vũ Ninh', 'Xuân Cẩm', 'Xuân Lương', 'Yên Dũng', 'Yên Định', 'Yên Phong', 'Yên Thế', 'Yên Trung'
    ]
  },
  {
    code: '96',
    name: 'Cà Mau',
    wards: [
      'An Trạch', 'An Xuyên', 'Bạc Liêu', 'Biển Bạch', 'Cái Đôi Vàm', 'Cái Nước', 'Châu Thới',
      'Đá Bạc', 'Đầm Dơi', 'Đất Mới', 'Đất Mũi', 'Định Thành', 'Đông Hải', 'Gành Hào', 'Giá Rai',
      'Hiệp Thành', 'Hòa Bình', 'Hòa Thành', 'Hồ Thị Kỷ', 'Hồng Dân', 'Hưng Hội', 'Hưng Mỹ', 'Khánh An',
      'Khánh Bình', 'Khánh Hưng', 'Khánh Lâm', 'Láng Tròn', 'Long Điền', 'Lương Thế Trân',
      'Lý Văn Lâm', 'Năm Căn', 'Nguyễn Phích', 'Nguyễn Việt Khái', 'Ninh Quới', 'Ninh Thạnh Lợi',
      'Phan Ngọc Hiển', 'Phong Hiệp', 'Phong Thạnh', 'Phú Mỹ', 'Phú Tân', 'Phước Long', 'Quách Phẩm',
      'Sông Đốc', 'Tạ An Khương', 'Tam Giang', 'Tân Ân', 'Tân Hưng', 'Tân Lộc', 'Tân Thành', 'Tân Thuận',
      'Tân Tiến', 'Thanh Tùng', 'Thới Bình', 'Trần Phán', 'Trần Văn Thời', 'Trí Phải', 'U Minh',
      'Vĩnh Hậu', 'Vĩnh Lộc', 'Vĩnh Lợi', 'Vĩnh Mỹ', 'Vĩnh Phước', 'Vĩnh Thanh', 'Vĩnh Trạch'
    ]
  },
  {
    code: '04',
    name: 'Cao Bằng',
    wards: [
      'Bạch Đằng', 'Bảo Lạc', 'Bảo Lâm', 'Bế Văn Đàn', 'Ca Thành', 'Canh Tân', 'Cần Yên', 'Cô Ba',
      'Cốc Pàng', 'Đàm Thủy', 'Đình Phong', 'Đoài Dương', 'Độc Lập', 'Đông Khê', 'Đức Long', 'Hạ Lang',
      'Hà Quảng', 'Hạnh Phúc', 'Hòa An', 'Huy Giáp', 'Hưng Đạo', 'Khánh Xuân', 'Kim Đồng', 'Lũng Nặm',
      'Lý Bôn', 'Lý Quốc', 'Minh Khai', 'Minh Tâm', 'Nam Quang', 'Nam Tuấn', 'Nguyên Bình', 'Nguyễn Huệ',
      'Nùng Trí Cao', 'Phan Thanh', 'Phục Hòa', 'Quang Hán', 'Quảng Lâm', 'Quang Long', 'Quang Trung',
      'Quảng Uyên', 'Sơn Lộ', 'Tam Kim', 'Tân Giang', 'Thạch An', 'Thành Công', 'Thanh Long', 'Thông Nông',
      'Thục Phán', 'Tĩnh Túc', 'Tổng Cọt', 'Trà Lĩnh', 'Trùng Khánh', 'Trường Hà', 'Vinh Quý', 'Xuân Trường',
      'Yên Thổ'
    ]
  },
  {
    code: '66',
    name: 'Đắk Lắk',
    wards: [
      'Bình Kiến', 'Buôn Đôn', 'Buôn Hồ', 'Buôn Ma Thuột', 'Cuôr Đăng', 'Cư Bao', 'Cư M’gar', 'Cư M’ta',
      'Cư Pơng', 'Cư Prao', 'Cư Pui', 'Cư Yang', 'Dang Kang', 'Dliê Ya', 'Dray Bhăng', 'Dur Kmăl',
      'Đắk Liêng', 'Đắk Phơi', 'Đông Hòa', 'Đồng Xuân', 'Đức Bình', 'Ea Bá', 'Ea Bung', 'Ea Drăng',
      'Ea Drông', 'Ea H\'Leo', 'Ea Hiao', 'Ea Kao', 'Ea Kar', 'Ea Khăl', 'Ea Kiết', 'Ea Kly', 'Ea Knốp',
      'Ea Knuếc', 'Ea Ktur', 'Ea Ly', 'Ea M’Droh', 'Ea Na', 'Ea Ning', 'Ea Nuôl', 'Ea Ô', 'Ea Păl',
      'Ea Phê', 'Ea Riêng', 'Ea Rốk', 'Ea Súp', 'Ea Trang', 'Ea Tul', 'Ea Wer', 'Ea Wy', 'Hòa Hiệp',
      'Hòa Mỹ', 'Hòa Phú', 'Hòa Sơn', 'Hòa Thịnh', 'Hòa Xuân', 'Ia Lốp', 'Ia Rvê', 'Krông Á', 'Krông Ana',
      'Krông Bông', 'Krông Búk', 'Krông Năng', 'Krông Nô', 'Krông Pắc', 'Liên Sơn Lắk', 'M’Drắk', 'Nam Ka',
      'Ô Loan', 'Phú Hòa 1', 'Phú Hòa 2', 'Phú Mỡ', 'Phú Xuân', 'Phú Yên', 'Pơng Drang', 'Quảng Phú',
      'Sông Cầu', 'Sông Hinh', 'Sơn Hòa', 'Sơn Thành', 'Suối Trai', 'Tam Giang', 'Tân An', 'Tân Lập',
      'Tân Tiến', 'Tây Hòa', 'Tây Sơn', 'Thành Nhất', 'Tuy An Bắc', 'Tuy An Đông', 'Tuy An Nam', 'Tuy An Tây',
      'Tuy Hòa', 'Vân Hòa', 'Vụ Bổn', 'Xuân Cảnh', 'Xuân Đài', 'Xuân Lãnh', 'Xuân Lộc', 'Xuân Phước',
      'Xuân Thọ', 'Yang Mao'
    ]
  },
  {
    code: '11',
    name: 'Điện Biên',
    wards: [
      'Búng Lao', 'Chà Tở', 'Chiềng Sinh', 'Điện Biên Phủ', 'Mường Ảng', 'Mường Chà', 'Mường Lạn',
      'Mường Lay', 'Mường Luân', 'Mường Mùn', 'Mường Nhà', 'Mường Nhé', 'Mường Phăng', 'Mường Pồn',
      'Mường Thanh', 'Mường Toong', 'Mường Tùng', 'Nà Bủng', 'Nà Hỳ', 'Na Sang', 'Na Son', 'Nà Tấu',
      'Nậm Kè', 'Nậm Nèn', 'Núa Ngam', 'Pa Ham', 'Phình Giàng', 'Pu Nhi', 'Pú Nhung', 'Quài Tở',
      'Quảng Lâm', 'Sam Mứn', 'Sáng Nhè', 'Si Pa Phìn', 'Sín Chải', 'Sín Thầu', 'Sính Phình', 'Thanh An',
      'Thanh Nưa', 'Thanh Yên', 'Tìa Dình', 'Tủa Chùa', 'Tủa Thàng', 'Tuần Giáo', 'Xa Dung'
    ]
  },
  {
    code: '75',
    name: 'Đồng Nai',
    wards: [
      'An Lộc', 'An Phước', 'An Viễn', 'Bảo Vinh', 'Bàu Hàm', 'Biên Hòa', 'Bình An', 'Bình Long',
      'Bình Lộc', 'Bình Minh', 'Bình Phước', 'Bình Tân', 'Bom Bo', 'Bù Đăng', 'Bù Gia Mập', 'Cẩm Mỹ',
      'Chơn Thành', 'Dầu Giây', 'Đa Kia', 'Đại Phước', 'Đak Lua', 'Đak Nhau', 'Đăk Ơ', 'Định Quán',
      'Đồng Phú', 'Đồng Tâm', 'Đồng Xoài', 'Gia Kiệm', 'Hàng Gòn', 'Hố Nai', 'Hưng Phước', 'Hưng Thịnh',
      'La Ngà', 'Long Bình', 'Long Hà', 'Long Hưng', 'Long Khánh', 'Long Phước', 'Long Thành', 'Lộc Hưng',
      'Lộc Ninh', 'Lộc Quang', 'Lộc Tấn', 'Lộc Thành', 'Lộc Thạnh', 'Minh Đức', 'Minh Hưng', 'Nam Cát Tiên',
      'Nghĩa Trung', 'Nha Bích', 'Nhơn Trạch', 'Phú Hòa', 'Phú Lâm', 'Phú Lý', 'Phú Nghĩa', 'Phú Riềng',
      'Phú Trung', 'Phú Vinh', 'Phước An', 'Phước Bình', 'Phước Long', 'Phước Sơn', 'Phước Tân', 'Phước Thái',
      'Sông Ray', 'Tà Lài', 'Tam Hiệp', 'Tam Phước', 'Tân An', 'Tân Hưng', 'Tân Khai', 'Tân Lợi',
      'Tân Phú', 'Tân Quan', 'Tân Tiến', 'Tân Triều', 'Thanh Sơn', 'Thiện Hưng', 'Thọ Sơn', 'Thống Nhất',
      'Thuận Lợi', 'Trảng Bom', 'Trảng Dài', 'Trấn Biên', 'Trị An', 'Xuân Bắc', 'Xuân Định', 'Xuân Đông',
      'Xuân Đường', 'Xuân Hòa', 'Xuân Lập', 'Xuân Lộc', 'Xuân Phú', 'Xuân Quế', 'Xuân Thành'
    ]
  },
  {
    code: '87',
    name: 'Đồng Tháp',
    wards: [
      'An Bình', 'An Hòa', 'An Hữu', 'An Long', 'An Phước', 'An Thạnh Thủy', 'Ba Sao', 'Bình Hàng Trung',
      'Bình Ninh', 'Bình Phú', 'Bình Thành', 'Bình Trưng', 'Bình Xuân', 'Cái Bè', 'Cai Lậy', 'Cao Lãnh',
      'Châu Thành', 'Chợ Gạo', 'Đạo Thạnh', 'Đốc Binh Kiều', 'Đồng Sơn', 'Gia Thuận', 'Gò Công', 'Gò Công Đông',
      'Hậu Mỹ', 'Hiệp Đức', 'Hòa Long', 'Hội Cư', 'Hồng Ngự', 'Hưng Thạnh', 'Kim Sơn', 'Lai Vung',
      'Lấp Vò', 'Long Bình', 'Long Định', 'Long Hưng', 'Long Khánh', 'Long Phú Thuận', 'Long Thuận', 'Long Tiên',
      'Lương Hòa Lạc', 'Mỹ An Hưng', 'Mỹ Đức Tây', 'Mỹ Hiệp', 'Mỹ Lợi', 'Mỹ Ngãi', 'Mỹ Phong', 'Mỹ Phước Tây',
      'Mỹ Quí', 'Mỹ Thành', 'Mỹ Thiện', 'Mỹ Tho', 'Mỹ Thọ', 'Mỹ Tịnh An', 'Mỹ Trà', 'Ngũ Hiệp',
      'Nhị Quý', 'Phong Hòa', 'Phong Mỹ', 'Phú Cường', 'Phú Hựu', 'Phú Thành', 'Phú Thọ', 'Phương Thịnh',
      'Sa Đéc', 'Sơn Qui', 'Tam Nông', 'Tân Dương', 'Tân Điền', 'Tân Đông', 'Tân Hòa', 'Tân Hộ Cơ',
      'Tân Hồng', 'Tân Hương', 'Tân Khánh Trung', 'Tân Long', 'Tân Nhuận Đông', 'Tân Phú', 'Tân Phú Đông',
      'Tân Phú Trung', 'Tân Phước 1', 'Tân Phước 2', 'Tân Phước 3', 'Tân Thành', 'Tân Thạnh', 'Tân Thới',
      'Tân Thuận Bình', 'Thanh Bình', 'Thanh Hòa', 'Thanh Hưng', 'Thanh Mỹ', 'Thạnh Phú', 'Tháp Mười',
      'Thới Sơn', 'Thường Lạc', 'Thường Phước', 'Tràm Chim', 'Trung An', 'Trường Xuân', 'Vĩnh Bình',
      'Vĩnh Hựu', 'Vĩnh Kim'
    ]
  },
  {
    code: '64',
    name: 'Gia Lai',
    wards: [
      'AI Bá', 'An Bình', 'An Hòa', 'An Khê', 'An Lão', 'An Lương', 'An Nhơn', 'An Nhơn Bắc',
      'An Nhơn Đông', 'An Nhơn Nam', 'An Nhơn Tây', 'An Phú', 'An Toàn', 'An Vinh', 'Ayun', 'Ayun Pa',
      'Ân Hảo', 'Ân Tường', 'Bàu Cạn', 'Biển Hồ', 'Bình An', 'Bình Dương', 'Bình Định', 'Bình Hiệp',
      'Bình Khê', 'Bình Phú', 'Bồng Sơn', 'Bờ Ngoong', 'Canh Liên', 'Canh Vinh', 'Cát Tiến', 'Chơ Long',
      'Chư A Thai', 'Chư Krey', 'Chư Păh', 'Chư Prông', 'Chư Pưh', 'Chư Sê', 'Cửu An', 'Diên Hồng',
      'Đak Đoa', 'Đak Pơ', 'Đak Rong', 'Đak Sơmei', 'Đăk Song', 'Đề Gi', 'Đức Cơ', 'Gào', 'Hòa Hội',
      'Hoài Ân', 'Hoài Nhơn', 'Hoài Nhơn Bắc', 'Hoài Nhơn Đông', 'Hoài Nhơn Nam', 'Hoài Nhơn Tây', 'Hội Phú',
      'Hội Sơn', 'Hra', 'Ia Băng', 'Ia Boòng', 'Ia Chia', 'Ia Dom', 'Ia Dơk', 'Ia Dreh', 'Ia Grai',
      'Ia Hiao', 'Ia Hrú', 'Ia Hrung', 'Ia Khươl', 'Ia Ko', 'Ia Krái', 'Ia Krêl', 'Ia Lâu', 'Ia Le',
      'Ia Ly', 'Ia Mơ', 'Ia Nan', 'Ia O', 'Ia Pa', 'Ia Phí', 'Ia Pia', 'Ia Pnôn', 'Ia Púch', 'Ia Rbol',
      'Ia Rsai', 'Ia Sao', 'Ia Tôr', 'Ia Tul', 'Kbang', 'KDang', 'Kim Sơn', 'Kon Chiêng', 'Kon Gang',
      'Kông Bơ La', 'Kông Chro', 'Krong', 'Lơ Pang', 'Mang Yang', 'Ngô Mây', 'Nhơn Châu', 'Phù Cát',
      'Phù Mỹ', 'Phù Mỹ Bắc', 'Phù Mỹ Đông', 'Phù Mỹ Nam', 'Phù Mỹ Tây', 'Phú Thiện', 'Phú Túc', 'Pleiku',
      'Pờ Tó', 'Quy Nhơn', 'Quy Nhơn Bắc', 'Quy Nhơn Đông', 'Quy Nhơn Nam', 'Quy Nhơn Tây', 'Sơn Lang',
      'SRó', 'Tam Quan', 'Tây Sơn', 'Thống Nhất', 'Tơ Tung', 'Tuy Phước', 'Tuy Phước Bắc', 'Tuy Phước Đông',
      'Tuy Phước Tây', 'Uar', 'Vạn Đức', 'Vân Canh', 'Vĩnh Quang', 'Vĩnh Sơn', 'Vĩnh Thạnh', 'Vĩnh Thịnh',
      'Xuân An', 'Ya Hội', 'Ya Ma'
    ]
  },
  {
    code: '42',
    name: 'Hà Tĩnh',
    wards: [
      'Bắc Hồng Lĩnh', 'Can Lộc', 'Cẩm Bình', 'Cẩm Duệ', 'Cẩm Hưng', 'Cẩm Lạc', 'Cẩm Trung', 'Cẩm Xuyên',
      'Cổ Đạm', 'Đan Hải', 'Đông Kinh', 'Đồng Lộc', 'Đồng Tiến', 'Đức Đồng', 'Đức Minh', 'Đức Quang',
      'Đức Thịnh', 'Đức Thọ', 'Gia Hanh', 'Hà Huy Tập', 'Hà Linh', 'Hải Ninh', 'Hoành Sơn', 'Hồng Lộc',
      'Hương Bình', 'Hương Đô', 'Hương Khê', 'Hương Phố', 'Hương Sơn', 'Hương Xuân', 'Kim Hoa', 'Kỳ Anh',
      'Kỳ Hoa', 'Kỳ Khang', 'Kỳ Lạc', 'Kỳ Thượng', 'Kỳ Văn', 'Kỳ Xuân', 'Lộc Hà', 'Mai Hoa', 'Mai Phụ',
      'Nam Hồng Lĩnh', 'Nghi Xuân', 'Phúc Trạch', 'Sông Trí', 'Sơn Giang', 'Sơn Hồng', 'Sơn Kim 1',
      'Sơn Kim 2', 'Sơn Tây', 'Sơn Tiến', 'Thạch Hà', 'Thạch Khê', 'Thạch Lạc', 'Thạch Xuân', 'Thành Sen',
      'Thiên Cầm', 'Thượng Đức', 'Tiên Điền', 'Toàn Lưu', 'Trần Phú', 'Trường Lưu', 'Tùng Lộc', 'Tứ Mỹ',
      'Việt Xuyên', 'Vũ Quang', 'Vũng Áng', 'Xuân Lộc', 'Yên Hòa'
    ]
  },
  {
    code: '33',
    name: 'Hưng Yên',
    wards: [
      'A Sào', 'Ái Quốc', 'Ân Thi', 'Bắc Đông Hưng', 'Bắc Đông Quan', 'Bắc Thái Ninh', 'Bắc Thụy Anh',
      'Bắc Tiên Hưng', 'Bình Định', 'Bình Nguyên', 'Bình Thanh', 'Châu Ninh', 'Chí Minh', 'Diên Hà',
      'Đại Đồng', 'Đoàn Đào', 'Đồng Bằng', 'Đồng Châu', 'Đông Hưng', 'Đông Quan', 'Đông Thái Ninh',
      'Đông Thụy Anh', 'Đông Tiền Hải', 'Đông Tiên Hưng', 'Đức Hợp', 'Đường Hào', 'Hiệp Cường', 'Hoàn Long',
      'Hoàng Hoa Thám', 'Hồng Châu', 'Hồng Minh', 'Hồng Quang', 'Hồng Vũ', 'Hưng Hà', 'Hưng Phú',
      'Khoái Châu', 'Kiến Xương', 'Lạc Đạo', 'Lê Lợi', 'Lê Quý Đôn', 'Long Hưng', 'Lương Bằng', 'Mễ Sở',
      'Minh Thọ', 'Mỹ Hào', 'Nam Cường', 'Nam Đông Hưng', 'Nam Thái Ninh', 'Nam Thụy Anh', 'Nam Tiền Hải',
      'Nam Tiên Hưng', 'Nghĩa Dân', 'Nghĩa Trụ', 'Ngọc Lâm', 'Nguyễn Du', 'Nguyễn Trãi', 'Nguyễn Văn Linh',
      'Ngự Thiên', 'Như Quỳnh', 'Phạm Ngũ Lão', 'Phố Hiến', 'Phụ Dực', 'Phụng Công', 'Quang Hưng',
      'Quang Lịch', 'Quỳnh An', 'Quỳnh Phụ', 'Sơn Nam', 'Tân Hưng', 'Tân Thuận', 'Tân Tiến', 'Tây Thái Ninh',
      'Tây Thụy Anh', 'Tây Tiền Hải', 'Thái Bình', 'Thái Ninh', 'Thái Thụy', 'Thần Khê', 'Thụy Anh',
      'Thư Trì', 'Thư Vũ', 'Thượng Hồng', 'Tiền Hải', 'Tiên Hoa', 'Tiên Hưng', 'Tiên La', 'Tiên Lữ',
      'Tiên Tiến', 'Tống Trân', 'Trà Giang', 'Trà Lý', 'Trần Hưng Đạo', 'Trần Lãm', 'Triệu Việt Vương',
      'Vạn Xuân', 'Văn Giang', 'Việt Tiến', 'Việt Yên', 'Vũ Phúc', 'Vũ Quý', 'Vũ Thư', 'Vũ Tiên', 'Xuân Trúc', 'Yên Mỹ'
    ]
  },
  {
    code: '56',
    name: 'Khánh Hòa',
    wards: [
      'Anh Dũng', 'Ba Ngòi', 'Bác Ái', 'Bác Ái Đông', 'Bác Ái Tây', 'Bảo An', 'Bắc Cam Ranh',
      'Bắc Khánh Vĩnh', 'Bắc Nha Trang', 'Bắc Ninh Hòa', 'Cà Ná', 'Cam An', 'Cam Hiệp', 'Cam Lâm',
      'Cam Linh', 'Cam Ranh', 'Công Hải', 'Diên Điền', 'Diên Khánh', 'Diên Lạc', 'Diên Lâm', 'Diên Thọ',
      'Đại Lãnh', 'Đô Vinh', 'Đông Hải', 'Đông Khánh Sơn', 'Đông Ninh Hòa', 'Hòa Thắng', 'Hòa Trí',
      'Khánh Sơn', 'Khánh Vĩnh', 'Lâm Sơn', 'Mỹ Sơn', 'Nam Cam Ranh', 'Nam Khánh Vĩnh', 'Nam Nha Trang',
      'Nam Ninh Hòa', 'Nha Trang', 'Ninh Chử', 'Ninh Hải', 'Ninh Hòa', 'Ninh Phước', 'Ninh Sơn', 'Phan Rang',
      'Phước Dinh', 'Phước Hà', 'Phước Hậu', 'Phước Hữu', 'Suối Dầu', 'Suối Hiệp', 'Tân Định', 'Tây Khánh Sơn',
      'Tây Khánh Vĩnh', 'Tây Nha Trang', 'Tây Ninh Hòa', 'Thuận Bắc', 'Thuận Nam', 'Trung Khánh Vĩnh',
      'Trường Sa', 'Tu Bông', 'Vạn Hưng', 'Vạn Ninh', 'Vạn Thắng', 'Vĩnh Hải', 'Xuân Hải'
    ]
  },
  {
    code: '12',
    name: 'Lai Châu',
    wards: [
      'Bản Bo', 'Bình Lư', 'Bum Nưa', 'Bum Tở', 'Dào San', 'Đoàn Kết', 'Hồng Thu', 'Hua Bum',
      'Khoen On', 'Khổng Lào', 'Khun Há', 'Lê Lợi', 'Mù Cả', 'Mường Khoa', 'Mường Kim', 'Mường Mô',
      'Mường Tè', 'Mường Than', 'Nậm Cuổi', 'Nậm Hàng', 'Nậm Mạ', 'Nậm Sỏ', 'Nậm Tăm', 'Pa Tần',
      'Pa Ủ', 'Pắc Ta', 'Phong Thổ', 'Pu Sam Cáp', 'Sì Lở Lầu', 'Sìn Hồ', 'Sin Suối Hồ', 'Tả Lèng',
      'Tà Tổng', 'Tân Phong', 'Tân Uyên', 'Than Uyên', 'Thu Lũm', 'Tủa Sín Chải'
    ]
  },
  {
    code: '68',
    name: 'Lâm Đồng',
    wards: [
      '1 Bảo Lộc', '2 Bảo Lộc', '3 Bảo Lộc', 'Bảo Lâm 1', 'Bảo Lâm 2', 'Bảo Lâm 3', 'Bảo Lâm 4',
      'Bảo Lâm 5', 'Bảo Thuận', 'Bắc Bình', 'Bắc Gia Nghĩa', 'Bắc Ruộng', 'Bình Thuận', 'Cam Ly - Đà Lạt',
      'Cát Tiên', 'Cát Tiên 2', 'Cát Tiên 3', 'Cư Jút', 'Di Linh', 'Đạ Huoai', 'Đạ Huoai 2', 'Đạ Huoai 3',
      'Đạ Tẻh', 'Đạ Tẻh 2', 'Đạ Tẻh 3', 'Đam Rông 1', 'Đam Rông 2', 'Đam Rông 3', 'Đam Rông 4', 'Đắk Mil',
      'Đắk Sắk', 'Đắk Song', 'Đắk Wil', 'Đinh Trang Thượng', 'Đinh Văn Lâm Hà', 'Đông Gia Nghĩa',
      'Đông Giang', 'Đồng Kho', 'Đơn Dương', 'Đức An', 'Đức Lập', 'Đức Linh', 'Đức Trọng', 'Gia Hiệp',
      'Hải Ninh', 'Hàm Kiệm', 'Hàm Liêm', 'Hàm Tân', 'Hàm Thạnh', 'Hàm Thắng', 'Hàm Thuận', 'Hàm Thuận Bắc',
      'Hàm Thuận Nam', 'Hiệp Thạnh', 'Hòa Bắc', 'Hòa Ninh', 'Hòa Thắng', 'Hoài Đức', 'Hồng Sơn', 'Hồng Thái',
      'Ka Đô', 'Kiến Đức', 'Krông Nô', 'La Dạ', 'La Gi', 'Lạc Dương', 'Lang Biang - Đà Lạt',
      'Lâm Viên - Đà Lạt', 'Liên Hương', 'Lương Sơn', 'Mũi Né', 'Nam Ban Lâm Hà', 'Nam Dong', 'Nam Đà',
      'Nam Gia Nghĩa', 'Nam Hà Lâm Hà', 'Nam Thành', 'Nâm Nung', 'Nghị Đức', 'Nhân Cơ', 'Ninh Gia',
      'Phan Rí Cửa', 'Phan Sơn', 'Phan Thiết', 'Phú Quý', 'Phú Sơn Lâm Hà', 'Phú Thủy', 'Phúc Thọ Lâm Hà',
      'Phước Hội', 'Quảng Hòa', 'Quảng Khê', 'Quảng Lập', 'Quảng Phú', 'Quảng Sơn', 'Quảng Tân', 'Quảng Tín',
      'Quảng Trực', 'Sông Lũy', 'Sơn Điền', 'Sơn Mỹ', 'Suối Kiết', 'Tà Đùng', 'Tà Hine', 'Tà Năng',
      'Tánh Linh', 'Tân Hà Lâm Hà', 'Tân Hải', 'Tân Hội', 'Tân Lập', 'Tân Minh', 'Tân Thành', 'Thuận An',
      'Thuận Hạnh', 'Tiến Thành', 'Trà Tân', 'Trường Xuân', 'Tuy Đức', 'Tuy Phong', 'Tuyên Quang',
      'Vĩnh Hảo', 'Xuân Hương - Đà Lạt', 'Xuân Trường - Đà Lạt'
    ]
  },
  {
    code: '20',
    name: 'Lạng Sơn',
    wards: [
      'Ba Sơn', 'Bắc Sơn', 'Bằng Mạc', 'Bình Gia', 'Cai Kinh', 'Cao Lộc', 'Châu Sơn', 'Chi Lăng',
      'Chiến Thắng', 'Công Sơn', 'Điềm He', 'Đình Lập', 'Đoàn Kết', 'Đồng Đăng', 'Đông Kinh', 'Hoa Thám',
      'Hoàng Văn Thụ', 'Hội Hoan', 'Hồng Phong', 'Hưng Vũ', 'Hữu Liên', 'Hữu Lũng', 'Kháng Chiến',
      'Khánh Khê', 'Khuất Xá', 'Kiên Mộc', 'Kỳ Lừa', 'Lộc Bình', 'Lợi Bác', 'Lương Văn Tri', 'Mẫu Sơn',
      'Na Dương', 'Na Sầm', 'Nhân Lý', 'Nhất Hòa', 'Quan Sơn', 'Quốc Khánh', 'Quốc Việt', 'Quý Hòa',
      'Tam Thanh', 'Tân Đoàn', 'Tân Thành', 'Tân Tiến', 'Tân Tri', 'Tân Văn', 'Thái Bình', 'Thất Khê',
      'Thiện Hòa', 'Thiện Long', 'Thiện Tân', 'Thiện Thuật', 'Thống Nhất', 'Thụy Hùng', 'Tràng Định',
      'Tri Lễ', 'Tuấn Sơn', 'Vạn Linh', 'Văn Lãng', 'Văn Quan', 'Vân Nham', 'Vũ Lễ', 'Xuân Dương',
      'Yên Bình', 'Yên Phúc'
    ]
  },
  {
    code: '10',
    name: 'Lào Cai',
    wards: [
      'A Mú Sung', 'Âu Lâu', 'Bản Hồ', 'Bản Lầu', 'Bản Liền', 'Bản Xèo', 'Bảo Ái', 'Bảo Hà',
      'Bảo Nhai', 'Bảo Thắng', 'Bảo Yên', 'Bát Xát', 'Bắc Hà', 'Cam Đường', 'Cảm Nhân', 'Cao Sơn',
      'Cát Thịnh', 'Cầu Thia', 'Chấn Thịnh', 'Châu Quế', 'Chế Tạo', 'Chiềng Ken', 'Cốc Lầu', 'Cốc San',
      'Dền Sáng', 'Dương Quỳ', 'Đông Cuông', 'Gia Hội', 'Gia Phú', 'Hạnh Phúc', 'Hợp Thành', 'Hưng Khánh',
      'Khánh Hòa', 'Khánh Yên', 'Khao Mang', 'Lào Cai', 'Lao Chải', 'Lâm Giang', 'Lâm Thượng', 'Liên Sơn',
      'Lục Yên', 'Lùng Phình', 'Lương Thịnh', 'Mậu A', 'Minh Lương', 'Mỏ Vàng', 'Mù Cang Chải', 'Mường Bo',
      'Mường Hum', 'Mường Khương', 'Mường Lai', 'Nam Cường', 'Nậm Chày', 'Nậm Có', 'Nậm Xé', 'Nghĩa Đô',
      'Nghĩa Lộ', 'Nghĩa Tâm', 'Ngũ Chỉ Sơn', 'Pha Long', 'Phình Hồ', 'Phong Dụ Hạ', 'Phong Dụ Thượng',
      'Phong Hải', 'Phúc Khánh', 'Phúc Lợi', 'Púng Luông', 'Quy Mông', 'Sa Pa', 'Si Ma Cai', 'Sín Chéng',
      'Sơn Lương', 'Tả Củ Tỷ', 'Tả Phìn', 'Tả Van', 'Tà Xi Láng', 'Tằng Loỏng', 'Tân Hợp', 'Tân Lĩnh',
      'Thác Bà', 'Thượng Bằng La', 'Thượng Hà', 'Trạm Tấu', 'Trấn Yên', 'Trịnh Tường', 'Trung Tâm',
      'Tú Lệ', 'Văn Bàn', 'Văn Chấn', 'Văn Phú', 'Việt Hồng', 'Võ Lao', 'Xuân Ái', 'Xuân Hòa',
      'Xuân Quang', 'Y Tý', 'Yên Bái', 'Yên Bình', 'Yên Thành'
    ]
  },
  {
    code: '40',
    name: 'Nghệ An',
    wards: [
      'An Châu', 'Anh Sơn', 'Anh Sơn Đông', 'Bạch Hà', 'Bạch Ngọc', 'Bắc Lý', 'Bích Hào', 'Bình Chuẩn',
      'Bình Minh', 'Cam Phục', 'Cát Ngạn', 'Châu Bình', 'Châu Hồng', 'Châu Khê', 'Châu Lộc', 'Châu Tiến',
      'Chiêu Lưu', 'Con Cuông', 'Cửa Lò', 'Diễn Châu', 'Đại Đồng', 'Đại Huệ', 'Đô Lương', 'Đông Hiếu',
      'Đông Lộc', 'Đông Thành', 'Đức Châu', 'Giai Lạc', 'Giai Xuân', 'Hải Châu', 'Hải Lộc', 'Hạnh Lâm',
      'Hoa Quân', 'Hoàng Mai', 'Hợp Minh', 'Hùng Chân', 'Hùng Châu', 'Huồi Tụ', 'Hưng Nguyên',
      'Hưng Nguyên Nam', 'Hữu Khuông', 'Hữu Kiệm', 'Keng Đu', 'Kim Bảng', 'Kim Liên', 'Lam Thành',
      'Lượng Minh', 'Lương Sơn', 'Mậu Thạch', 'Minh Châu', 'Minh Hợp', 'Môn Sơn', 'Mường Chọng',
      'Mường Ham', 'Mường Lống', 'Mường Quàng', 'Mường Típ', 'Mường Xén', 'Mỹ Lý', 'Na Loi', 'Na Ngoi',
      'Nam Đàn', 'Nậm Cắn', 'Nga My', 'Nghi Lộc', 'Nghĩa Đàn', 'Nghĩa Đồng', 'Nghĩa Hành', 'Nghĩa Hưng',
      'Nghĩa Khánh', 'Nghĩa Lâm', 'Nghĩa Lộc', 'Nghĩa Mai', 'Nghĩa Thọ', 'Nhân Hòa', 'Nhôn Mai', 'Phúc Lộc',
      'Quan Thành', 'Quảng Châu', 'Quang Đồng', 'Quế Phong', 'Quỳ Châu', 'Quỳ Hợp', 'Quỳnh Anh', 'Quỳnh Lưu',
      'Quỳnh Mai', 'Quỳnh Phú', 'Quỳnh Sơn', 'Quỳnh Tam', 'Quỳnh Thắng', 'Quỳnh Văn', 'Sơn Lâm', 'Tam Đồng',
      'Tam Hợp', 'Tam Quang', 'Tam Thái', 'Tân An', 'Tân Châu', 'Tân Kỳ', 'Tân Mai', 'Tân Phú', 'Tây Hiếu',
      'Thái Hòa', 'Thành Bình Thọ', 'Thành Vinh', 'Thần Lĩnh', 'Thiên Nhẫn', 'Thông Thụ', 'Thuần Trung',
      'Tiên Đồng', 'Tiền Phong', 'Tri Lễ', 'Trung Lộc', 'Trường Vinh', 'Tương Dương', 'Vạn An', 'Văn Hiến',
      'Văn Kiều', 'Vân Du', 'Vân Tụ', 'Vinh Hưng', 'Vinh Lộc', 'Vinh Phú', 'Vĩnh Tường', 'Xuân Lâm',
      'Yên Hòa', 'Yên Na', 'Yên Thành', 'Yên Trung', 'Yên Xuân'
    ]
  },
  {
    code: '37',
    name: 'Ninh Bình',
    wards: [
      'Bắc Lý', 'Bình An', 'Bình Giang', 'Bình Lục', 'Bình Minh', 'Bình Mỹ', 'Bình Sơn', 'Cát Thành',
      'Chất Bình', 'Châu Sơn', 'Cổ Lễ', 'Cúc Phương', 'Duy Hà', 'Duy Tân', 'Duy Tiên', 'Đại Hoàng',
      'Định Hóa', 'Đông A', 'Đông Hoa Lư', 'Đồng Thái', 'Đồng Thịnh', 'Đồng Văn', 'Gia Hưng', 'Gia Lâm',
      'Gia Phong', 'Gia Trấn', 'Gia Tường', 'Gia Vân', 'Gia Viễn', 'Giao Bình', 'Giao Hòa', 'Giao Hưng',
      'Giao Minh', 'Giao Ninh', 'Giao Phúc', 'Giao Thủy', 'Hà Nam', 'Hải An', 'Hải Anh', 'Hải Hậu',
      'Hải Hưng', 'Hải Quang', 'Hải Thịnh', 'Hải Tiến', 'Hải Xuân', 'Hiển Khánh', 'Hoa Lư', 'Hồng Phong',
      'Hồng Quang', 'Khánh Hội', 'Khánh Nhạc', 'Khánh Thiện', 'Khánh Trung', 'Kim Bảng', 'Kim Đông',
      'Kim Sơn', 'Kim Thanh', 'Lai Thành', 'Lê Hồ', 'Liêm Hà', 'Liêm Tuyền', 'Liên Minh', 'Lý Nhân',
      'Lý Thường Kiệt', 'Minh Tân', 'Minh Thái', 'Mỹ Lộc', 'Nam Định', 'Nam Đồng', 'Nam Hoa Lư',
      'Nam Hồng', 'Nam Lý', 'Nam Minh', 'Nam Ninh', 'Nam Trực', 'Nam Xang', 'Nghĩa Hưng', 'Nghĩa Lâm',
      'Nghĩa Sơn', 'Nguyễn Úy', 'Nhân Hà', 'Nho Quan', 'Ninh Cường', 'Ninh Giang', 'Phát Diệm',
      'Phong Doanh', 'Phú Long', 'Phủ Lý', 'Phú Sơn', 'Phù Vân', 'Quang Hưng', 'Quang Thiện', 'Quỹ Nhất',
      'Quỳnh Lưu', 'Rạng Đông', 'Tam Chúc', 'Tam Điệp', 'Tân Minh', 'Tân Thanh', 'Tây Hoa Lư', 'Thanh Bình',
      'Thanh Lâm', 'Thanh Liêm', 'Thành Nam', 'Thanh Sơn', 'Thiên Trường', 'Tiên Sơn', 'Trần Thương',
      'Trung Sơn', 'Trực Ninh', 'Trường Thi', 'Vạn Thắng', 'Vị Khê', 'Vĩnh Trụ', 'Vụ Bản', 'Vũ Dương',
      'Xuân Giang', 'Xuân Hồng', 'Xuân Hưng', 'Xuân Trường', 'Ý Yên', 'Yên Cường', 'Yên Đồng', 'Yên Khánh',
      'Yên Mạc', 'Yên Mô', 'Yên Sơn', 'Yên Thắng', 'Yên Từ'
    ]
  },
  {
    code: '25',
    name: 'Phú Thọ',
    wards: [
      'An Bình', 'An Nghĩa', 'Âu Cơ', 'Bản Nguyên', 'Bao La', 'Bình Nguyên', 'Bình Phú', 'Bình Tuyền',
      'Bình Xuyên', 'Cao Dương', 'Cao Phong', 'Cao Sơn', 'Cẩm Khê', 'Chân Mộng', 'Chí Đám', 'Chí Tiên',
      'Cự Đồng', 'Dân Chủ', 'Dũng Tiến', 'Đà Bắc', 'Đại Đình', 'Đại Đồng', 'Đan Thượng', 'Đạo Trù',
      'Đào Xá', 'Đoan Hùng', 'Đồng Lương', 'Đông Thành', 'Đức Nhàn', 'Hạ Hòa', 'Hải Lựu', 'Hiền Lương',
      'Hiền Quan', 'Hòa Bình', 'Hoàng An', 'Hoàng Cương', 'Hội Thịnh', 'Hợp Kim', 'Hợp Lý', 'Hùng Việt',
      'Hương Cần', 'Hy Cương', 'Khả Cửu', 'Kim Bôi', 'Kỳ Sơn', 'Lạc Lương', 'Lạc Sơn', 'Lạc Thủy',
      'Lai Đồng', 'Lâm Thao', 'Lập Thạch', 'Liên Châu', 'Liên Hòa', 'Liên Minh', 'Liên Sơn', 'Long Cốc',
      'Lương Sơn', 'Mai Châu', 'Mai Hạ', 'Minh Đài', 'Minh Hòa', 'Mường Bi', 'Mường Động', 'Mường Hoa',
      'Mường Thàng', 'Mường Vang', 'Nật Sơn', 'Ngọc Sơn', 'Nguyệt Đức', 'Nhân Nghĩa', 'Nông Trang',
      'Pà Cò', 'Phong Châu', 'Phú Khê', 'Phú Mỹ', 'Phù Ninh', 'Phú Thọ', 'Phúc Yên', 'Phùng Nguyên',
      'Quảng Yên', 'Quy Đức', 'Quyết Thắng', 'Sông Lô', 'Sơn Đông', 'Sơn Lương', 'Tam Dương', 'Tam Dương Bắc',
      'Tam Đảo', 'Tam Hồng', 'Tam Nông', 'Tam Sơn', 'Tân Hòa', 'Tân Lạc', 'Tân Mai', 'Tân Pheo',
      'Tân Sơn', 'Tây Cốc', 'Tề Lỗ', 'Thái Hòa', 'Thanh Ba', 'Thanh Miếu', 'Thanh Sơn', 'Thanh Thủy',
      'Thịnh Minh', 'Thọ Văn', 'Thổ Tang', 'Thống Nhất', 'Thu Cúc', 'Thung Nai', 'Thượng Cốc', 'Thượng Long',
      'Tiên Lữ', 'Tiên Lương', 'Tiền Phong', 'Toàn Thắng', 'Trạm Thản', 'Trung Sơn', 'Tu Vũ', 'Vạn Xuân',
      'Văn Lang', 'Văn Miếu', 'Vân Bán', 'Vân Phú', 'Vân Sơn', 'Việt Trì', 'Vĩnh An', 'Vĩnh Chân',
      'Vĩnh Hưng', 'Vĩnh Phú', 'Vĩnh Phúc', 'Vĩnh Thành', 'Vĩnh Tường', 'Vĩnh Yên', 'Võ Miếu', 'Xuân Đài',
      'Xuân Hòa', 'Xuân Lãng', 'Xuân Lũng', 'Xuân Viên', 'Yên Kỳ', 'Yên Lạc', 'Yên Lãng', 'Yên Lập',
      'Yên Phú', 'Yên Sơn', 'Yên Thủy', 'Yên Trị'
    ]
  },
  {
    code: '51',
    name: 'Quảng Ngãi',
    wards: [
      'An Phú', 'Ba Dinh', 'Ba Động', 'Ba Gia', 'Ba Tô', 'Ba Tơ', 'Ba Vì', 'Ba Vinh', 'Ba Xa',
      'Bình Chương', 'Bình Minh', 'Bình Sơn', 'Bờ Y', 'Cà Đam', 'Cẩm Thành', 'Dục Nông', 'Đăk Bla',
      'Đăk Cấm', 'Đăk Hà', 'Đăk Kôi', 'Đăk Long', 'Đăk Mar', 'Đăk Môn', 'Đăk Pék', 'Đăk Plô',
      'Đăk Pxi', 'Đăk Rơ Wa', 'Đăk Rve', 'Đăk Sao', 'Đăk Tô', 'Đăk Tờ Kan', 'Đăk Ui', 'Đặng Thùy Trâm',
      'Đình Cương', 'Đông Sơn', 'Đông Trà Bồng', 'Đức Phổ', 'Khánh Cường', 'Kon Braih', 'Kon Đào',
      'Kon Plông', 'Kon Tum', 'Lân Phong', 'Long Phụng', 'Lý Sơn', 'Măng Bút', 'Măng Đen', 'Măng Ri',
      'Minh Long', 'Mỏ Cày', 'Mộ Đức', 'Mô Rai', 'Nghĩa Giang', 'Nghĩa Hành', 'Nghĩa Lộ', 'Ngọc Linh',
      'Ngọk Bay', 'Ngọk Réo', 'Ngọk Tụ', 'Nguyễn Nghiêm', 'Phước Giang', 'Rờ Kơi', 'Sa Bình', 'Sa Huỳnh',
      'Sa Loong', 'Sa Thầy', 'Sơn Hà', 'Sơn Hạ', 'Sơn Kỳ', 'Sơn Linh', 'Sơn Mai', 'Sơn Tây',
      'Sơn Tây Hạ', 'Sơn Tây Thượng', 'Sơn Thủy', 'Sơn Tịnh', 'Tây Trà', 'Tây Trà Bồng', 'Thanh Bồng',
      'Thiện Tín', 'Thọ Phong', 'Tịnh Khê', 'Trà Bồng', 'Trà Câu', 'Trà Giang', 'Trường Giang',
      'Trương Quang Trọng', 'Tu Mơ Rông', 'Tư Nghĩa', 'Vạn Tường', 'Vệ Giang', 'Xốp', 'Ya Ly'
    ]
  },
  {
    code: '22',
    name: 'Quảng Ninh',
    wards: [
      'An Sinh', 'Ba Chẽ', 'Bãi Cháy', 'Bình Khê', 'Bình Liêu', 'Cái Chiên', 'Cao Xanh', 'Cẩm Phả',
      'Cô Tô', 'Cửa Ông', 'Đầm Hà', 'Điền Xá', 'Đông Mai', 'Đông Ngũ', 'Đông Triều', 'Đường Hoa',
      'Hà An', 'Hà Lầm', 'Hạ Long', 'Hà Tu', 'Hải Hòa', 'Hải Lạng', 'Hải Ninh', 'Hải Sơn', 'Hoàng Quế',
      'Hoành Bồ', 'Hoành Mô', 'Hồng Gai', 'Kỳ Thượng', 'Liên Hòa', 'Lục Hồn', 'Lương Minh', 'Mạo Khê',
      'Móng Cái 1', 'Móng Cái 2', 'Móng Cái 3', 'Mông Dương', 'Phong Cốc', 'Quảng Đức', 'Quảng Hà',
      'Quang Hanh', 'Quảng La', 'Quảng Tân', 'Quảng Yên', 'Thống Nhất', 'Tiên Yên', 'Tuần Châu',
      'Uông Bí', 'Vàng Danh', 'Vân Đồn', 'Việt Hưng', 'Vĩnh Thực', 'Yên Tử'
    ]
  },
  {
    code: '45',
    name: 'Quảng Trị',
    wards: [
      'A Dơi', 'Ái Tử', 'Ba Đồn', 'Ba Lòng', 'Bắc Gianh', 'Bắc Trạch', 'Bến Hải', 'Bến Quan',
      'Bố Trạch', 'Cam Hồng', 'Cam Lộ', 'Cồn Cỏ', 'Cồn Tiên', 'Cửa Tùng', 'Cửa Việt', 'Dân Hóa',
      'Diên Sanh', 'Đakrông', 'Đông Hà', 'Đồng Hới', 'Đồng Lê', 'Đồng Sơn', 'Đồng Thuận', 'Đông Trạch',
      'Gio Linh', 'Hải Lăng', 'Hiếu Giang', 'Hòa Trạch', 'Hoàn Lão', 'Hướng Hiệp', 'Hướng Lập',
      'Hướng Phùng', 'Khe Sanh', 'Kim Điền', 'Kim Ngân', 'Kim Phú', 'La Lay', 'Lao Bảo', 'Lệ Ninh',
      'Lệ Thủy', 'Lìa', 'Minh Hóa', 'Mỹ Thủy', 'Nam Ba Đồn', 'Nam Cửa Việt', 'Nam Đông Hà', 'Nam Gianh',
      'Nam Hải Lăng', 'Nam Trạch', 'Ninh Châu', 'Phong Nha', 'Phú Trạch', 'Quảng Ninh', 'Quảng Trạch',
      'Quảng Trị', 'Sen Ngư', 'Tà Rụt', 'Tân Gianh', 'Tân Lập', 'Tân Mỹ', 'Tân Thành', 'Thượng Trạch',
      'Triệu Bình', 'Triệu Cơ', 'Triệu Phong', 'Trung Thuần', 'Trường Ninh', 'Trường Phú', 'Trường Sơn',
      'Tuyên Bình', 'Tuyên Hóa', 'Tuyên Lâm', 'Tuyên Phú', 'Tuyên Sơn', 'Vĩnh Định', 'Vĩnh Hoàng',
      'Vĩnh Linh', 'Vĩnh Thủy'
    ]
  },
  {
    code: '14',
    name: 'Sơn La',
    wards: [
      'Bắc Yên', 'Bình Thuận', 'Bó Sinh', 'Chiềng An', 'Chiềng Cơi', 'Chiềng Hặc', 'Chiềng Hoa',
      'Chiềng Khoong', 'Chiềng Khương', 'Chiềng La', 'Chiềng Lao', 'Chiềng Mai', 'Chiềng Mung', 'Chiềng Sại',
      'Chiềng Sinh', 'Chiềng Sơ', 'Chiềng Sơn', 'Chiềng Sung', 'Co Mạ', 'Đoàn Kết', 'Gia Phù', 'Huổi Một',
      'Kim Bon', 'Long Hẹ', 'Lóng Phiêng', 'Lóng Sập', 'Mai Sơn', 'Mộc Châu', 'Mộc Sơn', 'Muổi Nọi',
      'Mường Bám', 'Mường Bang', 'Mường Bú', 'Mường Chanh', 'Mường Chiên', 'Mường Cơi', 'Mường É',
      'Mường Giôn', 'Mường Hung', 'Mường Khiêng', 'Mường La', 'Mường Lạn', 'Mường Lầm', 'Mường Lèo',
      'Mường Sại', 'Nậm Lầu', 'Nậm Ty', 'Ngọc Chiến', 'Pắc Ngà', 'Phiêng Cằm', 'Phiêng Khoài',
      'Phiêng Pằn', 'Phù Yên', 'Púng Bánh', 'Quỳnh Nhai', 'Song Khủa', 'Sông Mã', 'Sốp Cộp', 'Suối Tọ',
      'Tà Hộc', 'Tạ Khoa', 'Tà Xùa', 'Tân Phong', 'Tân Yên', 'Thảo Nguyên', 'Thuận Châu', 'Tô Hiệu',
      'Tô Múa', 'Tường Hạ', 'Vân Hồ', 'Vân Sơn', 'Xím Vàng', 'Xuân Nha', 'Yên Châu', 'Yên Sơn'
    ]
  },
  {
    code: '72',
    name: 'Tây Ninh',
    wards: [
      'An Lục Long', 'An Ninh', 'An Tịnh', 'Bến Cầu', 'Bến Lức', 'Bình Đức', 'Bình Hiệp', 'Bình Hòa',
      'Bình Minh', 'Bình Thành', 'Cần Đước', 'Cần Giuộc', 'Cầu Khởi', 'Châu Thành', 'Dương Minh Châu',
      'Đông Thành', 'Đức Hòa', 'Đức Huệ', 'Đức Lập', 'Gia Lộc', 'Gò Dầu', 'Hảo Đước', 'Hậu Nghĩa',
      'Hậu Thạnh', 'Hiệp Hòa', 'Hòa Hội', 'Hòa Khánh', 'Hòa Thành', 'Hưng Điền', 'Hưng Thuận', 'Khánh Hậu',
      'Khánh Hưng', 'Kiến Tường', 'Long An', 'Long Cang', 'Long Chữ', 'Long Hoa', 'Long Thuận', 'Lộc Ninh',
      'Lương Hòa', 'Mộc Hóa', 'Mỹ An', 'Mỹ Hạnh', 'Mỹ Lệ', 'Mỹ Lộc', 'Mỹ Quý', 'Mỹ Thạnh', 'Mỹ Yên',
      'Nhơn Hòa Lập', 'Nhơn Ninh', 'Nhựt Tảo', 'Ninh Điền', 'Ninh Thạnh', 'Phước Chỉ', 'Phước Lý',
      'Phước Thạnh', 'Phước Vinh', 'Phước Vĩnh Tây', 'Rạch Kiến', 'Tầm Vu', 'Tân An', 'Tân Biên',
      'Tân Châu', 'Tân Đông', 'Tân Hòa', 'Tân Hội', 'Tân Hưng', 'Tân Lân', 'Tân Lập', 'Tân Long',
      'Tân Ninh', 'Tân Phú', 'Tân Tập', 'Tân Tây', 'Tân Thành', 'Tân Thạnh', 'Tân Trụ', 'Thạnh Bình',
      'Thanh Điền', 'Thạnh Đức', 'Thạnh Hóa', 'Thạnh Lợi', 'Thạnh Phước', 'Thủ Thừa', 'Thuận Mỹ',
      'Trà Vong', 'Trảng Bàng', 'Truông Mít', 'Tuyên Bình', 'Tuyên Thạnh', 'Vàm Cỏ', 'Vĩnh Châu',
      'Vĩnh Công', 'Vĩnh Hưng', 'Vĩnh Thạnh'
    ]
  },
  {
    code: '19',
    name: 'Thái Nguyên',
    wards: [
      'An Khánh', 'Ba Bể', 'Bá Xuyên', 'Bách Quang', 'Bạch Thông', 'Bắc Kạn', 'Bằng Thành', 'Bằng Vân',
      'Bình Thành', 'Bình Yên', 'Cao Minh', 'Cẩm Giàng', 'Chợ Đồn', 'Chợ Mới', 'Chợ Rã', 'Côn Minh',
      'Cường Lợi', 'Dân Tiến', 'Đại Phúc', 'Đại Từ', 'Điềm Thụy', 'Định Hóa', 'Đồng Hỷ', 'Đồng Phúc',
      'Đức Lương', 'Đức Xuân', 'Gia Sàng', 'Hiệp Lực', 'Hợp Thành', 'Kha Sơn', 'Kim Phượng', 'La Bằng',
      'La Hiên', 'Lam Vỹ', 'Linh Sơn', 'Nà Phặc', 'Na Rì', 'Nam Cường', 'Nam Hòa', 'Ngân Sơn', 'Nghĩa Tá',
      'Nghiên Loan', 'Nghinh Tường', 'Phan Đình Phùng', 'Phong Quang', 'Phổ Yên', 'Phú Bình', 'Phú Đình',
      'Phú Lạc', 'Phú Lương', 'Phú Thịnh', 'Phủ Thông', 'Phú Xuyên', 'Phúc Lộc', 'Phúc Thuận', 'Phượng Tiến',
      'Quan Triều', 'Quảng Bạch', 'Quang Sơn', 'Quân Chu', 'Quyết Thắng', 'Sảng Mộc', 'Sông Công',
      'Tân Cương', 'Tân Khánh', 'Tân Kỳ', 'Tân Thành', 'Thành Công', 'Thanh Mai', 'Thanh Thịnh',
      'Thần Sa', 'Thượng Minh', 'Thượng Quan', 'Tích Lương', 'Trại Cau', 'Tràng Xá', 'Trần Phú', 'Trung Hội',
      'Trung Thành', 'Vạn Phú', 'Vạn Xuân', 'Văn Hán', 'Văn Lang', 'Văn Lăng', 'Vĩnh Thông', 'Võ Nhai',
      'Vô Tranh', 'Xuân Dương', 'Yên Bình', 'Yên Phong', 'Yên Thịnh', 'Yên Trạch'
    ]
  },
  {
    code: '38',
    name: 'Thanh Hóa',
    wards: [
      'An Nông', 'Ba Đình', 'Bá Thước', 'Bát Mọt', 'Biện Thượng', 'Bỉm Sơn', 'Các Sơn', 'Cẩm Tân',
      'Cẩm Thạch', 'Cẩm Thủy', 'Cẩm Tú', 'Cẩm Vân', 'Cổ Lũng', 'Công Chính', 'Đào Duy Từ', 'Điền Lư',
      'Điền Quang', 'Định Hòa', 'Định Tân', 'Đồng Lương', 'Đông Quang', 'Đông Sơn', 'Đông Thành',
      'Đông Tiến', 'Đồng Tiến', 'Giao An', 'Hà Long', 'Hà Trung', 'Hạc Thành', 'Hải Bình', 'Hải Lĩnh',
      'Hàm Rồng', 'Hậu Lộc', 'Hiền Kiệt', 'Hoa Lộc', 'Hóa Quỳ', 'Hoạt Giang', 'Hoằng Châu', 'Hoằng Giang',
      'Hoằng Hóa', 'Hoằng Lộc', 'Hoằng Phú', 'Hoằng Sơn', 'Hoằng Thanh', 'Hoằng Tiến', 'Hồ Vương',
      'Hồi Xuân', 'Hợp Tiến', 'Kiên Thọ', 'Kim Tân', 'Lam Sơn', 'Linh Sơn', 'Lĩnh Toại', 'Luận Thành',
      'Lương Sơn', 'Lưu Vệ', 'Mậu Lâm', 'Minh Sơn', 'Mường Chanh', 'Mường Lát', 'Mường Lý', 'Mường Mìn',
      'Na Mèo', 'Nam Sầm Sơn', 'Nam Xuân', 'Nga An', 'Nga Sơn', 'Nga Thắng', 'Nghi Sơn', 'Ngọc Lặc',
      'Ngọc Liên', 'Ngọc Sơn', 'Ngọc Trạo', 'Nguyệt Ấn', 'Nguyệt Viên', 'Nhi Sơn', 'Như Thanh', 'Như Xuân',
      'Nông Cống', 'Phú Lệ', 'Phú Xuân', 'Pù Luông', 'Pù Nhi', 'Quan Sơn', 'Quảng Bình', 'Quang Chiểu',
      'Quảng Chính', 'Quảng Ngọc', 'Quảng Ninh', 'Quảng Phú', 'Quang Trung', 'Quảng Yên', 'Quý Lộc',
      'Quý Lương', 'Sao Vàng', 'Sầm Sơn', 'Sơn Điện', 'Sơn Thủy', 'Tam Chung', 'Tam Lư', 'Tam Thanh',
      'Tân Dân', 'Tân Ninh', 'Tân Thành', 'Tân Tiến', 'Tây Đô', 'Thạch Bình', 'Thạch Lập', 'Thạch Quảng',
      'Thanh Kỳ', 'Thanh Phong', 'Thanh Quân', 'Thành Vinh', 'Thăng Bình', 'Thắng Lộc', 'Thắng Lợi',
      'Thiên Phủ', 'Thiết Ống', 'Thiệu Hóa', 'Thiệu Quang', 'Thiệu Tiến', 'Thiệu Toán', 'Thiệu Trung',
      'Thọ Bình', 'Thọ Lập', 'Thọ Long', 'Thọ Ngọc', 'Thọ Phú', 'Thọ Xuân', 'Thượng Ninh', 'Thường Xuân',
      'Tiên Trang', 'Tĩnh Gia', 'Tống Sơn', 'Triệu Lộc', 'Triệu Sơn', 'Trúc Lâm', 'Trung Chính', 'Trung Hạ',
      'Trung Lý', 'Trung Sơn', 'Trung Thành', 'Trường Lâm', 'Trường Văn', 'Tượng Lĩnh', 'Vạn Lộc', 'Vạn Xuân',
      'Văn Nho', 'Văn Phú', 'Vân Du', 'Vĩnh Lộc', 'Xuân Bình', 'Xuân Chinh', 'Xuân Du', 'Xuân Hòa',
      'Xuân Lập', 'Xuân Thái', 'Xuân Tín', 'Yên Định', 'Yên Khương', 'Yên Nhân', 'Yên Ninh', 'Yên Phú',
      'Yên Thắng', 'Yên Thọ', 'Yên Trường'
    ]
  },
  {
    code: '92',
    name: 'Cần Thơ',
    wards: [
      'An Bình', 'An Lạc Thôn', 'An Ninh', 'An Thạnh', 'Bình Thủy', 'Cái Khế', 'Cái Răng', 'Châu Thành',
      'Cờ Đỏ', 'Cù Lao Dung', 'Đại Hải', 'Đại Ngãi', 'Đại Thành', 'Đông Hiệp', 'Đông Phước', 'Đông Thuận',
      'Gia Hòa', 'Hiệp Hưng', 'Hòa An', 'Hỏa Lựu', 'Hòa Tú', 'Hồ Đắc Kiện', 'Hưng Phú', 'Kế Sách',
      'Khánh Hòa', 'Lai Hòa', 'Lâm Tân', 'Lịch Hội Thượng', 'Liêu Tú', 'Long Bình', 'Long Hưng', 'Long Mỹ',
      'Long Phú', 'Long Phú 1', 'Long Tuyền', 'Lương Tâm', 'Mỹ Hương', 'Mỹ Phước', 'Mỹ Quới', 'Mỹ Tú',
      'Mỹ Xuyên', 'Ngã Bảy', 'Ngã Năm', 'Ngọc Tố', 'Nhơn Ái', 'Nhơn Mỹ', 'Nhu Gia', 'Ninh Kiều',
      'Ô Môn', 'Phong Điền', 'Phong Nẫm', 'Phú Hữu', 'Phú Lộc', 'Phú Lợi', 'Phú Tâm', 'Phụng Hiệp',
      'Phước Thới', 'Phương Bình', 'Sóc Trăng', 'Tài Văn', 'Tân An', 'Tân Bình', 'Tân Hòa', 'Tân Long',
      'Tân Lộc', 'Tân Phước Hưng', 'Tân Thạnh', 'Thạnh An', 'Thạnh Hòa', 'Thạnh Phú', 'Thạnh Quới',
      'Thạnh Thới An', 'Thạnh Xuân', 'Thốt Nốt', 'Thới An Đông', 'Thới An Hội', 'Thới Hưng', 'Thới Lai',
      'Thới Long', 'Thuận Hòa', 'Thuận Hưng', 'Trần Đề', 'Trung Hưng', 'Trung Nhứt', 'Trường Khánh',
      'Trường Long', 'Trường Long Tây', 'Trường Thành', 'Trường Xuân', 'Vị Tân', 'Vị Thanh', 'Vị Thanh 1',
      'Vị Thủy', 'Vĩnh Châu', 'Vĩnh Hải', 'Vĩnh Lợi', 'Vĩnh Phước', 'Vĩnh Thạnh', 'Vĩnh Thuận Đông',
      'Vĩnh Trinh', 'Vĩnh Tường', 'Vĩnh Viễn', 'Xà Phiên'
    ]
  },
  {
    code: '48',
    name: 'Đà Nẵng',
    wards: [
      'An Hải', 'An Khê', 'An Thắng', 'Avương', 'Bà Nà', 'Bàn Thạch', 'Bến Giằng', 'Bến Hiên',
      'Cẩm Lệ', 'Chiên Đàn', 'Duy Nghĩa', 'Duy Xuyên', 'Đại Lộc', 'Đắc Pring', 'Điện Bàn', 'Điện Bàn Bắc',
      'Điện Bàn Đông', 'Điện Bàn Tây', 'Đồng Dương', 'Đông Giang', 'Đức Phú', 'Gò Nổi', 'Hà Nha',
      'Hải Châu', 'Hải Vân', 'Hiệp Đức', 'Hòa Cường', 'Hòa Khánh', 'Hòa Tiến', 'Hòa Vang', 'Hòa Xuân',
      'Hoàng Sa', 'Hội An', 'Hội An Đông', 'Hội An Tây', 'Hùng Sơn', 'Hương Trà', 'Khâm Đức', 'La Dêê',
      'La Êê', 'Lãnh Ngọc', 'Liên Chiểu', 'Nam Giang', 'Nam Phước', 'Nam Trà My', 'Ngũ Hành Sơn',
      'Nông Sơn', 'Núi Thành', 'Phú Ninh', 'Phú Thuận', 'Phước Chánh', 'Phước Hiệp', 'Phước Năng',
      'Phước Thành', 'Phước Trà', 'Quảng Phú', 'Quế Phước', 'Quế Sơn', 'Quế Sơn Trung', 'Sông Kôn',
      'Sông Vàng', 'Sơn Cẩm Hà', 'Sơn Trà', 'Tam Anh', 'Tam Hải', 'Tam Kỳ', 'Tam Mỹ', 'Tam Xuân',
      'Tân Hiệp', 'Tây Giang', 'Tây Hồ', 'Thạnh Bình', 'Thanh Khê', 'Thạnh Mỹ', 'Thăng An', 'Thăng Bình',
      'Thăng Điền', 'Thăng Phú', 'Thăng Trường', 'Thu Bồn', 'Thượng Đức', 'Tiên Phước', 'Trà Đốc',
      'Trà Giáp', 'Trà Leng', 'Trà Liên', 'Trà Linh', 'Trà My', 'Trà Tân', 'Trà Tập', 'Trà Vân',
      'Việt An', 'Vu Gia', 'Xuân Phú'
    ]
  },
  {
    code: '01',
    name: 'Hà Nội',
    wards: [
      'An Khánh', 'Ba Đình', 'Ba Vì', 'Bạch Mai', 'Bát Tràng', 'Bất Bạt', 'Bình Minh', 'Bồ Đề',
      'Cầu Giấy', 'Chuyên Mỹ', 'Chương Dương', 'Chương Mỹ', 'Cổ Đô', 'Cửa Nam', 'Dân Hòa', 'Dương Hòa',
      'Dương Nội', 'Đa Phúc', 'Đại Mỗ', 'Đại Thanh', 'Đại Xuyên', 'Đan Phượng', 'Định Công', 'Đoài Phương',
      'Đông Anh', 'Đống Đa', 'Đông Ngạc', 'Gia Lâm', 'Giảng Võ', 'Hạ Bằng', 'Hà Đông', 'Hai Bà Trưng',
      'Hát Môn', 'Hòa Lạc', 'Hòa Phú', 'Hòa Xá', 'Hoài Đức', 'Hoàn Kiếm', 'Hoàng Liệt', 'Hoàng Mai',
      'Hồng Hà', 'Hồng Sơn', 'Hồng Vân', 'Hưng Đạo', 'Hương Sơn', 'Khương Đình', 'Kiến Hưng', 'Kiều Phú',
      'Kim Anh', 'Kim Liên', 'Láng', 'Liên Minh', 'Lĩnh Nam', 'Long Biên', 'Mê Linh', 'Minh Châu',
      'Mỹ Đức', 'Nam Phù', 'Nghĩa Đô', 'Ngọc Hà', 'Ngọc Hồi', 'Nội Bài', 'Ô Chợ Dừa', 'Ô Diên',
      'Phú Cát', 'Phú Diễn', 'Phù Đổng', 'Phú Lương', 'Phú Nghĩa', 'Phú Thượng', 'Phú Xuyên', 'Phúc Lộc',
      'Phúc Lợi', 'Phúc Sơn', 'Phúc Thịnh', 'Phúc Thọ', 'Phượng Dực', 'Phương Liệt', 'Quảng Bị',
      'Quang Minh', 'Quảng Oai', 'Quốc Oai', 'Sóc Sơn', 'Sơn Đồng', 'Sơn Tây', 'Suối Hai', 'Tam Hưng',
      'Tây Hồ', 'Tây Mỗ', 'Tây Phương', 'Tây Tựu', 'Thạch Thất', 'Thanh Liệt', 'Thanh Oai', 'Thanh Trì',
      'Thanh Xuân', 'Thiên Lộc', 'Thuận An', 'Thư Lâm', 'Thượng Cát', 'Thượng Phúc', 'Thường Tín',
      'Tiến Thắng', 'Trần Phú', 'Trung Giã', 'Tùng Thiện', 'Từ Liêm', 'Tương Mai', 'Ứng Hòa', 'Ứng Thiên',
      'Văn Miếu - Quốc Tử Giám', 'Vân Đình', 'Vật Lại', 'Việt Hưng', 'Vĩnh Hưng', 'Vĩnh Thanh', 'Vĩnh Tuy',
      'Xuân Đỉnh', 'Xuân Mai', 'Xuân Phương', 'Yên Bài', 'Yên Hòa', 'Yên Lãng', 'Yên Nghĩa', 'Yên Sở', 'Yên Xuân'
    ]
  },
  {
    code: '31',
    name: 'Hải Phòng',
    wards: [
      'Ái Quốc', 'An Biên', 'An Dương', 'An Hải', 'An Hưng', 'An Khánh', 'An Lão', 'An Phong',
      'An Phú', 'An Quang', 'An Thành', 'An Trường', 'Bạch Đằng', 'Bạch Long Vĩ', 'Bắc An Phụ',
      'Bắc Thanh Miện', 'Bình Giang', 'Cát Hải', 'Cẩm Giang', 'Cẩm Giàng', 'Chấn Hưng', 'Chí Linh',
      'Chí Minh', 'Chu Văn An', 'Dương Kinh', 'Đại Sơn', 'Đồ Sơn', 'Đông Hải', 'Đường An', 'Gia Lộc',
      'Gia Phúc', 'Gia Viên', 'Hà Bắc', 'Hà Đông', 'Hà Nam', 'Hà Tây', 'Hải An', 'Hải Dương', 'Hải Hưng',
      'Hòa Bình', 'Hồng An', 'Hồng Bàng', 'Hồng Châu', 'Hợp Tiến', 'Hùng Thắng', 'Hưng Đạo', 'Kẻ Sặt',
      'Khúc Thừa Dụ', 'Kiến An', 'Kiến Hải', 'Kiến Hưng', 'Kiến Minh', 'Kiến Thụy', 'Kim Thành',
      'Kinh Môn', 'Lạc Phượng', 'Lai Khê', 'Lê Chân', 'Lê Đại Hành', 'Lê Ích Mộc', 'Lê Thanh Nghị',
      'Lưu Kiếm', 'Mao Điền', 'Nam An Phụ', 'Nam Đồ Sơn', 'Nam Đồng', 'Nam Sách', 'Nam Thanh Miện',
      'Nam Triệu', 'Nghi Dương', 'Ngô Quyền', 'Nguyễn Bỉnh Khiêm', 'Nguyễn Đại Năng', 'Nguyên Giáp',
      'Nguyễn Lương Bằng', 'Nguyễn Trãi', 'Nhị Chiểu', 'Ninh Giang', 'Phạm Sư Mạnh', 'Phù Liễn',
      'Phú Thái', 'Quyết Thắng', 'Tân An', 'Tân Hưng', 'Tân Kỳ', 'Tân Minh', 'Thạch Khôi', 'Thái Tân',
      'Thành Đông', 'Thanh Hà', 'Thanh Miện', 'Thiên Hương', 'Thủy Nguyên', 'Thượng Hồng', 'Tiên Lãng',
      'Tiên Minh', 'Trần Hưng Đạo', 'Trần Liễu', 'Trần Nhân Tông', 'Trần Phú', 'Trường Tân', 'Tuệ Tĩnh',
      'Tứ Kỳ', 'Tứ Minh'
    ]
  },
  {
    code: '79',
    name: 'TP. Hồ Chí Minh',
    wards: [
      'An Đông', 'An Hội Đông', 'An Hội Tây', 'An Khánh', 'An Lạc', 'An Long', 'An Nhơn', 'An Nhơn Tây',
      'An Phú', 'An Phú Đông', 'An Thới Đông', 'Bà Điểm', 'Bà Rịa', 'Bàn Cờ', 'Bàu Bàng', 'Bàu Lâm',
      'Bảy Hiền', 'Bắc Tân Uyên', 'Bến Cát', 'Bến Thành', 'Bình Chánh', 'Bình Châu', 'Bình Cơ', 'Bình Dương',
      'Bình Đông', 'Bình Giã', 'Bình Hòa', 'Bình Hưng', 'Bình Hưng Hòa', 'Bình Khánh', 'Bình Lợi',
      'Bình Lợi Trung', 'Bình Mỹ', 'Bình Phú', 'Bình Quới', 'Bình Tân', 'Bình Tây', 'Bình Thạnh',
      'Bình Thới', 'Bình Tiên', 'Bình Trị Đông', 'Bình Trưng', 'Cát Lái', 'Cần Giờ', 'Cầu Kiệu',
      'Cầu Ông Lãnh', 'Chánh Hiệp', 'Chánh Hưng', 'Chánh Phú Hòa', 'Châu Đức', 'Châu Pha', 'Chợ Lớn',
      'Chợ Quán', 'Côn Đảo', 'Củ Chi', 'Dầu Tiếng', 'Dĩ An', 'Diên Hồng', 'Đất Đỏ', 'Đông Hòa',
      'Đông Hưng Thuận', 'Đông Thạnh', 'Đức Nhuận', 'Gia Định', 'Gò Vấp', 'Hạnh Thông', 'Hiệp Bình',
      'Hiệp Phước', 'Hòa Bình', 'Hòa Hiệp', 'Hòa Hội', 'Hòa Hưng', 'Hòa Lợi', 'Hóc Môn', 'Hồ Tràm',
      'Hưng Long', 'Khánh Hội', 'Kim Long', 'Lái Thiêu', 'Linh Xuân', 'Long Bình', 'Long Điền', 'Long Hải',
      'Long Hòa', 'Long Hương', 'Long Nguyên', 'Long Phước', 'Long Sơn', 'Long Trường', 'Minh Phụng',
      'Minh Thạnh', 'Ngãi Giao', 'Nghĩa Thành', 'Nhà Bè', 'Nhiêu Lộc', 'Nhuận Đức', 'Phú An', 'Phú Định',
      'Phú Giáo', 'Phú Hòa Đông', 'Phú Lâm', 'Phú Lợi', 'Phú Mỹ', 'Phú Nhuận', 'Phú Thạnh', 'Phú Thọ',
      'Phú Thọ Hòa', 'Phú Thuận', 'Phước Hải', 'Phước Hòa', 'Phước Long', 'Phước Thành', 'Phước Thắng',
      'Rạch Dừa', 'Sài Gòn', 'Tam Bình', 'Tam Long', 'Tam Thắng', 'Tăng Nhơn Phú', 'Tân An Hội', 'Tân Bình',
      'Tân Định', 'Tân Đông Hiệp', 'Tân Hải', 'Tân Hiệp', 'Tân Hòa', 'Tân Hưng', 'Tân Khánh', 'Tân Mỹ',
      'Tân Nhựt', 'Tân Phú', 'Tân Phước', 'Tân Sơn', 'Tân Sơn Hòa', 'Tân Sơn Nhất', 'Tân Sơn Nhì',
      'Tân Tạo', 'Tân Thành', 'Tân Thới Hiệp', 'Tân Thuận', 'Tân Uyên', 'Tân Vĩnh Lộc', 'Tây Nam',
      'Tây Thạnh', 'Thái Mỹ', 'Thanh An', 'Thạnh An', 'Thạnh Mỹ Tây', 'Thông Tây Hội', 'Thới An',
      'Thới Hòa', 'Thủ Dầu Một', 'Thủ Đức', 'Thuận An', 'Thuận Giao', 'Thường Tân', 'Trung Mỹ Tây',
      'Trừ Văn Thố', 'Vĩnh Hội', 'Vĩnh Lộc', 'Vĩnh Tân', 'Vũng Tàu', 'Vườn Lài', 'Xóm Chiếu',
      'Xuân Hòa', 'Xuân Sơn', 'Xuân Thới Sơn', 'Xuyên Mộc'
    ]
  },
  {
    code: '46',
    name: 'Thừa Thiên Huế',
    wards: [
      'A Lưới 1', 'A Lưới 2', 'A Lưới 3', 'A Lưới 4', 'A Lưới 5', 'An Cựu', 'Bình Điền', 'Chân Mây - Lăng Cô',
      'Dương Nỗ', 'Đan Điền', 'Hóa Châu', 'Hưng Lộc', 'Hương An', 'Hương Thủy', 'Hương Trà', 'Khe Tre',
      'Kim Long', 'Kim Trà', 'Long Quảng', 'Lộc An', 'Mỹ Thượng', 'Nam Đông', 'Phong Dinh', 'Phong Điền',
      'Phong Phú', 'Phong Quảng', 'Phong Thái', 'Phú Bài', 'Phú Hồ', 'Phú Lộc', 'Phú Vang', 'Phú Vinh',
      'Phú Xuân', 'Quảng Điền', 'Thanh Thủy', 'Thuận An', 'Thuận Hóa', 'Vinh Lộc', 'Vỹ Dạ'
    ]
  },
  {
    code: '08',
    name: 'Tuyên Quang',
    wards: [
      'An Tường', 'Bạch Đích', 'Bạch Ngọc', 'Bạch Xa', 'Bản Máy', 'Bắc Mê', 'Bắc Quang', 'Bằng Hành',
      'Bằng Lang', 'Bình An', 'Bình Ca', 'Bình Thuận', 'Bình Xa', 'Cán Tỷ', 'Cao Bồ', 'Chiêm Hóa',
      'Côn Lôn', 'Du Già', 'Đồng Tâm', 'Đông Thọ', 'Đồng Văn', 'Đồng Yên', 'Đường Hồng', 'Đường Thượng',
      'Giáp Trung', 'Hà Giang 1', 'Hà Giang 2', 'Hàm Yên', 'Hòa An', 'Hoàng Su Phì', 'Hồ Thầu', 'Hồng Sơn',
      'Hồng Thái', 'Hùng An', 'Hùng Đức', 'Hùng Lợi', 'Khâu Vai', 'Khuôn Lùng', 'Kiên Đài', 'Kiến Thiết',
      'Kim Bình', 'Lao Chải', 'Lâm Bình', 'Liên Hiệp', 'Linh Hồ', 'Lũng Cú', 'Lũng Phìn', 'Lùng Tám',
      'Lực Hành', 'Mậu Duệ', 'Mèo Vạc', 'Minh Ngọc', 'Minh Quang', 'Minh Sơn', 'Minh Tân', 'Minh Thanh',
      'Minh Xuân', 'Mỹ Lâm', 'Nà Hang', 'Nấm Dẩn', 'Nậm Dịch', 'Nghĩa Thuận', 'Ngọc Đường', 'Ngọc Long',
      'Nhữ Khê', 'Niêm Sơn', 'Nông Tiến', 'Pà Vầy Sủ', 'Phú Linh', 'Phú Lương', 'Phù Lưu', 'Pờ Ly Ngài',
      'Quản Bạ', 'Quang Bình', 'Quảng Nguyên', 'Sà Phìn', 'Sơn Dương', 'Sơn Thủy', 'Sơn Vĩ', 'Sủng Máng',
      'Tát Ngà', 'Tân An', 'Tân Long', 'Tân Mỹ', 'Tân Quang', 'Tân Thanh', 'Tân Tiến', 'Tân Trào',
      'Tân Trịnh', 'Thái Bình', 'Thái Hòa', 'Thái Sơn', 'Thàng Tín', 'Thanh Thủy', 'Thắng Mố',
      'Thông Nguyên', 'Thuận Hòa', 'Thượng Lâm', 'Thượng Nông', 'Thượng Sơn', 'Tiên Nguyên', 'Tiên Yên',
      'Tri Phú', 'Trung Hà', 'Trung Sơn', 'Trung Thịnh', 'Trường Sinh', 'Tùng Bá', 'Tùng Vài', 'Vị Xuyên',
      'Việt Lâm', 'Vĩnh Tuy', 'Xín Mần', 'Xuân Giang', 'Xuân Vân', 'Yên Cường', 'Yên Hoa', 'Yên Lập',
      'Yên Minh', 'Yên Nguyên', 'Yên Phú', 'Yên Sơn', 'Yên Thành'
    ]
  },
  {
    code: '86',
    name: 'Vĩnh Long',
    wards: [
      'An Bình', 'An Định', 'An Hiệp', 'An Hội', 'An Ngãi Trung', 'An Phú Tân', 'An Qui', 'An Trường',
      'Ba Tri', 'Bảo Thạnh', 'Bến Tre', 'Bình Đại', 'Bình Minh', 'Bình Phú', 'Bình Phước', 'Cái Ngang',
      'Cái Nhum', 'Cái Vồn', 'Càng Long', 'Cầu Kè', 'Cầu Ngang', 'Châu Hòa', 'Châu Hưng', 'Châu Thành',
      'Chợ Lách', 'Duyên Hải', 'Đại An', 'Đại Điền', 'Đôn Châu', 'Đông Hải', 'Đồng Khởi', 'Đông Thành',
      'Giao Long', 'Giồng Trôm', 'Hàm Giang', 'Hiệp Mỹ', 'Hiếu Phụng', 'Hiếu Thành', 'Hòa Bình',
      'Hòa Hiệp', 'Hòa Minh', 'Hưng Khánh Trung', 'Hưng Mỹ', 'Hưng Nhượng', 'Hương Mỹ', 'Long Châu',
      'Long Đức', 'Long Hiệp', 'Long Hòa', 'Long Hồ', 'Long Hữu', 'Long Thành', 'Long Vĩnh',
      'Lộc Thuận', 'Lục Sĩ Thành', 'Lương Hòa', 'Lương Phú', 'Lưu Nghiệp Anh', 'Mỏ Cày', 'Mỹ Chánh Hòa',
      'Mỹ Long', 'Mỹ Thuận', 'Ngãi Tứ', 'Ngũ Lạc', 'Nhị Long', 'Nhị Trường', 'Nhơn Phú',
      'Nhuận Phú Tân', 'Phong Thạnh', 'Phú Khương', 'Phú Phụng', 'Phú Quới', 'Phú Tân', 'Phú Thuận',
      'Phú Túc', 'Phước Hậu', 'Phước Long', 'Phước Mỹ Trung', 'Quới An', 'Quới Điền', 'Quới Thiện',
      'Song Lộc', 'Song Phú', 'Sơn Đông', 'Tam Bình', 'Tam Ngãi', 'Tân An', 'Tân Hạnh', 'Tân Hào',
      'Tân Long Hội', 'Tân Lược', 'Tân Ngãi', 'Tân Phú', 'Tân Quới', 'Tân Thành Bình', 'Tân Thủy',
      'Tân Xuân', 'Tập Ngãi', 'Tập Sơn', 'Thanh Đức', 'Thạnh Hải', 'Thạnh Phong', 'Thạnh Phú',
      'Thạnh Phước', 'Thành Thới', 'Thạnh Trị', 'Thới Thuận', 'Tiên Thủy', 'Tiểu Cần', 'Trà Côn',
      'Trà Cú', 'Trà Ôn', 'Trà Vinh', 'Trung Hiệp', 'Trung Ngãi', 'Trung Thành', 'Vinh Kim',
      'Vĩnh Thành', 'Vĩnh Xuân'
    ]
  }
];

export const VIETNAM_PROVINCE_NAMES: string[] = VIETNAM_LOCATIONS.map(p => p.name);

function stripVietnamese(str: string): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/^(thanh pho|tinh|tp\.|tp)\s+/i, '')
    .replace(/[\s\-\.]+/g, ' ')
    .trim();
}

export function getWardsForProvince(provinceName: string): string[] {
  if (!provinceName) return [];
  const pNorm = stripVietnamese(provinceName);
  const found = VIETNAM_LOCATIONS.find(loc => {
    const locNorm = stripVietnamese(loc.name);
    return locNorm === pNorm ||
      (locNorm.includes('ho chi minh') && (pNorm.includes('ho chi minh') || pNorm === 'hcm')) ||
      (locNorm.includes('hue') && pNorm.includes('hue')) ||
      locNorm.includes(pNorm) || pNorm.includes(locNorm);
  });
  return found ? [...found.wards] : [];
}

