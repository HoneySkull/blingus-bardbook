/**
 * UI utilities for Blingus' Bardbook
 * Common DOM manipulation and UI helper functions
 */

window.UIUtils = (function() {
  'use strict';

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {number} duration - Duration in ms (default: 3000)
   */
  function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  /**
   * Show a modal
   * @param {HTMLElement|string} modal - Modal element or ID
   */
  function showModal(modal) {
    if (typeof modal === 'string') {
      modal = document.getElementById(modal);
    }
    if (!modal) return;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    // Focus first input if available
    const firstInput = modal.querySelector('input, textarea, select, button');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Hide a modal
   * @param {HTMLElement|string} modal - Modal element or ID
   */
  function hideModal(modal) {
    if (typeof modal === 'string') {
      modal = document.getElementById(modal);
    }
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  /**
   * Clear all children from an element
   * @param {HTMLElement} element - Element to clear
   */
  function clearElement(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Create a card element
   * @param {object} options - Card options
   * @returns {HTMLElement} - Card element
   */
  function createCard(options = {}) {
    const {
      content = '',
      className = 'card',
      onClick = null,
      meta = null,
      buttons = []
    } = options;

    const card = document.createElement('article');
    card.className = className;
    card.tabIndex = 0;

    // Add content
    if (typeof content === 'string') {
      const p = document.createElement('p');
      p.innerHTML = content;
      card.appendChild(p);
    } else if (content instanceof HTMLElement) {
      card.appendChild(content);
    }

    // Add metadata
    if (meta) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'card__meta';
      metaDiv.innerHTML = meta;
      card.appendChild(metaDiv);
    }

    // Add buttons
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = btn.className || 'card__button';
      button.innerHTML = btn.label || '';
      button.setAttribute('data-tooltip', btn.tooltip || '');
      if (btn.onClick) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          btn.onClick(e);
        });
      }
      card.appendChild(button);
    });

    // Add click handler
    if (onClick) {
      card.addEventListener('click', onClick);
      card.style.cursor = 'pointer';
    }

    return card;
  }

  /**
   * Debounce a function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} - Debounced function
   */
  function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Smooth scroll to element
   * @param {HTMLElement} element - Element to scroll to
   * @param {object} options - Scroll options
   */
  function smoothScrollTo(element, options = {}) {
    if (!element) return;

    const {
      behavior = 'smooth',
      block = 'center',
      inline = 'nearest'
    } = options;

    element.scrollIntoView({ behavior, block, inline });
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Success status
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  }

  /**
   * Animate element (simple CSS animation)
   * @param {HTMLElement} element - Element to animate
   * @param {string} animation - Animation class name
   * @param {number} duration - Duration in ms
   */
  function animate(element, animation, duration = 300) {
    if (!element) return;

    element.classList.add(animation);

    setTimeout(() => {
      element.classList.remove(animation);
    }, duration);
  }

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} - Whether element is in viewport
   */
  function isInViewport(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create a loading spinner element
   * @param {string} size - Size (small, medium, large)
   * @returns {HTMLElement} - Spinner element
   */
  function createSpinner(size = 'medium') {
    const spinner = document.createElement('div');
    spinner.className = `spinner spinner--${size}`;
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', 'Loading...');

    const sizeMap = { small: '20px', medium: '40px', large: '60px' };
    const spinnerSize = sizeMap[size] || sizeMap.medium;

    spinner.style.cssText = `
      width: ${spinnerSize};
      height: ${spinnerSize};
      border: 3px solid var(--accent-2);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 20px auto;
    `;

    // Add keyframes if not already present
    if (!document.getElementById('spinner-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spinner-keyframes';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    return spinner;
  }

  // Export all utilities
  return {
    showToast,
    showModal,
    hideModal,
    clearElement,
    createCard,
    debounce,
    smoothScrollTo,
    copyToClipboard,
    animate,
    isInViewport,
    escapeHtml,
    createSpinner
  };
})();
