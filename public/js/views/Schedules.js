// public/js/views/Schedules.js
import { apiFetch, showToast } from '../api.js';

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const START_HOUR = 17;
const END_HOUR = 21; // hasta 20-21
const DAY_LABELS = {
    lunes: "Lunes",
    martes: "Martes",
    miércoles: "Miércoles",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes"
};

const normalizeDayLabel = (value) => {
    if (!value) return null;
    const trimmed = value.toString().trim();
    const lower = trimmed.toLowerCase();
    if (DAY_LABELS[lower]) return DAY_LABELS[lower];

    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
        const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
        return DAY_LABELS[weekday.toLowerCase()] || null;
    }
    return null;
};

const buildKey = (day, hour) => `${day}|${hour}`;

export async function renderSchedules(container) {
    container.innerHTML = `
        <style>
            .schedule-grid { width: 100%; border-collapse: collapse; margin-top: 16px; }
            .schedule-grid th, .schedule-grid td { border: 1px solid rgba(255,255,255,0.08); padding: 10px; vertical-align: top; }
            .schedule-grid th { background: rgba(255,255,255,0.04); color: #d8d8d8; font-weight: 700; }
            .schedule-grid td { min-width: 180px; height: 80px; }
            .schedule-grid .slot-cell { border-radius: 12px; min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .15s ease; padding: 12px 8px; text-align: center; }
            .schedule-grid .slot-cell:hover { transform: translateY(-1px); }
            .schedule-grid .slot-cell--disabled { opacity: 0.35; cursor: not-allowed; background: rgba(255,255,255,0.03); }
            .schedule-grid .slot-cell--selected { background: rgba(56,189,248,0.18); box-shadow: inset 0 0 0 2px rgba(56,189,248,0.9); color: #e8f9ff; }
            .slot-label { display: block; font-size: 0.9rem; color: inherit; margin-bottom: 6px; }
            .slot-check { font-size: 1.4rem; line-height: 1; }
            .day-toggle { width: 100%; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 8px; background: transparent; color: #f5f5f5; cursor: pointer; transition: all .15s ease; }
            .day-toggle.active { background: rgba(56,189,248,0.14); border-color: rgba(56,189,248,0.7); }
            .day-toggle:hover { background: rgba(255,255,255,0.06); }
            .calendar-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
            .calendar-note { margin-top: 12px; color: #b8b8b8; font-size: 0.95rem; }
        </style>

        <div class="top-bar">
            <h2><i class="fa-solid fa-calendar-days"></i> Calendario / Horarios</h2>
        </div>

        <div class="glass-panel table-container">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
                <div>
                    <p style="margin: 0; color: #dcdcdc; font-size: 0.95rem;">Selecciona primero un día para activar sus franjas horarias. Luego haz clic en las casillas de hora para activar o desactivar cada bloque.</p>
                </div>
                <div class="calendar-actions">
                    <button id="save-schedule" class="btn btn-primary">Guardar configuración</button>
                    <button id="reset-schedule" class="btn btn-secondary">Limpiar selección</button>
                </div>
            </div>

            <div id="scheduleGridSection" style="margin-top: 24px; overflow-x: auto;"></div>
            <div class="calendar-note">Nota: el calendario solo muestra los días laborales Lunes a Viernes y franjas de 17:00 a 21:00. Si desactivas un día se borran sus horas seleccionadas.</div>
        </div>
    `;

    const selectedSlots = new Set();
    const existingScheduleIds = new Map();
    const activeDays = new Set();

    const getSlotLabel = (hour) => `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;

    const renderGrid = () => {
        const gridContainer = container.querySelector('#scheduleGridSection');
        const rows = [];

        const headers = WEEKDAYS.map(day => `
            <th>
                <button type="button" class="day-toggle ${activeDays.has(day) ? 'active' : ''}" data-day="${day}">${day}</button>
            </th>
        `).join('');

        for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
            const cells = WEEKDAYS.map(day => {
                const key = buildKey(day, hour);
                const selected = selectedSlots.has(key);
                const disabled = !activeDays.has(day);
                return `
                    <td>
                        <div class="slot-cell ${disabled ? 'slot-cell--disabled' : ''} ${selected ? 'slot-cell--selected' : ''}"
                             data-day="${day}"
                             data-hour="${hour}">
                            <span class="slot-label">${getSlotLabel(hour)}</span>
                            ${selected ? '<span class="slot-check">✓</span>' : ''}
                        </div>
                    </td>
                `;
            }).join('');

            rows.push(`
                <tr>
                    ${cells}
                </tr>
            `);
        }

        gridContainer.innerHTML = `
            <table class="schedule-grid">
                <thead>
                    <tr>
                        ${headers}
                    </tr>
                </thead>
                <tbody>
                    ${rows.join('')}
                </tbody>
            </table>
        `;

        attachGridEvents();
    };

    const attachGridEvents = () => {
        container.querySelectorAll('.day-toggle').forEach(button => {
            button.onclick = () => {
                const day = button.dataset.day;
                toggleDay(day);
            };
        });

        container.querySelectorAll('.slot-cell').forEach(cell => {
            cell.onclick = () => {
                const day = cell.dataset.day;
                const hour = Number(cell.dataset.hour);
                if (!activeDays.has(day)) {
                    activeDays.add(day);
                }
                toggleSlot(day, hour);
            };
        });
    };

    const toggleDay = (day) => {
        if (activeDays.has(day)) {
            activeDays.delete(day);
            for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
                selectedSlots.delete(buildKey(day, hour));
            }
        } else {
            activeDays.add(day);
        }
        renderGrid();
    };

    const toggleSlot = (day, hour) => {
        const key = buildKey(day, hour);
        if (selectedSlots.has(key)) {
            selectedSlots.delete(key);
        } else {
            selectedSlots.add(key);
            activeDays.add(day);
        }
        renderGrid();
    };

    const loadSchedules = async () => {
        try {
            const rawData = await apiFetch('/schedules');
            selectedSlots.clear();
            existingScheduleIds.clear();
            activeDays.clear();

            rawData.forEach(item => {
                const day = normalizeDayLabel(item.date);
                if (!day || !WEEKDAYS.includes(day)) return;

                const startTime = item.startTime || item.start_time || '';
                const hour = Number(startTime.split(':')[0]);
                if (Number.isNaN(hour)) return;

                const key = buildKey(day, hour);
                existingScheduleIds.set(key, item.id);
                selectedSlots.add(key);
                activeDays.add(day);
            });

            renderGrid();
        } catch (error) {
            container.querySelector('#scheduleGridSection').innerHTML = '<div class="text-center text-muted">Error cargando el calendario. Intenta de nuevo.</div>';
        }
    };

    const saveSchedule = async () => {
        const currentKeys = new Set(selectedSlots);
        const existingKeys = new Set(existingScheduleIds.keys());

        const toCreate = [...currentKeys].filter(key => !existingKeys.has(key));
        const toDelete = [...existingKeys].filter(key => !currentKeys.has(key));

        if (!toCreate.length && !toDelete.length) {
            showToast('No hay cambios para guardar.', 'success');
            return;
        }

        try {
            await Promise.all(toCreate.map(async (key) => {
                const [day, hour] = key.split('|');
                const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
                const endTime = `${(Number(hour) + 1).toString().padStart(2, '0')}:00:00`;
                await apiFetch('/schedules', {
                    method: 'POST',
                    body: JSON.stringify({ date: day, startTime, endTime })
                });
            }));

            await Promise.all(toDelete.map(async (key) => {
                const scheduleId = existingScheduleIds.get(key);
                if (scheduleId) {
                    await apiFetch(`/schedules/${scheduleId}`, { method: 'DELETE' });
                }
            }));

            await loadSchedules();
            showToast('Configuración de horarios guardada.');
        } catch (error) {
            // apiFetch ya muestra toast en caso de error
        }
    };

    const resetSelection = () => {
        selectedSlots.clear();
        activeDays.clear();
        renderGrid();
    };

    container.querySelector('#save-schedule').onclick = saveSchedule;
    container.querySelector('#reset-schedule').onclick = resetSelection;

    await loadSchedules();
}
