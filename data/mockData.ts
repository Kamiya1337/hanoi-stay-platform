// src/data/mockData.ts

// 1. Dữ liệu Danh sách Tòa nhà (Cơ sở)
export const mockBuildings = [
  { id: "B01", name: "HANOI STAY - Cầu Giấy" },
  { id: "B02", name: "HANOI STAY - Đống Đa" },
];

// 2. Dữ liệu Danh sách Phòng
export const mockRooms = [
  {
    id: "R101",
    buildingId: "B01",
    roomName: "Phòng 101",
    status: "RENTED", // RENTED: đang thuê, EMPTY: trống
    baseRentPrice: 4500000, // Giá thuê cơ bản (4.5tr)
    contractEndDate: "2024-06-15", // Hợp đồng sắp hết hạn
  },
  {
    id: "R102",
    buildingId: "B01",
    roomName: "Phòng 102",
    status: "EMPTY",
    baseRentPrice: 4000000,
    contractEndDate: null,
  },
  {
    id: "R201",
    buildingId: "B02",
    roomName: "Phòng 201",
    status: "RENTED",
    baseRentPrice: 5000000,
    contractEndDate: "2025-01-10",
  },
  // ... bạn có thể tự copy thêm vài phòng nữa cho phong phú dữ liệu
];

// 3. Dữ liệu Cấu hình Đơn giá Dịch vụ (Điện, Nước, Internet...)
export const mockServicePrices = {
  electricity: 3800, // 3,800 VNĐ / số
  water: 25000,      // 25,000 VNĐ / khối
  internet: 100000,  // 100,000 VNĐ / tháng
  cleaning: 50000,   // 50,000 VNĐ / tháng
};

// 4. Dữ liệu Thống kê Biểu đồ Dòng tiền (Cho Dashboard)
export const mockCashflowData = [
  { month: "T12/23", thu: 40000000, chi: 10000000, lai: 30000000 },
  { month: "T1/24", thu: 42000000, chi: 12000000, lai: 30000000 },
  { month: "T2/24", thu: 45000000, chi: 11000000, lai: 34000000 },
  { month: "T3/24", thu: 48900000, chi: 31500000, lai: 17400000 }, // Giống ảnh thiết kế của bạn
];