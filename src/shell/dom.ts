/**
 * DOM utilities - Safe DOM manipulation helpers
 * Imperative Shell - handles DOM side effects
 */

/**
 * Safely get an element by ID with type checking
 * Throws if element not found - fail fast for required elements
 */
export function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Required element not found: #${id}`);
  }
  return element as T;
}

/**
 * Safely query an element with type checking
 */
export function requireQuery<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

/**
 * Add event listener with automatic cleanup tracking
 */
export function addListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void
): () => void {
  element.addEventListener(type, listener);
  return () => element.removeEventListener(type, listener);
}

/**
 * Set element visibility
 */
export function setVisible(element: HTMLElement, visible: boolean): void {
  element.style.display = visible ? '' : 'none';
}

/**
 * Toggle CSS class
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}

/**
 * Create element with properties
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLElementTagNameMap[K]> & { children?: (HTMLElement | string)[] }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (props) {
    const { children, ...rest } = props;

    // Set properties
    Object.assign(element, rest);

    // Append children
    if (children) {
      children.forEach((child) => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }
  }

  return element;
}

/**
 * Clear all children from element
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
