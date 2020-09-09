'use strict'

// Configuration

/**
 * The button that makes the menu pop out.
 */
const BUTTON_TOGGLE = '[data-toggle="offcanvas"]'
/**
 * The menu itself.
 */
const CONTAINER_MENU = '.offcanvas-collapse'
/**
 * The overlay that dismisses the menu when touched.
 */
const CONTAINER_OVERLAY = '.offcanvas-overlay'
/**
 * The class that means the menu is open.
 */
const CLASS_MENU_OPEN = 'open'
/**
 * The class that means the button is hidden.
 */
const CLASS_BUTTON_HIDDEN = 'd-none'
/**
 * The event type that makes the menu pop out when the button is touched.
 */
const EVENT_TRIGGER_TOGGLE = 'click'
/**
 * The event type that makes the menu go away when the overlay is touched.
 */
const EVENT_TRIGGER_OVERLAY = EVENT_TRIGGER_TOGGLE
/**
 * All of the things that are toggled.
 * @property {string} selector - The thing that is toggled.
 * @property {string} className - The thing means that the thing is toggled.
 */
const TOGGLEABLES = [
  {
    selector: CONTAINER_MENU,
    className: CLASS_MENU_OPEN,
  },
  {
    selector: BUTTON_TOGGLE,
    className: CLASS_BUTTON_HIDDEN,
  },
]
/**
 * The things that do the toggling when you touch them.
 * @property {string} selector - The thing that toggles.
 * @property {string} eventType - The thing that makes the thing toggle.
 */
const TOGGLERS = [
  {
    selector: BUTTON_TOGGLE,
    eventType: EVENT_TRIGGER_TOGGLE,
  },
  {
    selector: CONTAINER_OVERLAY,
    eventType: EVENT_TRIGGER_OVERLAY,
  },
]

// Event Handlers

/**
 * Toggle all the things
 */
const doToggle = () => {
  TOGGLEABLES.forEach(({ selector, className }) => {
    $(selector).toggleClass(className)
  })
}

/**
 * Toggle event listeners for toggle event handlers
 */
const setUpTogglers = () => {
  TOGGLERS.forEach(({ selector, eventType }) => {
    $(selector).on(eventType, doToggle)
  })
}

// Do it now.  (actually when the DOM is ready)
$(setUpTogglers)