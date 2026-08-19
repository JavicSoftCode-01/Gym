// public/js/views/CashRegister.js
import { apiFetch, showToast } from '../api.js';

let activeRegister = null;

const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

export async function renderCashRegister(container) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:200px"><i class="fa-solid fa-spinner fa-spin fa-2x text-neon"></i></div>`;
    await loadRegisterState(container);
}

async function loadRegisterState(container) {
    try {
        const status = await apiFetch('/cash-registers/status').catch(() => null);
        activeRegister = status;
        if (activeRegister) {
            renderOpenState(container);
        } else {
            renderClosedState(container);
        }
    } catch(e) {
        renderClosedState(container);
    }
}

/* =====================================================
   ESTADO: CAJA CERRADA — Mostrar pantalla de apertura
   ===================================================== */
function renderClosedState(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-cash-register"></i> Control de Caja</h2>
            <span class="badge" style="background: rgba(255,59,48,.2); color:#ff3b30; border:1px solid #ff3b30; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem;">
                <i class="fa-solid fa-circle" style="font-size:8px; margin-right:6px"></i> CAJA CERRADA
            </span>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; min-height: 60vh;">
            <div class="glass-panel border-glow" style="max-width: 460px; width: 100%; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 16px">🏧</div>
                <h2 style="margin-bottom: 8px">Abrir Turno de Caja</h2>
                <p class="text-secondary" style="margin-bottom: 28px; font-size: 0.9rem">
                    Para realizar ventas o recibir pagos de planes, debes abrir un turno primero.
                    Ingresa el monto en efectivo con el que inicias el día (billetes y monedas para dar vuelto).
                </p>
                
                <div class="form-group" style="text-align: left; margin-bottom: 24px">
                    <label style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color: var(--text-secondary)">
                        <i class="fa-solid fa-coins text-neon"></i> &nbsp;Monto Inicial de Apertura ($)
                    </label>
                    <input 
                        type="number" step="0.01" min="0" 
                        id="opening-balance" 
                        class="form-control" 
                        placeholder="0.00" 
                        style="font-size: 2rem; text-align: center; font-weight: 900; padding: 18px"
                        autofocus
                    >
                    <p class="text-muted" style="font-size: 0.78rem; margin-top: 6px">
                        Este monto se sumará como saldo inicial al total en efectivo esperado al cierre.
                    </p>
                </div>

                <button id="btn-open-register" class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem; font-weight: 900; letter-spacing: 1px">
                    <i class="fa-solid fa-lock-open"></i> &nbsp; ABRIR CAJA AHORA
                </button>
            </div>
        </div>
    `;

    setTimeout(() => {
        document.getElementById('btn-open-register').addEventListener('click', async () => {
            const bal = parseFloat(document.getElementById('opening-balance').value || '0');
            if (isNaN(bal) || bal < 0) {
                showToast('Ingresa un monto de apertura válido (puede ser 0).', 'error');
                return;
            }
            try {
                await apiFetch('/cash-registers/open', {
                    method: 'POST',
                    body: JSON.stringify({ openingBalance: bal })
                });
                showToast('✅ ¡Caja abierta! Ya puedes procesar ventas y pagos.');
                await loadRegisterState(container);
            } catch (e) {}
        });

        document.getElementById('opening-balance').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('btn-open-register').click();
        });
    }, 50);
}

/* =====================================================
   ESTADO: CAJA ABIERTA — Tablero en vivo + Cierre
   ===================================================== */
function renderOpenState(container) {
    container.innerHTML = `
        <div class="top-bar">
            <div>
                <h2><i class="fa-solid fa-cash-register text-neon"></i> Control de Caja</h2>
                <p class="text-secondary" style="font-size: 0.85rem">
                    Turno abierto desde <strong id="opened-at-label">-</strong>
                </p>
            </div>
            <div class="d-flex gap-1">
                <span class="badge" style="background: rgba(52,199,89,.2); color:#34c759; border:1px solid #34c759; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem;">
                    <i class="fa-solid fa-circle" style="font-size:8px; margin-right:6px"></i> CAJA ABIERTA
                </span>
                <button class="btn btn-secondary" id="btn-refresh-cash">
                    <i class="fa-solid fa-rotate"></i> Actualizar
                </button>
            </div>
        </div>

        <!-- RESUMEN EN VIVO -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px" id="live-summary">
            ${liveSummarySkeletons()}
        </div>

        <!-- PANEL CIERRE + HISTORIAL -->
        <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px">
            <!-- FORMULARIO CIERRE -->
            <div class="glass-panel" style="height: fit-content">
                <h3 class="mb-3"><i class="fa-solid fa-lock text-neon"></i> Cierre y Arqueo de Caja</h3>
                <p class="text-secondary" style="font-size: 0.82rem; margin-bottom: 20px">
                    Cuenta el efectivo físico en la gaveta, ingresa el monto abajo y confirma el cierre del turno.
                </p>

                <div style="display:flex; gap: 16px">
                    <div class="form-group" style="flex:1">
                        <label>Efectivo Físico Contado ($)</label>
                        <input type="number" step="0.01" id="actualCash" class="form-control" placeholder="0.00">
                    </div>
                    <div class="form-group" style="flex:1">
                        <label>Suma de Depósitos ($)</label>
                        <input type="number" step="0.01" id="actualDeposit" class="form-control" placeholder="0.00">
                    </div>
                </div>

                <!-- Previsualización de diferencia -->
                <div class="glass-panel" id="preview-diff" style="margin: 16px 0; padding: 14px; display:none; border-radius: 12px">
                    <div style="display:flex; justify-content: space-between; font-size: 0.9rem">
                        <span class="text-secondary">Total Ingresado:</span>
                        <strong id="prev-total-actual">$0.00</strong>
                    </div>
                    <div style="display:flex; justify-content: space-between; font-size: 0.9rem; margin-top: 6px">
                        <span class="text-secondary">Total Esperado:</span>
                        <strong id="prev-total-expected">$0.00</strong>
                    </div>
                    <div style="display:flex; justify-content: space-between; font-size: 1.1rem; font-weight: 900; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color)">
                        <span>Diferencia:</span>
                        <span id="prev-diff-value" style="font-weight: 900">$0.00</span>
                    </div>
                </div>

                <button id="btn-close-register" class="btn btn-danger" style="width: 100%; padding: 16px; margin-top: 8px">
                    <i class="fa-solid fa-lock"></i> &nbsp; CONFIRMAR CIERRE DE TURNO
                </button>
                <p class="text-muted mt-2" style="font-size: 0.75rem; text-align: center">
                    <i class="fa-solid fa-triangle-exclamation"></i> Esta acción es irreversible y cierra el turno activo.
                </p>
            </div>

            <!-- HISTORIAL DE CIERRES -->
            <div class="glass-panel table-container">
                <h3 class="mb-2">Historial de Cierres (Auditoría)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Apertura</th>
                            <th>Cierre</th>
                            <th>Efectivo</th>
                            <th>Diferencia</th>
                            <th>Total Turno</th>
                            <th>G. Total</th>
                        </tr>
                    </thead>
                    <tbody id="cash-history">
                        <tr><td colspan="6" class="text-center">Cargando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(async () => {
        await refreshLiveSummary();
        await loadHistory();
        bindCloseForm();
    }, 50);
}

function liveSummarySkeletons() {
    return `
        <div class="glass-panel" style="padding: 20px; text-align:center">
            <p class="text-secondary" style="font-size:0.8rem; margin-bottom:8px"><i class="fa-solid fa-wallet text-neon"></i> Monto Inicial</p>
            <div class="text-neon" style="font-size:2rem; font-weight:900" id="live-opening">...</div>
        </div>
        <div class="glass-panel" style="padding: 20px; text-align:center">
            <p class="text-secondary" style="font-size:0.8rem; margin-bottom:8px"><i class="fa-solid fa-money-bill-wave" style="color:#34c759"></i> Efectivo Esperado</p>
            <div style="font-size:2rem; font-weight:900; color:#34c759" id="live-cash">...</div>
        </div>
        <div class="glass-panel" style="padding: 20px; text-align:center">
            <p class="text-secondary" style="font-size:0.8rem; margin-bottom:8px"><i class="fa-solid fa-building-columns" style="color:#007aff"></i> Depósitos Esperados</p>
            <div style="font-size:2rem; font-weight:900; color:#007aff" id="live-deposit">...</div>
        </div>
        <div class="glass-panel border-glow" style="padding: 20px; text-align:center">
            <p class="text-secondary" style="font-size:0.8rem; margin-bottom:8px"><i class="fa-solid fa-chart-line text-neon"></i> Total del Turno</p>
            <div class="text-neon" style="font-size:2.2rem; font-weight:900" id="live-total">...</div>
        </div>
    `;
}

async function refreshLiveSummary() {
    try {
        const data = await apiFetch('/cash-registers/status');
        activeRegister = data;

        const openedEl = document.getElementById('opened-at-label');
        if (openedEl && data.openedAt) {
            const d = new Date(data.openedAt);
            openedEl.textContent = d.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
        }

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
        set('live-opening', data.openingBalance);
        set('live-cash', data.expectedCash);
        set('live-deposit', data.expectedDeposit);
        set('live-total', data.totalExpected);
    } catch (e) {}
}

function bindCloseForm() {
    const btn = document.getElementById('btn-close-register');
    const cashEl = document.getElementById('actualCash');
    const depEl = document.getElementById('actualDeposit');

    const updatePreview = () => {
        if (!activeRegister) return;
        const ac = parseFloat(cashEl.value || 0);
        const ad = parseFloat(depEl.value || 0);
        const totalActual = ac + ad;
        const totalExpected = activeRegister.totalExpected || 0;
        const diff = totalActual - totalExpected;

        const preview = document.getElementById('preview-diff');
        if (cashEl.value !== '' || depEl.value !== '') {
            preview.style.display = 'block';
            const diffEl = document.getElementById('prev-diff-value');
            document.getElementById('prev-total-actual').textContent = fmt(totalActual);
            document.getElementById('prev-total-expected').textContent = fmt(totalExpected);
            diffEl.textContent = (diff >= 0 ? '+' : '') + fmt(diff);
            diffEl.style.color = diff < 0 ? '#ff3b30' : diff > 0 ? '#ff9500' : '#34c759';
        } else {
            preview.style.display = 'none';
        }
    };

    cashEl.addEventListener('input', updatePreview);
    depEl.addEventListener('input', updatePreview);

    btn.addEventListener('click', async () => {
        const actualCash = parseFloat(cashEl.value || 0);
        const actualDeposit = parseFloat(depEl.value || 0);

        if (cashEl.value === '') {
            showToast('Ingresa el efectivo físico contado.', 'error');
            return;
        }

        const totalActual = actualCash + actualDeposit;
        const totalExpected = activeRegister?.totalExpected || 0;
        const diff = totalActual - totalExpected;
        const diffStr = diff < 0 ? `⚠️ Hay un faltante de ${fmt(Math.abs(diff))}` : diff > 0 ? `ℹ️ Hay un sobrante de ${fmt(diff)}` : '✅ La caja está perfectamente cuadrada';

        const confirmed = confirm(`Resumen del cierre:\n\n${diffStr}\n\n¿Confirmas el cierre del turno?`);
        if (!confirmed) return;

        try {
            await apiFetch('/cash-registers/close', {
                method: 'POST',
                body: JSON.stringify({ actualCash, actualDeposit })
            });
            showToast('🔒 ¡Caja cerrada y turno archivado correctamente!');
            activeRegister = null;
            const container = document.getElementById('main-content') || document.querySelector('.content-area') || btn.closest('.glass-panel').parentElement.parentElement;
            await loadRegisterState(container);
        } catch (e) {}
    });

    const refreshBtn = document.getElementById('btn-refresh-cash');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await refreshLiveSummary();
            showToast('Datos actualizados.');
        });
    }
}

async function loadHistory() {
    try {
        const data = await apiFetch('/cash-registers/history');
        const tbody = document.getElementById('cash-history');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin cierres registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(r => {
            const diffColor = r.difference < 0 ? '#ff3b30' : r.difference > 0 ? '#ff9500' : '#34c759';
            const diffSign = r.difference >= 0 ? '+' : '';
            const openedAt = r.openedAt ? new Date(r.openedAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : '-';
            const closedAt = r.closedAt ? new Date(r.closedAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : `<span class="badge" style="background:rgba(52,199,89,.15);color:#34c759">Activo</span>`;

            return `
                <tr>
                    <td style="font-size:0.8rem">${openedAt}</td>
                    <td style="font-size:0.8rem">${closedAt}</td>
                    <td>
                        <span style="color:${r.actualCash < r.expectedCash ? '#ff3b30' : '#34c759'}">${fmt(r.actualCash)}</span>
                        <span class="text-muted" style="font-size:0.75rem"> / ${fmt(r.expectedCash)}</span>
                    </td>
                    <td style="font-weight: 900; color:${diffColor}">
                        ${diffSign}${fmt(r.difference)}
                    </td>
                    <td class="text-neon" style="font-weight: bold">${fmt(r.dailyTotal)}</td>
                    <td style="font-weight: bold; border-left: 2px solid var(--neon-accent); padding-left: 12px">${fmt(r.grandTotal)}</td>
                </tr>
            `;
        }).join('');
    } catch (e) {}
}
