// public/js/views/Suppliers.js
import { apiFetch, showToast } from '../api.js';

let suppliers = [];

export async function renderSuppliers(container) {
    try {
        suppliers = await apiFetch('/suppliers');

        container.innerHTML = `
            <div class="top-bar">
                <div>
                    <h2><i class="fa-solid fa-truck-field text-neon"></i> Proveedores y Distribuidores</h2>
                    <p class="text-secondary">Directorio de proveedores para compras de bebidas, insumos, suplementos y uniformes.</p>
                </div>
                <button class="btn btn-primary" id="btn-new-supplier"><i class="fa-solid fa-plus"></i> Nuevo Proveedor</button>
            </div>

            <div class="glass-panel">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre / Razón Social</th>
                                <th>Identificación / RUC</th>
                                <th>Contacto</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Dirección</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${suppliers.length === 0 ? `
                                <tr><td colspan="7" class="text-center text-secondary">No hay proveedores registrados aún.</td></tr>
                            ` : suppliers.map(s => `
                                <tr>
                                    <td><strong>${s.name}</strong></td>
                                    <td><code>${s.identification || '-'}</code></td>
                                    <td>${s.contactName || '-'}</td>
                                    <td>${s.phone || '-'}</td>
                                    <td>${s.email || '-'}</td>
                                    <td><small class="text-secondary">${s.address || '-'}</small></td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="window.openEditSupplierModal(${s.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                                        <button class="btn btn-secondary btn-sm text-danger" onclick="window.deleteSupplierAction(${s.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- MODAL CONTAINER -->
            <div id="supplier-modal-container"></div>
        `;

        setupSupplierEvents();
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="glass-panel text-danger">Error al cargar proveedores: ${e.message}</div>`;
    }
}

function setupSupplierEvents() {
    document.getElementById('btn-new-supplier').addEventListener('click', () => openSupplierModal());

    window.openEditSupplierModal = (id) => {
        const sup = suppliers.find(s => s.id === id);
        if (sup) openSupplierModal(sup);
    };

    window.deleteSupplierAction = async (id) => {
        if (!confirm("¿Deseas eliminar este proveedor?")) return;
        try {
            await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
            showToast("Proveedor eliminado", "success");
            renderSuppliers(document.getElementById('router-view'));
        } catch (e) {
            console.error(e);
        }
    };
}

function openSupplierModal(supplier = null) {
    const modalContainer = document.getElementById('supplier-modal-container');
    const isEdit = Boolean(supplier);

    modalContainer.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content glass-panel">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-truck text-neon"></i> ${isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="supplier-form">
                    <div class="form-group">
                        <label>Nombre o Razón Social *</label>
                        <input type="text" id="sup-name" class="form-control" placeholder="Ej. Distribuidora Polar S.A." value="${supplier?.name || ''}" required>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>RUC / Cédula / Identificación</label>
                            <input type="text" id="sup-ident" class="form-control" placeholder="Ej. 1790012345001" value="${supplier?.identification || ''}">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Persona de Contacto</label>
                            <input type="text" id="sup-contact-name" class="form-control" placeholder="Ej. Juan Pérez" value="${supplier?.contactName || ''}">
                        </div>
                    </div>

                    <div class="d-flex gap-1">
                        <div class="form-group" style="flex:1;">
                            <label>Teléfono</label>
                            <input type="text" id="sup-phone" class="form-control" placeholder="Ej. 0991234567" value="${supplier?.phone || ''}">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Correo Electrónico</label>
                            <input type="email" id="sup-email" class="form-control" placeholder="ventas@polar.com" value="${supplier?.email || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" id="sup-address" class="form-control" placeholder="Av. Principal y Secundaria" value="${supplier?.address || ''}">
                    </div>

                    <div class="form-group">
                        <label>Notas / Condiciones de Entrega</label>
                        <textarea id="sup-notes" class="form-control" rows="2" placeholder="Días de entrega, crédito 30 días, etc.">${supplier?.notes || ''}</textarea>
                    </div>

                    <div class="d-flex justify-between mt-2">
                        <button type="button" class="btn btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const closeModal = () => modalContainer.innerHTML = '';
    modalContainer.querySelector('.close-modal').addEventListener('click', closeModal);
    modalContainer.querySelector('.close-modal-btn').addEventListener('click', closeModal);

    document.getElementById('supplier-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('sup-name').value.trim(),
            identification: document.getElementById('sup-ident').value.trim() || null,
            contactName: document.getElementById('sup-contact-name').value.trim() || null,
            phone: document.getElementById('sup-phone').value.trim() || null,
            email: document.getElementById('sup-email').value.trim() || null,
            address: document.getElementById('sup-address').value.trim() || null,
            notes: document.getElementById('sup-notes').value.trim() || null
        };

        try {
            if (isEdit) {
                await apiFetch(`/suppliers/${supplier.id}`, { method: 'PUT', body: JSON.stringify(payload) });
                showToast("Proveedor actualizado", "success");
            } else {
                await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
                showToast("Proveedor registrado con éxito", "success");
            }
            closeModal();
            renderSuppliers(document.getElementById('router-view'));
        } catch (err) {
            console.error(err);
        }
    });
}
