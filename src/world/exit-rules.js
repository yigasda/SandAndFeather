// Passage conditions use existing saved progression. Day zero is a valid first defeat.
// Daily respawn (desertFight.killed) must never close a previously opened door.
export function canUseExit(exit, state) {
    const required = exit?.requiresFirstDefeat;
    return !required || state?.desertFight?.first?.[required] != null;
}
