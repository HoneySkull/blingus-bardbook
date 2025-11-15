/**
 * Search enhancements for Blingus' Bardbook
 * Integrates fuzzy search, result counts, and highlighting
 */

(function() {
  'use strict';

  // Wait for DOM and main script to load
  function waitForElements(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function enhanceSearch() {
    const searchInput = document.getElementById('searchInput');
    const toolbar = document.querySelector('.toolbar__container');

    if (!searchInput || !toolbar) {
      console.warn('Search elements not found, retrying...');
      setTimeout(enhanceSearch, 100);
      return;
    }

    // Add result count display
    createResultCounter();

    // Add fuzzy search toggle
    createFuzzyToggle();

    // Enhance the search input with debouncing and better UX
    enhanceSearchInput();

    // Override global search if available
    enhanceGlobalSearch();
  }

  function createResultCounter() {
    const toolbar = document.querySelector('.toolbar__row--primary');
    if (!toolbar || document.getElementById('searchResultCount')) return;

    const counter = document.createElement('div');
    counter.id = 'searchResultCount';
    counter.style.cssText = `
      padding: 8px 12px;
      background: var(--accent-2);
      color: white;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      display: none;
      white-space: nowrap;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    toolbar.appendChild(counter);
  }

  function createFuzzyToggle() {
    const toolbar = document.querySelector('.toolbar__row--filters');
    if (!toolbar || document.getElementById('fuzzySearchToggle')) return;

    const label = document.createElement('label');
    label.className = 'toggle';
    label.setAttribute('data-tooltip', 'Matches similar words even with typos');
    label.innerHTML = `
      <input type="checkbox" id="fuzzySearchToggle" checked />
      <span>🔍 Fuzzy search</span>
    `;

    toolbar.appendChild(label);

    // Listen for changes
    const checkbox = label.querySelector('input');
    checkbox.addEventListener('change', () => {
      localStorage.setItem('fuzzySearchEnabled', checkbox.checked);
      // Trigger re-render if there's a search query
      const searchInput = document.getElementById('searchInput');
      if (searchInput && searchInput.value.trim()) {
        searchInput.dispatchEvent(new Event('input'));
      }
    });

    // Restore saved preference
    const saved = localStorage.getItem('fuzzySearchEnabled');
    if (saved !== null) {
      checkbox.checked = saved === 'true';
    }
  }

  function enhanceSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    // Add search icon and loading indicator
    const wrapper = searchInput.parentElement;
    if (wrapper && !wrapper.querySelector('.search-icon')) {
      wrapper.style.position = 'relative';

      const icon = document.createElement('span');
      icon.className = 'search-icon';
      icon.innerHTML = '🔍';
      icon.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        opacity: 0.5;
      `;
      wrapper.appendChild(icon);
    }

    // Update placeholder for better UX
    searchInput.placeholder = 'Search... (Ctrl+K or /)';
  }

  function updateResultCount(count, query) {
    const counter = document.getElementById('searchResultCount');
    if (!counter) return;

    if (count !== null && count !== undefined) {
      counter.textContent = `Found ${count} result${count !== 1 ? 's' : ''}${query ? ` for "${query}"` : ''}`;
      counter.style.display = 'block';

      // Add animation
      counter.style.transform = 'scale(1.05)';
      setTimeout(() => {
        counter.style.transform = 'scale(1)';
      }, 200);
    } else {
      counter.style.display = 'none';
    }
  }

  function enhanceGlobalSearch() {
    // We'll enhance the cards after they're rendered
    // Set up a MutationObserver to detect when content changes
    const content = document.getElementById('content');
    if (!content) return;

    const observer = new MutationObserver((mutations) => {
      const searchInput = document.getElementById('searchInput');
      const query = searchInput ? searchInput.value.trim() : '';

      if (query) {
        // Count visible cards (excluding empty state messages)
        const cards = content.querySelectorAll('.card');
        let count = 0;

        cards.forEach(card => {
          // Don't count empty state or header cards
          if (!card.textContent.includes('No results found') &&
              !card.textContent.includes('Search Results')) {
            count++;

            // Highlight matches in this card
            highlightCardMatches(card, query);
          }
        });

        updateResultCount(count, query);
      } else {
        updateResultCount(null);
      }
    });

    observer.observe(content, {
      childList: true,
      subtree: true
    });
  }

  function highlightCardMatches(card, query) {
    if (!query || card.hasAttribute('data-highlighted')) return;

    // Mark as highlighted to avoid re-processing
    card.setAttribute('data-highlighted', 'true');

    // Get text nodes and highlight matches
    const textElements = card.querySelectorAll('p, div, span');
    textElements.forEach(el => {
      // Skip if already has highlighting
      if (el.querySelector('mark')) return;

      const text = el.textContent;
      if (text && text.toLowerCase().includes(query.toLowerCase())) {
        const highlighted = highlightMatches(text, query);
        if (highlighted !== text) {
          el.innerHTML = highlighted;
        }
      }
    });
  }

  // Utility: Highlight matches (duplicated from search-utils.js for standalone use)
  function highlightMatches(text, query) {
    if (!query || !text) return escapeHtml(text);

    const escapedText = escapeHtml(text);
    const escapedQuery = escapeRegex(query);

    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(regex, '<mark style="background: #ffeb3b; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Initialize
  waitForElements(enhanceSearch);

  // Export for testing
  window.SearchEnhancements = {
    updateResultCount,
    highlightMatches
  };
})();
