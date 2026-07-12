/**
 * Shared project constants.
 * Credentials are loaded from .env.
 */

export const BASE_URL =
  process.env.BASE_URL || 'https://community.cloud.automationanywhere.digital';

export const API = {
  AUTH: '/v2/authentication',
  FOLDERS: '/v2/repository/folders',
  FILES: '/v2/repository/files',
  FILE_CONTENT: (id: string) => `/v2/repository/files/${id}/content`,
  FILE_DEPENDENCIES: (id: string) =>
    `/v2/repository/files/${id}/dependencies`,
} as const;

export const CONTENT_TYPE = {
  FORM: 'application/vnd.aa.form',
  WORKFLOW: 'application/vnd.aa.workflow',
} as const;

export const SELECTORS = {
  LOGIN: {
    USERNAME_INPUT: 'input[type="text"]:not([class*="hidden"]):not([name*="auto"])',
    PASSWORD_INPUT: 'input[type="password"]',
    SUBMIT_BUTTON: 'button:has-text("Log in")',
    ERROR_MESSAGE: '[class*="error"], [role="alert"], [class*="alert"]',
  },

  NAV: {
    AUTOMATION_MENU_ITEM: 'text=Automation',
    CREATE_DROPDOWN: 'button:has-text("Create")',
    CREATE_FORM_OPTION:
      '[role="menuitem"]:has-text("Form"), li:has-text("Form"), button:has-text("Form")',
  },

  FORM_MODAL: {
    NAME_INPUT: 'input[value="Untitled"], input[placeholder*="Untitled"]',
    DESCRIPTION: 'textarea',
    CREATE_BUTTON: 'button:has-text("Create & edit")',
  },

  IFRAME: {
    FORM_BUILDER_FRAME: 'iframe.modulepage-frame',
  },

  FORM_BUILDER: {
    PALETTE_TEXTBOX: {
      role: 'button' as const,
      name: ' Text Box',
    },

    PALETTE_FILE_UPLOAD: {
      role: 'button' as const,
      name: ' Select File',
    },

    DRAG_SOURCE_TEXTBOX:
      '.editor-palette-item__child--is_draggable:has(.editor-palette-item__child-label)',

    DRAG_SOURCE_FILE_UPLOAD:
      '.editor-palette-item__child--is_draggable:has(.editor-palette-item__child-label)',

    CANVAS: '.editor-layout__canvas',
    CANVAS_PANE: '.formcanvas__leftpane',

    PROPERTIES_PANEL: '.editor-details__content',

    SAVE_BUTTON: '.command-button--is_solid button',

    CANVAS_TEXTBOX:
      '.formcanvas-element, [class*="textbox"], [class*="text-box"]',

    CANVAS_FILE_UPLOAD:
      '.formcanvas-element, [class*="file-upload"], [class*="selectfile"]',

    SUCCESS_TOAST:
      '[class*="toast"], [role="status"], [class*="notification"], [class*="snack"]',
  },
} as const;

export const TIMEOUT = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
  DRAG: 2000,
} as const;