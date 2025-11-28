// purchase-history.js - Final Complete Version

let currentCategoryFilter = 'all';
let currentDate = new Date().toISOString().split('T')[0];
let currentReceiptContent = ''; 
let pendingVoidId = null;
let confirmCallback = null;

// Initialize
function initPurchaseHistory() {
        autoCleanOldData();
        const shop = JSON.parse(localStorage.getItem('shopInfo')) || {};
        
        if (shop.logo) {
            const logoImg = document.querySelector('.logo-img');
            if (logoImg) logoImg.src = shop.logo;
        }
        
        if (shop.name) {
            const logoText = document.querySelector('.logo-text');
            if (logoText) logoText.textContent = shop.name + " History";
        }

        loadCategoryFilters();
        document.getElementById('reportDate').value = currentDate;
        loadSalesReport();
    }

// Dropdown Filter Logic
function loadCategoryFilters() {
        const categoryFilters = document.getElementById('categoryFilters');
        categoryFilters.innerHTML = ''; 
        
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'category-dropdown';

        let currentLabel = 'All Categories';
        let currentIcon = '📦';

        if (currentCategoryFilter !== 'all') {
            const activeCategory = categories.find(c => c.id.toString() === currentCategoryFilter);
            if (activeCategory) {
                currentLabel = activeCategory.name;
                currentIcon = activeCategory.icon || '📦';
            }
        }

        const dropdownBtn = document.createElement('button');
        dropdownBtn.className = 'dropdown-btn';
        dropdownBtn.innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><span>${currentIcon}</span> <span>${currentLabel}</span></div>`;
        
        dropdownBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('historyDropdown').classList.toggle('show');
        };

        const dropdownContent = document.createElement('div');
        dropdownContent.id = 'historyDropdown';
        dropdownContent.className = 'dropdown-content';

        const allOption = document.createElement('div');
        allOption.className = `dropdown-item ${currentCategoryFilter === 'all' ? 'active' : ''}`;
        allOption.innerHTML = '<span>📦</span> <span>All Categories</span>';
        allOption.onclick = () => { filterByCategory('all'); };
        dropdownContent.appendChild(allOption);

        categories.forEach(category => {
            const item = document.createElement('div');
            item.className = `dropdown-item ${currentCategoryFilter === category.id.toString() ? 'active' : ''}`;
            item.innerHTML = `<span>${category.icon || '🔹'}</span><span>${category.name}</span>`;
            item.onclick = () => { filterByCategory(category.id.toString()); };
            dropdownContent.appendChild(item);
        });

        dropdownContainer.appendChild(dropdownBtn);
        dropdownContainer.appendChild(dropdownContent);
        categoryFilters.appendChild(dropdownContainer);
    }

function filterByCategory(categoryId) {
        currentCategoryFilter = categoryId;
        loadCategoryFilters();
        loadSalesReport();
    }
function loadSalesReport() {
        const date = document.getElementById('reportDate').value || currentDate;
        currentDate = date;
        const elementsToAnimate = [
            document.querySelector('.analytics-grid'),
            document.querySelector('.history-details'),
            document.querySelector('.payment-methods-grid')
        ];

        elementsToAnimate.forEach(element => {
            if (element) {
                element.classList.remove('animate-enter');
                void element.offsetWidth; 
                element.classList.add('animate-enter');
            }
        });
        
        const report = getSalesReport(
            currentCategoryFilter === 'all' ? null : parseInt(currentCategoryFilter),
            date
        );
        
        document.getElementById('totalSales').textContent = `₱${report.totalSales.toFixed(2)}`;
        document.getElementById('itemsSold').textContent = report.itemsSold;
        document.getElementById('transactionsCount').textContent = report.transactions;
        document.getElementById('categoriesCount').textContent = report.categoriesCount;
        document.getElementById('cashTotal').textContent = `₱${(report.paymentMethods.cash || 0).toFixed(2)}`;
        document.getElementById('gcashTotal').textContent = `₱${(report.paymentMethods.gcash || 0).toFixed(2)}`;
        
        loadSalesHistory(report.sales);
    }

// Load Table
function loadSalesHistory(salesData) {
        const salesHistory = document.getElementById('salesHistory');
        salesHistory.innerHTML = '';
        
        if (salesData.length === 0) {
            salesHistory.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary);">No sales found for the selected criteria.</td></tr>`;
            return;
        }
        
        salesData.forEach(sale => {
            const row = document.createElement('tr');
            const saleDate = new Date(sale.timestamp);
            const timeString = saleDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
            
            const itemsString = sale.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                // FIX: Use <br> tags to separate items within the cell, but only in this cell.
                return product ? `${item.quantity}x ${product.name} (${item.size || 'N/A'})` : 'Unknown Product';
            }).join('<br>'); 
            
            // FIX: Tamang 5 columns (TDs) na may tamang data alignment.
            row.innerHTML = `
                <td>${timeString}</td> 
                <td>${itemsString}</td> 
                <td>₱${sale.total.toFixed(2)}</td>
                <td><span class="payment-method-badge payment-${sale.paymentMethod}">${sale.paymentMethod.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="handleReceiptClick('${sale.id}')">Receipt</button>
                    <button class="btn btn-danger btn-sm" onclick="handleVoidClick('${sale.id}')">Void</button>
                </td>
            `;
            salesHistory.appendChild(row);
        });
    }
function handleReceiptClick(saleId) {
        const sale = sales.find(s => s.id == saleId);
        if (sale) {
            const receiptHTML = generateReceiptHTML(sale);
            currentReceiptContent = receiptHTML;
            document.getElementById('receiptModalContent').innerHTML = receiptHTML;
            document.getElementById('receiptModal').style.display = 'flex';
        }
    }

function closeReceiptModal() { document.getElementById('receiptModal').style.display = 'none'; }

// REMOVED THE OLD RECEIPT MODAL HERE BAS

function handleVoidClick(saleId) {
        pendingVoidId = saleId; 
        if (document.getElementById('customConfirmModal')) {
            showConfirmModal(
                'Void Transaction?', 
                'This will return items to stock and remove this sale record. This action cannot be undone.', 
                function() { openSecurityModal(); }
            );
        } else {
            if(confirm('Void Transaction?')) openSecurityModal();
        }
    }

function openSecurityModal() {
        document.getElementById('secEmail').value = '';
        document.getElementById('secPass').value = '';
        document.getElementById('securityModal').style.display = 'flex';
    }

function closeSecurityModal() {
        document.getElementById('securityModal').style.display = 'none';
    }

function handleVoidSecurityCheck(event) {
        event.preventDefault();
        
        const email = document.getElementById('secEmail').value;
        const password = document.getElementById('secPass').value;
        
        let isAuthorized = false;
        if (email === "ksweets" && password === "sweetadmins123") {
            isAuthorized = true;
        } else {
            const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
            const userFound = storedUsers.find(u => u.email === email && u.password === password);
            if (userFound) isAuthorized = true;
        }

        if (isAuthorized) {
            closeSecurityModal();
            
            try {
                let currentSales = JSON.parse(localStorage.getItem('sales')) || [];
                let currentProducts = JSON.parse(localStorage.getItem('products')) || [];
                let currentVoided = JSON.parse(localStorage.getItem('voidedTransactions')) || [];

                const saleIndex = currentSales.findIndex(s => s.id == pendingVoidId);
                
                if (saleIndex !== -1) {
                    const voidedSale = currentSales[saleIndex];
                    voidedSale.items.forEach(item => {
                        const product = currentProducts.find(p => p.id === item.productId);
                        if (product) {
                            if (item.size && product.sizeStocks) {
                                const currentSizeStock = parseInt(product.sizeStocks[item.size] || 0);
                                product.sizeStocks[item.size] = currentSizeStock + parseInt(item.quantity);
                                product.stock = Object.values(product.sizeStocks).reduce((a, b) => parseInt(a) + parseInt(b), 0);
                            } else {
                                product.stock = parseInt(product.stock) + parseInt(item.quantity);
                            }
                        }
                    });
                    currentVoided.push({ ...voidedSale, voidedAt: new Date().toISOString() });
                    currentSales.splice(saleIndex, 1);
                    localStorage.setItem('sales', JSON.stringify(currentSales));
                    localStorage.setItem('products', JSON.stringify(currentProducts));
                    localStorage.setItem('voidedTransactions', JSON.stringify(currentVoided));
                    sales = currentSales;
                    products = currentProducts;
                    voidedTransactions = currentVoided;
                    
                    loadSalesReport(); 
                    showNotification('Success', 'Transaction voided successfully!', 'success');
                    pendingVoidId = null;
                    
                } else {
                    showErrorAlert('Error', 'Transaction ID not found: ' + pendingVoidId);
                }
            } catch (err) {
                console.error(err);
                showErrorAlert('Critical Error', err.message);
            }
        } else {
            showErrorAlert('Access Denied!', 'Wrong email or password.');
        }
    }

//generateReceipt
function generateReceiptHTML(sale) {
        const shop = JSON.parse(localStorage.getItem('shopInfo')) || {};
        const shopName = shop.name || ""; 
        const shopAddress = shop.address || ""; 
        const shopFooter = shop.receiptFooter || ""; 
        
        const saleDate = new Date(sale.timestamp);

        let paidAmount = 0;
        let paymentHTML = '';
        
        if (sale.paymentMethod === 'multi' && sale.paymentAmounts) {
            const cash = sale.paymentAmounts.cash || 0;
            const gcash = sale.paymentAmounts.gcash || 0;
            paidAmount = cash + gcash;
            
            paymentHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span>Cash:</span> <span>₱${cash.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span>GCash:</span> <span>₱${gcash.toFixed(2)}</span>
                </div>
            `;
        } else {
            if (sale.paymentAmounts) {
                paidAmount = sale.paymentMethod === 'cash' ? sale.paymentAmounts.cash : sale.paymentAmounts.gcash;
            } else {
                paidAmount = sale.total; 
            }
            paidAmount = Number(paidAmount) || sale.total;

            paymentHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span>${sale.paymentMethod.toUpperCase()} Paid:</span> 
                    <span>₱${paidAmount.toFixed(2)}</span>
                </div>
            `;
        }

        const realChange = Math.max(0, paidAmount - sale.total);

        return `
            <div style="font-family: 'Courier New', monospace; font-size: 13px; color: #000; padding: 10px; background: white;">
                <div style="text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${shopName}</h3>
                    <p style="margin: 2px 0; font-size: 11px; color: #555;">${shopAddress}</p>
                    <p style="margin: 5px 0 0 0; font-size: 11px;">${saleDate.toLocaleString('en-PH')}</p>
                    <p style="margin: 0; font-size: 11px;">Ref: #${sale.id}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    ${sale.items.map(item => {
                        const pName = products.find(p => p.id == item.productId)?.name || "Item";
                        const pDetails = item.size ? `(${item.size})` : "";
                        return `<tr><td style="padding: 2px 0; vertical-align: top;">${item.quantity}x</td><td style="padding: 2px 5px; vertical-align: top;">${pName} <span style="font-size:10px; color:#666">${pDetails}</span></td><td style="padding: 2px 0; text-align: right; vertical-align: top;">₱${(item.price * item.quantity).toFixed(2)}</td></tr>`;
                    }).join('')}
                </table>
                
                <div style="border-top: 1px dashed #ccc; padding-top: 5px; margin-top: 5px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px;"><span>Subtotal:</span> <span>₱${(sale.subtotal || sale.total).toFixed(2)}</span></div>
                    ${sale.discount > 0 ? `<div style="display: flex; justify-content: space-between; font-size: 11px; color: red;"><span>Discount (${sale.discountType || 'Promo'}):</span> <span>-₱${sale.discount.toFixed(2)}</span></div>` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 5px 0;"><span>TOTAL</span><span>₱${sale.total.toFixed(2)}</span></div>
                    ${paymentHTML}
                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px; font-weight: bold;"><span>Change:</span><span>₱${realChange.toFixed(2)}</span></div>
                </div>
                <div style="text-align: center; margin-top: 15px; font-size: 11px; color: #555;"><p>${shopFooter}</p></div>
            </div>
        `;
    }

//downloadReports
function downloadReports() {
    const date = document.getElementById('reportDate').value || currentDate;
    const isFiltered = currentCategoryFilter !== 'all';
    const report = getSalesReport(
        currentCategoryFilter === 'all' ? null : parseInt(currentCategoryFilter),
        date
    );
    const historyTable = generateHistoryTable(report.sales);
    const voidedData = getVoidedTransactionsByDate(date); 
    const voidedTable = generateVoidedTable(voidedData);
    const shop = JSON.parse(localStorage.getItem('shopInfo')) || {};
    const shopName = shop.name || "Sales Report"; 
    const filterDisplay = isFiltered ? categories.find(c => c.id.toString() === currentCategoryFilter)?.name : 'All Categories';
    
    const finalReportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${shopName} Report (${date})</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 10pt; }
                h2, h3 { text-align: center; margin-bottom: 5px; }
                .report-info { text-align: center; margin-bottom: 20px; font-size: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .section-title { font-size: 14pt; margin-top: 20px; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
            </style>
        </head>
        <body>
            <h2>${shopName} Sales Report</h2>
            <div class="report-info">
                Date: ${date} | Category Filter: ${filterDisplay || 'N/A'}
            </div>

            <div class="section-title">Table 1. Purchase History</div>
            ${historyTable}

            <div class="section-title">Table 2. Voided Transactions</div>
            ${voidedTable}
            
            <p style="font-size: 8pt; text-align: center; margin-top: 50px;">
                --- End of Report ---
            </p>
        </body>
        </html>
    `;
    const blob = new Blob([finalReportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shopName.replace(/\s/g, '_')}_Report_${date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Download Started', `Report for ${date} downloaded as HTML file.`, 'success', 2000);
}

//History
function generateHistoryTable(salesData) {
    if (salesData.length === 0) {
        return '<p style="text-align: center;">No sales history found for this period/filter.</p>';
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>TIME</th>
                    <th>DATE</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>PAYMENT</th>
                    <th>TYPE OF DISCOUNT (N/A IF NOT)</th>
                </tr>
            </thead>
            <tbody>
    `;

    salesData.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        const dateString = saleDate.toLocaleDateString('en-PH');
        const timeString = saleDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        
        const itemsString = sale.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            // Use <br> tag for clearer line breaks in downloaded report
            return `${item.quantity}x ${product ? product.name : 'Unknown Product'} (${item.size || 'N/A'})`;
        }).join('<br>'); 
        const discountType = sale.discount > 0 ? sale.discountType.toUpperCase() : 'N/A';

        tableHTML += `
            <tr>
                <td>${timeString}</td>
                <td>${dateString}</td>
                <td>${itemsString}</td>
                <td>₱${sale.total.toFixed(2)}</td>
                <td>${sale.paymentMethod.toUpperCase()}</td>
                <td>${discountType}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    return tableHTML;
}

//GenerateVoid
function generateVoidedTable(voidedData) {
    if (voidedData.length === 0) {
        return '<p style="text-align: center;">No voided transactions found for this period.</p>';
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>TIME</th>
                    <th>DATE</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>PAYMENT</th>
                    <th>TIME OF BEING VOIDED</th>
                </tr>
            </thead>
            <tbody>
    `;

    voidedData.forEach(transaction => {
        const saleDate = new Date(transaction.timestamp);
        const voidDate = new Date(transaction.voidedAt);
        const dateString = saleDate.toLocaleDateString('en-PH');
        const timeString = saleDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        const voidTimeString = voidDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

        const itemsString = transaction.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return `${item.quantity}x ${product ? product.name : 'Unknown Product'} (${item.size || 'N/A'})`;
        }).join('<br>');

        tableHTML += `
            <tr>
                <td>${timeString}</td>
                <td>${dateString}</td>
                <td>${itemsString}</td>
                <td>₱${transaction.total.toFixed(2)}</td>
                <td>${transaction.paymentMethod.toUpperCase()}</td>
                <td>${voidTimeString}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    return tableHTML;
}

//Voided
function getVoidedTransactionsByDate(date) {
    const selectedDate = new Date(date);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return voidedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        return transactionDate >= selectedDate && transactionDate < nextDate;
    });
}

//HELPERS (Retained)
function showErrorAlert(title, message) { 
        const modal = document.getElementById('errorAlertModal');
        if(modal) {
            document.getElementById('errorAlertTitle').textContent = title; 
            document.getElementById('errorAlertMessage').textContent = message; 
            modal.style.display = 'flex'; 
        } else {
            alert(title + "\n" + message);
        }
    }
function closeErrorAlert() { document.getElementById('errorAlertModal').style.display = 'none'; }

function showConfirmModal(title, message, callback) { 
        const modal = document.getElementById('customConfirmModal');
        if(modal) {
            document.getElementById('confirmTitle').textContent = title; 
            document.getElementById('confirmMessage').textContent = message; 
            confirmCallback = callback; 
            modal.style.display = 'flex'; 
        } else {
            if(confirm(message)) callback();
        }
    }
function closeConfirmModal() { 
        document.getElementById('customConfirmModal').style.display = 'none'; 
        confirmCallback = null; 
    }
    const confirmBtn = document.getElementById('confirmActionBtn');
    if(confirmBtn) {
        confirmBtn.onclick = function() { 
            if (confirmCallback) { confirmCallback(); } 
            closeConfirmModal(); 
        };
    }

// Auto Clean
function autoCleanOldData() {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        sales = sales.filter(sale => new Date(sale.timestamp) >= threeDaysAgo);
        voidedTransactions = voidedTransactions.filter(t => new Date(t.timestamp) >= threeDaysAgo);
        saveSales(); saveVoidedTransactions();
    }

    window.onclick = function(event) {
        if (!event.target.matches('.dropdown-btn') && !event.target.closest('.dropdown-btn')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) { const openDropdown = dropdowns[i]; if (openDropdown.classList.contains('show')) openDropdown.classList.remove('show'); }
        }
    }

function closeVoidedModal() { document.getElementById('voidedModal').style.display = 'none'; }
function viewVoidedTransactions() {
        const voidedList = document.getElementById('voidedTransactionsList');
        voidedList.innerHTML = '';
        
        const date = document.getElementById('reportDate').value || currentDate;
        const voidedToday = getVoidedTransactionsByDate(date);

        if (voidedToday.length === 0) {
            voidedList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--secondary);">No voided transactions found.</div>';
        } else {
            voidedToday.forEach(transaction => {
                const voidedItem = document.createElement('div');
                voidedItem.className = 'transaction-item';
                voidedItem.style.cssText = "border:1px solid #eee;padding:10px;margin-bottom:10px;border-radius:8px;";
                const voidDate = new Date(transaction.voidedAt);
                voidedItem.innerHTML = `
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                        <div style="font-size:12px;color:#666;">Voided: ${voidDate.toLocaleString()}</div>
                        <span class="payment-method-badge payment-${transaction.paymentMethod}">${transaction.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div style="font-weight:bold;border-top:1px solid #eee;padding-top:5px;">Total: ₱${transaction.total.toFixed(2)}</div>
                `;
                voidedList.appendChild(voidedItem);
            });
        }
        document.getElementById('voidedModal').style.display = 'flex';
    }

// Start
document.addEventListener('DOMContentLoaded', initPurchaseHistory);