// Music: the words the song sheet and the Music tab use, and how a scene's Moment is worked out.
// Nothing here is sent to Claude. engine/music.js reads these to score songs; app/music.js plays them.
//
// MOMENTS: one row per kind of scene a song can be tagged for.
//   id      never change it: saved tags use it
//   label   the name in the sheet and the panel
//   moods   mood ids: the moment is on when someone in the scene feels one at 41 or more
//   places  setting fact ids (Facts \u203a Place & time): on when one of them is on
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
    { id: 'seduction', label: 'Seduction', moods: ['seductive', 'heated', 'sensual'], places: [], dyn: ['heat'] },
    { id: 'afterglow', label: 'Afterglow', moods: ['afterglow', 'aftercare_mode', 'sated'], places: [], dyn: [], test: s => s.facts.has('spent') },
    { id: 'sleep', label: 'Sleep', moods: ['sleepy', 'sleepy_contentment'], places: ['sleep_room'], dyn: [], test: s => s.night && s.energy <= 2 },
    { id: 'quiet', label: 'Quiet together', moods: ['cuddly', 'feels_safe', 'homey', 'peaceful'], places: ['cosy', 'domestic'], dyn: [], test: s => s.energy <= 2 },
    { id: 'reunion', label: 'Reunion', moods: ['reunited', 'missing_them'], places: [], dyn: [] },
    { id: 'grief', label: 'Grief', moods: ['grieving', 'numb_grief', 'anticipatory_grief'], places: ['funeral', 'graveside', 'morgue', 'emptied_home'], dyn: [] },
    { id: 'first_meeting', label: 'First meeting', moods: [], places: [], dyn: [], test: s => s.replies <= 6 },
    { id: 'party', label: 'Party', moods: ['party_mode', 'party_brain'], places: ['party', 'bar_club', 'jazz_club'], dyn: [] },
    // 1.68: more specific scenes for the dark stories.
    { id: 'stalking', label: 'Watching / stalking', moods: ['watching_over', 'keeping_tabs', 'voyeuristic', 'obsessive_collecting'], places: [], dyn: [] },
    { id: 'worship', label: 'Worship', moods: ['worshipful', 'devotion_cult', 'terrified_awe', 'hypnotised'], places: [], dyn: [] },
    { id: 'conditioning', label: 'Conditioning / brainwashing', moods: ['gaslighting', 'breaking_will', 'breaking_them', 'performing_obedience', 'broken_mind', 'imprinting'], places: [], dyn: ['mind'] },
    { id: 'sedated', label: 'Sedated / drugged drift', moods: ['dazed', 'brain_fog', 'zoned_out', 'dissociating', 'subspace'], places: [], dyn: [] },
    { id: 'high', label: 'High / using', moods: ['euphoric_high', 'strung_out', 'comedown', 'hazy_drunk', 'drinking_to_forget'], places: [], dyn: [] },
    { id: 'driving', label: 'Driving', moods: [], places: ['in_a_car', 'drive_in'], dyn: [] },
    // 1.69.2: the sweet side, so a shy confession or a giggly flirt isn't read as foreplay.
    { id: 'love_confession', label: 'Love confession', moods: ['giddy_in_love', 'openhearted', 'butterflies_kiss', 'sweet_on_them'], places: [], dyn: [] },
    { id: 'flirting', label: 'Flirting / teasing', moods: ['flirty', 'coy', 'teasing_them', 'tender_teasing', 'cheeky', 'shy_desire'], places: [], dyn: [] },
    { id: 'sweet_moment', label: 'Sweet / wholesome', moods: ['smitten', 'giddy', 'playful', 'tickled', 'goofy', 'charmed', 'melting', 'daydream_happy'], places: [], dyn: [] },
    // 1.89: romance apart from sex, the in-between and action scenes, and kinds of high.
    { id: 'romance', label: 'Romance / in love', moods: ['romantic', 'lovesick', 'devoted', 'devotion_quiet', 'cherishing', 'butterflies_kiss'], places: [], dyn: [] },
    { id: 'longing', label: 'Longing / yearning', moods: ['yearning', 'regretful_longing', 'heartsick', 'limerent', 'waiting_on_them'], places: [], dyn: [] },
    { id: 'slow_dance', label: 'Slow dance', moods: [], places: [], dyn: [] },
    { id: 'chase', label: 'Chase / getaway', moods: ['thrill_of_chase', 'adrenaline_high'], places: [], dyn: [], test: s => s.energy >= 4 },
    { id: 'fight', label: 'Fight / brawl', moods: ['spoiling_for_fight', 'feral_energy'], places: [], dyn: [] },
    { id: 'heist', label: 'Robbery / break-in / job', moods: [], places: [], dyn: [] },
    { id: 'betrayal', label: 'Betrayal / lies coming out', moods: ['betrayed', 'cheated', 'caught_out', 'jilted'], places: [], dyn: [] },
    { id: 'confrontation', label: 'Confrontation / ultimatum', moods: ['outraged', 'indignant', 'humiliated_rage', 'provoked', 'jealous_fury'], places: [], dyn: [] },
    { id: 'deal', label: 'Deal / business', moods: ['businesslike', 'calculating_coldness'], places: ['dealers_flat', 'trap_house'], dyn: [] },
    { id: 'standoff', label: 'Standoff / suspicion', moods: ['suspicious', 'paranoid', 'uneasy', 'eggshells', 'watchful_quiet', 'vigilant'], places: [], dyn: [] },
    { id: 'waiting', label: 'Waiting for it', moods: ['dreading', 'waiting_for_bad_news', 'expectant'], places: [], dyn: [] },
    { id: 'hustle', label: 'Street / hustle', moods: ['swaggering_flirt', 'in_their_element', 'cocky', 'unapologetic'], places: ['parking_lot', 'junkyard', 'late_night_diner', 'cheap_motel'], dyn: [] },
    { id: 'stoned', label: 'Stoned / mellow', moods: ['chill', 'languid'], places: [], dyn: [], test: s => s.words.stoned >= 1 },
    { id: 'rolling', label: 'Rolling (ecstasy, loved-up)', moods: [], places: [], dyn: [], test: s => s.words.rolling >= 1 },
    { id: 'tripping', label: 'Tripping (acid, shrooms)', moods: [], places: [], dyn: [], test: s => s.words.tripping >= 1 },
    { id: 'wired', label: 'Wired (speed, coke, tweaking)', moods: ['wired', 'jittery', 'revved_up', 'mind_racing'], places: [], dyn: [], test: s => s.words.wired >= 1 },
    { id: 'nodding', label: 'Nodding (heroin, downers)', moods: [], places: [], dyn: [], test: s => s.words.nodding >= 1 },
    { id: 'drunk', label: 'Drunk', moods: ['hazy_drunk', 'weepy_drunk', 'punch_drunk', 'drinking_to_forget'], places: [], dyn: [] },
    { id: 'comedown', label: 'Comedown / withdrawal', moods: ['comedown', 'strung_out', 'adrenaline_crash'], places: [], dyn: [] },
];
// Kinds of high (1.89): when one of these is on, the scene is High and the plain High / using moment steps back.
export const HIGHS = ['stoned', 'rolling', 'tripping', 'wired', 'nodding', 'drunk', 'comedown'];

// The kind of scene, which leads the song pick (engine/music.js modeOf). The first that matches wins, in this order,
// except Intimate, which is on whenever there is heat. A song fits a kind through its Moment (or, with no Moment
// tagged, its first two Feelings); Intimate songs need Heat, a Desire feeling or a Seduction/Afterglow moment.
export const MODES = [
    { id: 'intimate', label: 'Erotic', hint: 'foreplay and sex: songs that sound sexual', moments: ['seduction', 'afterglow'], families: ['desire'] },
    { id: 'danger', label: 'Danger', hint: 'real threat: hunted, a weapon out, it going wrong', moments: ['hunted', 'escape', 'violence'], families: ['scared'] },
    { id: 'action', label: 'Action', hint: 'fast and physical: a chase, a fight, a getaway, a job', moments: ['chase', 'fight', 'heist'], families: [] },
    { id: 'drama', label: 'Drama', hint: 'a loud row between people who matter, a betrayal coming out', moments: ['argument', 'betrayal', 'confrontation'], families: ['angry'] },
    { id: 'sorrow', label: 'Sorrow', hint: 'grief, breaking down, a heavy confession', moments: ['grief', 'breakdown', 'confession'], families: ['sad'] },
    { id: 'sweet', label: 'Sweet', hint: 'bright and giddy: flirting, teasing, a shy confession', moments: ['love_confession', 'flirting', 'sweet_moment'], families: ['happy', 'closeness'] },
    { id: 'romantic', label: 'Romantic', hint: 'in love, longing, a real kiss, a slow dance: not sex', moments: ['romance', 'longing', 'slow_dance'], families: [] },
    { id: 'tender', label: 'Tender', hint: 'quiet and soft: comfort, lying together, sleep, making up', moments: ['afterglow', 'sleep', 'quiet', 'making_up', 'reunion'], families: ['closeness', 'calm', 'attachment'] },
    { id: 'dark', label: 'Dark', hint: 'captivity, experiments, conditioning, being watched', moments: ['captivity', 'experiment', 'conditioning', 'sedated', 'stalking', 'worship'], families: ['cruel', 'cold', 'scared'] },
    { id: 'high', label: 'High', hint: 'on something: the kind of high picks the songs', moments: ['high', 'stoned', 'rolling', 'tripping', 'wired', 'nodding', 'drunk', 'comedown'], families: [] },
    { id: 'tense', label: 'Tense', hint: 'uneasy but nothing has happened yet: a deal, a standoff, waiting', moments: ['deal', 'standoff', 'waiting'], families: [] },
    { id: 'street', label: 'Street', hint: 'the everyday grit: hustling, cruising, hanging about, swagger', moments: ['hustle', 'driving', 'deal'], families: [] },
    { id: 'party', label: 'Party', hint: 'a party, a club, letting loose', moments: ['party', 'first_meeting'], families: ['happy', 'energy', 'bold'] },
];
// Romance apart from sex (1.89): these moods make a scene Romantic when they outweigh the pull to bed.
export const ROMANCE_MOODS = ['romantic', 'lovesick', 'devoted', 'devotion_quiet', 'cherishing', 'yearning', 'heartsick', 'limerent', 'butterflies_kiss', 'sweet_on_them', 'missing_them', 'regretful_longing'];
// Where a song tagged Heard in (sheet column "Heard in") is coming from the room itself. Ids match engine/venues.js,
// plus car (a car stereo) and radio (any radio, jukebox or record player in the story).
export const HEARD_IN = [
    { id: 'gig', label: 'Gig / punk show' }, { id: 'club', label: 'Club / rave' }, { id: 'party', label: 'House party' }, { id: 'cocktail', label: 'Bar' },
    { id: 'jazz', label: 'Jazz club' }, { id: 'dance', label: 'Dance / ballroom' }, { id: 'car', label: 'Car stereo' }, { id: 'radio', label: 'Radio / record player' },
];
// What the story's own words can switch on (engine/scene-words.js): word list \u2192 Moment.
export const WORD_MOMENTS = { violence: 'violence', hunted: 'hunted', grief: 'grief', sleep: 'sleep', party: 'party', driving: 'driving', sweet: 'sweet_moment', confess: 'love_confession', flirt: 'flirting',
    slowdance: 'slow_dance', chase: 'chase', fight: 'fight', heist: 'heist', betrayal: 'betrayal', row: 'confrontation', deal: 'deal', standoff: 'standoff', hustle: 'hustle',
    stoned: 'stoned', rolling: 'rolling', tripping: 'tripping', wired: 'wired', nodding: 'nodding', drunk: 'drunk', comedown: 'comedown' };
// Sweet or intimate? Light desire (a flirt, a shy want) counts half towards heat. Sweet moods and the story's sweet words
// (a confession, giggling, holding hands, a kiss on the cheek) weigh against heat: when they outweigh it, the scene is
// Sweet, not Intimate, unless it's plainly a sex scene or you set it yourself.
export const LIGHT_DESIRE = ['flirty', 'coy', 'teasing_them', 'shy_desire', 'lust_at_first_sight', 'admiration_to_desire', 'intellectual_chemistry', 'aesthetic_fascination', 'checking_out', 'kiss_hungry', 'desperate_closeness'];
export const SWEET_MOODS = ['giddy_in_love', 'smitten', 'playful', 'cheeky', 'giddy', 'charmed', 'flattered', 'tickled', 'goofy', 'mirthful', 'daydream_happy', 'cosy_happiness', 'happy', 'romantic', 'sweet_on_them', 'butterflies_kiss', 'tender_teasing', 'affectionate', 'melting', 'openhearted', 'soft', 'warm', 'fond_exasperation', 'cherishing', 'new_relationship_energy', 'flirty', 'coy', 'shy_desire', 'teasing_them'];

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
export const ENERGY_PUSH = { hunted: 1.2, escape: 1, violence: 1.2, party: 0.8, sleep: -1.2, quiet: -0.6, grief: -0.5, afterglow: -0.6, sedated: -1, worship: -0.4, high: 0.5, chase: 1.2, fight: 1, heist: 0.6, confrontation: 0.6, standoff: -0.2, waiting: -0.4, stoned: -0.8, nodding: -1.4, comedown: -0.8, wired: 1, rolling: 0.6, slow_dance: -0.8, longing: -0.4, dangerous: 0.6, stormy: 0.3, late_night: -0.3 };

// How much each match is worth (the doc's table). Change these to make one kind of tag count more.
export const POINTS = {
    char: 4, charScene: 2.5, otherChar: -6, mood: 4, moodMax: 2, family1: 2.5, family2: 1.5, place: 3, moment: 3, dynamic: 2, heat: 4, heatNear: 2, slowOutside: -3,
    modeFit: 4, modeMiss: -7, meaning: 5, both: 2, modeMissIntimate: -16, sound: 1, soundMax: 3,
    energySame: 2, energyNear: 1, energyFar: -1, favourite: 0.5, recent: -4, theme: 3, cue: 5, fits: 1, fitsMax: 3, notHere: -1.5, notHereMin: -6,
};
// Below this, nothing fits well enough and the fallbacks take over.
export const GOOD_ENOUGH = 5;
// How many songs at the top are sent to Spotify at once, so it keeps playing fitting songs even if the page sleeps.
export const LINEUP = 12;

// Settings in the Music tab, as tap choices.
export const CHANGE_CHOICES = [['end', 'Only when a song ends'], ['big', 'On big shifts'], ['any', 'On any shift']];
export const HOLD_CHOICES = [[60, '1 min'], [120, '2 min'], [240, '4 min']];
export const THEME_CHOICES = [['big', 'At their big moments'], ['always', 'Whenever they appear'], ['off', 'Never']];

// Meanings: what a song is about when it is two feelings at once (Laughing on the Outside is joking AND hurt).
// A Meaning only counts when one person in the scene feels something from each side at 31 or more, and then it
// counts a lot. Each side lists feelings ('f:<family id>') and exact mood labels as the panel shows them.
export const COMBOS = [
    { id: 'laughing_heartbreak', label: 'Laughing through heartbreak', a: ['f:happy', 'Joking through hurt', 'Forced cheer', 'Brave face', 'Charm as armour', 'Polite smile', 'Partying it off'], b: ['f:sad'] },
    { id: 'grieving_love', label: 'Grieving a love', a: ['f:sad'], b: ['f:closeness', 'Lovesick', 'Yearning', 'Missing them', 'Devoted', 'Limerent'] },
    { id: 'love_that_hurts', label: 'Loving the one who hurts you', a: ['f:closeness', 'f:attachment'], b: ['Hurt', 'Betrayed', 'Used', 'Afraid of them', 'Walking on eggshells', 'Trauma bonded', 'Dreading punishment', 'Cowed'] },
    { id: 'devotion_madness', label: 'Devotion turned to madness', a: ['Worshipful', 'Blind devotion', 'Obsessed', 'Shrine-keeping', 'Love-addicted', 'Imprinting', 'Starved for one person'], b: ['Unhinged', 'Mind breaking', 'Spiralling', 'Manic', 'Intrusive thoughts', 'Dissociating', 'Entranced'] },
    { id: 'awe_dread', label: 'Awe and dread (a god to them)', a: ['Terrified awe', 'Awe-struck', 'Worshipful', 'Entranced', 'Reverent desire', 'Blind devotion'], b: ['f:scared'] },
    { id: 'tender_menace', label: 'Tender menace', a: ['f:closeness', 'Weaponised kindness', 'Smiling threat', 'False mercy'], b: ['f:cruel'] },
    { id: 'calm_cruelty', label: 'Calm before the cut', a: ['f:calm', 'Eerily calm', 'Predatory patience', 'Businesslike'], b: ['f:cruel'] },
    { id: 'sweet_sinister', label: 'Sweet and sinister', a: ['f:happy'], b: ['f:cruel', 'f:scared', 'Hostage calm', 'Trapped'] },
    { id: 'wanting_wrong', label: 'Wanting what\u2019s wrong', a: ['f:desire'], b: ['Guilty lust', 'Forbidden want', 'Conflicted attraction', 'Ashamed', 'Guilty / regretful', 'Scared of being found out', 'Guilt-sick'] },
    { id: 'surrender', label: 'Fear and surrender', a: ['f:scared'], b: ['f:desire', 'Longing to submit', 'Wants to be taken'] },
    { id: 'hate_want', label: 'Hate and want', a: ['f:desire'], b: ['f:angry', 'Icy contempt', 'Hateful'] },
    { id: 'hollow_want', label: 'Wanting while numb', a: ['f:desire'], b: ['Numbed out', 'Dissociating', 'Empty', 'Dead-eyed', 'Hollowed out', 'Detached'] },
    { id: 'rage_in_love', label: 'Rage inside love', a: ['f:angry'], b: ['f:closeness', 'f:attachment'] },
    { id: 'possessive_tender', label: 'Tender and possessive', a: ['f:closeness'], b: ['Possessive', 'Staking a claim', 'Possessive lust', 'Territorial', 'Controlling', 'Won\u2019t let go', 'Holding on too tight'] },
    { id: 'longing_gone', label: 'Longing for someone gone', a: ['Missing them', 'Yearning', 'Loyal to a ghost', 'Waiting on them', 'Heartsick'], b: ['Grieving', 'Numb grief', 'Old grief', 'Forsaken', 'Left behind', 'Mourning what they had'] },
    { id: 'sorry_loved_badly', label: 'Sorry I loved you badly', a: ['Guilt-sick', 'Contrite', 'Wishing they could undo it', 'Never said it', 'Guilty / regretful'], b: ['f:closeness', 'f:attachment'] },
    { id: 'saving_from_self', label: 'Saving them from me', a: ['Protective', 'Caretaking', 'Protective rage', 'Holding it together for them'], b: ['Ashamed', 'Worthless', 'Guilt-sick', 'Afraid of being a burden', 'Self-pitying'] },
    { id: 'dancing_edge', label: 'Dancing on the edge', a: ['Manic', 'Euphoric', 'Hyper', 'Party brain', 'High', 'Reckless courage', 'Feral energy'], b: ['f:sad', 'f:scared'] },
    { id: 'quiet_after', label: 'Quiet after the storm', a: ['f:calm', 'Calm after violence', 'Cried out'], b: ['f:sad', 'In shock', 'Hollowed out'] },
    { id: 'pretending_fine', label: 'Pretending to be fine', a: ['f:masks', 'Acting unaffected', 'Pretending not to care', 'Stiff upper lip'], b: ['f:sad', 'f:scared'] },
    { id: 'repressed_want', label: 'Repressed want', a: ['Hiding arousal', 'Bottling it', 'Stoic', 'Stern', 'In control', 'Unreadable', 'Poker face', 'Polite through gritted teeth'], b: ['f:desire', 'Starved for one person'] },
];
