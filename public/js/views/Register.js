// public/js/views/Register.js
import { apiFetch, showToast } from '../api.js';

export function renderRegister() {
    setTimeout(() => {
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        
        togglePassword?.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });

        const togglePasswordConfirm = document.getElementById('toggle-password-confirm');
        const passwordConfirmInput = document.getElementById('password-confirm');
        
        togglePasswordConfirm?.addEventListener('click', () => {
            const type = passwordConfirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordConfirmInput.setAttribute('type', type);
            togglePasswordConfirm.classList.toggle('fa-eye');
            togglePasswordConfirm.classList.toggle('fa-eye-slash');
        });

        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const contact = document.getElementById('contact').value;
                const password = document.getElementById('password').value;
                const passwordConfirm = document.getElementById('password-confirm').value;
                
                if (password !== passwordConfirm) {
                    showToast('Las contraseñas no coinciden', 'error');
                    return;
                }
                
                try {
                    await apiFetch('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({ contact, password })
                    });
                    
                    showToast('Registro exitoso. Por favor, inicia sesión.');
                    window.location.hash = '#login';
                } catch (error) {
                    // API handles error toast
                }
            });
        }
    }, 100);

    return `
        <div class="login-wrapper">
            <div class="glass-panel login-box">
                <div class="login-logo text-neon">
                    <i class="fa-solid fa-user-plus"></i>
                    <div>REGISTRO</div>
                </div>
                
                <form id="register-form">
                    <div class="form-group">
                        <label>Usuario</label>
                        <input type="text" id="contact" class="form-control" placeholder="Ingresar usuario" required autocomplete="off">
                    </div>
                    
                    <div class="form-group">
                        <label>Contraseña</label>
                        <div style="position: relative;">
                            <input type="password" id="password" class="form-control" placeholder="••••••••" required>
                            <i class="fa-solid fa-eye" id="toggle-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-secondary);"></i>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Confirmar Contraseña</label>
                        <div style="position: relative;">
                            <input type="password" id="password-confirm" class="form-control" placeholder="••••••••" required>
                            <i class="fa-solid fa-eye" id="toggle-password-confirm" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-secondary);"></i>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1.1rem; margin-top: 10px;">
                        REGISTRARSE <i class="fa-solid fa-check"></i>
                    </button> 
                    
                    <div class="text-center mt-3">
                    <br>
                        <a href="#login" style="color: var(--text-secondary); text-decoration: none; font-size: 0.9rem;">
                            ¿Ya tienes cuenta? Ingresa aquí
                        </a>
                    </div>
                </form>
            </div>
        </div>
    `;
}
