// public/js/views/POS.js
import { apiFetch, showToast } from '../api.js';

let cart = [];
let allProducts = [];
let allCategories = [];
let allPlans = [];
let customers = [];
let paymentMethods = [];
let selectedCategory = 'all';

export async function renderPOS(container) {
    try {
        // 🔐 Verificar que hay caja abierta antes de operar el POS
        let cashStatus = null;
        try {
            cashStatus = await apiFetch('/cash-registers/status');
        } catch (_) { /* 400 = no hay caja abierta */ }

        if (!cashStatus) {
            container.innerHTML = `
                <div class="top-bar">
                    <h2><i class="fa-solid fa-cart-shopping"></i> Punto de Venta (POS)</h2>
                </div>
                <div style="display:flex;justify-content:center;align-items:center;min-height:60vh">
                    <div class="glass-panel" style="max-width:460px;width:100%;text-align:center;">
                        <div style="font-size:4rem;margin-bottom:16px">🔒</div>
                        <h2 style="margin-bottom:8px">Caja cerrada</h2>
                        <p class="text-secondary" style="margin-bottom:28px">
                            No puedes procesar ventas porque no tienes un turno de caja abierto.<br>
                            Ve a <strong>Control de Caja</strong> y abre tu turno primero.
                        </p>
                        <button class="btn btn-primary" style="padding: 14px 32px" onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: 'cash-register' }))">
                            <i class="fa-solid fa-cash-register"></i> Ir a Abrir Caja
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const [productsData, categoriesData, plansData, customersData, paymentMethodsData] = await Promise.all([
            apiFetch('/products'),
            apiFetch('/products/categories'),
            apiFetch('/plans'),
            apiFetch('/customers'),
            apiFetch('/payment-methods')
        ]);

        allProducts = productsData;
        allCategories = categoriesData;
        allPlans = plansData;
        customers = customersData;
        paymentMethods = paymentMethodsData;

        container.innerHTML = `
            <div class="top-bar">
                <div>
                    <h2><i class="fa-solid fa-cart-shopping text-neon"></i> Punto de Venta (POS)</h2>
                    <p class="text-secondary">Venta rápida de productos (aguas, batidos, suplementos) y planes de gimnasio con descuentos automáticos.</p>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-secondary" id="btn-refresh-pos"><i class="fa-solid fa-rotate"></i> Actualizar</button>
                    <button class="btn btn-primary" id="btn-view-sales-history"><i class="fa-solid fa-clock-rotate-left"></i> Historial de Ventas</button>
                </div>
            </div>

            <div class="pos-container">
                <!-- PANEL IZQUIERDO: CATÁLOGO Y BUSCADOR -->
                <div class="pos-catalogue">
                    <div class="pos-search-bar">
                        <div style="flex:1; position:relative;">
                            <input type="text" id="pos-search-input" class="form-control" placeholder="🔍 Buscar por nombre o código de barras (Enter)..." autofocus>
                        </div>
                    </div>

                    <!-- PILLS DE CATEGORÍAS -->
                    <div class="category-pills" id="category-pills">
                        <div class="category-pill active" data-cat="all">Todos</div>
                        <div class="category-pill" data-cat="plans">🏋️ Planes / Servicios</div>
                        ${allCategories.map(c => `<div class="category-pill" data-cat="${c.id}">${c.name}</div>`).join('')}
                    </div>

                    <!-- GRID DE PRODUCTOS -->
                    <div class="products-grid" id="pos-products-grid"></div>
                </div>

                <!-- PANEL DERECHO: TICKET Y CARRITO REACTIVO -->
                <div class="pos-cart-panel">
                    <div class="d-flex justify-between align-center">
                        <h4><i class="fa-solid fa-receipt text-neon"></i> Ticket Actual</h4>
                        <button class="btn btn-secondary btn-sm" id="btn-clear-cart" title="Vaciar Carrito"><i class="fa-solid fa-trash"></i></button>
                    </div>

                    <!-- CLIENTE SELECTOR -->
                    <div class="mt-2">
                        <select id="pos-customer-select" class="form-control">
                            <option value="">👤 Consumidor Final (General)</option>
                            ${customers.map(c => `<option value="${c.id}">👤 ${c.fullName} (${c.contact})</option>`).join('')}
                        </select>
                    </div>

                    <!-- LISTA DE ITEMS -->
                    <div class="cart-items-list" id="cart-items-list">
                        <div class="text-center text-secondary mt-3">
                            <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; opacity: 0.3;"></i>
                            <p class="mt-1">El carrito está vacío.<br>Haz clic en los productos para agregarlos.</p>
                        </div>
                    </div>

                    <!-- RESUMEN FINANCIERO Y DESCUENTOS -->
                    <div class="cart-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span id="cart-subtotal">$0.00</span>
                        </div>
                        <div class="summary-row" style="color: var(--warning);">
                            <span>Descuentos aplicados:</span>
                            <span id="cart-discount">-$0.00</span>
                        </div>
                        <div class="summary-row summary-total">
                            <span>Total a Cobrar:</span>
                            <span class="text-neon" id="cart-total">$0.00</span>
                        </div>

                        <!-- MÉTODO DE PAGO -->
                        <div class="form-group mt-1 mb-1">
                            <label><i class="fa-solid fa-credit-card"></i> Forma de Pago</label>
                            <select id="pos-payment-method-select" class="form-control">
                                ${paymentMethods.map(pm => `<option value="${pm.id}">${pm.name}</option>`).join('')}
                            </select>
                        </div>

                        <button class="btn btn-success btn-block" id="btn-checkout" style="padding: 14px; font-size: 1.1rem;" disabled>
                            <i class="fa-solid fa-cash-register"></i> Cobrar e Imprimir
                        </button>
                    </div>
                </div>
            </div>

            <!-- CONTENEDOR MODAL PARA VENTAS -->
            <div id="pos-modal-container"></div>
        `;

        setupPOSEvents();
        renderProductsGrid();
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="glass-panel text-danger">Error al cargar POS: ${e.message}</div>`;
    }
}

function setupPOSEvents() {
    // Categorías
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedCategory = pill.dataset.cat;
            renderProductsGrid();
        });
    });

    // Buscador
    const searchInput = document.getElementById('pos-search-input');
    searchInput.addEventListener('input', () => renderProductsGrid());
    searchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) return;
            // Buscar por código de barras exacto primero
            const exactProduct = allProducts.find(p => p.barcode && p.barcode.toLowerCase() === query.toLowerCase());
            if (exactProduct) {
                addToCart('product', exactProduct.id);
                searchInput.value = '';
                renderProductsGrid();
            }
        }
    });

    // Vaciar carrito
    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        cart = [];
        updateCartUI();
    });

    // Botón cobrar
    document.getElementById('btn-checkout').addEventListener('click', openCheckoutModal);

    // Actualizar
    document.getElementById('btn-refresh-pos').addEventListener('click', () => {
        renderPOS(document.getElementById('router-view'));
    });

    // Historial
    document.getElementById('btn-view-sales-history').addEventListener('click', openSalesHistoryModal);
}

function renderProductsGrid() {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    const search = document.getElementById('pos-search-input').value.toLowerCase();
    let itemsHTML = '';

    // Si la categoría no es sólo planes, mostrar productos
    if (selectedCategory !== 'plans') {
        const filteredProducts = allProducts.filter(p => {
            const matchesCat = selectedCategory === 'all' || p.categoryId === parseInt(selectedCategory);
            const matchesSearch = p.name.toLowerCase().includes(search) || (p.barcode && p.barcode.toLowerCase().includes(search));
            return matchesCat && matchesSearch;
        });

        itemsHTML += filteredProducts.map(p => {
            const isOutOfStock = p.stock <= 0;
            return `
                <div class="product-pos-card ${isOutOfStock ? 'disabled' : ''}" data-type="product" data-id="${p.id}" style="${isOutOfStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    <div class="product-pos-icon">
                        <i class="${getCategoryIcon(p.categoryId)}"></i>
                    </div>
                    <div>
                        <div class="product-pos-name">${p.name}</div>
                        <div class="product-pos-price">$${p.salePrice.toFixed(2)}</div>
                        <div class="product-pos-stock ${p.stock <= p.minStock ? 'text-danger' : ''}">
                            ${isOutOfStock ? '⚠️ Agotado' : `Stock: ${p.stock} un.`}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Si la categoría es 'all' o 'plans', mostrar planes
    if (selectedCategory === 'all' || selectedCategory === 'plans') {
        const filteredPlans = allPlans.filter(p => {
            const title = p.service?.title || 'Plan';
            return title.toLowerCase().includes(search);
        });

        itemsHTML += filteredPlans.map(pl => {
            const title = pl.service?.title ? `${pl.service.title} (${pl.type === 'daily' ? 'Diario' : 'Mensual'})` : `Plan #${pl.id}`;
            return `
                <div class="product-pos-card" data-type="plan" data-id="${pl.id}" style="border-color: rgba(175, 82, 222, 0.4);">
                    <div class="product-pos-icon text-purple">
                        <i class="fa-solid fa-dumbbell"></i>
                    </div>
                    <div>
                        <div class="product-pos-name">${title}</div>
                        <div class="product-pos-price">$${pl.price.toFixed(2)}</div>
                        <div class="product-pos-stock text-secondary">Servicio Gym</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (!itemsHTML) {
        grid.innerHTML = `<div class="text-secondary" style="grid-column: 1/-1; text-align: center; padding: 40px;">No se encontraron productos o servicios que coincidan.</div>`;
        return;
    }

    grid.innerHTML = itemsHTML;

    // Click en producto
    grid.querySelectorAll('.product-pos-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            const id = parseInt(card.dataset.id);
            addToCart(type, id);
        });
    });
}

function getCategoryIcon(catId) {
    const cat = allCategories.find(c => c.id === catId);
    if (!cat) return 'fa-solid fa-box';
    const name = cat.name.toLowerCase();
    if (name.includes('bebida') || name.includes('agua')) return 'fa-solid fa-bottle-water';
    if (name.includes('batido')) return 'fa-solid fa-blender';
    if (name.includes('suplemento') || name.includes('prote')) return 'fa-solid fa-prescription-bottle';
    if (name.includes('snack')) return 'fa-solid fa-cookie-bite';
    if (name.includes('ropa') || name.includes('accesorio')) return 'fa-solid fa-shirt';
    return 'fa-solid fa-bag-shopping';
}

function addToCart(itemType, id) {
    const existingIndex = cart.findIndex(item => item.itemType === itemType && item.id === id);

    if (itemType === 'product') {
        const product = allProducts.find(p => p.id === id);
        if (!product) return;
        const currentQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
        if (product.stock <= currentQty) {
            showToast(`No hay más stock disponible de ${product.name} (${product.stock} un.)`, 'warning');
            return;
        }
    }

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({ itemType, id, quantity: 1 });
    }

    updateCartUI();
}

async function updateCartUI() {
    const cartList = document.getElementById('cart-items-list');
    const checkoutBtn = document.getElementById('btn-checkout');

    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="text-center text-secondary mt-3">
                <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; opacity: 0.3;"></i>
                <p class="mt-1">El carrito está vacío.<br>Haz clic en los productos para agregarlos.</p>
            </div>
        `;
        document.getElementById('cart-subtotal').textContent = '$0.00';
        document.getElementById('cart-discount').textContent = '-$0.00';
        document.getElementById('cart-total').textContent = '$0.00';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;

    try {
        // Cotizar en tiempo real con el motor de descuentos
        const quote = await apiFetch('/pos/quote', {
            method: 'POST',
            body: JSON.stringify({ items: cart })
        });

        cartList.innerHTML = quote.items.map((item, idx) => `
            <div class="cart-item-row">
                <div class="cart-item-header">
                    <span class="cart-item-title">${item.name}</span>
                    <button class="btn-icon text-danger" onclick="window.removeCartItem(${idx})" style="background:none; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-stepper">
                        <button class="qty-btn" onclick="window.changeCartQty(${idx}, -1)">-</button>
                        <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
                        <button class="qty-btn" onclick="window.changeCartQty(${idx}, 1)">+</button>
                    </div>
                    <div class="text-right">
                        ${item.discountApplied > 0 ? `
                            <div class="discount-badge-item">
                                <i class="fa-solid fa-tag"></i> Promo: -$${item.discountApplied.toFixed(2)}
                            </div>
                        ` : ''}
                        <span style="font-weight: 700; font-size: 1rem;">$${item.finalSubtotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('cart-subtotal').textContent = `$${quote.subtotal.toFixed(2)}`;
        document.getElementById('cart-discount').textContent = `-$${quote.discountTotal.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${quote.total.toFixed(2)}`;

    } catch (e) {
        console.error("Error al cotizar carrito:", e);
    }
}

// Global hooks for cart buttons
window.changeCartQty = (index, delta) => {
    if (!cart[index]) return;
    const newQty = cart[index].quantity + delta;

    if (newQty <= 0) {
        cart.splice(index, 1);
    } else {
        if (cart[index].itemType === 'product') {
            const product = allProducts.find(p => p.id === cart[index].id);
            if (product && product.stock < newQty) {
                showToast(`Stock máximo alcanzado para ${product.name}`, 'warning');
                return;
            }
        }
        cart[index].quantity = newQty;
    }
    updateCartUI();
};

window.removeCartItem = (index) => {
    cart.splice(index, 1);
    updateCartUI();
};

async function openCheckoutModal() {
    if (cart.length === 0) return;

    const modalContainer = document.getElementById('pos-modal-container');
    const customerId = document.getElementById('pos-customer-select').value;
    const paymentMethodId = parseInt(document.getElementById('pos-payment-method-select').value);

    // Obtener cotización final
    const quote = await apiFetch('/pos/quote', {
        method: 'POST',
        body: JSON.stringify({ items: cart })
    });

    modalContainer.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content glass-panel" style="max-width: 440px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-cash-register text-neon"></i> Confirmar Cobro</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div>
                    <div class="ticket-box mb-2">
                        <div class="text-center" style="font-weight: bold; font-size: 1.1rem;">GYM PRO POS</div>
                        <div class="text-center text-secondary">${new Date().toLocaleString()}</div>
                        <hr>
                        ${quote.items.map(i => `
                            <div class="ticket-row">
                                <span>${i.quantity}x ${i.name}</span>
                                <span>$${i.finalSubtotal.toFixed(2)}</span>
                            </div>
                            ${i.discountApplied > 0 ? `<div style="font-size: 0.75rem; color: green;">* Descuento aplicado: -$${i.discountApplied.toFixed(2)}</div>` : ''}
                        `).join('')}
                        <hr>
                        <div class="ticket-row"><span>Subtotal:</span><span>$${quote.subtotal.toFixed(2)}</span></div>
                        <div class="ticket-row" style="color: green;"><span>Descuentos:</span><span>-$${quote.discountTotal.toFixed(2)}</span></div>
                        <div class="ticket-row" style="font-weight:bold; font-size: 1.1rem;"><span>TOTAL:</span><span>$${quote.total.toFixed(2)}</span></div>
                    </div>

                    <div class="form-group">
                        <label>Efectivo Recibido ($)</label>
                        <input type="number" id="cash-received-input" class="form-control" placeholder="0.00" step="0.01" value="${quote.total.toFixed(2)}">
                    </div>

                    <div class="summary-row mb-2" style="font-size: 1.1rem; font-weight: bold;">
                        <span>Cambio / Vuelto:</span>
                        <span class="text-success" id="cash-change-display">$0.00</span>
                    </div>

                    <button class="btn btn-success btn-block" id="btn-confirm-pos-sale" style="padding: 14px;">
                        <i class="fa-solid fa-check-circle"></i> Finalizar Venta
                    </button>
                </div>
            </div>
        </div>
    `;

    const cashInput = document.getElementById('cash-received-input');
    const changeDisplay = document.getElementById('cash-change-display');

    const updateChange = () => {
        const received = parseFloat(cashInput.value) || 0;
        const change = Math.max(0, received - quote.total);
        changeDisplay.textContent = `$${change.toFixed(2)}`;
    };

    cashInput.addEventListener('input', updateChange);
    updateChange();

    modalContainer.querySelector('.close-modal').addEventListener('click', () => {
        modalContainer.innerHTML = '';
    });

    document.getElementById('btn-confirm-pos-sale').addEventListener('click', async () => {
        try {
            const sale = await apiFetch('/pos/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    customerId: customerId ? parseInt(customerId) : null,
                    paymentMethodId,
                    items: cart
                })
            });

            showToast(`¡Venta ${sale.saleNumber} realizada con éxito!`, 'success');
            modalContainer.innerHTML = '';
            cart = [];
            // Recargar datos y refrescar POS
            renderPOS(document.getElementById('router-view'));
        } catch (e) {
            console.error(e);
        }
    });
}

async function openSalesHistoryModal() {
    const modalContainer = document.getElementById('pos-modal-container');
    try {
        const sales = await apiFetch('/pos/sales');

        modalContainer.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content glass-panel" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-clock-rotate-left text-neon"></i> Historial de Tickets / Ventas POS</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="table-container" style="max-height: 60vh;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket #</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Método</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sales.map(s => `
                                    <tr>
                                        <td><strong>${s.saleNumber}</strong></td>
                                        <td>${new Date(s.createdAt).toLocaleString()}</td>
                                        <td>${s.customer?.fullName || 'Consumidor Final'}</td>
                                        <td>${s.paymentMethod?.name || '-'}</td>
                                        <td><strong>$${s.total.toFixed(2)}</strong></td>
                                        <td><span class="badge ${s.status === 'completed' ? 'badge-success' : 'badge-danger'}">${s.status}</span></td>
                                        <td>
                                            ${s.status === 'completed' ? `
                                                <button class="btn btn-secondary btn-sm" onclick="window.cancelSaleAction(${s.id})"><i class="fa-solid fa-ban"></i> Anular</button>
                                            ` : '-'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        modalContainer.querySelector('.close-modal').addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        window.cancelSaleAction = async (id) => {
            if (!confirm("¿Estás seguro de anular esta venta? El stock de los productos vendidos será reintegrado automáticamente.")) return;
            try {
                await apiFetch(`/pos/sales/${id}/cancel`, {
                    method: 'POST',
                    body: JSON.stringify({ reason: 'Anulación solicitada por administrador' })
                });
                showToast("Venta anulada correctamente", "success");
                openSalesHistoryModal();
            } catch (e) {
                console.error(e);
            }
        };

    } catch (e) {
        showToast(e.message, 'error');
    }
}
