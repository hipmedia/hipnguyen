const scheduleModule = {
    data: [],
    filteredData: [],
    currentSort: { column: 'ID', asc: true },

    init: function(data) {
        this.data = [...data];
        this.setupEvents();
        this.applyFilters();
    },

    setupEvents: function() {
        document.getElementById('sched-search').oninput = () => this.applyFilters();
        document.getElementById('sched-filter-status').onchange = () => this.applyFilters();
        document.getElementById('sched-filter-date').onchange = () => this.applyFilters();
        document.getElementById('sched-btn-clear').onclick = () => {
            document.getElementById('sched-search').value = '';
            document.getElementById('sched-filter-status').value = '';
            document.getElementById('sched-filter-date').value = '';
            this.applyFilters();
        };
    },

    applyFilters: function() {
        const search = document.getElementById('sched-search').value.toLowerCase();
        const status = document.getElementById('sched-filter-status').value;
        const dateVal = document.getElementById('sched-filter-date').value;

        this.filteredData = this.data.filter(item => {
            const matchSearch = !search || 
                item.KhachHang.toLowerCase().includes(search) || 
                item.SoDienThoai.includes(search) || 
                item.DichVu.toLowerCase().includes(search) ||
                (item.Editor && item.Editor.toLowerCase().includes(search));

            const matchStatus = !status || item.TrangThai === status;
            
            let matchDate = true;
            if (dateVal) {
                const d1 = new Date(item.Ngay).setHours(0,0,0,0);
                const d2 = new Date(dateVal).setHours(0,0,0,0);
                matchDate = d1 === d2;
            }

            return matchSearch && matchStatus && matchDate;
        });

        this.sort(this.currentSort.column, false);
    },

    sort: function(column, toggle = true) {
        if (toggle) {
            if (this.currentSort.column === column) {
                this.currentSort.asc = !this.currentSort.asc;
            } else {
                this.currentSort.column = column;
                this.currentSort.asc = true;
            }
        }

        this.filteredData.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'Ngay') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return this.currentSort.asc ? -1 : 1;
            if (valA > valB) return this.currentSort.asc ? 1 : -1;
            return 0;
        });

        this.renderTable();
    },

    renderTable: function() {
        const tbody = document.getElementById('schedule-table-body');
        tbody.innerHTML = '';

        this.filteredData.forEach(item => {
            const formattedDate = new Date(item.Ngay).toLocaleDateString('vi-VN');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.ID}</td>
                <td>${formattedDate}</td>
                <td class="fw-bold">${item.KhachHang}</td>
                <td><a href="tel:${item.SoDienThoai}" class="text-decoration-none">${item.SoDienThoai}</a></td>
                <td><span class="badge bg-dark">${item.DichVu}</span></td>
                <td class="fw-bold text-end text-success">${formatCurrency(item.GiaTri)}</td>
                <td><span class="badge ${getStatusBadgeClass(item.TrangThai)}">${item.TrangThai}</span></td>
                <td class="d-none d-md-table-cell">${item.Editor || ''}</td>
                <td class="d-none d-md-table-cell"><small class="text-muted text-wrap" style="max-width: 150px; display: inline-block;">${item.GhiChu || ''}</small></td>
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="scheduleModule.openEditModal(${item.ID})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="scheduleModule.deleteItem(${item.ID})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openAddModal: function() {
        document.getElementById('scheduleModalLabel').innerText = "Thêm lịch mới";
        document.getElementById('schedule-form').reset();
        document.getElementById('form-id').value = '';
        scheduleModalInstance.show();
    },

    openEditModal: function(id) {
        const item = this.data.find(x => x.ID === id);
        if (!item) return;

        document.getElementById('scheduleModalLabel').innerText = "Cập nhật lịch làm việc";
        document.getElementById('form-id').value = item.ID;
        
        const dateObj = new Date(item.Ngay);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        
        document.getElementById('form-date').value = `${yyyy}-${mm}-${dd}`;
        document.getElementById('form-customer').value = item.KhachHang;
        document.getElementById('form-phone').value = item.SoDienThoai;
        document.getElementById('form-service').value = item.DichVu;
        document.getElementById('form-value').value = item.GiaTri;
        document.getElementById('form-status').value = item.TrangThai;
        document.getElementById('form-editor').value = item.Editor || '';
        document.getElementById('form-notes').value = item.GhiChu || '';

        scheduleModalInstance.show();
    },

    deleteItem: async function(id) {
        const result = await Swal.fire({
            title: 'Xác nhận xóa',
            text: `Bạn có chắc chắn muốn xóa lịch ID: ${id} không? Dữ liệu không thể khôi phục.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`${CONFIG.API_URL}?action=deleteSchedule`, {
                method: 'POST',
                body: JSON.stringify({ ID: id })
            });
            const resData = await res.json();
            
            showLoading(false);
            
            if (resData.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa!',
                    text: 'Lịch làm việc đã được xóa thành công.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchData();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Xóa thất bại: ' + resData.message
                });
            }
        } catch (error) {
            console.error(error);
            showLoading(false);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi mạng',
                text: 'Không thể kết nối đến máy chủ!'
            });
        }
    }
};