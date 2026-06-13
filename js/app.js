let appData = [];
let scheduleModalInstance;

document.addEventListener("DOMContentLoaded", () => {
    scheduleModalInstance = new bootstrap.Modal(document.getElementById('scheduleModal'));
    initApp();
});

function initApp() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Sidebar toggle (Mobile friendly)
    document.getElementById('sidebarCollapse').addEventListener('click', () => {
        sidebar.classList.toggle('active');
        if(window.innerWidth <= 768) {
            overlay.classList.toggle('active');
        }
    });

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Time display
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleString('vi-VN');
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.innerText = timeStr;
    }, 1000);

    // Navigation routing
    document.querySelectorAll('#sidebar ul.components li a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('#sidebar ul.components li').forEach(li => li.classList.remove('active'));
            this.parentElement.classList.add('active');

            const section = this.getAttribute('data-section');
            switchSection(section);
            
            // Auto close sidebar on mobile after clicking
            if(window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });

    // Form Event Handler
    document.getElementById('schedule-form').addEventListener('submit', handleFormSubmit);

    // Initial Fetch
    fetchData();
}

function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
    document.getElementById(`section-${sectionId}`).classList.remove('d-none');
    
    const titles = {
        'dashboard': 'Dashboard',
        'schedule': 'Quản lý lịch làm việc',
        'revenue': 'Quản lý doanh thu',
        'customer': 'Danh sách khách hàng',
        'statistics': 'Thống kê phân tích'
    };
    document.getElementById('current-section-title').innerText = titles[sectionId] || 'Hệ thống';

    renderSection(sectionId);
}

async function fetchData() {
    showLoading(true);
    try {
        const res = await fetch(`${CONFIG.API_URL}?action=getSchedules`);
        const result = await res.json();
        if (result.status === 'success') {
            appData = result.data;
            const activeLink = document.querySelector('#sidebar ul.components li.active a');
            const currentSection = activeLink ? activeLink.getAttribute('data-section') : 'dashboard';
            renderSection(currentSection);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Lỗi lấy dữ liệu từ hệ thống: ' + result.message
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Mất kết nối',
            text: 'Không thể kết nối đến API Server. Vui lòng kiểm tra lại cấu hình hoặc mạng.'
        });
    } finally {
        showLoading(false);
    }
}

function renderSection(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            dashboardModule.init(appData);
            break;
        case 'schedule':
            scheduleModule.init(appData);
            break;
        case 'revenue':
            revenueModule.init(appData);
            break;
        case 'customer':
            customerModule.init(appData);
            break;
        case 'statistics':
            statisticsModule.init(appData);
            break;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-id').value;
    const data = {
        Ngay: document.getElementById('form-date').value,
        KhachHang: document.getElementById('form-customer').value,
        SoDienThoai: document.getElementById('form-phone').value,
        DichVu: document.getElementById('form-service').value,
        GiaTri: Number(document.getElementById('form-value').value),
        TrangThai: document.getElementById('form-status').value,
        Editor: document.getElementById('form-editor').value,
        GhiChu: document.getElementById('form-notes').value
    };

    showLoading(true);
    scheduleModalInstance.hide();

    try {
        let response;
        if (id) {
            data.ID = Number(id);
            response = await fetch(`${CONFIG.API_URL}?action=updateSchedule`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch(`${CONFIG.API_URL}?action=addSchedule`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
        const resData = await response.json();
        
        showLoading(false);
        
        if(resData.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: id ? 'Cập nhật lịch thành công!' : 'Thêm lịch mới thành công!',
                timer: 1500,
                showConfirmButton: false
            });
            fetchData();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Thất bại',
                text: 'Xử lý biểu mẫu thất bại: ' + resData.message
            });
            scheduleModalInstance.show(); // Re-open if fail
        }
    } catch (error) {
        console.error(error);
        showLoading(false);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại!'
        });
        scheduleModalInstance.show();
    }
}

function showLoading(show) {
    const loader = document.getElementById('loading-overlay');
    if (show) loader.classList.remove('d-none');
    else loader.classList.add('d-none');
}

function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Chờ xác nhận': return 'badge-pending';
        case 'Đã cọc': return 'badge-deposited';
        case 'Đang xử lý': return 'badge-processing';
        case 'Đã hoàn thành': return 'badge-completed';
        case 'Đã hủy': return 'badge-cancelled';
        default: return 'bg-secondary';
    }
}