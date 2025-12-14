// purchase-history.js - Final Complete Version

let currentCategoryFilter = 'all';
let currentDate = new Date().toISOString().split('T')[0];
let currentReceiptContent = ''; 
let currentReceiptSaleData = null; // NEW: To hold the actual sale object for print
let pendingVoidId = null;
let pendingVoidType = null; // NEW: 'return_stock' or 'no_return'
let confirmCallback = null;

// ESC/POS Commands (Copied from pos.js for self-contained module)
const ESC = '\x1B';
const GS = '\x1D';
const INIT = `${ESC}@`;
const BOLD_ON = `${ESC}E\x01`;
const BOLD_OFF = `${ESC}E\x00`;
const CENTER = `${ESC}a\x01`;
const LEFT = `${ESC}a\x00`;
const CUT = `${GS}V\x00`;
const LINE_FEED = '\n';

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
            // FIX: Column count should be 5
            salesHistory.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary);">No sales found for the selected criteria.</td></tr>`;
            return;
        }
        
        salesData.forEach(sale => {
            const row = document.createElement('tr');
            const saleDate = new Date(sale.timestamp);
            const timeString = saleDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
            
            // FIX: Use <span> with display: block for vertical stacking of items within the Items column
            const itemsString = sale.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return product ? `<span style="display: block;">${item.quantity}x ${product.name} (${item.size || 'N/A'})</span>` : 'Unknown Product';
            }).join('');
            
            // FINAL FIX: Tamang 5 columns (TDs) ang output para mag-align sa header.
            // HEADERS: Time (1) | Items (2) | Total (3) | Payment (4) | Actions (5)
            row.innerHTML = `
                <td><span style="display: block; white-space: nowrap;">${timeString}</span></td> 
                <td>${itemsString}</td> 
                <td>₱${sale.total.toFixed(2)}</td>
                <td><span class="payment-method-badge payment-${sale.paymentMethod}">${sale.paymentMethod.toUpperCase()}</span></td>
                <td>
                    <div class="action-buttons-container">
                        <button class="btn btn-outline btn-sm" onclick="handleReceiptClick('${sale.id}')">Receipt</button>
                        <button class="btn btn-danger btn-sm" onclick="handleVoidClick('${sale.id}')">Void</button>
                    </div>
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
            currentReceiptSaleData = sale; // NEW: Store the sale data for print
            document.getElementById('receiptModalContent').innerHTML = receiptHTML;
            document.getElementById('receiptModal').style.display = 'flex';
        }
    }

function closeReceiptModal() { document.getElementById('receiptModal').style.display = 'none'; }

// NEW FUNCTION: Button handler for history receipt modal (Standard Print only)
function printReceiptFromModal() {
    // Falls back to standard print
    printReceiptStandardFromModal();
}

// NEW FUNCTION: Standard Print Fallback for History Modal
function printReceiptStandardFromModal() {
    if (!currentReceiptContent) {
        console.error('No receipt content to print.');
        return;
    }
    
    // Create print window and use the stored HTML content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Print Receipt</title>
                <style>
                    /* Use styles from pos.js printReceiptStandard for consistency */
                </style>
            </head>
            <body onload="window.print(); setTimeout(() => window.close(), 500);">
                <div class="container">${currentReceiptContent}</div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function handleVoidClick(saleId) {
        pendingVoidId = saleId; 
        
        // FIX 4: Update Confirmation Modal for two options
        document.getElementById('confirmTitle').textContent = 'Void Transaction?';
        document.getElementById('confirmMessage').textContent = 'Choose how to process this transaction. Stock status will be affected by your choice.';
        
        const confirmModal = document.getElementById('customConfirmModal');
        const confirmBtn = document.getElementById('confirmActionBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        // Set "Yes, Void It" (No Stock Return) logic
        confirmBtn.textContent = 'Void';
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.onclick = function() {
            pendingVoidType = 'no_return';
            closeConfirmModal();
            openSecurityModal();
        };

        // Set "Wrong Selected Item" (Return Stock) logic
        cancelBtn.textContent = 'Return';
        cancelBtn.className = 'btn btn-outline'; // Keep outline style
        cancelBtn.style.cssText = 'min-width: 100px; background: white; border-color: #3b82f6; color: #3b82f6;'; // Use primary color for clarity
        cancelBtn.onclick = function() {
            pendingVoidType = 'return_stock';
            closeConfirmModal();
            openSecurityModal();
        };
        
        confirmModal.style.display = 'flex';
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
        // Check hardcoded admin or local storage users
        if (email === "admin" && password === "admins123") {
            isAuthorized = true;
        } else {
            const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
            const userFound = storedUsers.find(u => u.email === email && u.password === password);
            if (userFound) isAuthorized = true;
        }

        if (isAuthorized) {
            closeSecurityModal();
            
            try {
                // Fetch latest data from local storage
                let currentSales = JSON.parse(localStorage.getItem('sales')) || [];
                let currentProducts = JSON.parse(localStorage.getItem('products')) || [];
                let currentVoided = JSON.parse(localStorage.getItem('voidedTransactions')) || [];

                const saleIndex = currentSales.findIndex(s => s.id == pendingVoidId);
                
                if (saleIndex !== -1) {
                    const voidedSale = currentSales[saleIndex];
                    
                    // FIX 2: Apply stock return logic based on pendingVoidType
                    if (pendingVoidType === 'return_stock') {
                        voidedSale.items.forEach(item => {
                            // Find the product in the live 'products' array to update stock correctly
                            const productToUpdate = currentProducts.find(p => p.id == item.productId);
                            
                            if (productToUpdate) {
                                if (item.size && productToUpdate.sizeStocks && productToUpdate.sizeStocks[item.size] !== undefined) {
                                    // Handle sized product stock return
                                    const currentSizeStock = Number(productToUpdate.sizeStocks[item.size] || 0); // Use Number() for safety
                                    productToUpdate.sizeStocks[item.size] = currentSizeStock + Number(item.quantity);
                                    // Recalculate total stock
                                    productToUpdate.stock = Object.values(productToUpdate.sizeStocks).reduce((a, b) => Number(a) + Number(b), 0);
                                } else {
                                    // Handle regular product stock return
                                    productToUpdate.stock = Number(productToUpdate.stock) + Number(item.quantity);
                                }
                            }
                        });
                        localStorage.setItem('products', JSON.stringify(currentProducts)); // Save updated products
                        products = currentProducts; // Update global products array
                    }
                    
                    // FIX 4: Store the correct receipt ID in the voided transaction
                    currentVoided.push({ 
                        ...voidedSale, 
                        id: voidedSale.id, 
                        receiptNumber: voidedSale.id, 
                        voidedAt: new Date().toISOString(), 
                        voidType: pendingVoidType 
                    });
                    
                    currentSales.splice(saleIndex, 1);
                    localStorage.setItem('sales', JSON.stringify(currentSales));
                    localStorage.setItem('voidedTransactions', JSON.stringify(currentVoided));
                    
                    sales = currentSales; // Update global sales array
                    voidedTransactions = currentVoided;
                    
                    loadSalesReport(); 
                    const returnStatus = pendingVoidType === 'return_stock' ? 'and stock returned' : 'but stock remained voided';
                    showNotification('Success', `Transaction #${pendingVoidId} voided ${returnStatus}!`, 'success');
                    
                    pendingVoidId = null;
                    pendingVoidType = null;
                    
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
        
        // Use inline styles to mimic 58mm thermal receipt design (same as POS.js receipt style)
        return `
            <div class="modern-receipt" style="width: 100%; max-width: 58mm; padding: 10px; box-sizing: border-box;">
                <div style="font-family: 'Courier New', monospace; font-size: 13px; color: #000;">
                    <div style="text-align: center; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 5px;">
                        <h3 style="margin: 0; font-size: 14px; font-weight: bold; line-height: 1.1;">${shopName}</h3>
                        <p style="margin: 2px 0; font-size: 11px; color: #555;">${shopAddress}</p>
                        <p style="margin: 5px 0 0 0; font-size: 11px;">${saleDate.toLocaleString('en-PH')}</p>
                        <p style="margin: 0; font-size: 11px;">Ref: #${sale.id}</p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
                        ${sale.items.map(item => {
                            const pName = products.find(p => p.id === item.productId);
                            if (pName) {
                                const displayName = item.size ? `${pName.name} (${item.size})` : pName.name;
                                return `<tr><td style="padding: 2px 0; vertical-align: top; font-size: 12px;">${item.quantity}x</td><td style="padding: 2px 5px; vertical-align: top; font-size: 12px; font-weight: bold;">${displayName}</td><td style="padding: 2px 0; text-align: right; vertical-align: top; font-size: 12px;">₱${(item.price * item.quantity).toFixed(2)}</td></tr>`;
                            }
                            return '';
                        }).join('')}
                    </table>
                    
                    <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px;"><span>Subtotal:</span> <span>₱${(sale.subtotal || sale.total).toFixed(2)}</span></div>
                        ${sale.discount > 0 ? `<div style="display: flex; justify-content: space-between; font-size: 12px; color: red;"><span>Discount (${sale.discountType.toUpperCase()}):</span> <span>-₱${sale.discount.toFixed(2)}</span></div>` : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 5px 0; border-top: 2px solid #000; padding-top: 5px;"><span>TOTAL</span><span>₱${sale.total.toFixed(2)}</span></div>
                        ${paymentHTML}
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px; font-weight: bold;"><span>Change:</span><span>₱${realChange.toFixed(2)}</span></div>
                    </div>
                    ${sale.notes && sale.notes.trim() ? `<div style="margin-top: 10px; padding: 5px; border-top: 1px dashed #ccc; color: red; font-size: 12px;">NOTES: ${sale.notes}</div>` : ''}
                    <div style="text-align: center; margin-top: 15px; font-size: 11px; color: #555;"><p>${shopFooter}</p></div>
                </div>
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
    
    // FIX 4: Hiwalayin ang voided data para sa download
    const returnedItems = voidedData.filter(t => t.voidType === 'return_stock');
    const voidedNoReturn = voidedData.filter(t => t.voidType === 'no_return');

    // Generate HTML content for both tables
    const voidedReturnedTable = generateVoidedTableHTML(returnedItems, true, true);
    const voidedNoReturnTable = generateVoidedTableHTML(voidedNoReturn, false, true);

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
                .void-section-title { font-size: 12pt; margin-top: 15px; margin-bottom: 5px; }
                .void-table th { background-color: #fce2e2; }
                .returned-table th { background-color: #dcfce7; }
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
            
            <h3 class="void-section-title returned-table">Stock Returned</h3>
            ${voidedReturnedTable || '<p style="margin-left: 20px;">No transactions found in this category.</p>'}

            <h3 class="void-section-title void-table">Voided Stock</h3>
            ${voidedNoReturnTable || '<p style="margin-left: 20px;">No transactions found in this category.</p>'}
            
            <p style="font-size: 8pt; text-align: center; margin-top: 50px;">
                --- End of Report ---
            </p>
        </body>
        </html>
    `;
    
    // --- CONVERT TO PDF LOGIC ---
    // Create a temporary element to host the content for PDF conversion
    const element = document.createElement('div');
    element.innerHTML = finalReportHTML; 

    // Configuration for PDF conversion
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5], // Top, Left, Bottom, Right margin in inches
        filename: `${shopName.replace(/\s/g, '_')}_Report_${date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: false, dpi: 192, letterRendering: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Call html2pdf to convert and download
    // Assuming html2pdf is globally available from the CDN link in HTML
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
        showNotification('Download Started', `Report for ${date} downloaded as PDF file.`, 2000);
    } else {
         showErrorAlert('Download Error', 'html2pdf library not loaded. Please check internet connection.');
    }
}

//History
function generateHistoryTable(salesData) {
// ... (No change here)
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

//GenerateVoid - REMOVED

//Voided
function getVoidedTransactionsByDate(date) {
// ... (No change here)
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
// ... (No change here)
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
// ... (No change here)
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
// ... (No change here)
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

// FIX 2 & 3: Updated logic to show two separate lists in modal
function viewVoidedTransactions() {
    const voidedListContainer = document.getElementById('voidedTransactionsList');
    const date = document.getElementById('reportDate').value || currentDate;
    const voidedToday = getVoidedTransactionsByDate(date);

    voidedListContainer.innerHTML = '';
    
    if (voidedToday.length === 0) {
        voidedListContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--secondary);">No voided transactions found for this date.</div>';
    } else {
        const returnedItems = voidedToday.filter(t => t.voidType === 'return_stock');
        const voidedNoReturn = voidedToday.filter(t => t.voidType === 'no_return');

        let allVoidedHTML = '';

        // Generate list for Returned Stock (UI from old request)
        allVoidedHTML += '<h3 style="margin: 20px 0 10px 0; padding-left: 10px; color: var(--success);">Items Returned to Stock (Return Option)</h3>';
        if (returnedItems.length > 0) {
            returnedItems.forEach(transaction => {
                const voidDate = new Date(transaction.voidedAt);
                const itemsString = transaction.items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return `(${item.quantity}x) ${product ? product.name : 'Unknown'}`;
                }).join(', ');
                
                allVoidedHTML += `
                    <div class="transaction-item" style="border: 1px solid var(--success); background: var(--light); margin-bottom: 10px; padding: 10px; border-radius: 6px;">
                        <div style="font-weight: bold; font-size: 14px; display: flex; justify-content: space-between;">
                            <span>#${transaction.id}</span> <span>₱${transaction.total.toFixed(2)}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--secondary); margin-bottom: 5px;">
                            Items: ${itemsString}
                        </div>
                        <div style="font-size: 10px; color: var(--success);">
                            VOIDED: ${voidDate.toLocaleTimeString()} (RETURNED)
                        </div>
                    </div>
                `;
            });
        } else {
            allVoidedHTML += '<p style="margin-left: 10px; color: var(--secondary);">No transactions returned stock today.</p>';
        }


        // Generate list for Voided Stock (No Return) (UI from old request)
        allVoidedHTML += '<h3 style="margin: 30px 0 10px 0; padding-left: 10px; color: var(--danger);">Items Voided (Void Option - No Stock Return)</h3>';
        if (voidedNoReturn.length > 0) {
            voidedNoReturn.forEach(transaction => {
                const voidDate = new Date(transaction.voidedAt);
                const itemsString = transaction.items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return `(${item.quantity}x) ${product ? product.name : 'Unknown'}`;
                }).join(', ');

                allVoidedHTML += `
                    <div class="transaction-item" style="border: 1px solid var(--danger); background: var(--light); margin-bottom: 10px; padding: 10px; border-radius: 6px;">
                        <div style="font-weight: bold; font-size: 14px; display: flex; justify-content: space-between;">
                            <span>#${transaction.id}</span> <span>₱${transaction.total.toFixed(2)}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--secondary); margin-bottom: 5px;">
                            Items: ${itemsString}
                        </div>
                        <div style="font-size: 10px; color: var(--danger);">
                            VOIDED: ${voidDate.toLocaleTimeString()} (NO RETURN)
                        </div>
                    </div>
                `;
            });
        } else {
            allVoidedHTML += '<p style="margin-left: 10px; color: var(--secondary);">No transactions voided stock today.</p>';
        }
        
        voidedListContainer.innerHTML = allVoidedHTML;
    }
    document.getElementById('voidedModal').style.display = 'flex';
}

// FIX 3: NEW HELPER: Generates the actual table HTML for voided data (used by Modal and Download)
function generateVoidedTableHTML(data, isReturned, forDownload = false) {
    if (data.length === 0) return '';
    
    const timeHeader = forDownload ? 'TIME VOIDED' : 'VOID TIME';
    
    let tableHTML = `
        <div class="inventory-table" style="box-shadow: none;">
        <table class="table" style="min-width: 700px; font-size: 12px; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: ${isReturned ? '#dcfce7' : '#fee2e2'};">
                    <th>RECEIPT #</th>
                    <th>TIME OF SALE</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>${timeHeader}</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(transaction => {
        const saleDate = new Date(transaction.timestamp);
        const voidDate = new Date(transaction.voidedAt);
        const saleTime = saleDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        const voidTime = voidDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        
        const itemsString = transaction.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            // Use <br> tag for download, or <span> for modal
            const separator = forDownload ? '<br>' : '<span style="display: block;">';
            const closing = forDownload ? '' : '</span>';
            return `${item.quantity}x ${product ? product.name : 'Unknown'} (${item.size || 'N/A'})`;
        }).join(forDownload ? '<br>' : '<span style="display: block;">');

        tableHTML += `
            <tr>
                <td>#${transaction.id}</td> <td>${saleTime}</td>
                <td>${itemsString}</td>
                <td>₱${transaction.total.toFixed(2)}</td>
                <td>${voidTime}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        </div>
    `;
    return tableHTML;
}

// Start
document.addEventListener('DOMContentLoaded', initPurchaseHistory);