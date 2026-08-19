// public/js/views/Products.js
import { apiFetch, showToast } from '../api.js';

let products = [];
let categories = [];
let suppliers = [];

export async function renderProducts(container) {
    try {
        const [prodData, catData, supData] = await Promise.all([
            apiFetch('/products?includeInactive=true'),
            apiFetch('/products/categories'),
            apiFetch('/suppliers')
        ]);

        products = prodData;
        categories = catData;
        suppliers = supData;

        const lowStockCount = products.filter(p => p.isActive && p.stock <= p.minStock).length;

        container.innerHTML = `
            <div class="top-bar">
                <div>
                    <h2><i class="fa-solid fa-bottle-water text-neon"></i> Catálogo de Productos e Inventario</h2>
                    <p class="text-secondary">Administración de bebidas, batidos nutritivos, suplementos y control de existencias.</p>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-secondary" id="btn-manage-categories"><i class="fa-solid fa-folder-tree"></i> Categorías</button>
                    <button class="btn btn-primary" id="btn-new-product"><i class="fa-solid fa-plus"></i> Nuevo Producto</button>
                </div>
            </div>

            ${lowStockCount > 0 ? `
                <div class="glass-card mb-2" style="border-left: 4px solid var(--warning); background: rgba(255, 214, 10, 0.05);">
                    <div class="d-flex align-center gap-1">
                        <i class="fa-solid fa-triangle-exclamation text-warning" style="font-size: 1.3rem;"></i>
                        <div>
                            <strong>Alerta de Inventario:</strong> Hay <strong>${lowStockCount}</strong> producto(s) con stock igual o inferior al mínimo configurado.
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="glass-panel">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Código / Barcode</th>
                                <th>Proveedor</th>
                                <th>P. Costo</th>
                                <th>P. Venta</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.length === 0 ? `
                                <tr><td colspan="9" class="text-center text-secondary">No hay productos registrados. Crea el primero.</td></tr>
                            ` : products.map(p => {
                                const isLow = p.stock <= p.minStock;
                                return `
                                    <tr>
                                        <td><strong>${p.name}</strong></td>
                                        <td><span class="badge badge-neutral">${p.category?.name || 'General'}</span></td>
                                        <td><code>${p.barcode || '-'}</code></td>
                                        <td>${p.supplier?.name || '-'}</td>
                                        <td>$${p.costPrice.toFixed(2)}</td>
                                        <td><strong class="text-success">$${p.salePrice.toFixed(2)}</strong></td>
                                        <td>
                                            <span class="badge ${p.stock <= 0 ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}">
                                                ${p.stock} un. ${isLow ? '(Bajo)' : ''}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge ${p.isActive ? 'badge-success' : 'badge-neutral'}">
                                                ${p.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-secondary btn-sm" onclick="window.openStockEntryModal(${p.id})" title="Entrada de Stock"><i class="fa-solid fa-boxes-stacked"></i></button>
                                            <button class="btn btn-secondary btn-sm" onclick="window.openEditProductModal(${p.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                                            <button class="btn btn-secondary btn-sm text-danger" onclick="window.deleteProductAction(${p.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- MODAL CONTAINER -->
            <div id="product-modal-container"></div>
        `;

        setupProductEvents();

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="glass-panel text-danger">Error al cargar productos: ${e.message}</div>`;
    }
}

function setupProductEvents() {
    document.getElementById('btn-new-product').addEventListener('click', () => openProductModal());
    document.getElementById('btn-manage-categories').addEventListener('click', () => openCategoriesModal());

    window.openEditProductModal = (id) => {
        const prod = products.find(p => p.id === id);
        if (prod) openProductModal(prod);
    };

    window.openStockEntryModal = (id) => {
        const prod = products.find(p => p.id === id);
        if (prod) openStockModal(prod);
    };

    window.deleteProductAction = async (id) => {
        if (!confirm("¿Deseas dar de baja este producto?")) return;
        try {
            await apiFetch(`/products/${id}`, { method: 'DELETE' });
            showToast("Producto eliminado / desactivado", "success");
            renderProducts(document.getElementById('router-view'));
        } catch (e) {
            console.error(e);
        }
    };
}

function openProductModal(product = null) {
    const modalContainer = document.getElementById('product-modal-container');
    const isEdit = Boolean(product);

    modalContainer.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content glass-panel">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-box text-neon"></i> ${isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="product-form">
                    <div class="form-group">
                        <label>Nombre del Producto *</label>
                        <input type="text" id="p-name" class="form-control" placeholder="Ej. Agua Mineral 500ml, Batido Proteico" value="${product?.name || ''}" required>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Categoría *</label>
                            <select id="p-category" class="form-control" required>
                                ${categories.map(c => `<option value="${c.id}" ${product?.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Proveedor (Opcional)</label>
                            <select id="p-supplier" class="form-control">
                                <option value="">Sin proveedor asignado</option>
                                ${suppliers.map(s => `<option value="${s.id}" ${product?.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Código de Barras / SKU (Opcional)</label>
                        <input type="text" id="p-barcode" class="form-control" placeholder="Escanea o escribe el código" value="${product?.barcode || ''}">
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Precio Costo ($)</label>
                            <input type="number" id="p-cost" class="form-control" step="0.01" value="${product?.costPrice || '0.00'}" required>
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Precio Venta ($) *</label>
                            <input type="number" id="p-sale" class="form-control" step="0.01" value="${product?.salePrice || ''}" required>
                        </div>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Stock Inicial</label>
                            <input type="number" id="p-stock" class="form-control" value="${product?.stock || '0'}" ${isEdit ? 'disabled' : ''}>
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Stock Mínimo (Alerta)</label>
                            <input type="number" id="p-min-stock" class="form-control" value="${product?.minStock !== undefined ? product.minStock : '5'}">
                        </div>
                    </div>

                    ${isEdit ? `
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="p-active" ${product.isActive ? 'checked' : ''}> Producto Activo para Venta
                            </label>
                        </div>
                    ` : ''}

                    <div class="d-flex justify-between mt-2">
                        <button type="button" class="btn btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar Producto</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const closeModal = () => modalContainer.innerHTML = '';
    modalContainer.querySelector('.close-modal').addEventListener('click', closeModal);
    modalContainer.querySelector('.close-modal-btn').addEventListener('click', closeModal);

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('p-name').value.trim(),
            categoryId: parseInt(document.getElementById('p-category').value),
            supplierId: document.getElementById('p-supplier').value ? parseInt(document.getElementById('p-supplier').value) : null,
            barcode: document.getElementById('p-barcode').value.trim() || null,
            costPrice: parseFloat(document.getElementById('p-cost').value) || 0,
            salePrice: parseFloat(document.getElementById('p-sale').value) || 0,
            stock: parseInt(document.getElementById('p-stock').value) || 0,
            minStock: parseInt(document.getElementById('p-min-stock').value) || 5,
            isActive: isEdit ? document.getElementById('p-active').checked : true
        };

        try {
            if (isEdit) {
                await apiFetch(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(payload) });
                showToast("Producto actualizado", "success");
            } else {
                await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
                showToast("Producto creado con éxito", "success");
            }
            closeModal();
            renderProducts(document.getElementById('router-view'));
        } catch (err) {
            console.error(err);
        }
    });
}

function openStockModal(product) {
    const modalContainer = document.getElementById('product-modal-container');

    modalContainer.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content glass-panel" style="max-width: 450px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-boxes-stacked text-neon"></i> Entrada de Stock / Compra</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="stock-form">
                    <p>Producto: <strong>${product.name}</strong></p>
                    <p class="text-secondary mb-2">Stock actual: <strong>${product.stock} un.</strong></p>

                    <div class="form-group">
                        <label>Proveedor *</label>
                        <select id="s-supplier" class="form-control" required>
                            ${suppliers.map(s => `<option value="${s.id}" ${product.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Cantidad a Ingresar *</label>
                            <input type="number" id="s-qty" class="form-control" min="1" placeholder="Ej. 24" required>
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Costo Unitario ($)</label>
                            <input type="number" id="s-cost" class="form-control" step="0.01" value="${product.costPrice.toFixed(2)}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Nota / Factura de Compra</label>
                        <input type="text" id="s-reason" class="form-control" placeholder="Ej. Factura #00123">
                    </div>

                    <div class="d-flex justify-between mt-2">
                        <button type="button" class="btn btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn btn-success"><i class="fa-solid fa-check"></i> Registrar Entrada</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const closeModal = () => modalContainer.innerHTML = '';
    modalContainer.querySelector('.close-modal').addEventListener('click', closeModal);
    modalContainer.querySelector('.close-modal-btn').addEventListener('click', closeModal);

    document.getElementById('stock-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            productId: product.id,
            supplierId: parseInt(document.getElementById('s-supplier').value),
            quantity: parseInt(document.getElementById('s-qty').value),
            unitCost: parseFloat(document.getElementById('s-cost').value),
            reason: document.getElementById('s-reason').value.trim()
        };

        try {
            await apiFetch('/inventory/purchases', { method: 'POST', body: JSON.stringify(payload) });
            showToast("Stock y costo actualizados correctamente", "success");
            closeModal();
            renderProducts(document.getElementById('router-view'));
        } catch (err) {
            console.error(err);
        }
    });
}

function openCategoriesModal() {
    const modalContainer = document.getElementById('product-modal-container');

    modalContainer.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content glass-panel" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-folder-tree text-neon"></i> Categorías de Productos</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div>
                    <form id="new-cat-form" class="d-flex gap-1 mb-2">
                        <input type="text" id="cat-name-input" class="form-control" placeholder="Nueva categoría..." required>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-plus"></i></button>
                    </form>

                    <div class="table-container" style="max-height: 40vh;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${categories.map(c => `
                                    <tr>
                                        <td><strong>${c.name}</strong></td>
                                        <td>
                                            <button class="btn btn-secondary btn-sm text-danger" onclick="window.deleteCategoryAction(${c.id})"><i class="fa-solid fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    modalContainer.querySelector('.close-modal').addEventListener('click', () => modalContainer.innerHTML = '');

    document.getElementById('new-cat-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name-input').value.trim();
        if (!name) return;
        try {
            await apiFetch('/products/categories', { method: 'POST', body: JSON.stringify({ name }) });
            showToast("Categoría creada", "success");
            modalContainer.innerHTML = '';
            renderProducts(document.getElementById('router-view'));
        } catch (err) {
            console.error(err);
        }
    });

    window.deleteCategoryAction = async (id) => {
        if (!confirm("¿Eliminar esta categoría?")) return;
        try {
            await apiFetch(`/products/categories/${id}`, { method: 'DELETE' });
            showToast("Categoría eliminada", "success");
            modalContainer.innerHTML = '';
            renderProducts(document.getElementById('router-view'));
        } catch (err) {
            console.error(err);
        }
    };
}
