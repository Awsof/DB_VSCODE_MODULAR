(function () {
  'use strict';

  class DBLogin extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
      this.bindEvents();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: flex;
            position: fixed;
            inset: 0;
            align-items: center;
            justify-content: center;
            background: rgba(15, 155, 148, 0.08);
            z-index: 999;
          }

          .login-box {
            width: min(420px, 90%);
            background: var(--bg2, #ffffff);
            border: 1px solid var(--border, #d4dbe6);
            border-radius: var(--r, 6px);
            box-shadow: 0 18px 34px rgba(0, 55, 97, 0.12);
            padding: 34px 32px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .login-logo {
            display: flex;
            justify-content: center;
          }

          .login-logo span {
            font-size: 32px;
            font-weight: 800;
            color: var(--accent, #0F9B94);
          }

          .login-title {
            font-size: 22px;
            font-weight: 700;
            color: var(--navy, #003761);
            text-align: center;
          }

          .login-sub {
            font-size: 13px;
            color: var(--text3, #8a96a8);
            text-align: center;
          }

          .login-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .login-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--text2, #4a5568);
          }

          .login-input {
            width: 100%;
            border: 1px solid var(--border, #d4dbe6);
            border-radius: var(--r, 6px);
            padding: 11px 14px;
            font-size: 14px;
            color: var(--text, #1a2433);
            outline: none;
            transition: border-color .15s;
          }

          .login-input:focus {
            border-color: var(--accent, #0F9B94);
          }

          .login-btn {
            width: 100%;
            padding: 11px;
            background: var(--accent, #0F9B94);
            border: none;
            border-radius: var(--r, 6px);
            color: white;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s;
            margin-top: 4px;
          }

          .login-btn:hover {
            background: var(--accent2, #0a7a74);
          }

          .login-error {
            color: var(--red, #d63031);
            font-size: 12px;
            text-align: center;
            min-height: 18px;
          }
        </style>

        <div class="login-box">
          <div class="login-logo"><span>DB</span></div>
          <div class="login-title">DB Lab Manager</div>
          <div class="login-sub">Faça login para continuar</div>
          <div class="login-field">
            <label class="login-label">Login</label>
            <input type="text" class="login-input" id="login-user" placeholder="Usuário" autocomplete="username">
          </div>
          <div class="login-field">
            <label class="login-label">Senha</label>
            <input type="password" class="login-input" id="login-pass" placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="login-btn" id="login-btn" type="button">Entrar</button>
          <div class="login-error" id="login-error"></div>
        </div>
      `;
    }

    bindEvents() {
      this.shadowRoot.addEventListener('click', (event) => {
        if (event.target.id === 'login-btn') {
          this.dispatchEvent(new CustomEvent('db-login-submit', { bubbles: true, composed: true }));
        }
      });

      this.shadowRoot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('db-login-submit', { bubbles: true, composed: true }));
        }
      });
    }

    getCredentials() {
      return {
        login: this.shadowRoot.getElementById('login-user').value,
        password: this.shadowRoot.getElementById('login-pass').value,
      };
    }

    setError(message) {
      this.shadowRoot.getElementById('login-error').textContent = message || '';
    }

    reset() {
      this.shadowRoot.getElementById('login-user').value = '';
      this.shadowRoot.getElementById('login-pass').value = '';
      this.setError('');
    }

    focus() {
      this.shadowRoot.getElementById('login-user').focus();
    }
  }

  customElements.define('db-login', DBLogin);
  window.DBLogin = DBLogin;
})();
