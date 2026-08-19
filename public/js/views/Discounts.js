// public/js/views/Discounts.js
import { apiFetch, showToast } from '../api.js';

let discounts = [];
let products = [];
let categories = [];
let plans = [];

export async function renderDiscounts(container) {
    try {
        const [discData, prodData, catData, plansData] = await Promise.all([
            apiFetch('/discounts'),
            apiFetch('/products'),
            apiFetch('/products/categories'),
            apiFetch('/plans')
        ]);

        discounts = discData;
        products = prodData;
        categories = catData;
        plans = plansData;

        container.innerHTML = `
            <div class="top-bar">
                <div>
                    <h2><i class="fa-solid fa-tags text-neon"></i> Motor de Promociones y Descuentos</h2>
                    <p class="text-secondary">Configura ofertas automáticas por volumen (ej. al comprar más de 2 unidades) y por tiempo (rango de fechas o Happy Hour).</p>
                </div>
                <button class="btn btn-primary" id="btn-new-discount"><i class="fa-solid fa-plus"></i> Nueva Promoción</button>
            </div>

            <div class="glass-panel">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre de la Promo</th>
                                <th>Tipo de Regla</th>
                                <th>Descuento</th>
                                <th>Condición / Cantidad</th>
                                <th>Aplica a</th>
                                <th>Vigencia Horaria / Fecha</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${discounts.length === 0 ? `
                                <tr><td colspan="8" class="text-center text-secondary">No hay promociones configuradas. ¡Crea la primera para impulsar tus ventas!</td></tr>
                            ` : discounts.map(d => `
                                <tr>
                                    <td><strong>${d.name}</strong></td>
                                    <td><span class="badge ${d.type === 'bulk_quantity' ? 'badge-orange' : 'badge-purple'}">${formatDiscountType(d.type)}</span></td>
                                    <td><strong class="text-success">${d.discountType === 'percentage' ? `${d.value}% OFF` : `-$${d.value.toFixed(2)}`}</strong></td>
                                    <td>${d.minQuantity > 1 ? `Al comprar <strong>≥ ${d.minQuantity} un.</strong>` : 'Desde 1 un.'}</td>
                                    <td>${formatTarget(d)}</td>
                                    <td><small class="text-secondary">${formatValidity(d)}</small></td>
                                    <td>
                                        <button class="badge ${d.isActive ? 'badge-success' : 'badge-neutral'}" onclick="window.toggleDiscountAction(${d.id}, ${!d.isActive})" style="cursor: pointer; border: none;">
                                            ${d.isActive ? 'Activo' : 'Pausado'}
                                        </button>
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="window.openEditDiscountModal(${d.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                                        <button class="btn btn-secondary btn-sm text-danger" onclick="window.deleteDiscountAction(${d.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- MODAL CONTAINER -->
            <div id="discount-modal-container"></div>
        `;

        setupDiscountEvents();

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="glass-panel text-danger">Error al cargar promociones: ${e.message}</div>`;
    }
}

function formatDiscountType(type) {
    if (type === 'bulk_quantity') return 'Por Cantidad / Volumen';
    if (type === 'time_range') return 'Por Tiempo / Horario';
    return 'General';
}

function formatTarget(d) {
    if (d.targetType === 'all') return 'Todos los productos';
    if (d.targetType === 'product') {
        const prod = products.find(p => p.id === d.targetId);
        return `Producto: <strong>${prod ? prod.name : '#' + d.targetId}</strong>`;
    }
    if (d.targetType === 'category') {
        const cat = categories.find(c => c.id === d.targetId);
        return `Categoría: <strong>${cat ? cat.name : '#' + d.targetId}</strong>`;
    }
    if (d.targetType === 'plan') {
        const pl = plans.find(p => p.id === d.targetId);
        return `Plan: <strong>${pl?.service?.title || '#' + d.targetId}</strong>`;
    }
    return '-';
}

function formatValidity(d) {
    const parts = [];
    if (d.startDate && d.endDate) parts.push(`${d.startDate} al ${d.endDate}`);
    else if (d.startDate) parts.push(`Desde ${d.startDate}`);
    else if (d.endDate) parts.push(`Hasta ${d.endDate}`);

    if (d.startTime && d.endTime) parts.push(`⏰ ${d.startTime} - ${d.endTime}`);

    return parts.length > 0 ? parts.join(' | ') : 'Siempre vigente';
}

function setupDiscountEvents() {
    document.getElementById('btn-new-discount').addEventListener('click', () => openDiscountModal());

    window.openEditDiscountModal = (id) => {
        const disc = discounts.find(d => d.id === id);
        if (disc) openDiscountModal(disc);
    };

    window.toggleDiscountAction = async (id, newStatus) => {
        try {
            await apiFetch(`/discounts/${id}/toggle-active`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: newStatus })
            });
            showToast(`Promoción ${newStatus ? 'activada' : 'pausada'}`, 'success');
            renderDiscounts(document.getElementById('router-view'));
        } catch (e) {
            console.error(e);
        }
    };

    window.deleteDiscountAction = async (id) => {
        if (!confirm("¿Deseas eliminar esta promoción?")) return;
        try {
            await apiFetch(`/discounts/${id}`, { method: 'DELETE' });
            showToast("Promoción eliminada", "success");
            renderDiscounts(document.getElementById('router-view'));
        } catch (e) {
            console.error(e);
        }
    };
}

function openDiscountModal(discount = null) {
    const modalContainer = document.getElementById('discount-modal-container');
    const isEdit = Boolean(discount);

    modalContainer.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content glass-panel" style="max-width: 550px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-tag text-neon"></i> ${isEdit ? 'Editar Promoción' : 'Nueva Promoción / Descuento'}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="discount-form">
                    <div class="form-group">
                        <label>Nombre de la Promoción *</label>
                        <input type="text" id="d-name" class="form-control" placeholder="Ej. 15% Descuento en Aguas al llevar 3 o más" value="${discount?.name || ''}" required>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Tipo de Promoción</label>
                            <select id="d-type" class="form-control">
                                <option value="bulk_quantity" ${discount?.type === 'bulk_quantity' ? 'selected' : ''}>Por Cantidad / Volumen</option>
                                <option value="time_range" ${discount?.type === 'time_range' ? 'selected' : ''}>Por Horario / Tiempo (Happy Hour)</option>
                                <option value="percentage_all" ${discount?.type === 'percentage_all' ? 'selected' : ''}>Descuento General</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Forma de Cálculo</label>
                            <select id="d-discount-type" class="form-control">
                                <option value="percentage" ${discount?.discountType === 'percentage' ? 'selected' : ''}>Porcentaje (%)</option>
                                <option value="fixed_amount" ${discount?.discountType === 'fixed_amount' ? 'selected' : ''}>Monto Fijo ($)</option>
                            </select>
                        </div>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Valor del Descuento *</label>
                            <input type="number" id="d-value" class="form-control" placeholder="Ej. 10 para 10% o 1.50 para $1.50" step="0.01" value="${discount?.value || ''}" required>
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Cantidad Mínima Requerida</label>
                            <input type="number" id="d-min-qty" class="form-control" min="1" value="${discount?.minQuantity || '1'}">
                        </div>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Aplica a</label>
                            <select id="d-target-type" class="form-control">
                                <option value="all" ${discount?.targetType === 'all' ? 'selected' : ''}>Todos los productos</option>
                                <option value="product" ${discount?.targetType === 'product' ? 'selected' : ''}>Producto Específico</option>
                                <option value="category" ${discount?.targetType === 'category' ? 'selected' : ''}>Categoría Completa</option>
                                <option value="plan" ${discount?.targetType === 'plan' ? 'selected' : ''}>Plan de Gimnasio</option>
                            </select>
                        </div>
                        <div class="form-group" id="target-id-group" style="flex:1; display: none;">
                            <label id="target-id-label">Seleccionar Objetivo</label>
                            <select id="d-target-id" class="form-control"></select>
                        </div>
                    </div>

                    <div class="glass-card mb-2" style="padding: 12px;">
                        <label style="font-weight: 600; font-size: 0.85rem;" class="text-neon">⏰ Vigencia Opcional (Fechas y Horarios)</label>
                        <div class="d-flex gap-1 mt-1">
                            <div style="flex:1;">
                                <label style="font-size:0.75rem;">Fecha Inicio</label>
                                <input type="date" id="d-start-date" class="form-control" value="${discount?.startDate || ''}">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size:0.75rem;">Fecha Fin</label>
                                <input type="date" id="d-end-date" class="form-control" value="${discount?.endDate || ''}">
                            </div>
                        </div>
                        <div class="d-flex gap-1 mt-1">
                            <div style="flex:1;">
                                <label style="font-size:0.75rem;">Hora Inicio (ej. 18:00)</label>
                                <input type="time" id="d-start-time" class="form-control" value="${discount?.startTime || ''}">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size:0.75rem;">Hora Fin (ej. 20:00)</label>
                                <input type="time" id="d-end-time" class="form-control" value="${discount?.endTime || ''}">
                            </div>
                        </div>
                    </div>

                    <div class="d-flex justify-between mt-2">
                        <button type="button" class="btn btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar Promoción</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const targetTypeSelect = document.getElementById('d-target-type');
    const targetIdGroup = document.getElementById('target-id-group');
    const targetIdSelect = document.getElementById('d-target-id');
    const targetIdLabel = document.getElementById('target-id-label');

    const updateTargetSelect = () => {
        const type = targetTypeSelect.value;
        if (type === 'all') {
            targetIdGroup.style.display = 'none';
        } else {
            targetIdGroup.style.display = 'block';
            if (type === 'product') {
                targetIdLabel.textContent = 'Seleccionar Producto:';
                targetIdSelect.innerHTML = products.map(p => `<option value="${p.id}" ${discount?.targetId === p.id ? 'selected' : ''}>${p.name} ($${p.salePrice.toFixed(2)})</option>`).join('');
            } else if (type === 'category') {
                targetIdLabel.textContent = 'Seleccionar Categoría:';
                targetIdSelect.innerHTML = categories.map(c => `<option value="${c.id}" ${discount?.targetId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
            } else if (type === 'plan') {
                targetIdLabel.textContent = 'Seleccionar Plan:';
                targetIdSelect.innerHTML = plans.map(p => `<option value="${p.id}" ${discount?.targetId === p.id ? 'selected' : ''}>${p.service?.title || 'Plan'} ($${p.price.toFixed(2)})</option>`).join('');
            }
        }
    };

    targetTypeSelect.addEventListener('change', updateTargetSelect);
    updateTargetSelect();

    const closeModal = () => modalContainer.innerHTML = '';
    modalContainer.querySelector('.close-modal').addEventListener('click', closeModal);
    modalContainer.querySelector('.close-modal-btn').addEventListener('click', closeModal);

    document.getElementById('discount-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const targetType = targetTypeSelect.value;
        const payload = {
            name: document.getElementById('d-name').value.trim(),
            type: document.getElementById('d-type').value,
            discountType: document.getElementById('d-discount-type').value,
            value: parseFloat(document.getElementById('d-value').value),
            minQuantity: parseInt(document.getElementById('d-min-qty').value) || 1,
            targetType,
            targetId: targetType !== 'all' ? parseInt(targetIdSelect.value) : null,
            startDate: document.getElementById('d-start-date').value || null,
            endDate: document.getElementById('d-end-date').value || null,
            startTime: document.getElementById('d-start-time').value || null,
            endTime: document.getElementById('d-end-time').value || null,
            isActive: true
        };

        try {
            if (isEdit) {
                await apiFetch(`/discounts/${discount.id}`, { method: 'PUT', body: JSON.stringify(payload) });
                showToast("Promoción actualizada", "success");
            } else {
                await apiFetch('/discounts', { method: 'POST', body: JSON.stringify(payload) });
                showToast("Promoción creada con éxito", "success");
            }
            closeModal();
            renderDiscounts(document.getElementById('router-view'));
        } catch (err) {
            console.error(err);
        }
    });
}
