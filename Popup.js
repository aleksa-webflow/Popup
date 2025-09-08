<script>
class PopupModal {
  /**
   * @param {string|Element} modalRoot - selector or DOM node of the modal container
   *   The container should hold both the backdrop and the dialog content.
   *   This class will toggle data-popup="active|not-active" on it.
   *
   * @param {Object} options
   * @param {Array<string|Element>} [options.openTriggers=[]] - selectors/elements that open on click
   * @param {Array<string|Element>} [options.closeTriggers=[]] - selectors/elements that close on click
   * @param {boolean} [options.closeOnEsc=true] - close on Escape
   * @param {boolean} [options.closeOnBackdrop=true] - close when clicking outside dialog
   * @param {number|null} [options.delay=null] - auto-open after N ms
   * @param {boolean} [options.lockScroll=true] - lock page scroll while open
   * @param {string} [options.lockScrollAttr='data-lock-scroll'] - attribute set on <body> when locked
   * @param {string} [options.stateAttr='data-popup'] - attribute toggled on modal root
   * @param {string} [options.activeValue='active']
   * @param {string} [options.inactiveValue='not-active']
   * @param {function} [options.onOpen] - callback after open
   * @param {function} [options.onClose] - callback after close
   */
  constructor(modalRoot, options = {}) {
    // options
    this.opts = Object.assign({
      openTriggers: [],
      closeTriggers: [],
      closeOnEsc: true,
      closeOnBackdrop: true,
      delay: null,
      lockScroll: false,
      lockScrollAttr: 'data-lock-scroll',
      stateAttr: 'data-popup',
      activeValue: 'active',
      inactiveValue: 'not-active',
      onOpen: null,
      onClose: null
    }, options);

    // resolve modal root
    this.root = typeof modalRoot === 'string' ? document.querySelector(modalRoot) : modalRoot;
    if (!this.root) {
      console.warn('[PopupModal] Modal root not found:', modalRoot);
      return;
    }

    // keep a reference to the element that opened the modal (for potential focus restore if you want)
    this._openerEl = null;

    // initial state
    if (!this.root.hasAttribute(this.opts.stateAttr)) {
      this.root.setAttribute(this.opts.stateAttr, this.opts.inactiveValue);
    }

    // cache dialog content (center box) if present; otherwise fallback to root
    this.dialog = this.root.querySelector('[data-popup-dialog]') || this.root;

    // bind listeners
    this._handleEsc = this._handleEsc.bind(this);
    this._handleBackdrop = this._handleBackdrop.bind(this);

    // wire triggers
    this._bindTriggerList(this.opts.openTriggers, 'open');
    this._bindTriggerList(this.opts.closeTriggers, 'close');

    // optional auto-open
    if (typeof this.opts.delay === 'number' && this.opts.delay >= 0) {
      setTimeout(() => this.open(), this.opts.delay);
    }
  }

  // Utility: turn a selector/element array into a list of nodes
  _resolveNodes(list) {
    const result = [];
    (Array.isArray(list) ? list : [list]).forEach(item => {
      if (!item) return;
      if (item instanceof Element) {
        result.push(item);
      } else if (typeof item === 'string') {
        document.querySelectorAll(item).forEach(el => result.push(el));
      }
    });
    return result;
  }

  _bindTriggerList(list, action) {
    this._resolveNodes(list).forEach(el => {
      el.addEventListener('click', (e) => {
        if (action === 'open') {
          this._openerEl = e.currentTarget;
          this.open();
        } else {
          this.close();
        }
      });
    });
  }

  _handleEsc(e) {
    if (!this.isOpen()) return;
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      this.close();
    }
  }

  _handleBackdrop(e) {
    if (!this.isOpen()) return;
    // If click is outside the dialog element, close
    if (this.opts.closeOnBackdrop && !this.dialog.contains(e.target)) {
      this.close();
    }
  }

  isOpen() {
    return this.root.getAttribute(this.opts.stateAttr) === this.opts.activeValue;
  }

  open() {
    if (this.isOpen()) return;

    this.root.setAttribute(this.opts.stateAttr, this.opts.activeValue);

    // Lock scroll via attribute on body (CSS handles overflow)
    if (this.opts.lockScroll) {
      document.body.setAttribute(this.opts.lockScrollAttr, 'true');
    }

    // listeners for closing
    if (this.opts.closeOnEsc) {
      document.addEventListener('keydown', this._handleEsc, true);
    }
    if (this.opts.closeOnBackdrop) {
      // listen on root so backdrop clicks bubble here
      this.root.addEventListener('mousedown', this._handleBackdrop);
      this.root.addEventListener('touchstart', this._handleBackdrop, {passive: true});
    }

    if (typeof this.opts.onOpen === 'function') this.opts.onOpen(this);
  }

  close() {
    if (!this.isOpen()) return;

    this.root.setAttribute(this.opts.stateAttr, this.opts.inactiveValue);

    // unlock scroll
    if (this.opts.lockScroll) {
      document.body.removeAttribute(this.opts.lockScrollAttr);
    }

    // remove listeners
    document.removeEventListener('keydown', this._handleEsc, true);
    this.root.removeEventListener('mousedown', this._handleBackdrop);
    this.root.removeEventListener('touchstart', this._handleBackdrop);

    if (typeof this.opts.onClose === 'function') this.opts.onClose(this);
  }
}
</script>
