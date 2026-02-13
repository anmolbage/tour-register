// ===================================
// Export Module - Excel & PDF Generation
// ===================================

class ExportManager {
    constructor(app) {
        this.app = app;
    }
    
    // ===================================
    // Excel Export
    // ===================================
    async exportToExcel() {
        const monthInput = document.getElementById('export-month').value;
        if (!monthInput) {
            this.app.showToast('Please select a month', 'error');
            return;
        }
        
        this.app.showLoading();
        
        try {
            const visits = await this.getVisitsForMonth(monthInput);
            
            if (visits.length === 0) {
                this.app.hideLoading();
                this.app.showToast('No visits found for selected month', 'error');
                return;
            }
            
            const csv = this.generateCSV(visits);
            this.downloadCSV(csv, `tour-register-${monthInput}.csv`);
            
            this.app.hideLoading();
            this.app.showToast('Excel file downloaded', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.app.hideLoading();
            this.app.showToast('Export failed', 'error');
        }
    }
    
    generateCSV(visits) {
        const purposeLabels = {
            govt: 'Govt Meeting',
            official: 'Official Meeting',
            customer: 'Customer Meeting',
            'pre-sanction': 'Pre-Sanction Inspection',
            'post-sanction': 'Post-Sanction Inspection',
            followup: 'Lead Follow-up',
            notice: 'Notice Serve',
            recovery: 'Recovery Visit',
            others: 'Others'
        };
        
        // CSV Headers
        let csv = 'Date,Time Out,Time In,Duration (mins),Purpose,Distance (km),Location,Notes\n';
        
        // CSV Rows
        visits.forEach(visit => {
            const date = new Date(visit.date).toLocaleDateString('en-IN');
            const timeOut = visit.timeOut ? new Date(visit.timeOut).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}) : '';
            const timeIn = new Date(visit.timeIn).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
            const duration = visit.duration || 0;
            const purpose = purposeLabels[visit.purpose] || visit.purpose;
            const distance = (visit.distance || 0).toFixed(1);
            const location = (visit.address || '').replace(/,/g, ';'); // Replace commas to avoid CSV issues
            const notes = (visit.notes || '').replace(/,/g, ';').replace(/\n/g, ' ');
            
            csv += `"${date}","${timeOut}","${timeIn}",${duration},"${purpose}",${distance},"${location}","${notes}"\n`;
        });
        
        return csv;
    }
    
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    // ===================================
    // PDF Export
    // ===================================
    async exportToPDF() {
        const monthInput = document.getElementById('export-month').value;
        if (!monthInput) {
            this.app.showToast('Please select a month', 'error');
            return;
        }
        
        this.app.showLoading();
        
        try {
            const visits = await this.getVisitsForMonth(monthInput);
            
            if (visits.length === 0) {
                this.app.hideLoading();
                this.app.showToast('No visits found for selected month', 'error');
                return;
            }
            
            const html = this.generatePDFHTML(visits, monthInput);
            this.printPDF(html);
            
            this.app.hideLoading();
            this.app.showToast('Opening print dialog...', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.app.hideLoading();
            this.app.showToast('Export failed', 'error');
        }
    }
    
    generatePDFHTML(visits, month) {
        const purposeLabels = {
            govt: 'Govt Meeting',
            official: 'Official Meeting',
            customer: 'Customer Meeting',
            'pre-sanction': 'Pre-Sanction Inspection',
            'post-sanction': 'Post-Sanction Inspection',
            followup: 'Lead Follow-up',
            notice: 'Notice Serve',
            recovery: 'Recovery Visit',
            others: 'Others'
        };
        
        const monthName = new Date(month + '-01').toLocaleDateString('en-IN', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        let totalKm = 0;
        let totalHours = 0;
        
        const rows = visits.map(visit => {
            totalKm += visit.distance || 0;
            totalHours += (visit.duration || 0) / 60;
            
            const date = new Date(visit.date).toLocaleDateString('en-IN');
            const timeOut = visit.timeOut ? new Date(visit.timeOut).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}) : '-';
            const timeIn = new Date(visit.timeIn).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
            const purpose = purposeLabels[visit.purpose] || visit.purpose;
            const distance = (visit.distance || 0).toFixed(1);
            
            return `
                <tr>
                    <td>${date}</td>
                    <td>${timeOut}</td>
                    <td>${timeIn}</td>
                    <td>${purpose}</td>
                    <td>${distance}</td>
                    <td>${visit.address || '-'}</td>
                </tr>
            `;
        }).join('');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Tour Register - ${monthName}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 10pt;
                        line-height: 1.4;
                        margin: 0;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #1a472a;
                        padding-bottom: 15px;
                    }
                    .header h1 {
                        margin: 0 0 5px 0;
                        color: #1a472a;
                        font-size: 20pt;
                    }
                    .header h2 {
                        margin: 0;
                        color: #666;
                        font-size: 14pt;
                        font-weight: normal;
                    }
                    .info-section {
                        margin-bottom: 20px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .info-item {
                        font-size: 10pt;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #333;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th {
                        background-color: #1a472a;
                        color: white;
                        padding: 10px 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 10pt;
                    }
                    td {
                        padding: 8px;
                        border-bottom: 1px solid #ddd;
                        font-size: 9pt;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .summary {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: #f0f8f4;
                        border-left: 4px solid #1a472a;
                    }
                    .summary-item {
                        display: inline-block;
                        margin-right: 30px;
                        font-weight: bold;
                    }
                    .signature-section {
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .signature-box {
                        text-align: center;
                    }
                    .signature-line {
                        width: 200px;
                        border-top: 1px solid #333;
                        margin: 50px auto 10px;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 8pt;
                        color: #999;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>TOUR REGISTER</h1>
                    <h2>Branch Manager's Field Visit Log</h2>
                </div>
                
                <div class="info-section">
                    <div class="info-item">
                        <span class="info-label">Period:</span> ${monthName}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Visits:</span> ${visits.length}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Generated:</span> ${new Date().toLocaleDateString('en-IN')}
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time Out</th>
                            <th>Time In</th>
                            <th>Purpose</th>
                            <th>Distance (km)</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                
                <div class="summary">
                    <div class="summary-item">Total Distance: ${totalKm.toFixed(1)} km</div>
                    <div class="summary-item">Total Field Hours: ${totalHours.toFixed(1)} hrs</div>
                    <div class="summary-item">Average per Visit: ${(totalKm / visits.length).toFixed(1)} km</div>
                </div>
                
                <div class="signature-section">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>Branch Manager</p>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>Verified By</p>
                    </div>
                </div>
                
                <div class="footer">
                    This is a system-generated document from Tour Register PWA
                </div>
            </body>
            </html>
        `;
    }
    
    printPDF(html) {
        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        
        document.body.appendChild(iframe);
        
        // Write HTML to iframe
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        
        // Print after content loads
        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            
            // Remove iframe after printing
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        };
    }
    
    // ===================================
    // Helper Methods
    // ===================================
    async getVisitsForMonth(month) {
        const allVisits = await this.app.getAllVisits();
        return allVisits.filter(visit => visit.date.startsWith(month));
    }
}

// ===================================
// Attach Export Functions to App
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.app) {
            const exportManager = new ExportManager(window.app);
            
            // Override app export methods
            window.app.exportToExcel = () => exportManager.exportToExcel();
            window.app.exportToPDF = () => exportManager.exportToPDF();
        }
    }, 1000);
});
