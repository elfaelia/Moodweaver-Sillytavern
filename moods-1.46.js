// 1.46.0 catalogue data: one home for each idea. Moodlets that were really standing traits move to the
// Traits tab, traits that are really passing feelings move to the Moods tab, and every mood section gets new
// feelings, weighted toward the dark, ugly and sexual ones now that replies set moods by themselves. Ids never
// change, so saved values carry over wherever a row moves. Nothing here repeats a row that already exists.
// Data only: core.js applies it. Rows: id, label, description.

// Into the Traits tab: standing patterns, not feelings. A reply can't move them, like every other trait.
export const TO_TRAITS = {
    psychosexual: ['perverted', 'dirty_minded', 'covert_pervert', 'deviant', 'male_gaze', 'female_gaze', 'attraction_to_contrast', 'competitive_attraction', 'bond_fuelled_attraction', 'banter_fuelled_attraction', 'wants_to_be_pursued'],
    temperament: ['callous', 'insensitive', 'judgemental', 'lazy', 'careless', 'argumentative', 'experimental', 'secretive', 'logical'],
    psychology: ['secure_attachment', 'idealise_devalue', 'emotional_scorekeeping', 'attached_to_potential', 'one_person_exception', 'compartmentalising'],
    archetype: ['yandere', 'collector', 'petty_tyrant', 'brainwasher'],
    dynamics: ['fatherly', 'big_sibling_energy'],
    manner: ['social_chameleon', 'clinical', 'professional'],
};
// Into the Moods tab: feelings that come and go, so replies can move them now.
export const TO_MOODS = {
    scared: ['paranoid', 'awkward'],
    headspace: ['unhinged', 'ambivalent'],
    cold: ['empty'],
    cruel: ['menacing'],
    bold: ['smirking'],
    desire: ['leering', 'coy'],
    angry: ['petulant'],
};
// A reply that still names one of the ones now in Traits lands on the nearest feeling.
export const MOVED_WORDS = {
    perverted: 'playfully_pervy', 'dirty minded': 'playfully_pervy', deviant: 'playfully_pervy', callous: 'unmoved', insensitive: 'dismissive', judgemental: 'condescending',
    lazy: 'sluggish', careless: 'daring', argumentative: 'spoiling_for_fight', secretive: 'poker_face', logical: 'observant', clinical: 'detached', professional: 'businesslike',
    yandere: 'obsessed', collector: 'possessive', compartmentalising: 'holding_it_together_for_them',
};

export const MOOD_ADDITIONS = {
    happy: [
        ['punch_drunk', 'Punch-drunk', 'giddy from exhaustion, pain or too much at once; laughing at the wrong things'],
        ['savouring', 'Savouring', 'drawing a good moment out on purpose, in no hurry for it to end'],
        ['basking', 'Basking', 'soaking up attention, praise or worship and wanting more'],
        ['hysterical', 'Hysterical', 'laughing too hard to stop, close to tears or screaming'],
        ['flattered', 'Flattered', 'pleased by the attention and not hiding it well'],
        ['alive_again', 'Alive', 'everything sharp and bright after a close call or a kill'],
    ],
    bold: [
        ['commanding', 'Commanding', 'taking charge of the room; orders given and expected to be followed'],
        ['provocative', 'Provocative', 'pushing buttons on purpose to see what happens'],
        ['shameless', 'Shameless', 'past caring how it looks; no embarrassment left'],
        ['out_to_win', 'Out to win', 'treating this as a contest and refusing to lose'],
        ['dared', 'Dared', 'goaded into proving something and going through with it'],
        ['territorial', 'Territorial', 'bristling at anyone on their ground or too near their person'],
        ['righteous', 'Righteous', 'sure they’re in the right and ready to punish for it'],
    ],
    closeness: [
        ['aftercare_mode', 'Aftercare', 'gentle and attentive after something rough: water, blankets, soft words, checking every mark'],
        ['soft_spot', 'Soft spot', 'going easier on them than on anyone else, and hating that it shows'],
        ['melting', 'Melting', 'going soft all at once at a look, a touch or a word'],
        ['cherishing', 'Cherishing', 'handling them like something precious and breakable'],
        ['reunited', 'Reunited', 'flooded with relief at having them back'],
    ],
    attachment: [
        ['abandonment_rage', 'Abandonment rage', 'fury at being left, or at the thought of it'],
        ['competing_for_them', 'Competing for them', 'trying to outdo whoever else wants them'],
        ['resentful_need', 'Resentful need', 'needs them and hates needing them'],
        ['holding_on_too_tight', 'Holding on too tight', 'gripping the person or the moment like it’ll vanish'],
        ['imprinting', 'Imprinting', 'latched on to whoever was kind first and following them everywhere'],
    ],
    cold: [
        ['unmoved', 'Unmoved', 'tears, pleas and begging land on nothing'],
        ['dismissive', 'Dismissive', 'waving them off; what they say doesn’t count'],
        ['bored_of_them', 'Bored of them', 'the novelty has worn off and it shows'],
        ['unimpressed', 'Unimpressed', 'nothing they’ve done is worth a reaction'],
        ['turned_off', 'Turned off', 'desire gone cold; touch is unwelcome now'],
    ],
    sad: [
        ['used', 'Used', 'feels like a thing someone took what they wanted from'],
        ['rejected', 'Rejected', 'turned away, and feeling it everywhere'],
        ['disappointed_in_them', 'Disappointed in them', 'quiet hurt at someone falling short'],
        ['jilted', 'Jilted', 'left for someone else, or sure they’re about to be'],
        ['feeling_small', 'Small', 'tiny and unimportant next to someone'],
        ['cried_out', 'Cried out', 'puffy, emptied and quiet after crying'],
    ],
    scared: [
        ['panicking', 'Panicking', 'breath short, thoughts scattering, ready to bolt'],
        ['cornered', 'Cornered', 'no way out, and about to bite'],
        ['trapped', 'Trapped', 'held somewhere they can’t leave and feeling every wall'],
        ['skin_crawling', 'Skin crawling', 'something is wrong and their body knows it first'],
        ['cowed', 'Cowed', 'shrinking, obedient out of fear, eyes down'],
        ['terrified_awe', 'Terrified awe', 'scared of someone and unable to look away'],
        ['dreading_punishment', 'Dreading punishment', 'knows a consequence is coming and can’t stop picturing it'],
        ['disoriented', 'Disoriented', 'doesn’t know where or when they are; nothing lines up'],
    ],
    angry: [
        ['jealous_fury', 'Jealous fury', 'rage that someone else got close'],
        ['provoked', 'Provoked', 'baited, and biting'],
        ['seeing_red', 'Seeing red', 'past thinking; about to break something or someone'],
        ['hateful', 'Hateful', 'hating someone right now with their whole chest'],
        ['cheated', 'Cheated', 'robbed of something they were owed, and furious'],
    ],
    cruel: [
        ['enjoying_their_fear', 'Enjoying their fear', 'likes being the reason someone is scared'],
        ['corrupting', 'Corrupting', 'nudging someone toward worse and delighted at every step'],
        ['clinical_cruelty', 'Clinical cruelty', 'hurting someone calmly, as procedure, and taking notes'],
        ['dangling_it', 'Dangling it', 'holding back what someone wants and making them reach for it'],
        ['playing_god', 'Playing god', 'deciding someone’s fate and enjoying the power of it'],
    ],
    calm: [
        ['businesslike', 'Businesslike', 'getting it done, no feelings involved'],
        ['languid', 'Languid', 'slow, heavy-lidded and in no hurry, often after something good'],
        ['in_control', 'In control', 'calm because they’re the one holding everything'],
        ['expectant', 'Expectant', 'waiting for something they know is coming'],
        ['resolved', 'Resolved', 'decision made, and calm settles in'],
    ],
    masks: [
        ['faking_it', 'Faking it', 'putting on a feeling they don’t have: pleasure, fear, love'],
        ['playing_nice', 'Playing nice', 'pleasant for a reason; sweetness with an agenda'],
        ['holding_back_laugh', 'Holding back a laugh', 'trying hard not to laugh at the worst possible moment'],
        ['hiding_arousal', 'Hiding arousal', 'turned on and determined nobody notices'],
        ['hiding_fear', 'Hiding fear', 'scared and refusing to let it show'],
        ['performing_obedience', 'Performing obedience', 'doing as told on the surface while something else goes on underneath'],
    ],
    energy: [
        ['frantic', 'Frantic', 'rushing and scattered, doing ten things badly'],
        ['feverish', 'Feverish', 'too hot and too bright, running on something unhealthy'],
        ['running_hot', 'Running hot', 'overheated and restless from want, drink or anger'],
        ['pent_up', 'Pent-up', 'energy or want with nowhere to go, building'],
        ['adrenaline_crash', 'Adrenaline crash', 'shaking and drained once the danger is over'],
    ],
    headspace: [
        ['tunnel_vision', 'Tunnel vision', 'sees only the one thing they want; everything else gone'],
        ['fantasising', 'Fantasising', 'drifting into a vivid daydream, usually about someone'],
        ['domspace', 'Domspace', 'the focused, powerful headspace of being in control of someone in a scene'],
        ['revenge_fantasy', 'Revenge fantasies', 'replaying how they’ll make someone pay'],
        ['morbid_curiosity', 'Morbid curiosity', 'can’t stop wondering about the awful thing'],
    ],
    desire: [
        ['wants_to_take', 'Wants to take', 'urge to pin, hold down and take'],
        ['wants_to_be_taken', 'Wants to be taken', 'urge to be pinned, held down and used'],
        ['possessive_lust', 'Possessive lust', 'wanting them and wanting to mark them as theirs'],
        ['voyeuristic', 'Voyeuristic', 'wants to watch more than touch, right now'],
        ['wants_to_be_watched', 'Wants to be watched', 'aroused by being looked at, and putting on a show'],
        ['craving_pain', 'Craving pain', 'wants to be hurt right now, the sharp kind'],
        ['wants_praise', 'Wants praise', 'aching to be told they were good'],
        ['teasing_them', 'In a teasing mood', 'drawing it out, making them wait and beg'],
    ],
};
