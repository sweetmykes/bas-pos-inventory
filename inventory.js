// inventory.js - POS page functionality

let selectedCategoryForHistory = null;
let selectedDateForHistory = null;
let selectedIcon = '☕';
let selectedColor = 'blue';
let tempLogoBase64 = null;
let pendingEdit = { productId: null, sizeName: null, currentStock: 0 };

// IDAGDAG ITO:
let pendingErase = false;

function initInventory() {
    if (shopInfo.logo) {
        const logoImg = document.querySelector('.logo-img');
        if (logoImg) logoImg.src = shopInfo.logo;
    }
    if (shopInfo.name) {
        const logoText = document.querySelector('.logo-text');
        if (logoText) logoText.textContent = shopInfo.name + " Inventory";
    }

    // 2. Load the rest
    loadCategoriesGrid();
    loadProductsTable();
    loadCategoryDropdown();
    autoCleanOldData();
}


// Category Modal Functions
function openCategoryModal() {
    document.getElementById('categoryModal').style.display = 'flex';
    loadCategoryIcons();
    loadColorsGrid();
    document.getElementById('categoryModalTitle').textContent = 'Add Category';
    document.getElementById('categoryName').value = '';
    resetSizeFields();
    
    selectedIcon = '☕';
    selectedColor = 'blue';
    document.getElementById('sizeOptionsSection').style.display = 'none';
    
    setTimeout(() => {
        const firstIcon = document.querySelector('.icon-btn');
        const firstColor = document.querySelector('.color-option');
        if (firstIcon) firstIcon.classList.add('selected');
        if (firstColor) firstColor.classList.add('selected');
    }, 100);
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

function loadCategoryIcons() {
    const iconsGrid = document.getElementById('categoryIcons');
    const icons = ['☕', '🍰', '🥤', '🍩', '🍪', '🍫', '🍦', '🧁', '🎂', '🍚', '🧃', '🍵'];
    
    iconsGrid.innerHTML = '';
    icons.forEach(icon => {
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'icon-btn';
        iconBtn.innerHTML = icon;
        iconBtn.onclick = function() {
            selectIcon(icon);
        };
        iconsGrid.appendChild(iconBtn);
    });
}

function loadColorsGrid() {
    const colorsGrid = document.getElementById('colorsGrid');
    
    const colors = [
        { name: 'blue', value: 'blue', display: 'Blue (Drinks)' },
        { name: 'pink', value: 'pink', display: 'Pink (Foods)' },
        { name: 'purple', value: 'purple', display: 'Purple (Others)' }
    ];
    
    colorsGrid.innerHTML = '';
    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.innerHTML = `
            <div class="color-preview ${color.value}"></div>
            <span>${color.display}</span>
        `;
        colorOption.onclick = () => {
            selectColor(color.value, colorOption);
        };
        colorsGrid.appendChild(colorOption);
    });
}

function selectIcon(icon) {
    selectedIcon = icon;
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function selectColor(color, element) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    
    const sizeSection = document.getElementById('sizeOptionsSection');
    if (color === 'blue') {
        sizeSection.style.display = 'block';
    } else {
        sizeSection.style.display = 'none';
        resetSizeFields();
    }
}

// Size management variables
let sizeCounter = 3;

function resetSizeFields() {
    document.getElementById('size1').value = '';
    document.getElementById('size2').value = '';
    document.getElementById('size3').value = '';
    document.getElementById('additionalSizesContainer').innerHTML = '';
    sizeCounter = 3;
}

function addSizeField() {
    sizeCounter++;
    const newSizeField = document.createElement('div');
    newSizeField.className = 'size-input-group';
    newSizeField.innerHTML = `
        <input type="text" class="form-input" id="size${sizeCounter}" placeholder="Size ${sizeCounter}" style="margin-bottom: 8px;">
        <button type="button" class="remove-size-btn" onclick="removeSizeField(${sizeCounter})">×</button>
    `;
    document.getElementById('additionalSizesContainer').appendChild(newSizeField);
}

function removeSizeField(sizeId) {
    const sizeElement = document.getElementById(`size${sizeId}`);
    if (sizeElement) {
        sizeElement.parentElement.remove();
    }
}

function getAllSizes() {
    const sizes = [];
    if (selectedColor === 'blue') {
        const size1 = document.getElementById('size1').value.trim();
        if (size1) {
            sizes.push(size1);
        }
        const size2 = document.getElementById('size2').value.trim();
        if (size2) {
            sizes.push(size2);
        }
        const size3 = document.getElementById('size3').value.trim();
        if (size3) {
            sizes.push(size3);
        }
        for (let i = 4; i <= sizeCounter; i++) {
            const sizeElement = document.getElementById(`size${i}`);
            if (sizeElement && sizeElement.value.trim()) {
                sizes.push(sizeElement.value.trim());
            }
        }
    }
    
    return sizes;
}

function handleCategorySubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    if (!name) {
        showNotification('Error', 'Please enter category name!', 'error');
        return;
    }
    const existingCategory = categories.find(cat => 
        cat.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingCategory) {
        showNotification('Error', 'Category name already exists!', 'error');
        return;
    }
    
    let sizeOptions = [];
    if (selectedColor === 'blue') {
        sizeOptions = getAllSizes();
        if (sizeOptions.length === 0) {
            showNotification('Error', 'Please enter at least one size for drinks!', 'error');
            return;
        }
    }
    
    const categoryData = {
        name: name,
        icon: selectedIcon,
        color: selectedColor,
        sizeOptions: sizeOptions
    };
    addCategory(categoryData);
    closeCategoryModal();
    loadCategoriesGrid();
    loadCategoryDropdown();
    
    showNotification('Success', 'Category added successfully!', 'success');
}
function openProductModal() {
    document.getElementById('productModal').style.display = 'flex';
    loadCategoryDropdown();
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productName').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('mainPriceFieldGroup').style.display = 'block';
    document.getElementById('mainStockFieldGroup').style.display = 'block';
    document.getElementById('sizeFieldGroup').style.display = 'none';
    document.getElementById('sizeStocksContainer').innerHTML = '';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function handleProductSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('productName').value.trim();
    const categoryId = document.getElementById('productCategory').value;
    
    if (!name) {
        showNotification('Error', 'Please enter product name!', 'error');
        return;
    }
    
    if (!categoryId) {
        showNotification('Error', 'Please select a category!', 'error');
        return;
    }
    
    const category = categories.find(cat => cat.id == categoryId);
    let sizeStocks = {};
    let sizePrices = {};
    let totalStock = 0;
    let basePrice = 0;
    
    // Check if it's a drinks category with sizes
    const isDrinkCategory = category && category.color === 'blue' && category.sizeOptions && category.sizeOptions.length > 0;
    
    if (isDrinkCategory) {
        let hasValidStock = false;
        let hasValidPrice = false;
        const validPrices = [];
        
        // Process size fields
        category.sizeOptions.forEach(size => {
            if (size.trim()) {
                const sizeId = size.replace(/\s+/g, '_');
                const stockInput = document.getElementById(`stock_${sizeId}`);
                const priceInput = document.getElementById(`price_${sizeId}`);
                
                if (stockInput && priceInput) {
                    const stock = parseInt(stockInput.value) || 0;
                    const price = parseFloat(priceInput.value) || 0;
                    
                    sizeStocks[size] = stock;
                    sizePrices[size] = price;
                    totalStock += stock;
                    
                    if (stock > 0) hasValidStock = true;
                    if (price > 0) {
                        hasValidPrice = true;
                        validPrices.push(price);
                    }
                }
            }
        });
        
        if (!hasValidStock) {
            showNotification('Error', 'Please enter stock quantity for at least one size!', 'error');
            return;
        }
        
        if (!hasValidPrice) {
            showNotification('Error', 'Please enter price for at least one size!', 'error');
            return;
        }
        
        basePrice = Math.min(...validPrices);
        
    } else {
        // Non-drinks category
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value) || 0;
        
        if (isNaN(price) || price <= 0) {
            showNotification('Error', 'Please enter a valid price!', 'error');
            return;
        }
        
        if (stock < 0) {
            showNotification('Error', 'Please enter a valid stock quantity!', 'error');
            return;
        }
        
        totalStock = stock;
        basePrice = price;
    }
    
    // Create product data
    const productData = {
        name: name,
        categoryId: parseInt(categoryId),
        price: basePrice,
        stock: totalStock,
        sizeStocks: isDrinkCategory ? sizeStocks : {},
        sizePrices: isDrinkCategory ? sizePrices : {}
    };
    
    // Add product
    addProduct(productData);
    closeProductModal();
    loadProductsTable();
    
    showNotification('Success', `Product "${name}" added successfully!`, 'success');
}

// Load Categories Grid
function loadCategoriesGrid() {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = '';
    triggerAnimation(grid);
    
    if (!categories || categories.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--secondary);">
                No categories found. Click "Add Category" to create one!
            </div>
        `;
        return;
    }
    
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = `category-card ${category.color || 'blue'}`;
        categoryCard.innerHTML = `
            <div class="category-icon">${category.icon || '📦'}</div>
            <div class="category-name">${category.name}</div>
            <div class="category-products">
                ${getProductsByCategory(category.id).length} products
            </div>
        `;
        grid.appendChild(categoryCard);
    });
}

// Load Products Table
function loadProductsTable() {
    const table = document.getElementById('productsTable');
    table.innerHTML = '';
    
    if (!products || products.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 40px; color: var(--secondary);">
                    No products found. Add products using the "Add Product" button!
                </td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const category = getCategoryById(product.categoryId);
        const row = document.createElement('tr');
        const isSizedProduct = product.sizeStocks && Object.keys(product.sizeStocks).length > 0;
        let stockDisplay = '';
        let sizeStocksDisplay = '-';

        if (isSizedProduct) {
            stockDisplay = `
                <span style="color: #666; font-weight:bold; display:block;">${product.stock}</span>
                <button class="edit-stock-btn" onclick="initiateEdit('${product.id}', null, ${product.stock})" title="Edit Total Stock">
                    ✏️
                </button>
            `;
            
            // FIX: Use <div> with display block for clearer line breaks
            sizeStocksDisplay = Object.entries(product.sizeStocks)
                .map(([size, stock]) => `
                    <div class="size-stock-row" style="white-space: nowrap;">
                        <span>${size}: <strong>${stock}</strong></span>
                        <button class="edit-stock-btn" onclick="initiateEdit('${product.id}', '${size}', ${stock})" title="Edit ${size} Stock">
                            ✏️
                        </button>
                    </div>
                `).join('');

        } else {
            stockDisplay = `
                <span style="font-weight:bold; font-size:1.1em; display:block;">${product.stock}</span>
                <button class="edit-stock-btn" onclick="initiateEdit('${product.id}', null, ${product.stock})" title="Edit Stock">
                    ✏️
                </button>
            `;
        }
        
        let priceDisplay = `₱${(product.price || 0).toFixed(2)}`;
        if (product.sizePrices && Object.keys(product.sizePrices).length > 0) {
            // FIX: Use <span> with display:block for multiple prices in one column
            priceDisplay = Object.entries(product.sizePrices)
                .map(([size, price]) => `<span style="font-size:12px; display:block;">${size}: ₱${price.toFixed(2)}</span>`)
                .join('');
        }
        
        row.innerHTML = `
            <td>${product.name || 'Unnamed Product'}</td>
            <td>
                <span class="category-with-icon">
                    <span class="category-icon">${category ? (category.icon || '📦') : '📦'}</span>
                    <span>${category ? (category.name || 'Uncategorized') : 'Uncategorized'}</span>
                </span>
            </td>
            <td>${priceDisplay}</td>
            <td>${stockDisplay}</td> <td>${sizeStocksDisplay}</td> <td>
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        `;
        table.appendChild(row); 
    });
}

// Load category dropdown for product modal
function loadCategoryDropdown() {
    const listContainer = document.getElementById('productCategoryList');
    const hiddenInput = document.getElementById('productCategory');
    const displayBtn = document.getElementById('selectedCategoryDisplay');
    
    if (!listContainer) return;
    listContainer.innerHTML = '';
    hiddenInput.value = '';
    displayBtn.innerHTML = '<span class="placeholder-text">Select Category</span>';
    if (!categories || categories.length === 0) {
        listContainer.innerHTML = '<div class="dropdown-item">No categories available</div>';
        return;
    }
    categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
            <span style="font-size: 1.2em;">${category.icon || '📦'}</span>
            <span>${category.name}</span>
        `;
        item.onclick = () => {
            selectCategoryForProduct(category);
        };
        
        listContainer.appendChild(item);
    });
}

function initiateEdit(productId, size, currentStock) {
    pendingEdit = {
        productId: productId,
        sizeName: size, 
        currentStock: currentStock
    };
    document.getElementById('securityEmail').value = '';
    document.getElementById('securityPass').value = '';
    document.getElementById('reLoginModal').style.display = 'flex';
}
function handleReLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('securityEmail').value;
    const password = document.getElementById('securityPass').value;
    let isAuthorized = false;
    if (email === "admin" && password === "admins123") {
        isAuthorized = true;
    } else {
        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const user = storedUsers.find(u => u.email === email && u.password === password);
        if (user) isAuthorized = true;
    }
    if (isAuthorized) {
        closeReLoginModal();
        
        if (pendingErase) {
            executeNuclearWipe();
            pendingErase = false; 
        } else {
            openStockEditModal();
        }
    } else {
        showErrorAlert('Access Denied!', 'Wrong email or password.');
    }
}
function openStockEditModal() {
    const modal = document.getElementById('stockEditModal');
    const label = document.getElementById('stockEditLabel');
    const display = document.getElementById('currentStockDisplay');
    const product = products.find(p => p.id == pendingEdit.productId);
    const productName = product ? product.name : 'Item';
    
    if (pendingEdit.sizeName) {
        label.textContent = `Updating stock for: ${productName} (${pendingEdit.sizeName})`;
    } else {
        label.textContent = `Updating stock for: ${productName}`;
    }
    
    display.textContent = pendingEdit.currentStock;
    document.getElementById('newStockValue').value = ''; 
    
    modal.style.display = 'flex';
    document.getElementById('newStockValue').focus();
}
function handleStockUpdate(event) {
    event.preventDefault();
    
    const newStock = parseInt(document.getElementById('newStockValue').value);
    
    if (isNaN(newStock) || newStock < 0) {
        alert('Please enter a valid number!');
        return;
    }
    const productIndex = products.findIndex(p => p.id == pendingEdit.productId);
    
    if (productIndex !== -1) {
        const product = products[productIndex];
        
        if (pendingEdit.sizeName) {
            product.sizeStocks[pendingEdit.sizeName] = newStock;
            product.stock = Object.values(product.sizeStocks).reduce((a, b) => a + b, 0);
            
        } else {
            product.stock = newStock;
        }
        saveProducts();
        loadProductsTable();
        showNotification('Success', 'Stock updated successfully!', 'success');
        closeStockEditModal();
    }
}
function closeReLoginModal() {
    document.getElementById('reLoginModal').style.display = 'none';
}

function closeStockEditModal() {
    document.getElementById('stockEditModal').style.display = 'none';
}
function toggleProductDropdown() {
    const dropdown = document.getElementById('productCategoryList');
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
    });
    dropdown.classList.toggle('show');
}
function selectCategoryForProduct(category) {
    const displayBtn = document.getElementById('selectedCategoryDisplay');
    displayBtn.innerHTML = `
        <span style="font-size: 1.2em;">${category.icon || '📦'}</span>
        <span style="font-weight: 600;">${category.name}</span>
    `;
    const hiddenInput = document.getElementById('productCategory');
    hiddenInput.value = category.id;
    document.getElementById('productCategoryList').classList.remove('show');
    handleCategoryChange(); 
}
window.onclick = function(event) {
    if (!event.target.matches('.dropdown-btn') && !event.target.closest('.dropdown-btn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function handleCategoryChange() {
    const categorySelect = document.getElementById('productCategory');
    const selectedCategoryId = categorySelect.value;
    
    const mainPriceFieldGroup = document.getElementById('mainPriceFieldGroup');
    const mainStockFieldGroup = document.getElementById('mainStockFieldGroup');
    const sizeFieldGroup = document.getElementById('sizeFieldGroup');
    const sizeStocksContainer = document.getElementById('sizeStocksContainer');
    sizeStocksContainer.innerHTML = '';
    
    if (selectedCategoryId) {
        const category = categories.find(cat => cat.id == selectedCategoryId);
        
        if (category && category.color === 'blue' && category.sizeOptions && category.sizeOptions.length > 0) {
            mainPriceFieldGroup.style.display = 'none';
            mainStockFieldGroup.style.display = 'none';
            sizeFieldGroup.style.display = 'block';
            category.sizeOptions.forEach(size => {
                if (size.trim()) {
                    const sizeId = size.replace(/\s+/g, '_');
                    const sizeStockGroup = document.createElement('div');
                    sizeStockGroup.className = 'size-stock-group';
                    sizeStockGroup.innerHTML = `
                        <span class="size-stock-label">${size}:</span>
                        <input type="number" 
                               class="size-stock-input" 
                               id="stock_${sizeId}" 
                               min="0" 
                               placeholder="Stock"
                               oninput="validateSizeInput(this)">
                        <input type="number" 
                               class="size-price-input" 
                               id="price_${sizeId}" 
                               step="0.01" 
                               min="0" 
                               placeholder="Price"
                               oninput="validateSizeInput(this)">
                    `;
                    sizeStocksContainer.appendChild(sizeStockGroup);
                }
            });
        } else {
            mainPriceFieldGroup.style.display = 'block';
            mainStockFieldGroup.style.display = 'block';
            sizeFieldGroup.style.display = 'none';
        }
    } else {
        mainPriceFieldGroup.style.display = 'block';
        mainStockFieldGroup.style.display = 'block';
        sizeFieldGroup.style.display = 'none';
    }
}

// Add validation helper function
function validateSizeInput(input) {
    const value = parseFloat(input.value);
    if (value < 0) {
        input.value = 0;
    }
}

// Delete product
function deleteProduct(productId) {
    showConfirmModal(
        'Delete Product?', 
        'Are you sure you want to delete this product? This cannot be undone.', 
        function() {
            const index = products.findIndex(p => p.id == productId);
            if (index !== -1) {
                const productName = products[index].name;
                products.splice(index, 1);
                sales.forEach(sale => {
                    sale.items = sale.items.filter(item => item.productId != productId);
                });
                saveProducts();
                loadProductsTable();
                showNotification('Deleted', `Product "${productName}" deleted successfully`, 'success');
            }
        }
    );
}

// Shop Settings Functions
function openShopSettingsModal() {
    document.getElementById('shopSettingsModal').style.display = 'flex';
    document.getElementById('shopName').value = shopInfo.name || '';
    document.getElementById('shopAddress').value = shopInfo.address || '';
    document.getElementById('receiptFooter').value = shopInfo.receiptFooter || '';
    const currentLogo = shopInfo.logo || "pics/logo.png";
    document.getElementById('settingsLogoPreview').src = currentLogo;
    tempLogoBase64 = currentLogo;
    const emailField = document.getElementById('adminEmail');
    const passField = document.getElementById('adminPass');
    emailField.value = "";
    passField.value = "";
    emailField.placeholder = "Input your email here";
    passField.placeholder = "Input your correct password";
    emailField.setAttribute('readonly', true);
    passField.setAttribute('readonly', true);
    passField.type = "password";
}

function closeShopSettingsModal() {
    document.getElementById('shopSettingsModal').style.display = 'none';
}

function enableField(fieldId) {
    const field = document.getElementById(fieldId);
    field.removeAttribute('readonly');
    field.focus();
    if (fieldId === 'adminPass') field.type = "text";
}

function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('settingsLogoPreview').src = e.target.result;
            tempLogoBase64 = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function handleShopSettings(event) {
    event.preventDefault();
    let currentUsers = JSON.parse(localStorage.getItem('users')) || [];
    let existingAdmin = currentUsers.find(u => u.id === 1) || { id: 1, email: 'admin', password: 'admins123', name: "Admin" };
    const inputEmail = document.getElementById('adminEmail').value.trim();
    const inputPass = document.getElementById('adminPass').value.trim();
    const finalEmail = inputEmail !== "" ? inputEmail : existingAdmin.email;
    const finalPass = inputPass !== "" ? inputPass : existingAdmin.password;
    const newShopInfo = {
        name: document.getElementById('shopName').value,
        address: document.getElementById('shopAddress').value,
        receiptFooter: document.getElementById('receiptFooter').value,
        logo: tempLogoBase64
    };
    updateShopInfo(newShopInfo);
    const updatedUsers = [
        { id: 1, email: finalEmail, password: finalPass, name: "Admin" }
    ];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    users = updatedUsers; 
    const headerLogos = document.querySelectorAll('.logo-img');
    headerLogos.forEach(img => { if (newShopInfo.logo) img.src = newShopInfo.logo; });

    closeShopSettingsModal();
    showNotification('Success', 'Settings updated successfully!', 'success');
}


// Function para sa DELETE ALL DATA (With Security Check)
function eraseAllData() {
    showConfirmModal(
        '🚨 DELETE EVERYTHING? 🚨', 
        'This will WIPE OUT ALL DATA including sales history, products, and settings! This cannot be undone!', 
        function() {
            pendingErase = true;
            document.getElementById('securityEmail').value = '';
            document.getElementById('securityPass').value = '';
            document.getElementById('reLoginModal').style.display = 'flex';
        }
    );
}
let confirmCallback = null; 

function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    document.getElementById('customConfirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('customConfirmModal').style.display = 'none';
    confirmCallback = null;
}
document.getElementById('confirmActionBtn').onclick = function() {
    if (confirmCallback) {
        confirmCallback(); 
    }
    closeConfirmModal();
};

// Auto-clean data older than 3 days
function autoCleanOldData() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const originalLength = sales.length;
    sales = sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= threeDaysAgo;
    });
    voidedTransactions = voidedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        return transactionDate >= threeDaysAgo;
    });
    if (sales.length !== originalLength) {
        saveSales();
        saveVoidedTransactions();
        console.log(`Auto-cleaned ${originalLength - sales.length} old records`);
    }
}
// === CUSTOM ERROR ALERT FUNCTION ===
function showErrorAlert(title, message) {
    document.getElementById('errorAlertTitle').textContent = title;
    document.getElementById('errorAlertMessage').textContent = message;
    document.getElementById('errorAlertModal').style.display = 'flex';
}

function closeErrorAlert() {
    document.getElementById('errorAlertModal').style.display = 'none';
}

// Save all data
function saveData() {
    saveShopInfo();
    saveCategories();
    saveProducts();
    saveSales();
    saveVoidedTransactions();
}
function triggerAnimation(element) {
    if (element) {
        element.classList.remove('animate-enter');
        void element.offsetWidth;
        element.classList.add('animate-enter');
    }
}
function executeNuclearWipe() {
    try {
        localStorage.clear();
        sessionStorage.clear();
        shopInfo = {};
        categories = [];
        products = [];
        sales = [];
        voidedTransactions = [];
        users = [];
        const errorModal = document.getElementById('errorAlertModal');
        const errorTitle = document.getElementById('errorAlertTitle');
        const errorMessage = document.getElementById('errorAlertMessage');
        const errorBtn = errorModal.querySelector('.btn-danger'); 
        errorTitle.textContent = '✅ RESET COMPLETE';
        errorMessage.textContent = 'All data has been erased. The system will now reload.';
        errorBtn.textContent = "Reload System";
        errorBtn.onclick = function() {
            window.location.href = window.location.pathname; 
        };
        errorModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error deleting data:', error);
        showErrorAlert('Error', error.message);
    }
}
function openFooterHelpModal() {
    document.getElementById('footerHelpModal').style.display = 'flex';
}

function closeFooterHelpModal() {
    document.getElementById('footerHelpModal').style.display = 'none';
}
// Initialize when page loads
document.addEventListener('DOMContentLoaded', initInventory);