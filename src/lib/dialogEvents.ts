// Fired after a modal dialog closes. The native `close` event is not enough: it fires in a later
// task, by which time the dialog may already be removed from the page and the event goes nowhere.
export const DIALOG_CLOSED = 'clearspace:dialog-closed';
export const announceDialogClosed = () => window.dispatchEvent(new Event(DIALOG_CLOSED));
