/**
 * Template module
 * Variable substitution and prompt rendering
 */

// Render functions
export {
  renderPrompt,
  extractVariables,
  getMissingVariables,
  getDefaultValue,
} from "./render";

// Variable helpers
export {
  getDynamicDefaults,
  formatVariableName,
  getVariablePlaceholder,
} from "./variables";
