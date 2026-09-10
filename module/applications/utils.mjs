/**
 * Shared helpers for actor/item sheet applications.
 */

/**
 * Ask the user to confirm an irreversible deletion via a DialogV2 confirm
 * prompt. Used before any itemDelete-style action so a stray click on a
 * trash icon can't silently remove something with no way back.
 * @param {string} name  Display name of the thing being deleted, shown in
 *                       the dialog body (falls back to a generic phrase if
 *                       empty/undefined).
 * @returns {Promise<boolean>}  True if the user confirmed the deletion.
 */
export async function confirmDelete(name) {
  const label = name || game.i18n.localize("SW5E.DeleteConfirmFallback");
  return foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("SW5E.DeleteConfirmTitle") },
    content: `<p>${game.i18n.format("SW5E.DeleteConfirmContent", { name: label })}</p>`,
    rejectClose: false,
    modal: true
  });
}
