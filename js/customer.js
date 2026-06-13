const customerModule = {
    init: function(data) {
        const customers = {};

        data.forEach(item => {
            // 1. Chuẩn hóa số điện thoại để làm key gom nhóm chính xác
            let rawPhone = item.SoDienThoai ? String(item.SoDienThoai) : '';
            let phone = rawPhone.replace(/\s+/g, '')       // Xóa khoảng trắng
                                .replace(/^\+84/, '0')     // Đổi +84 thành 0
                                .replace(/^'/, '');        // Xóa dấu nháy đơn nếu sheet bị dính
            
            // Bỏ qua nếu dòng không có thông tin số điện thoại
            if (!phone) return; 

            if (!customers[phone]) {
                customers[phone] = {
                    Name: item.KhachHang,
                    Phone: phone,
                    Count: 0,
                    TotalSpend: 0
                };
            } else {
                // Cập nhật tên mới nhất nếu khách có đổi tên lưu trên hệ thống
                if (item.KhachHang) {
                    customers[phone].Name = item.KhachHang;
                }
            }

            // 2. Chỉ tính số lần sử dụng dịch vụ với các lịch KHÔNG bị hủy
            const status = item.TrangThai ? item.TrangThai.trim() : '';
            if (status && status !== 'Đã hủy') {
                customers[phone].Count += 1;
            }

            // 3. Chỉ cộng tiền vào tổng chi tiêu nếu lịch Đã hoàn thành
            if (status === 'Đã hoàn thành') {
                customers[phone].TotalSpend += Number(item.GiaTri || 0);
            }
        });

        // 4. Lọc ra những khách hàng có ít nhất 1 lần sử dụng dịch vụ (bỏ qua những người chỉ có lịch Hủy)
        const validCustomers = Object.values(customers).filter(c => c.Count > 0);

        this.renderTable(validCustomers);
    },

    renderTable: function(customerList) {
        const tbody = document.getElementById('customer-table-body');
        tbody.innerHTML = '';

        // Sắp xếp ưu tiên: Tổng chi tiêu giảm dần -> Số lần sử dụng giảm dần
        customerList.sort((a, b) => {
            if (b.TotalSpend !== a.TotalSpend) {
                return b.TotalSpend - a.TotalSpend;
            }
            return b.Count - a.Count;
        });

        customerList.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${c.Name}</td>
                <td><a href="tel:${c.Phone}" class="text-decoration-none">${c.Phone}</a></td>
                <td class="text-center"><span class="badge bg-info text-dark rounded-pill px-3">${c.Count} lần</span></td>
                <td class="text-end fw-bold text-primary">${formatCurrency(c.TotalSpend)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
};