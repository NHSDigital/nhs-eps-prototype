export const toggleAttribute = (element, attr) => {
  // Return without error if element or attr are missing
  if (!element || !attr) return;
  // Toggle attribute value. Treat no existing attr same as when set to false
  const value = (element.getAttribute(attr) === 'true') ? 'false' : 'true';
  element.setAttribute(attr, value);
};
export const toggleConditionalInput = (input, className) => {
  // Return without error if input or class are missing
  if (!input || !className) return;
  // If the input has conditional content it had a data-aria-controls attribute
  const conditionalId = input.getAttribute('aria-controls');
  if (conditionalId) {
    // Get the conditional element from the input data-aria-controls attribute
    const conditionalElement = document.getElementById(conditionalId);
    if (conditionalElement) {
      conditionalElement.classList.toggle(className);
      toggleAttribute(input, 'aria-expanded');
    }
  }
};

/**
 * Toggle a toggle a class on conditional content for an input based on checked state
 * @param {HTMLElement} input input element
 * @param {string} className class to toggle
 */

/**
 * Handle menu show and hide for mobile
 */
export default () => {
  // HTMLElements
  const toggleButton = document.querySelector('#toggle-menu');
  const closeButton = document.querySelector('#close-menu');
  const nav = document.querySelector('#header-navigation');

  /**
   * Toggle classes and attributes
   * @param {Object} event click event object
   */
  const toggleMenu = (event) => {
    event.preventDefault();
    // Toggle aria-expanded for accessibility
    toggleAttribute(toggleButton, 'aria-expanded');
    // Toggle classes to apply CSS
    toggleButton.classList.toggle('is-active');
    nav.classList.toggle('js-show');
  };

  // Check all necessary HTMLElements exist
  if (toggleButton && closeButton && nav) {
    // Attach toggleMenu as click to any elements which need it
    [toggleButton, closeButton].forEach((elem) => {
      elem.addEventListener('click', toggleMenu);
    });
  }
};