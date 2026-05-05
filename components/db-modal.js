/**
 * components/db-modal.js — Web Component para modais
 * 
 * Encapsula a lógica de exibição de diálogos modais.
 * Substitui as funções openModal() e closeModal() de core/utils.js.
 * 
 * API pública:
 *   - open(html, title, onClose) — abre um modal com conteúdo
 *   - close() — fecha o modal
 *   - propriedades: open (boolean), title (string), content (HTML string)
 * 
 * Exemplo de uso:
 *   var modal = document.getElementById('modal');
 *   modal.open('<p>Conteúdo</p>', 'Título', () => console.log('fechado'));
 */
(function () {
  'use strict';

  class DBModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._isOpen = false;
      this._onClose = null;
    }

    connectedCallback() {
      this.render();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --navy: var(--navy, #003763);
            --navy3: var(--navy3, #004d7a);
            --accent: var(--accent, #0f9b94);
            --red: var(--red, #d32f2f);
            --bg2: var(--bg2, #f5f5f5);
            --bg3: var(--bg3, #eeeeee);
            --border: var(--border, #e0e0e0);
            --text: var(--text, #1a1a1a);
            --text2: var(--text2, #4a4a4a);
            --text3: var(--text3, #888888);
            --r: var(--r, 4px);
            --r2: var(--r2, 8px);
          }

          :host {
            display: none;
          }

          :host([open]) {
            display: contents;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 55, 97, 0.45);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            animation: fadeIn 0.15s ease;
          }

          .modal {
            background: var(--bg2);
            border: 1px solid var(--border);
            border-radius: var(--r2);
            width: 100%;
            max-width: 640px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 55, 97, 0.2);
            animation: slideUp 0.2s ease;
          }

          .modal-header {
            padding: 18px 24px 16px;
            border-bottom: 2px solid var(--accent);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background: var(--bg2);
            z-index: 1;
          }

          .modal-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--navy);
          }

          .modal-close {
            background: none;
            border: none;
            color: var(--text3);
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.15s;
          }

          .modal-close:hover {
            color: var(--red);
          }

          .modal-body {
            padding: 20px 24px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          }

          .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: none;
              opacity: 1;
            }
          }
        </style>

        <div class="modal-overlay" id="overlay">
          <div class="modal" id="modal">
            <div class="modal-header">
              <div class="modal-title" id="title"></div>
              <button class="modal-close" id="close-btn">✕</button>
            </div>
            <div class="modal-body" id="content"></div>
          </div>
        </div>
      `;

      // Event listeners
      var overlay = this.shadowRoot.getElementById('overlay');
      var closeBtn = this.shadowRoot.getElementById('close-btn');
      var modal = this.shadowRoot.getElementById('modal');

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });

      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    /**
     * Abre o modal com conteúdo HTML
     * @param {string} html - Conteúdo HTML do corpo do modal
     * @param {string} title - Título do modal (opcional)
     * @param {function} onClose - Callback ao fechar (opcional)
     */
    open(html, title, onClose) {
      if (typeof html === 'string') {
        this.shadowRoot.getElementById('content').innerHTML = html;
      }
      if (typeof title === 'string') {
        this.shadowRoot.getElementById('title').textContent = title;
      } else if (typeof title === 'function') {
        // Se segundo argumento é função, é onClose
        onClose = title;
      }

      this._onClose = onClose;
      this.setAttribute('open', '');
      this._isOpen = true;
    }

    /**
     * Fecha o modal
     */
    close() {
      this.removeAttribute('open');
      this._isOpen = false;
      if (typeof this._onClose === 'function') {
        this._onClose();
      }
      this._onClose = null;
    }

    /**
     * Retorna se o modal está aberto
     */
    get isOpen() {
      return this._isOpen;
    }

    /**
     * Define se o modal está aberto
     */
    set isOpen(value) {
      if (value) {
        this.setAttribute('open', '');
        this._isOpen = true;
      } else {
        this.close();
      }
    }
  }

  // Registrar o Web Component
  customElements.define('db-modal', DBModal);

  // COMPATIBILIDADE: Registrar funções globais openModal e closeModal
  // que delegam ao componente
  window.openModal = function (html, onClose) {
    var modalComponent = document.getElementById('modal');
    if (modalComponent && typeof modalComponent.open === 'function') {
      modalComponent.open(html, onClose);
      return modalComponent;
    }
  };

  window.closeModal = function () {
    var modalComponent = document.getElementById('modal');
    if (modalComponent && typeof modalComponent.close === 'function') {
      modalComponent.close();
    }
  };
})();
