// data.js - Data management and storage

let shopInfo = JSON.parse(localStorage.getItem('shopInfo')) || {};
let categories = JSON.parse(localStorage.getItem('categories')) || [];
let products = JSON.parse(localStorage.getItem('products')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let voidedTransactions = JSON.parse(localStorage.getItem('voidedTransactions')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let queue = JSON.parse(localStorage.getItem('queue')) || [];
let lastQueueNumber = parseInt(localStorage.getItem('lastQueueNumber')) || 0;

// Save functions
function saveShopInfo() {
        localStorage.setItem('shopInfo', JSON.stringify(shopInfo));
    }

function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }

function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

function saveSales() {
        localStorage.setItem('sales', JSON.stringify(sales));
    }

function saveVoidedTransactions() {
        localStorage.setItem('voidedTransactions', JSON.stringify(voidedTransactions));
    }

function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

// Product management
function getProductsByCategory(categoryId) {
        return products.filter(product => product.categoryId == categoryId);
    }

function getCategoryById(categoryId) {
        return categories.find(cat => cat.id == categoryId);
    }

function addProduct(product) {
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...product,
            price: parseFloat(product.price),
            stock: parseInt(product.stock),
            sizeStocks: product.sizeStocks || {}, 
            sizePrices: product.sizePrices || {}   
        };
        products.push(newProduct);
        saveProducts();
        return newProduct;
    }

function updateProduct(id, updatedProduct) {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
            saveProducts();
            return products[index];
        }
        return null;
    }

function deleteProduct(id) {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products.splice(index, 1);
            saveProducts();
            return true;
        }
        return false;
    }

// Category management
function addCategory(category) {
        const newCategory = {
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            name: category.name,
            icon: category.icon || '📦',
            color: category.color,
            sizeOptions: category.sizeOptions || []  
        };
        categories.push(newCategory);
        saveCategories();
        return newCategory;
    }

function updateCategory(id, updatedCategory) {
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = { ...categories[index], ...updatedCategory };
            saveCategories();
            return categories[index];
        }
        return null;
    }

function deleteCategory(id) {
        const productsInCategory = products.filter(p => p.id === id);
        if (productsInCategory.length > 0) {
            throw new Error('Cannot delete category with existing products');
        }
        
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories.splice(index, 1);
            saveCategories();
            return true;
        }
        return false;
    }

// Sales management
function addSale(saleData) {
        try {
            console.log('addSale called with:', saleData);
            
            if (!saleData || !saleData.items || saleData.items.length === 0) {
                console.error('Invalid sale data');
                return null;
            }
            let lastSaleNumber = parseInt(localStorage.getItem('lastSaleNumber')) || 0;
            lastSaleNumber++;
            localStorage.setItem('lastSaleNumber', lastSaleNumber.toString());
            
            const saleId = lastSaleNumber.toString().padStart(6, '0');
            
            const sale = {
                id: saleId,
                timestamp: new Date().toISOString(),
                items: saleData.items,
                subtotal: saleData.subtotal || 0,
                discount: saleData.discount || 0,
                discountType: saleData.discountType || 'none',
                total: saleData.total || 0,
                paymentMethod: saleData.paymentMethod || 'cash',
                paymentAmounts: saleData.paymentAmounts || { cash: 0, gcash: 0 },
                change: saleData.change || 0,
                notes: saleData.notes || '' // NEW: Make sure Notes is included
            };
            
            console.log('Created sale object:', sale);
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    if (item.size && product.sizeStocks && product.sizeStocks[item.size] !== undefined) {
                        console.log(`Updating ${item.size} stock for ${product.name}: ${product.sizeStocks[item.size]} - ${item.quantity}`);
                        product.sizeStocks[item.size] = Math.max(0, product.sizeStocks[item.size] - item.quantity);
                        console.log(`New ${item.size} stock: ${product.sizeStocks[item.size]}`);
                        product.stock = Object.values(product.sizeStocks).reduce((sum, stock) => sum + stock, 0);
                    } else {
                        console.log(`Updating stock for ${product.name}: ${product.stock} - ${item.quantity}`);
                        product.stock = Math.max(0, product.stock - item.quantity);
                        console.log(`New stock: ${product.stock}`);
                    }
                }
            });
            
            sales.push(sale);
            localStorage.setItem('sales', JSON.stringify(sales));
            localStorage.setItem('products', JSON.stringify(products));
            
            console.log('Sale processed successfully');
            return sale;
            
        } catch (error) {
            console.error('Error in addSale:', error);
            return null;
        }
    }

function getSalesByCategoryAndDate(categoryId, date) {
        const selectedDate = new Date(date);
        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        return sales.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            if (saleDate < selectedDate || saleDate >= nextDate) return false;
            
            return sale.items.some(item => {
                const product = products.find(p => p.id === item.productId);
                return product && product.categoryId == categoryId;
            });
        });
    }

function getSalesReport(categoryId = null, date = null) {
        let filteredSales = sales;
        
        if (date) {
            const selectedDate = new Date(date);
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            
            filteredSales = sales.filter(sale => {
                const saleDate = new Date(sale.timestamp);
                return saleDate >= selectedDate && saleDate < nextDate;
            });
        }
        
        if (categoryId) {
            filteredSales = filteredSales.filter(sale => {
                return sale.items.some(item => {
                    const product = products.find(p => p.id === item.productId);
                    return product && product.categoryId == categoryId;
                });
            });
        }
        
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const itemsSold = filteredSales.reduce((sum, sale) => 
            sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        const transactions = filteredSales.length;
        
        const categorySales = {};
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    categorySales[product.categoryId] = true;
                }
            });
        });
        const categoriesCount = Object.keys(categorySales).length;
        
        const paymentMethods = {};
        filteredSales.forEach(sale => {
            paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
        });
        
        return {
            totalSales,
            itemsSold,
            transactions,
            categoriesCount,
            paymentMethods,
            sales: filteredSales
        };
    }

// Void transaction
function voidTransaction(saleId) {
        const saleIndex = sales.findIndex(s => s.id === saleId);
        if (saleIndex !== -1) {
            const voidedSale = sales[saleIndex];
            voidedSale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    product.stock += item.quantity;
                }
            });
            voidedTransactions.push({
                ...voidedSale,
                voidedAt: new Date().toISOString()
            });
            sales.splice(saleIndex, 1);
            
            saveSales();
            saveVoidedTransactions();
            saveProducts();
            
            return true;
        }
        return false;
    }

// Update shop info
function updateShopInfo(newInfo) {
        shopInfo = { ...shopInfo, ...newInfo };
        saveShopInfo();
    }

// User management(DATABASE ONLY)
function loginUser(email, password) {
        console.log('loginUser called with:', email);
        if (!users || users.length === 0) {
            console.log('No users found, creating default user');
            users = [
                { id: 1, email: "admin", password: "admins123", name: "Admin" }
            ];
            saveUsers();
        }
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            console.log('User found:', user.name);
            return true;
        } else {
            console.log('Login failed');
            return false;
        }
    }

function isLoggedIn() {
        return true;
    }

function addUser(user) {
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            ...user
        };
        users.push(newUser);
        saveUsers();
        return newUser;
    }

// DELETE ALL DATA FUNCTION - SUPER NUCLEAR
function eraseAllData() {
        if (confirm('🚨 DELETE ABSOLUTELY EVERYTHING? 🚨\n\nThis will WIPE OUT ALL DATA!\n\n⚠️ THIS CANNOT BE UNDONE!')) {
            
            try {
                localStorage.clear();
                sessionStorage.clear();
                shopInfo = {};
                categories = [];
                products = [];
                sales = [];
                voidedTransactions = [];
                users = [];
                
                alert('✅ NUCLEAR DELETE COMPLETE! All data erased!');
                setTimeout(() => {
                    window.location.href = window.location.pathname;
                }, 1000);
                
            } catch (error) {
                console.error('Error deleting data:', error);
                alert('❌ Error: ' + error.message);
            }
        }
    }

// Notification System
function showNotification(title, message, type = 'info', duration = 3000) {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }, duration);
        }
    }

// Add queue management functions
function addToQueue(saleData) {
    lastQueueNumber++;
    localStorage.setItem('lastQueueNumber', lastQueueNumber.toString());
    
    const queueItem = {
        queueNumber: lastQueueNumber,
        receiptNumber: saleData.id,
        timestamp: new Date().toISOString(),
        items: saleData.items,
        total: saleData.total,
        notes: saleData.notes || '', // FIX: Include notes field in queue data
        status: 'preparing' 
    };
    
    queue.push(queueItem);
    localStorage.setItem('queue', JSON.stringify(queue));
    return queueItem;
}

function completeQueueItem(queueNumber) {
    const item = queue.find(q => q.queueNumber === queueNumber);
    if (item) {
        item.status = 'done';
        item.completedAt = new Date().toISOString();
        localStorage.setItem('queue', JSON.stringify(queue));
        return true;
    }
    return false;
}

function getActiveQueue() {
    return queue.filter(item => item.status === 'preparing');
}

function saveQueue() {
    localStorage.setItem('queue', JSON.stringify(queue));
}
function checkAndResetQueue() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastQueueReset');
    
    if (lastReset !== today) {
        queue = [];
        lastQueueNumber = 0;
        localStorage.setItem('queue', JSON.stringify(queue));
        localStorage.setItem('lastQueueNumber', lastQueueNumber.toString());
        localStorage.setItem('lastQueueReset', today);
        console.log('Queue reset for new day:', today);
    }
}
checkAndResetQueue();