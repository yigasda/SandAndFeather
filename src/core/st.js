// SillyTavern access in one place: the context, its events, and whether a chat is open.
// Same calls as NarrativeArchive uses (getContext, eventSource, chatMetadata, setExtensionPrompt).

export const ctx = () => SillyTavern.getContext();
export const eventTypes = () => { const c = ctx(); return c.eventTypes || c.event_types || {}; };
export const hasChat = () => { const c = ctx(); return !!(c.chatId || c.getCurrentChatId?.()); };
export const chatKey = () => String(ctx().getCurrentChatId?.() || ctx().chatId || '');
