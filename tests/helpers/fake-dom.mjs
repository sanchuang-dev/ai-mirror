/**
 * Minimal fake DOM for the speed of `node --test` without adding a browser dependency.
 * It only implements the small surface the page modules use.
 */
export class FakeNode {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.className = '';
    this.textContent = '';
    this.attributes = new Map();
    this.listeners = new Map();
    this.childNodes = [];
  }

  get classList() {
    const node = this;
    const names = () => node.className.split(/\s+/).filter(Boolean);
    return {
      add(...added) {
        node.className = [...new Set([...names(), ...added])].join(' ');
      },
      remove(...removed) {
        node.className = names()
          .filter((name) => !removed.includes(name))
          .join(' ');
      },
      contains(name) {
        return names().includes(name);
      },
    };
  }

  append(...nodes) {
    this.childNodes.push(...nodes);
  }

  prepend(...nodes) {
    this.childNodes.unshift(...nodes);
  }

  replaceChildren(...nodes) {
    this.childNodes = nodes;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  /** Ignore focus on disconnected nodes when browser-like focus checks are requested. */
  focus() {
    if (
      this.ownerDocument?.requireMountedFocus &&
      !collect(this.ownerDocument.root, (node) => node === this).length
    ) {
      return;
    }
    this.focused = true;
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  /**
   * @param {string} type
   * @param {Record<string, unknown>} [event] extra event fields (key, shiftKey, …)
   */
  dispatch(type, event = {}) {
    for (const handler of this.listeners.get(type) ?? []) {
      handler({
        type,
        target: this,
        preventDefault() {},
        stopPropagation() {},
        ...event,
      });
    }
  }
}

/**
 * @param {FakeNode} root
 * @param {(node: FakeNode) => boolean} predicate
 * @returns {FakeNode[]}
 */
export function collect(root, predicate) {
  const matches = [];
  const visit = (node) => {
    if (predicate(node)) matches.push(node);
    for (const child of node.childNodes) visit(child);
  };
  visit(root);
  return matches;
}

/** @param {{requireMountedFocus?: boolean}} [options] */
export function createFakeDocument(options = {}) {
  const root = new FakeNode('div');
  const documentElement = new FakeNode('html');
  const document = {
    root,
    documentElement,
    activeElement: null,
    requireMountedFocus: options.requireMountedFocus ?? false,
    getElementById: (id) => (id === 'app' ? root : null),
    createElement: (tagName) => {
      const node = new FakeNode(tagName);
      node.ownerDocument = document;
      return node;
    },
  };
  return document;
}
