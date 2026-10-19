// Model Staff đã được hợp nhất hoàn toàn sang Employee (bảng Employees)
// File này giữ lại alias để đảm bảo tương thích ngược và không tạo dư collection Staffs
const Employee = require('./Employee');
module.exports = Employee;
