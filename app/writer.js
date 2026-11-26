// Writers (2.0.15): your main writing model and a stand-in, as SillyTavern Connection Profiles, with one tap on the
// Scene page to switch which one writes. Moodweaver only switches the profile (the same as picking it in
// SillyTavern's Connection Profiles menu); everything else about the reply stays the same.
import { profiles } from './chat.js';
import { settings } from './settings.js';
import { ctx, run } from './state.js';

const all = () => (profiles() ?? []).filter(p => p?.id && p?.name);
export const writerName = id => all().find(p => p.id === id)?.name ?? '';
// The profile SillyTavern has selected right now ('' when the Connection Profiles extension isn't on).
export const currentWriter = () => ctx().extensionSettings?.connectionManager?.selectedProfile ?? '';
export const writerChoices = () => all().map(p => [p.id, p.name]);
// What the Scene page shows: null until both writers are picked.
export function writerState() {
    const main = settings().writerMain ?? '', alt = settings().writerAlt ?? '';
    if (!main || !alt || main === alt || !writerName(main) || !writerName(alt)) return null;
    const now = currentWriter();
    return { main, alt, now, onAlt: now === alt, mainName: writerName(main), altName: writerName(alt), nowName: writerName(now) };
}
// Switch SillyTavern's connection to this profile, through its own /profile command.
export async function switchWriter(id) {
    const name = writerName(id), c = ctx();
    if (!name) throw new Error('That connection profile is gone. Pick it again in Settings \u203a Writers.');
    const exec = c.executeSlashCommandsWithOptions ?? c.executeSlashCommands;
    if (typeof exec !== 'function') throw new Error('This SillyTavern can\u2019t switch profiles from an extension.');
    run.writerBusy = true;
    try { await exec.call(c, `/profile ${name.replace(/[|{}]/g, ' ').trim()}`); }
    finally { run.writerBusy = false; }
    if (currentWriter() && currentWriter() !== id) throw new Error(`SillyTavern didn\u2019t switch to ${name}. Check the profile in its Connection Profiles menu.`);
}
