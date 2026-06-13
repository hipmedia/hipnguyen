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
                (item.NhanSu && item.NhanSu.toLowerCase().includes(search));

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
            let valA = a[column]; let valB = b[column];
            if (column === 'Ngay') { valA = new Date(valA); valB = new Date(valB); }
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
            
            // Xử lý nợ = 0 nếu đã hoàn thành (Hiển thị)
            let conNo = (Number(item.GiaTri) - Number(item.DaThu || 0));
            if (item.TrangThai === 'Đã hoàn thành') {
                conNo = 0;
            }
            
            const noText = conNo > 0 ? formatCurrency(conNo) : '0đ';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${item.ID}</td>
                <td class="text-nowrap">${formattedDate}</td>
                <td class="fw-bold">${item.KhachHang}</td>
                <td><a href="tel:${item.SoDienThoai}" class="text-decoration-none">${item.SoDienThoai}</a></td>
                <td><span class="badge bg-dark">${item.DichVu}</span></td>
                <td><small class="text-primary">${item.NhanSu || ''}</small></td>
                <td class="text-end fw-bold text-success">${formatCurrency(item.GiaTri)}</td>
                <td class="text-end fw-bold text-danger">${noText}</td>
                <td><span class="badge ${getStatusBadgeClass(item.TrangThai)}">${item.TrangThai}</span></td>
                <td class="text-center text-nowrap">
                    <div class="dropdown">
                        <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Thao tác</button>
                        <ul class="dropdown-menu dropdown-menu-end shadow">
                            <li><a class="dropdown-item" href="#" onclick="scheduleModule.openEditModal(${item.ID})"><i class="bi bi-pencil me-2 text-primary"></i> Sửa lịch</a></li>
                            <li><a class="dropdown-item" href="#" onclick="scheduleModule.exportPDF(${item.ID}, 'Báo Giá')"><i class="bi bi-file-earmark-pdf me-2 text-warning"></i> Xuất Báo giá</a></li>
                            <li><a class="dropdown-item" href="#" onclick="scheduleModule.exportPDF(${item.ID}, 'Hóa Đơn')"><i class="bi bi-receipt me-2 text-success"></i> Xuất Hóa đơn</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="scheduleModule.deleteItem(${item.ID})"><i class="bi bi-trash me-2"></i> Xóa</a></li>
                        </ul>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openAddModal: function() {
        document.getElementById('scheduleModalLabel').innerText = "Thêm lịch mới";
        document.getElementById('schedule-form').reset();
        document.getElementById('form-id').value = '';
        document.getElementById('form-debt-display').innerText = '0đ';
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
        document.getElementById('form-crew').value = item.NhanSu || '';
        document.getElementById('form-value').value = item.GiaTri;
        document.getElementById('form-paid').value = item.DaThu || 0;
        document.getElementById('form-status').value = item.TrangThai;
        document.getElementById('form-notes').value = item.GhiChu || '';

        calculateDebt();
        scheduleModalInstance.show();
    },

    deleteItem: async function(id) {
        const result = await Swal.fire({
            title: 'Xác nhận xóa', text: 'Dữ liệu không thể khôi phục.', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d', confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy'
        });
        if (!result.isConfirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`${CONFIG.API_URL}?action=deleteSchedule`, { method: 'POST', body: JSON.stringify({ ID: id }) });
            const resData = await res.json();
            showLoading(false);
            if (resData.status === 'success') {
                Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 1500, showConfirmButton: false });
                fetchData();
            } else { Swal.fire({ icon: 'error', title: 'Lỗi', text: resData.message }); }
        } catch (error) {
            showLoading(false); Swal.fire({ icon: 'error', title: 'Lỗi mạng' });
        }
    },

    exportPDF: function(id, type) {
        const item = this.data.find(x => x.ID === id);
        if(!item) return;
        
        this.currentExportFilename = `${type === 'Báo Giá' ? 'BaoGia' : 'HoaDon'}_${item.KhachHang}.pdf`;

        document.getElementById('pdf-doc-title').innerText = type.toUpperCase();
        document.getElementById('pdf-date').innerText = new Date().toLocaleDateString('vi-VN');
        document.getElementById('pdf-id').innerText = item.ID;
        document.getElementById('pdf-customer').innerText = item.KhachHang;
        document.getElementById('pdf-phone').innerText = item.SoDienThoai;
        document.getElementById('pdf-service').innerText = item.DichVu;
        document.getElementById('pdf-total').innerText = formatCurrency(item.GiaTri);
        document.getElementById('pdf-total-summary').innerText = formatCurrency(item.GiaTri);
        
        let debt = Number(item.GiaTri) - Number(item.DaThu || 0);
        if(item.TrangThai === 'Đã hoàn thành') debt = 0;
        
        if(type === 'Báo Giá') {
            document.getElementById('pdf-paid-row').style.display = 'none';
            document.getElementById('pdf-debt-row').style.display = 'none';
        } else {
            document.getElementById('pdf-paid-row').style.display = 'table-row';
            document.getElementById('pdf-debt-row').style.display = 'table-row';
            document.getElementById('pdf-paid').innerText = formatCurrency(item.DaThu || 0);
            document.getElementById('pdf-debt').innerText = formatCurrency(debt < 0 ? 0 : debt);
        }

        const pdfModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('pdfPreviewModal'));
        pdfModal.show();
    },

    executeExportPDF: function() {
        // Bỏ focus các thành phần đang edit (nếu có) để khi chụp PDF không bị dính viền outline
        if (document.activeElement) {
            document.activeElement.blur();
        }

        const element = document.getElementById('pdf-template');
        document.getElementById('pdf-container').classList.remove('d-none');
        
        const opt = {
            margin:       0,
            filename:     `${type === 'Báo Giá' ? 'BaoGia' : 'HoaDon'}_${item.KhachHang}.pdf`,
            filename:     this.currentExportFilename || 'Tai_Lieu.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            document.getElementById('pdf-container').classList.add('d-none');
            const modalIns = bootstrap.Modal.getInstance(document.getElementById('pdfPreviewModal'));
            if (modalIns) modalIns.hide();
        });
    }
};