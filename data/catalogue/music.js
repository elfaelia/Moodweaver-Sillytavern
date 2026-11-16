// Music: the words the song sheet and the Music tab use, and how a scene's Moment is worked out.
// Nothing here is sent to Claude. engine/music.js reads these to score songs; app/music.js plays them.
//
// MOMENTS: one row per kind of scene a song can be tagged for.
//   id      never change it: saved tags use it
//   label   the name in the sheet and the panel
//   moods   mood ids: the moment is on when someone in the scene feels one at 41 or more
//   places  setting fact ids (Facts › Place & time): on when one of them is on
//   dyn     dynamic group ids: on when the main or second dynamic is in one of them
//   test    (optional) a further check on the scene snapshot (see engine/music.js)
// The order here is the order in the sheet's dropdown and on the panel's chips.

export const MOMENTS = [
    { id: 'hunted', label: 'Being hunted', moods: ['hunted', 'prey_instinct', 'cornered', 'panicking'], places: [], dyn: [] },
    { id: 'escape', label: 'Escape', moods: ['trapped', 'desperate'], places: ['abandoned', 'dangerous'], dyn: [], test: s => s.energy >= 4 },
    { id: 'captivity', label: 'Captivity', moods: ['hostage_calm', 'helpless', 'trapped', 'dreading_punishment'], places: ['padded_cell', 'glass_cage', 'basement', 'interrogation_room'], dyn: ['captor'] },
    { id: 'experiment', label: 'Experiment', moods: ['clinical_cruelty', 'playing_god'], places: ['observation_room', 'operating_theatre', 'hydrotherapy_room', 'garage_lab', 'facility'], dyn: ['clinic'] },
    { id: 'violence', label: 'Violence', moods: ['violent', 'bloodthirsty', 'seeing_red', 'murderous'], places: ['crime_scene'], dyn: [], test: s => s.meters.hu >= 61 },
    { id: 'argument', label: 'Argument', moods: ['seething', 'fuming', 'spoiling_for_fight', 'temper_tantrum'], places: [], dyn: [] },
    { id: 'making_up', label: 'Making up', moods: ['forgiving', 'contrite', 'reunited'], places: [], dyn: [] },
    { id: 'confession', label: 'Confession', moods: ['mask_slip', 'cant_hold_it_in', 'opening_up', 'confession_close', 'confessing_to_no_one'], places: [], dyn: [] },
    { id: 'breakdown', label: 'Breakdown', moods: ['spiralling', 'quietly_breaking', 'broken', 'in_shock'], places: [], dyn: [] },
    { id: 'seduction', label: 'Seduction', moods: ['flirty', 'seductive', 'heated'], places: [], dyn: ['heat'] },
    { id: 'afterglow', label: 'Afterglow', moods: ['afterglow', 'aftercare_mode', 'sated'], places: [], dyn: [], test: s => s.facts.has('spent') },
    { id: 'sleep', label: 'Sleep', moods: ['sleepy', 'sleepy_contentment'], places: ['sleep_room'], dyn: [], test: s => s.night && s.energy <= 2 },
    { id: 'quiet', label: 'Quiet together', moods: ['cuddly', 'feels_safe', 'homey', 'peaceful'], places: ['cosy', 'domestic'], dyn: [], test: s => s.energy <= 2 },
    { id: 'reunion', label: 'Reunion', moods: ['reunited', 'missing_them'], places: [], dyn: [] },
    { id: 'grief', label: 'Grief', moods: ['grieving', 'numb_grief', 'anticipatory_grief'], places: ['funeral', 'graveside', 'morgue', 'emptied_home'], dyn: [] },
    { id: 'first_meeting', label: 'First meeting', moods: [], places: [], dyn: [], test: s => s.replies <= 6 },
    { id: 'party', label: 'Party', moods: ['party_mode', 'party_brain'], places: ['party', 'bar_club', 'jazz_club'], dyn: [] },
    { id: 'driving', label: 'Driving', moods: [], places: ['in_a_car', 'drive_in'], dyn: [] },
];

// Heat: what a song is for in an intimate scene. A song tagged Sex scene only plays in one.
export const HEAT = [
    { id: 'slow', label: 'Slow burn' },
    { id: 'sex', label: 'Sex scene' },
];
// Facts that mean a sex scene is happening (In the bedroom). Restraints are left out on purpose:
// in a captivity story they mean something else.
export const SEX_FACTS = ['bedroom_wet', 'bedroom_hard', 'edged', 'undressed', 'straddling', 'denied', 'first_time', 'being_watched_in_bed', 'wearing_plug'];

export const ENERGY = [
    { id: 1, label: '1 Still' }, { id: 2, label: '2 Low' }, { id: 3, label: '3 Medium' }, { id: 4, label: '4 High' }, { id: 5, label: '5 Frantic' },
];
// How charged each mood family makes a scene, 1 to 5. The scene's energy is the average over its strongest moods.
export const FAMILY_ENERGY = { happy: 3.5, bold: 3.5, closeness: 2.3, attachment: 3, cold: 2, sad: 1.6, scared: 4, angry: 4.5, cruel: 3.5, calm: 1.5, masks: 2.6, energy: 3.2, headspace: 3, desire: 3.4 };
// Moments and places that push the energy up or down.
export const ENERGY_PUSH = { hunted: 1.2, escape: 1, violence: 1.2, party: 0.8, sleep: -1.2, quiet: -0.6, grief: -0.5, afterglow: -0.6, dangerous: 0.6, stormy: 0.3, late_night: -0.3 };

// How much each match is worth (the doc's table). Change these to make one kind of tag count more.
export const POINTS = {
    char: 4, otherChar: -6, mood: 4, moodMax: 2, family1: 2.5, family2: 1.5, place: 3, moment: 3, dynamic: 2, heat: 3, sexOutside: -5,
    energySame: 2, energyNear: 1, energyFar: -1, favourite: 0.5, recent: -4, theme: 3, fits: 1, fitsMax: 3, notHere: -1.5, notHereMin: -6,
};
// Below this, nothing fits well enough and the fallbacks take over.
export const GOOD_ENOUGH = 5;
// How many songs at the top are sent to Spotify at once, so it keeps playing fitting songs even if the page sleeps.
export const LINEUP = 8;

// Settings in the Music tab, as tap choices.
export const CHANGE_CHOICES = [['end', 'Only when a song ends'], ['big', 'On big shifts'], ['any', 'On any shift']];
export const HOLD_CHOICES = [[60, '1 min'], [120, '2 min'], [240, '4 min']];
export const THEME_CHOICES = [['big', 'At their big moments'], ['always', 'Whenever they appear'], ['off', 'Never']];
