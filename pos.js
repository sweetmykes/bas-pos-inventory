// pos.js - POS page functionality

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'all';
let selectedDiscount = { type: 'none', amount: 0 };
let selectedPaymentMethod = null;
let paymentAmounts = { cash: 0, gcash: 0 };
let selectedProductForSize = null;
let sizeSelectionModal = null;
updatePOSBranding();

// Initialize POS
function initPOS() {
// ... (No change here)
    loadCategories();
    loadProducts();
    loadCart();
    updateCartDisplay();
    updatePOSTitle();
    createSizeSelectionModal();
    updateQueueDisplay();
}

function updatePOSBranding() {
// ... (No change here)
        if (shopInfo.logo) {
            const logoImg = document.querySelector('.logo-img');
            if (logoImg) logoImg.src = shopInfo.logo;
        }
        if (shopInfo.name) {
            const logoText = document.querySelector('.logo-text');
            if (logoText) logoText.textContent = shopInfo.name;
        }
    }
//HELPER: ANIMATION TRIGGER
function triggerAnimation(element) {
// ... (No change here)
        if (element) {
            element.classList.remove('animate-enter');
            void element.offsetWidth;
            element.classList.add('animate-enter');
        }
    }


// Create Size Selection Modal
function createSizeSelectionModal() {
// ... (No change here)
        sizeSelectionModal = document.createElement('div');
        sizeSelectionModal.className = 'modal';
        sizeSelectionModal.id = 'sizeSelectionModal';
        sizeSelectionModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="sizeModalTitle">Select Size</div>
                    <button class="close-btn" onclick="closeSizeSelectionModal()">&times;</button>
                </div>
                <div class="size-selection-container" id="sizeSelectionContainer">
                    </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeSizeSelectionModal()">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(sizeSelectionModal);
    }

// Show Size Selection Modal
function showSizeSelectionModal(product, category) {
// ... (No change here)
        selectedProductForSize = product;
        const container = document.getElementById('sizeSelectionContainer');
        const title = document.getElementById('sizeModalTitle');
        
        title.textContent = `Select Size for ${product.name}`;
        container.innerHTML = '';
        Object.keys(product.sizePrices).forEach(size => {
            if (size.trim() && product.sizeStocks[size] > 0) {
                const price = product.sizePrices[size];
                const stock = product.sizeStocks[size];
                
                const sizeButton = document.createElement('button');
                sizeButton.className = 'size-selection-btn';
                sizeButton.innerHTML = `
                    <div class="size-name">${size}</div>
                    <div class="size-price">₱${price.toFixed(2)}</div>
                    <div class="size-stock">Stock: ${stock}</div>
                `;
                sizeButton.onclick = () => selectSize(size, price);
                container.appendChild(sizeButton);
            }
        });
        if (container.children.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--secondary);">No sizes available</div>';
        }
        
        sizeSelectionModal.style.display = 'flex';
    }

// Select Size and Add to Cart - NEW FUNCTION
function selectSize(size, price) {
// ... (No change here)
        if (!selectedProductForSize) return;
        const productVariant = {
            ...selectedProductForSize,
            selectedSize: size,
            price: price, 
            displayName: `${selectedProductForSize.name} (${size})`
        };
        
        addProductToCartDirectly(productVariant, size);
        closeSizeSelectionModal();
    }

// Close Size Selection Modal
function closeSizeSelectionModal() {
// ... (No change here)
        selectedProductForSize = null;
        if (sizeSelectionModal) {
            sizeSelectionModal.style.display = 'none';
        }
    }

// Add product to cart (modified to handle sizes)
function addProductToCartDirectly(product, selectedSize) {
// ... (No change here)
        const productId = selectedSize ? `${product.id}_${selectedSize}` : product.id;
        const existingItem = cart.find(item => item.productId === productId);
        let availableStock = product.stock;
        if (selectedSize && product.sizeStocks && product.sizeStocks[selectedSize] !== undefined) {
            availableStock = product.sizeStocks[selectedSize];
        }
        
        if (existingItem) {
            if (existingItem.quantity >= availableStock) {
                showNotification('Warning', `Only ${availableStock} items available in stock!`, 'warning');
                return;
            }
            existingItem.quantity++;
        } else {
            if (availableStock < 1) {
                showNotification('Error', 'Product out of stock!', 'error');
                return;
            }
            cart.push({
                productId: productId,
                originalProductId: product.id,
                quantity: 1,
                price: product.price,
                size: selectedSize,
                productName: product.name,
                displayName: selectedSize ? `${product.name} (${selectedSize})` : product.name
            });
        }
        
        saveCart();
        updateCartDisplay();
        showNotification('Cart Updated', `${selectedSize ? product.name + ' (' + selectedSize + ')' : product.name} added to cart`, 'success', 1000);
    }

// Modified addToCart function
function addToCart(product) {
// ... (No change here)
        const category = getCategoryById(product.categoryId);
        if (category && category.color === 'blue' && product.sizePrices && Object.keys(product.sizePrices).length > 0) {
            showSizeSelectionModal(product, category);
        } else {
            addProductToCartDirectly(product, null);
        }
    }
function updatePOSTitle() {
// ... (No change here)
        const posTitle = document.getElementById('posTitle');
        if (posTitle && typeof shopInfo !== 'undefined') {
            posTitle.textContent = shopInfo.name + " POS";
        }
    }

// Load categories for tabs
function loadCategories() {
// ... (No change here)
        const categoryTabs = document.getElementById('categoryTabs');
        
        if (!categoryTabs) return;
        categoryTabs.innerHTML = `
            <div class="category-tab active" data-category="all" onclick="filterByCategory('all')">
                <span class="category-icon">📦</span>
                <span>All Items</span>
            </div>
        `;
        
        if (typeof categories === 'undefined' || !categories || categories.length === 0) {
            return;
        }
        
        categories.forEach(category => {
            const tab = document.createElement('div');
            tab.className = `category-tab ${category.color || 'blue'}`;
            tab.dataset.category = category.id;
            tab.innerHTML = `
                <span class="category-icon">${category.icon || '📦'}</span>
                <span>${category.name}</span>
            `;
            tab.onclick = () => filterByCategory(category.id);
            categoryTabs.appendChild(tab);
        });
    }

// Load products grid
function loadProducts() {
// ... (No change here)
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        triggerAnimation(productsGrid);
        
        productsGrid.innerHTML = '';
        productsGrid.style.display = 'grid';
        productsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        productsGrid.style.gap = '8px';
        productsGrid.style.alignItems = 'stretch';
        
        if (currentCategory === 'all') {
            const categoriesWithProducts = categories.map(category => {
                const categoryProducts = getProductsByCategory(category.id);
                return {
                    category: category,
                    products: categoryProducts
                };
            }).filter(group => group.products.length > 0);
            
            categoriesWithProducts.sort((a, b) => a.category.name.localeCompare(b.category.name));
            
            categoriesWithProducts.forEach(group => {
                const categorySection = document.createElement('div');
                categorySection.style.gridColumn = '1 / -1';
                categorySection.style.marginBottom = '12px';
                
                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'category-section-title';
                categoryTitle.style.borderLeft = `3px solid ${getCategoryColor(group.category.color)}`;
                categoryTitle.innerHTML = `<span class="category-icon">${group.category.icon || '📦'}</span> <span>${group.category.name}</span>`;
                
                categorySection.appendChild(categoryTitle);
                
                const productsContainer = document.createElement('div');
                productsContainer.style.display = 'grid';
                productsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
                productsContainer.style.gap = '8px';
                productsContainer.style.alignItems = 'stretch';
                
                group.products.forEach(product => {
                    productsContainer.appendChild(createProductCard(product, group.category));
                });
                
                categorySection.appendChild(productsContainer);
                productsGrid.appendChild(categorySection);
            });
            
            return;
        } else {
            const productsToShow = getProductsByCategory(currentCategory);
            
            if (!productsToShow || productsToShow.length === 0) {
                productsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--secondary); font-size: 12px;">
                        No products found in this category.
                    </div>
                `;
                return;
            }
            
            productsToShow.forEach(product => {
                const category = getCategoryById(product.categoryId);
                productsGrid.appendChild(createProductCard(product, category));
            });
        }
    }

// Create product card - OPTIMIZED SIZE
function createProductCard(product, category) {
// ... (No change here)
        const productCard = document.createElement('div');
        productCard.className = `product-card ${category?.color || 'blue'}`;
        let hasStock = product.stock > 0;
        if (category?.color === 'blue' && product.sizeStocks) {
            hasStock = Object.values(product.sizeStocks).some(stock => stock > 0);
        }
        
        if (!hasStock) {
            productCard.classList.add('out-of-stock');
        } else if (product.stock <= 5) {
            productCard.classList.add('low-stock');
        }
        
        let stockBadge = '';
        if (!hasStock) {
            stockBadge = '<div class="stock-badge">OUT</div>';
        } else if (product.stock <= 5) {
            stockBadge = `<div class="stock-badge">${product.stock}</div>`;
        }
        let sizeInfo = '';
        if (category?.color === 'blue' && product.sizePrices && Object.keys(product.sizePrices).length > 0) {
            const sizes = Object.keys(product.sizePrices);
            sizeInfo = `<div class="product-size">${sizes.join('/')}</div>`;
        }
        
        productCard.innerHTML = `
            ${stockBadge}
            <div class="product-name">${product.name || 'Unnamed Product'}</div>
            <div class="product-price">₱${(product.price || 0).toFixed(2)}</div>
            <div class="product-stock">Stock: ${product.stock || 0}</div>
            ${sizeInfo}
        `;
        
        if (hasStock) {
            productCard.onclick = () => addToCart(product);
        }
        
        return productCard;
    }

// Helper function to get category color
function getCategoryColor(color) {
// ... (No change here)
        switch(color) {
            case 'blue': return '#3b82f6';
            case 'green': return '#10b981';
            case 'orange': return '#f59e0b';
            case 'red': return '#ef4444';
            case 'purple': return '#7c3aed';
            case 'pink': return '#db2777';
            default: return '#3b82f6';
        }
    }

// Filter products by category
function filterByCategory(categoryId) {
// ... (No change here)
        currentCategory = categoryId;
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`.category-tab[data-category="${categoryId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        loadProducts();
    }

// Cart functionality
function loadCart() {
// ... (No change here)
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;
        
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="text-center" style="color: var(--secondary); padding: 40px;">Cart is empty</div>';
            return;
        }
        
        cart.forEach((item, index) => {
            const product = products.find(p => p.id === item.originalProductId || p.id === item.productId);
            const displayName = item.displayName || (product ? product.name : 'Unknown Product');
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${displayName}</div>
                    <div class="cart-item-price">₱${(item.price || 0).toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${index})">🗑️</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }

// UPDATED FUNCTION to handle sizes
function updateQuantity(index, change) {
// ... (No change here)
        const item = cart[index];
        const product = products.find(p => p.id === item.originalProductId || p.id === item.productId);
        
        if (!product) return;
        let availableStock = product.stock;
        if (item.size && product.sizeStocks && product.sizeStocks[item.size] !== undefined) {
            availableStock = product.sizeStocks[item.size];
        }
        
        const newQuantity = item.quantity + change;
        
        if (newQuantity < 1) {
            removeFromCart(index);
            return;
        }
        
        if (newQuantity > availableStock) {
            showNotification('Warning', `Only ${availableStock} items available in stock!`, 'warning');
            return;
        }
        
        item.quantity = newQuantity;
        saveCart();
        updateCartDisplay();
    }

function removeFromCart(index) {
// ... (No change here)
        const product = products.find(p => p.id === cart[index].productId || p.id === cart[index].originalProductId);
        cart.splice(index, 1);
        saveCart();
        updateCartDisplay();
        
        if (product) {
            showNotification('Cart Updated', `${product.name} removed from cart`, 'info', 1000);
        }
    }

function clearCart() {
// ... (No change here)
        if (cart.length === 0) return;
        
        if (confirm('Clear all items from cart?')) {
            cart = [];
            selectedDiscount = { type: 'none', amount: 0 };
            saveCart();
            updateCartDisplay();
            resetDiscountButtons();
            showNotification('Cart Cleared', 'All items removed from cart', 'info');
        }
    }

function saveCart() {
// ... (No change here)
        localStorage.setItem('cart', JSON.stringify(cart));
    }

function updateCartDisplay() {
// ... (No change here)
        loadCart();
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;
        
        if (selectedDiscount.type === 'senior' || selectedDiscount.type === 'pwd') {
            discountAmount = subtotal * 0.20;
        }
        
        const total = subtotal - discountAmount;
        
        document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
        document.getElementById('total').textContent = `₱${total.toFixed(2)}`;
        
        const discountRow = document.getElementById('discountRow');
        const discountAmountSpan = document.getElementById('discountAmount');
        
        if (discountAmount > 0) {
            discountRow.style.display = 'flex';
            discountAmountSpan.textContent = `-₱${discountAmount.toFixed(2)}`;
            discountAmountSpan.style.color = 'var(--success)';
        } else {
            discountRow.style.display = 'none';
        }
    }

// Discount application
function applyDiscount(type) {
// ... (No change here)
        selectedDiscount.type = type;
        
        document.querySelectorAll('.discount-btn').forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        updateCartDisplay();
    }

function resetDiscountButtons() {
// ... (No change here)
        selectedDiscount = { type: 'none', amount: 0 };
        document.querySelectorAll('.discount-btn').forEach(btn => {
            if (btn.dataset.type === 'none') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

// Payment Modal functionality
function openPaymentModal() {
// ... (No change here)
        if (cart.length === 0) {
            showNotification('Error', 'Cart is empty!', 'error');
            return;
        }

        const total = calculateTotal();
        document.getElementById('paymentTotal').textContent = `₱${total.toFixed(2)}`;
        document.getElementById('multiPaymentTotal').textContent = `₱${total.toFixed(2)}`;
        document.getElementById('paymentActionButtons').style.display = 'none';
        document.getElementById('paymentModalTitle').textContent = 'Payment Method';
        document.getElementById('paymentMethodSelection').style.display = 'block';
        document.getElementById('singlePaymentSection').style.display = 'none';
        document.getElementById('multiPaymentSection').style.display = 'none';
        document.getElementById('processPaymentBtn').disabled = true;
        document.getElementById('paymentModal').style.display = 'flex';
    }

function selectPaymentOption(method) {
// ... (No change here)
    const titleElement = document.getElementById('paymentModalTitle');
    
    if (method === 'cash') {
        titleElement.textContent = 'Cash Payment';
    } else if (method === 'gcash') {
        titleElement.textContent = 'GCash Payment';
    } 

    selectedPaymentMethod = method;
    document.getElementById('paymentMethodSelection').style.display = 'none';
    document.getElementById('singlePaymentSection').style.display = 'none';
    document.getElementById('multiPaymentSection').style.display = 'none';
    
    if (method === 'cash' || method === 'gcash') {
        document.getElementById('singlePaymentSection').style.display = 'block';
        
        const label = method === 'cash' ? 'Cash Amount' : 'GCash Amount';
        const type = method === 'cash' ? 'Cash Paid' : 'GCash Paid';
        
        document.getElementById('singlePaymentLabel').textContent = label;
        document.getElementById('singlePaymentType').textContent = type;
        document.getElementById('singlePaymentAmount').value = ''; 
        document.getElementById('singlePaymentPaid').textContent = '₱0.00';
        document.getElementById('singlePaymentChange').textContent = '₱0.00';
        
        setTimeout(() => document.getElementById('singlePaymentAmount').focus(), 100);
        
        document.getElementById('singlePaymentAmount').oninput = updateSinglePayment;
        
    } else if (method === 'multi') {
        document.getElementById('multiPaymentSection').style.display = 'block';
        document.getElementById('multiCashAmount').value = '';
        document.getElementById('multiGcashAmount').value = '';
        paymentAmounts.cash = 0;
        paymentAmounts.gcash = 0;

        document.getElementById('multiCashAmount').oninput = updateMultiPayment;
        document.getElementById('multiGcashAmount').oninput = updateMultiPayment;
        document.getElementById('multiTotalPaid').textContent = '₱0.00';
        document.getElementById('multiPaymentRemaining').textContent = '₱0.00';
        updateMultiPayment(); 
    }
    document.getElementById('paymentActionButtons').style.display = 'block';
    document.getElementById('processPaymentBtn').disabled = true;
    updateProcessButton();
}

// Function back method (Back Button)
function backToPaymentSelection() {
// ... (No change here)
        selectedPaymentMethod = null;
        paymentAmounts = { cash: 0, gcash: 0 };
        document.getElementById('paymentModalTitle').textContent = 'Payment Method';
        selectedPaymentMethod = null;
        
        document.getElementById('singlePaymentAmount').value = '';
        document.getElementById('multiCashAmount').value = '';
        document.getElementById('multiGcashAmount').value = '';

        updateMultiPayment();
        
        document.getElementById('singlePaymentPaid').textContent = '₱0.00';
        document.getElementById('singlePaymentChange').textContent = '₱0.00';
        document.getElementById('multiTotalPaid').textContent = '₱0.00';
        document.getElementById('multiPaymentRemaining').textContent = '₱0.00';

        document.getElementById('paymentMethodSelection').style.display = 'block';
        document.getElementById('singlePaymentSection').style.display = 'none';
        document.getElementById('multiPaymentSection').style.display = 'none';
        
        document.getElementById('processPaymentBtn').disabled = true;
        document.getElementById('paymentActionButtons').style.display = 'none';
        document.getElementById('processPaymentBtn').disabled = true;
    }

//updateSinglePayment
function updateSinglePayment() {
// ... (No change here)
    const amount = parseFloat(document.getElementById('singlePaymentAmount').value) || 0;
    const total = calculateTotal();
    
    paymentAmounts.cash = selectedPaymentMethod === 'cash' ? amount : 0;
    paymentAmounts.gcash = selectedPaymentMethod === 'gcash' ? amount : 0;
    
    const change = amount - total;
    const changeElement = document.getElementById('singlePaymentChange');

    document.getElementById('singlePaymentPaid').textContent = `₱${amount.toFixed(2)}`;
    
    if (change < 0) {
        changeElement.style.color = 'var(--danger)';
        changeElement.textContent = `₱${change.toFixed(2)}`;
    } else {
        changeElement.style.color = 'var(--primary)';
        changeElement.textContent = `₱${change.toFixed(2)}`;
    }
    
    updateProcessButton();
}

//updateMultiPayment
function updateMultiPayment() {
// ... (No change here)
    const cashAmount = Math.max(0, parseFloat(document.getElementById('multiCashAmount').value) || 0);
    const gcashAmount = Math.max(0, parseFloat(document.getElementById('multiGcashAmount').value) || 0);
    const total = calculateTotal();
    
    paymentAmounts.cash = cashAmount;
    paymentAmounts.gcash = gcashAmount;
    
    const totalPaid = cashAmount + gcashAmount;
    const remaining = totalPaid - total; // Positive kung Change, Negative kung Kulang

    document.getElementById('multiTotalPaid').textContent = `₱${totalPaid.toFixed(2)}`;
    
    const remainingElement = document.getElementById('multiPaymentRemaining');
    // Clear previous color styles
    remainingElement.style.color = '';
    
    if (remaining < 0) {
        // Kulang pa: Display as positive value with INSUFFICIENT label
        remainingElement.style.color = 'var(--danger)'; 
        remainingElement.innerHTML = `₱${Math.abs(remaining).toFixed(2)} <small style="color: var(--danger);">(Insufficient)</small>`;
    } else {
        // Sakto o sobra (Change)
        remainingElement.style.color = remaining > 0 ? 'var(--primary)' : 'var(--success)';
        
        // Tanggalin ang small tag na may 'Paid' / 'Change' text para mas malinis
        remainingElement.textContent = `₱${remaining.toFixed(2)}`; 
    }
    
    updateProcessButton();
}

//updateProcessButton
function updateProcessButton() {
// ... (No change here)
    const total = calculateTotal();
    let totalPaid = 0;
    
    if (selectedPaymentMethod === 'cash') {
        totalPaid = paymentAmounts.cash;
    } else if (selectedPaymentMethod === 'gcash') {
        totalPaid = paymentAmounts.gcash;
    } else if (selectedPaymentMethod === 'multi') {
        totalPaid = paymentAmounts.cash + paymentAmounts.gcash;
    }

    const isValid = totalPaid >= total;
    document.getElementById('processPaymentBtn').disabled = !isValid;
    const processBtn = document.getElementById('processPaymentBtn');
    if (!isValid) {
        processBtn.textContent = 'Insufficient Payment';
        processBtn.classList.remove('btn-primary');
        processBtn.classList.add('btn-danger');
    } else {
        processBtn.textContent = 'Process Payment';
        processBtn.classList.remove('btn-danger');
        processBtn.classList.add('btn-primary');
    }
}

function calculateTotal() {
// ... (No change here)
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;
        
        if (selectedDiscount.type === 'senior' || selectedDiscount.type === 'pwd') {
            discountAmount = subtotal * 0.20;
        }
        
        return subtotal - discountAmount;
    }

// UPDATED PROCESS PAYMENT (Saves Correct Change)
function processPayment() {
// ... (No change here)
    console.log('=== PROCESS PAYMENT STARTED ===');
    
    if (cart.length === 0) {
        showNotification('Error', 'Cart is empty! Please add items first.', 'error');
        return;
    }
    
    const total = calculateTotal();
    
    if (!selectedPaymentMethod) {
        showNotification('Error', 'Please select a payment method!', 'error');
        return;
    }
    
    let totalPaid = 0;
    if (selectedPaymentMethod === 'multi') {
        totalPaid = paymentAmounts.cash + paymentAmounts.gcash;
    } else {
        totalPaid = selectedPaymentMethod === 'cash' ? paymentAmounts.cash : paymentAmounts.gcash;
    }
    
    const change = Math.max(0, totalPaid - total);
    
    const saleData = {
        items: cart.map(item => ({
            productId: item.originalProductId || item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size
        })),
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        discount: selectedDiscount.type !== 'none' ? total * 0.20 : 0,
        discountType: selectedDiscount.type,
        total: total,
        paymentMethod: selectedPaymentMethod,
        paymentAmounts: { ...paymentAmounts },
        change: change
    };
    
    try {
        const sale = addSale(saleData);
        
        if (sale) {
            // Add to queue
            addToQueue(sale);
            
            showReceipt(sale);
            
            cart = [];
            selectedDiscount = { type: 'none', amount: 0 };
            saveCart();
            updateCartDisplay();
            updateQueueDisplay(); // Update queue display
            resetDiscountButtons();
            loadProducts();
            
            closePaymentModal();
            showNotification('Success', `Payment processed! Queue #${lastQueueNumber}`, 'success');
        } else {
            showNotification('Error', 'Failed to process payment! Please try again.', 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Error', 'System error: ' + error.message, 'error');
    }
}

// Close Payment Modal
function closePaymentModal() {
// ... (No change here)
        console.log('Closing payment modal...');
        
        selectedPaymentMethod = null;
        paymentAmounts = { cash: 0, gcash: 0 };
        
        document.getElementById('singlePaymentAmount').value = '';
        document.getElementById('multiCashAmount').value = '';
        document.getElementById('multiGcashAmount').value = '';
        
        document.getElementById('singlePaymentPaid').textContent = '₱0.00';
        document.getElementById('singlePaymentChange').textContent = '₱0.00';
        document.getElementById('multiTotalPaid').textContent = '₱0.00';
        document.getElementById('multiPaymentRemaining').textContent = '₱0.00';
        
        document.getElementById('paymentModalTitle').textContent = 'Payment Method';
        document.getElementById('paymentMethodSelection').style.display = 'block';
        document.getElementById('singlePaymentSection').style.display = 'none';
        document.getElementById('multiPaymentSection').style.display = 'none';
        document.getElementById('processPaymentBtn').disabled = true;
        
        document.getElementById('paymentModal').style.display = 'none';
        
        console.log('Payment modal closed');
    }

// UPDATED: updateQueueDisplay to target navbar button and new modal
function updateQueueDisplay() {
// ... (No change here)
    const queueNavCount = document.getElementById('queueNavCount');
    const queueModalCount = document.getElementById('queueModalCount');
    const queueItemsModal = document.getElementById('queueItemsModal');
    const activeQueue = getActiveQueue();
    
    // Update Navbar Button
    const countText = `${activeQueue.length} order${activeQueue.length !== 1 ? 's' : ''}`;
    if (queueNavCount) queueNavCount.textContent = countText;
    
    // Update Modal Title
    if (queueModalCount) queueModalCount.textContent = countText;
    
    if (!queueItemsModal) return;

    if (activeQueue.length === 0) {
        queueItemsModal.innerHTML = '<div class="text-center" style="color: var(--secondary); padding: 40px;">No active orders</div>';
        return;
    }
    
    queueItemsModal.innerHTML = '';
    activeQueue.forEach(item => {
        const queueElement = document.createElement('div');
        queueElement.className = 'queue-item';
        queueElement.innerHTML = `
            <div class="queue-number">Queue #${item.queueNumber.toString().padStart(3, '0')}</div>
            <div class="queue-time">${new Date(item.timestamp).toLocaleTimeString('en-PH', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}</div>
            <div class="queue-items-count">${item.items.length} item${item.items.length !== 1 ? 's' : ''}</div>
            <div class="queue-total">₱${item.total.toFixed(2)}</div>
            <div style="display:flex; gap: 8px;">
                <button class="btn btn-outline btn-sm" onclick="openOrderDetailsModal(${item.queueNumber})">View Order</button>
                <button class="btn btn-success btn-sm" onclick="completeOrder(${item.queueNumber})">Done</button>
            </div>
        `;
        queueItemsModal.appendChild(queueElement);
    });
}

function completeOrder(queueNumber) {
// ... (No change here)
    if (completeQueueItem(queueNumber)) {
        updateQueueDisplay();
        showNotification('Success', `Order #${queueNumber} completed!`, 'success');
    }
}

// Update the processPayment function to add to queue
function processPayment() {
// ... (No change here)
    console.log('=== PROCESS PAYMENT STARTED ===');
    
    if (cart.length === 0) {
        showNotification('Error', 'Cart is empty! Please add items first.', 'error');
        return;
    }
    
    const total = calculateTotal();
    
    if (!selectedPaymentMethod) {
        showNotification('Error', 'Please select a payment method!', 'error');
        return;
    }
    
    let totalPaid = 0;
    if (selectedPaymentMethod === 'multi') {
        totalPaid = paymentAmounts.cash + paymentAmounts.gcash;
    } else {
        totalPaid = selectedPaymentMethod === 'cash' ? paymentAmounts.cash : paymentAmounts.gcash;
    }
    
    const change = Math.max(0, totalPaid - total);
    
    const saleData = {
        items: cart.map(item => ({
            productId: item.originalProductId || item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size
        })),
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        discount: selectedDiscount.type !== 'none' ? total * 0.20 : 0,
        discountType: selectedDiscount.type,
        total: total,
        paymentMethod: selectedPaymentMethod,
        paymentAmounts: { ...paymentAmounts },
        change: change
    };
    
    try {
        const sale = addSale(saleData);
        
        if (sale) {
            // Add to queue
            addToQueue(sale);
            
            showReceipt(sale);
            
            cart = [];
            selectedDiscount = { type: 'none', amount: 0 };
            saveCart();
            updateCartDisplay();
            updateQueueDisplay(); // Update queue display
            resetDiscountButtons();
            loadProducts();
            
            closePaymentModal();
            showNotification('Success', `Payment processed! Queue #${lastQueueNumber}`, 'success');
        } else {
            showNotification('Error', 'Failed to process payment! Please try again.', 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Error', 'System error: ' + error.message, 'error');
    }
}

// New: Queue Modal Functions
function openQueueModal() {
// ... (No change here)
    updateQueueDisplay(); // Always update before opening
    document.getElementById('queueModal').style.display = 'flex';
}

function closeQueueModal() {
// ... (No change here)
    document.getElementById('queueModal').style.display = 'none';
}

// Update receipt to show queue number instead of barcode
function showReceipt(saleData) {
// ... (No change here)
    const receiptContent = document.getElementById('receiptContent');
    
    let itemsHTML = '';
    saleData.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const displayName = item.size ? `${product.name} (${item.size})` : product.name;
            itemsHTML += `
                <div class="receipt-item">
                    <div class="receipt-item-main">
                        <span class="receipt-item-name">${displayName}</span>
                        <span class="receipt-item-qty">${item.quantity}x</span>
                    </div>
                    <div class="receipt-item-sub">
                        <span class="receipt-item-price">@₱${item.price.toFixed(2)}</span>
                        <span class="receipt-item-total">₱${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
    });
    
    let paymentHTML = '';
    const paidAmount = saleData.paymentMethod === 'cash' ? 
        (saleData.paymentAmounts?.cash || saleData.total) : 
        (saleData.paymentAmounts?.gcash || saleData.total);
    
    if (saleData.paymentMethod === 'multi' && saleData.paymentAmounts) {
        paymentHTML = `
            <div class="receipt-payment-methods">
                <div class="receipt-payment-row">
                    <span>Cash:</span>
                    <span>₱${saleData.paymentAmounts.cash.toFixed(2)}</span>
                </div>
                <div class="receipt-payment-row">
                    <span>GCash:</span>
                    <span>₱${saleData.paymentAmounts.gcash.toFixed(2)}</span>
                </div>
                ${(saleData.paymentAmounts.cash + saleData.paymentAmounts.gcash) > saleData.total ? `
                <div class="receipt-payment-row">
                    <span>Change:</span>
                    <span>₱${((saleData.paymentAmounts.cash + saleData.paymentAmounts.gcash) - saleData.total).toFixed(2)}</span>
                </div>
                ` : ''}
            </div>
        `;
    } else {
        paymentHTML = `
            <div class="receipt-payment-methods">
                <div class="receipt-payment-row">
                    <span>${saleData.paymentMethod.toUpperCase()} Paid:</span>
                    <span>₱${paidAmount.toFixed(2)}</span>
                </div>
                ${paidAmount > saleData.total ? `
                <div class="receipt-payment-row">
                    <span>Change:</span>
                    <span>₱${(paidAmount - saleData.total).toFixed(2)}</span>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    const shopName = shopInfo.name || '';
    const shopAddress = shopInfo.address || '';
    const shopFooter = shopInfo.receiptFooter || '';

    const now = new Date();
    const dateString = now.toLocaleDateString('en-PH', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    const timeString = now.toLocaleTimeString('en-PH', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    receiptContent.innerHTML = `
        <div class="modern-receipt">
            <div class="receipt-header">
                <div class="receipt-shop-name">${shopName}</div>
                <div class="receipt-address">${shopAddress}</div>
            </div>
            
            <div class="receipt-info">
                <div class="receipt-date">${dateString} ${timeString}</div>
                <div class="receipt-transaction">Receipt #: ${saleData.id || '000001'}</div>
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-items">
                <div class="receipt-section-title">ITEMS</div>
                ${itemsHTML}
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-totals">
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>₱${saleData.subtotal.toFixed(2)}</span>
                </div>
                ${saleData.discount > 0 ? `
                <div class="receipt-total-row receipt-discount">
                    <span>Discount (${saleData.discountType.toUpperCase()}):</span>
                    <span>-₱${saleData.discount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="receipt-total-row receipt-grand-total">
                    <span>TOTAL:</span>
                    <span>₱${saleData.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="receipt-payment">
                <div class="receipt-section-title">PAYMENT</div>
                <div class="receipt-payment-method">
                    <span>Method:</span>
                    <span class="payment-method-badge ${saleData.paymentMethod}">${saleData.paymentMethod.toUpperCase()}</span>
                </div>
                ${paymentHTML}
            </div>
            
            <div class="receipt-divider"></div>
            
            <div class="receipt-footer">
                <div class="receipt-thankyou">${shopFooter}</div>
                <b><div class="receipt-greeting">Thank you for your purchase!</div></b>
            </div>
            
            <div class="receipt-divider"></div>

            <div class="receipt-queue">
                <div class="queue-number-large">Queue #${lastQueueNumber.toString().padStart(3, '0')}</div>
                <div class="queue-notice">Please wait for your number to be called</div>
            </div>
    `;
    
    document.getElementById('receiptModal').style.display = 'flex';
}

function closeReceiptModal() {
// ... (No change here)
        document.getElementById('receiptModal').style.display = 'none';
    }

function printReceipt() {
// ... (No change here)
        const receiptElement = document.querySelector('.modern-receipt');
        if (!receiptElement) {
            console.error('Receipt element not found');
            return;
        }
        
        const receiptContent = receiptElement.outerHTML;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        body { 
                            font-family: 'Courier New', monospace; 
                            margin: 0; 
                            padding: 0;
                            font-size: 12px;
                            line-height: 1.3;
                            background: white;
                        }
                        @media print {
                            body { margin: 0; padding: 0; }
                            .modern-receipt { 
                                width: 80mm !important; 
                                margin: 0 !important;
                                padding: 10px !important;
                                box-shadow: none !important;
                                font-size: 11px !important;
                            }
                        }
                        .modern-receipt { 
                            width: 80mm;
                            margin: 0 auto;
                            padding: 15px;
                            background: white;
                        }
                        .receipt-header { text-align: center; margin-bottom: 10px; }
                        .receipt-shop-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
                        .receipt-address { font-size: 10px; color: #666; }
                        .receipt-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px; }
                        .receipt-divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                        .receipt-section-title { font-weight: bold; font-size: 12px; margin-bottom: 5px; }
                        .receipt-item { margin-bottom: 5px; }
                        .receipt-item-main { display: flex; justify-content: space-between; font-weight: bold; }
                        .receipt-item-sub { display: flex; justify-content: space-between; color: #666; font-size: 10px; }
                        .receipt-total-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                        .receipt-grand-total { font-weight: bold; font-size: 14px; margin-top: 5px; }
                        .receipt-payment-method { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .receipt-payment-row { display: flex; justify-content: space-between; font-size: 11px; }
                        .receipt-footer { text-align: center; font-size: 10px; color: #666; margin-top: 15px; }
                        .receipt-barcode { display: flex; justify-content: center; gap: 2px; margin-top: 10px; }
                        .barcode-line { width: 2px; height: 30px; background: black; }
                        .barcode-line.short { height: 20px; }
                    </style>
                </head>
                <body onload="window.print(); setTimeout(() => window.close(), 500);">
                    ${receiptContent}
                </body>
            </html>
        `);
        printWindow.document.close();
    }

// Login Modal functionality 
function openLoginModal() {
// ... (No change here)
        console.log('Opening login modal...');
        document.getElementById('loginModal').style.display = 'flex';
        document.body.classList.add('modal-open'); 
        const loginBtn = document.querySelector('#loginModal .btn-primary');
        if (loginBtn) {
            loginBtn.onclick = handleLogin;
            loginBtn.style.pointerEvents = 'auto';
            loginBtn.style.cursor = 'pointer';
        }
    }

function closeLoginModal() {
// ... (No change here)
        document.getElementById('loginModal').style.display = 'none';
        document.body.classList.remove('modal-open'); 
    }

function handleLogin() {
// ... (No change here)
        console.log('✅ LOGIN BUTTON CLICKED!');
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (typeof loginUser === 'function' && loginUser(email, password)) {
            showNotification('Success', 'Login successful!', 'success');
            closeLoginModal();
            
            setTimeout(() => {
                window.location.href = 'inventory.html';
            }, 1000);
        } else {
            showNotification('Error', 'Invalid email or password!', 'error');
        }
    }
function openOrderDetailsModal(queueNumber) {
    // FIX: Close the Queue Modal when opening Order Details Modal
    closeQueueModal(); 

    const activeQueue = getActiveQueue();
    const item = activeQueue.find(q => q.queueNumber === queueNumber);
    const title = document.getElementById('orderDetailsTitle');
    const content = document.getElementById('orderDetailsContent');
    
    if (!item) {
        showNotification('Error', `Queue #${queueNumber} not found or completed.`, 'error');
        return;
    }
    
    title.textContent = `Order Details - Queue #${queueNumber.toString().padStart(3, '0')}`;
    content.innerHTML = '';
    
    item.items.forEach(orderItem => {
        const product = products.find(p => p.id === orderItem.productId);
        const displayName = orderItem.size ? `${product.name} (${orderItem.size})` : product.name;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.style.borderBottom = '1px dashed var(--border)';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${displayName}</div>
                <div class="cart-item-price">₱${(orderItem.price || 0).toFixed(2)} × ${orderItem.quantity}</div>
            </div>
            <div class="cart-item-quantity" style="font-weight: bold;">
                ₱${(orderItem.price * orderItem.quantity).toFixed(2)}
            </div>
        `;
        content.appendChild(cartItem);
    });
    content.innerHTML += `
        <div class="cart-item" style="border-bottom: none; font-weight: bold; padding-top: 15px;">
            <div class="cart-item-info">
                <div class="cart-item-name" style="font-size: 16px;">ORDER TOTAL:</div>
            </div>
            <div class="cart-item-quantity" style="font-size: 18px; color: var(--primary);">
                ₱${item.total.toFixed(2)}
            </div>
        </div>
    `;

    document.getElementById('orderDetailsModal').style.display = 'flex';
}
function closeOrderDetailsModal() {
// ... (No change here)
    document.getElementById('orderDetailsModal').style.display = 'none';
}
// Initialize when page loads
    document.addEventListener('DOMContentLoaded', initPOS);