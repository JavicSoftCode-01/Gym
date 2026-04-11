// public/js/api.js
const API_URL = '/api';

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3500);
}

export async function apiFetch(endpoint, options = {}) {
    showLoading();
    
    const token = localStorage.getItem('gym_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        let data = null;
        const contentType = response.headers.get("content-type");
        if (response.status !== 204 && contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else if (response.status !== 204) {
            const text = await response.text();
            data = { error: text || `Error ${response.status}` };
        }

        if (!response.ok) {
            if (response.status === 401) {
                // Token invalid or expired
                localStorage.removeItem('gym_token');
                window.location.hash = '#login';
            }
            throw new Error(data?.error || `Error ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    } finally {
        hideLoading();
    }
}
