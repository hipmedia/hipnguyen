const dashboardModule = {
    init: function(data) {
        this.renderCards(data);
        this.renderCharts(data);
    },

    renderCards: function(data) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        let revMonth = 0;
        let revYear = 0;
        let pending = 0;
        let done = 0;
        let cancel = 0;

        data.forEach(item => {
            const date = new Date(item.Ngay);
            const itemMonth = date.getMonth() + 1;
            const itemYear = date.getFullYear();

            if (item.TrangThai === 'Đã hoàn thành') {
                if (itemYear === currentYear) {
                    revYear += Number(item.GiaTri || 0);
                    if (itemMonth === currentMonth) {
                        revMonth += Number(item.GiaTri || 0);
                    }
                }
            }

            if (item.TrangThai === 'Chờ xác nhận') pending++;
            else if (item.TrangThai === 'Đã hoàn thành') done++;
            else if (item.TrangThai === 'Đã hủy') cancel++;
        });

        document.getElementById('db-rev-month').innerText = formatCurrency(revMonth);
        document.getElementById('db-rev-year').innerText = formatCurrency(revYear);
        document.getElementById('db-status-pending').innerText = pending;
        document.getElementById('db-status-done').innerText = done;
        document.getElementById('db-status-cancel').innerText = cancel;
    },

    renderCharts: function(data) {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Month Chart Data
        const monthlyData = Array(12).fill(0);
        // Service Chart Data
        const serviceMap = {};

        data.forEach(item => {
            const date = new Date(item.Ngay);
            if (date.getFullYear() === currentYear && item.TrangThai === 'Đã hoàn thành') {
                monthlyData[date.getMonth()] += Number(item.GiaTri || 0);
                
                const svc = item.DichVu || 'Khác';
                serviceMap[svc] = (serviceMap[svc] || 0) + Number(item.GiaTri || 0);
            }
        });

        chartModule.createBarChart('chart-db-month', 
            ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'], 
            monthlyData, 
            'Doanh thu'
        );

        chartModule.createPieChart('chart-db-service', 
            Object.keys(serviceMap), 
            Object.values(serviceMap)
        );
    }
};