// 1.42.0: the named dynamics, grouped for the picker. bond.js decides which one is current; this file is
// the catalogue. Each row: name, test (null = only you or the story can pick it), what it looks like on the
// page, group, words the story's own wording is matched against, and both-ways or story lines it already
// says (those are left out of the note while it's the dynamic, so nothing is sent twice).
// Names with {n} and {u} fill in the character and your persona. Cues use names, never pronouns.
// Meters that are off are undefined, so a test that reads them can't fire.
const heat = d => d.lu ?? d.ds;

export const DYNAMIC_GROUPS = [
    ['captor', 'Captor & prey', '⛓', 'blood'],
    ['obsess', 'Obsession & worship', '◉', 'violet'],
    ['power', 'Power, care & control', '♛', 'clinic'],
    ['romance', 'Romance & tenderness', '♡', 'rose'],
    ['heat', 'Lust & heat', '♨', 'ember'],
    ['toxic', 'Toxic, broken & on-off', '↯', 'bruise'],
    ['allies', 'Friends, rivals & enemies', '⚔', 'amber'],
    ['roles', 'Roles & family', '⚭', 'parchment'],
    ['distance', 'Distance & strangers', '☾', 'ash'],
    ['own', 'Your own', '✎', 'rose'],
];

// Checked before the built-in dark dynamics. Every test here needs at least one of the optional meters
// (or the Desire card), or names a captor holding the keys, so chats that don't use them read as before.
export const FRONT_DYNAMICS = [
    // Captor & prey
    ['Breaking in', d => d.p >= 50 && d.di >= 40 && d.hu >= 40, (n, u) => `${n} is breaking ${u}'s will on purpose: punishments that leave a mark, praise rationed out, every refusal made to cost more than the last`, 'captor', 'breaking broken will punish punishment break her break him', ['held_by_threat']],
    ['Conditioning captor', d => d.p >= 50 && d.di >= 50, (n, u) => `${n} is training ${u}: plain rules, small rewards for doing as told, cold consequences for defiance, every routine built to make obedience feel safer than resisting`, 'captor', 'conditioning training conditioned rules rewards obedience reward good', ['captor_captive', 'made_to_need']],
    ['Guilty captor', d => d.p >= 50 && d.gu >= 50, (n, u) => `${n} holds the keys to ${u}'s world and hates it: apologies that never open the door, little comforts, sleepless nights over what ${n} can't undo or let go of`, 'captor', 'guilty captor reluctant remorse sorry cannot let go', ['captor_captive']],
    ['Fixated captor', d => d.p >= 50 && d.ob >= 60, (n, u) => `${n} keeps ${u} because ${n} can't bear ${u} out of reach: checking in too often, collecting every reaction, rearranging the room around ${u}`, 'captor', 'fixated captor obsessive keeping fixation', ['captor_captive']],
    ['Kept and tended', d => d.p >= 40 && d.ca >= 55, (n, u) => `${n} keeps ${u} and sees to every need with ${n}'s own hands: bathing, feeding, dressing, brushing hair. Care is how ${n} reminds ${u} who ${u} belongs to`, 'captor', 'keeper kept tended tending caretaking caretaker bathing bath feeding nursing cared for looked after', []],
    ['Princess and keeper', d => d.p >= 35 && d.l <= -20 && d.ca >= 40, (n, u) => `${n} holds the keys and still waits on ${u} like royalty: fetching, fussing, indulging every mood, while ${u} demands and complains and is never let go`, 'captor', 'princess spoiled spoilt brat bratty royalty waits on pampered demanding', ['spoiled_captive', 'gilded_cage']],
    ['Romantic captor', d => d.p >= 50 && d.r >= 55 && d.ca >= 35, (n, u) => `${n} courts ${u} from the other side of a locked door: candlelit dinners, gifts, letters, and the patient certainty that ${u} will love ${n} back in time`, 'captor', 'romantic captor courting courtship wooing', ['captor_captive']],
    ['For your own good', d => d.p >= 50 && d.pr >= 60, (n, u) => `${n} keeps ${u} locked away and calls it protection: the world is dangerous, only ${n} understands, and every rule is framed as keeping ${u} safe`, 'captor', 'own good protective captor safe protecting keeping safe', ['captor_captive']],
    ['Stockholm drift', d => d.p >= 50 && d.l >= 40, (n, u) => `${n} holds the keys and ${u} has started to need ${n}: waiting for ${n}'s footsteps, seeking ${n}'s approval, and ${n} noticing every sign of it`, 'captor', 'stockholm syndrome drift attached needs captor bonded', ['stockholm']],
    ['Flight risk', d => d.p >= 50 && d.t <= -45, (n, u) => `${n} holds ${u} and expects ${u} to run: doors checked twice, a hand on ${u}'s wrist, every kindness from ${u} weighed as a possible trick`, 'captor', 'flight risk escape running run away suspicious captor', []],
    ['Hunter and hunted', d => d.hu >= 50 && d.fa >= 50, (n, u) => `${n} is stalking ${u} for the pleasure of the chase: learning routines, letting ${u} glimpse the danger, enjoying the fear as much as any ending`, 'captor', 'hunter hunted hunt chase stalking stalker cat mouse', ['hunter_hunted', 'predator_and_prey']],
    // Obsession & worship
    ['Obsessive tenderness', d => d.ob >= 60 && d.ca >= 50, (n, u) => `${n} pours an obsessive amount of care into ${u}: memorising preferences, hovering, fixing things before ${u} notices, and it's never enough for ${n}`, 'obsess', 'obsessive tender tenderness smothering hovering', []],
    ['Possessive worship', d => d.pe >= 40 && d.po >= 60, (n, u) => `${n} worships ${u} and owns ${u} in the same breath: kneeling and gripping, praise that sounds like a claim`, 'obsess', 'possessive worship mine', []],
    ['Jealous devotion', d => d.je >= 60 && d.r >= 50, (n, u) => `${n} loves ${u} with a jealousy that never sleeps: tender in private, then cold and questioning the moment anyone else has ${u}'s attention`, 'obsess', 'jealous devotion jealousy', ['jealousy_games']],
    ['Watched and safe', d => d.kn >= 40 && d.pr >= 50 && d.t >= 20, (n, u) => `${n} watches over ${u} constantly, and ${u} feels safer for it: ${n} knows where ${u} is, what ${u} needs and who to keep away`, 'obsess', 'watched safe watching over guardian angel', ['watched_and_safe']],
    ['Collector', d => d.ob >= 50 && d.fa >= 50, (n, u) => `${n} collects ${u}: photographs, hair ties, words ${u} said once, and treats ${u} as the centrepiece of something ${n} has been building`, 'obsess', 'collector collecting collection trophies keepsakes', []],
    ['Devotional', d => d.ly >= 60 && d.r >= 45 && d.pe >= 25, (n, u) => `${n} has made ${u} the centre of ${n}'s faith: rituals of care, loyalty past reason, every slight against ${u} taken as sacrilege`, 'obsess', 'devotional devotion faith religious worship idol', []],
    // Power, care & control
    ['Dark mentor', d => d.gd >= 50 && d.co >= 40, (n, u) => `${n} is teaching ${u} the wrong things on purpose: patient lessons in cruelty, lying or worse, and praise for every step down`, 'power', 'dark mentor evil mentor corrupting teacher', ['mentor_threat']],
    ['Mentor and protégé', d => d.gd >= 50 && d.re >= 30 && d.f >= 20, (n, u) => `${n} is shaping ${u} into ${n}'s successor: hard lessons, harder standards, and pride ${n} never says out loud`, 'power', 'mentor protege apprentice successor', []],
    ['Teacher and student', d => d.gd >= 50 && d.re >= 20 && d.r < 20, (n, u) => `${n} teaches and ${u} learns: explanations, assignments, a raised eyebrow at sloppy work, a rare nod when ${u} gets it right`, 'power', 'teacher student lesson class tutor professor', []],
    ['Lovingly controlling', d => d.r >= 45 && d.ca >= 40 && (d.p >= 35 || d.di >= 40), (n, u) => `${n} loves ${u} and runs ${u}'s life: choosing meals and clothes, managing friends and plans, every decision wrapped in affection so it's hard to argue with`, 'power', 'lovingly controlling loving control smothering managing', []],
    ['Strict and tender', d => d.di >= 50 && d.ca >= 50, (n, u) => `${n} is soft with ${u} and strict about everything: warm hands, firm rules, comfort that comes with conditions`, 'power', 'strict tender firm gentle discipline care', []],
    ['Benevolent tyrant', d => d.p >= 60 && d.ca >= 40 && d.t <= 0, (n, u) => `${n} decides everything for ${u} and makes sure ${u} wants for nothing but freedom: generous, smothering, never once asking`, 'power', 'benevolent tyrant gilded control generous', []],
    ['Short leash', d => d.p >= 50 && d.di >= 30 && d.t <= -20, (n, u) => `${n} keeps ${u} on a short leash: permission for everything, check-ins, and a hard tug the moment ${u} strays`, 'power', 'short leash permission controlled tight', []],
    ['Guardian', d => d.pr >= 60 && d.ca >= 40 && d.r < 20, (n, u) => `${n} guards and raises ${u} more than anything else: checking in, setting curfews, stepping in front of trouble without being asked`, 'power', 'guardian protector parent watchful', []],
    ['Patronising', d => d.re <= -30 && d.di >= 40, (n, u) => `${n} manages ${u} like a child who can't be trusted: rules explained slowly, decisions taken away, praise for the smallest things`, 'power', 'patronising condescending talked down managed', []],
    // Romance & tenderness
    ['Honeymoon', d => d.r >= 60 && heat(d) >= 50 && d.t >= 20 && d.f >= 20, (n, u) => `${n} is giddy over ${u}: late nights, constant touching, private jokes, the rest of the world pleasantly blurred`, 'romance', 'honeymoon giddy newly in love new couple', []],
    ['Steamy love', d => d.r >= 50 && heat(d) >= 60, (n, u) => `${n} loves ${u} and can't keep ${n}'s hands off ${u}: kisses that turn into more, teasing in public, tenderness and hunger in the same touch`, 'romance', 'steamy love passionate passion hot couple', []],
    ['Protective love', d => d.r >= 45 && d.pr >= 55, (n, u) => `${n} loves ${u} with ${n}'s body between ${u} and the world: walking street-side, scanning rooms, quiet fury at anyone who frightens ${u}`, 'romance', 'protective love protecting', ['who_did_this', 'touch_and_die']],
    ['Guilty love', d => d.r >= 45 && d.gu >= 50, (n, u) => `${n} loves ${u} and can't forgive ${n}self for what that love has cost ${u}: tender, then withdrawn, apologising for things ${u} never mentioned`, 'romance', 'guilty love guilt', []],
    ['Trying to be better for {u}', d => d.gu >= 40 && d.r >= 35 && (d.hu ?? 0) < 30, (n, u) => `${n} is trying to become someone who deserves ${u}: biting back the old cruelty, keeping promises, failing and trying again where ${u} can see`, 'romance', 'better redemption redeeming trying change changing deserve', ['redeeming_love']],
    ['Avoidant love', d => d.r >= 45 && d.op <= 25 && d.t <= 30, (n, u) => `${n} loves ${u} and backs away every time it gets close: going quiet, cancelling, coming back with something small and pretending nothing happened`, 'romance', 'avoidant love avoiding distant pulls away', []],
    ['Unspoken love', d => d.r >= 40 && d.op <= 30 && d.t >= 20, (n, u) => `${n} loves ${u} and has never said it: looks held too long, care disguised as practicality, a confession always about to happen`, 'romance', 'unspoken love secret feelings unconfessed', []],
    ['Pining', d => d.r >= 35 && d.de >= 40 && d.l <= -20, (n, u) => `${n} aches for ${u} from too close: noticing everything, reading too much into small kindnesses, hurting quietly when ${u} looks elsewhere`, 'romance', 'pining longing yearning aching', []],
    ['Smitten', d => d.r >= 35 && d.r < 60 && d.pe >= 30, (n, u) => `${n} is smitten with ${u}: grinning at nothing, finding excuses to be near, convinced ${u} hung the moon`, 'romance', 'smitten besotted starry eyed', []],
    ['Soft for each other', d => d.r >= 40 && d.ca >= 40 && d.f >= 30, (n, u) => `${n} goes soft around ${u}: little kindnesses, gentle teasing, remembering exactly how ${u} likes things`, 'romance', 'soft gentle sweet tender cosy', []],
    ['Loyal love', d => d.r >= 50 && d.ly >= 60 && d.t >= 30, (n, u) => `${n} would follow ${u} anywhere: alibis without questions, fights picked for ${u}, staying when anyone sane would leave`, 'romance', 'loyal love ride or die devoted', []],
    // Lust & heat
    ['Hate-lust', d => heat(d) >= 55 && d.f <= -15 && d.r < 30, (n, u) => `${n} can't stand ${u} and wants ${u} anyway: arguments that end against a wall, contempt and hunger in the same look`, 'heat', 'hate lust hate sex angry sex hatefuck', ['fights_as_foreplay', 'hate_need']],
    ['Friends with benefits', d => heat(d) >= 50 && d.f >= 40 && d.r < 30, (n, u) => `${n} and ${u} are friends who sleep together and pretend it's simple: easy banter, easy sex, a flicker of something neither names`, 'heat', 'friends with benefits fwb casual', ['friends_with_benefits']],
    ['Forbidden want', d => heat(d) >= 50 && d.gu >= 40, (n, u) => `${n} wants ${u} and knows ${n} shouldn't: stolen looks, self-disgust, pulling back and then giving in`, 'heat', 'forbidden want taboo shouldnt guilt', ['forbidden_love']],
    ['Just bodies', d => heat(d) >= 50 && d.f <= -5 && d.f > -15 && d.r < 20, (n, u) => `${n} uses ${u} for pleasure and little else: sex without small talk, leaving soon after, no tenderness asked for or given`, 'heat', 'just bodies sex only using no strings', []],
    ['In lust', d => heat(d) >= 60 && d.r < 35, (n, u) => `${n} wants ${u}'s body far more than ${u}'s heart: heavy looks, crude honesty, touches that linger with no promises attached`, 'heat', 'lust in lust desire wanting horny', []],
    ['Unresolved tension', d => heat(d) >= 45 && d.r < 45 && d.op <= 40, (n, u) => `${n} and ${u} are one bad night from finally doing something about it: charged silences, near misses, every argument a little too close`, 'heat', 'tension unresolved sexual tension near misses', ['near_misses']],
    // Toxic, broken & on-off
    ['Love-bomb cycle', d => d.vo >= 50 && d.r >= 50 && d.po >= 40, (n, u) => `${n} swings ${u} between worship and punishment: flowers and apologies, then coldness and blame, then flowers again`, 'toxic', 'love bomb love bombing cycle hot cold', ['love_bomb_cycle']],
    ['Mutual destruction', d => d.hu >= 40 && d.r >= 30 && d.vo >= 50, (n, u) => `${n} and ${u} bring out the worst in each other and keep coming back for more: fights that turn physical or filthy, apologies, the next fight already loading`, 'toxic', 'mutual destruction destructive ruin each other', ['addicted_to_each_other']],
    ['On again, off again', d => d.vo >= 50 && d.r >= 30, (n, u) => `${n} and ${u} keep breaking and coming back: slammed doors, 3am texts, swearing it's over and turning up anyway`, 'toxic', 'on again off again on off breakup make up', ['on_off']],
    ['Toxic orbit', d => d.r >= 35 && d.rs >= 45 && d.ly >= 40, (n, u) => `${n} can't leave ${u} and can't stop resenting ${u}: old wounds dug up, cruelty that turns into clinging, staying because leaving feels worse`, 'toxic', 'toxic orbit cant leave stuck', ['toxic']],
    ['Resents being saved', d => d.rs >= 50 && d.de >= 40, (n, u) => `${n} hates needing ${u}, hates the life ${u} keeps dragging ${n} back into, and needs ${u} anyway: snarled thanks, self-destruction in front of ${u}, falling apart when ${u} leaves the room`, 'toxic', 'resents saved saving rescued brought back hates needing', []],
    ['Codependent spiral', d => d.de >= 50 && d.vo >= 40, (n, u) => `${n} can't cope without ${u} and can't cope with ${u}: clinging, snapping, guilt, clinging again`, 'toxic', 'codependent spiral clinging', ['codependent_pair']],
    ['Enabling', d => d.de >= 40 && d.ca >= 30 && d.gu >= 30, (n, u) => `${n} keeps making it easier for ${u} to keep hurting ${u}self: covering for ${u}, cleaning up, telling ${n}self it's the last time`, 'toxic', 'enabling enabler addiction using covering', ['enabling_each_other', 'using_together']],
    ['Resentful devotion', d => d.ly >= 60 && d.rs >= 50, (n, u) => `${n} stays loyal to ${u} and resents every minute of it: showing up, doing the work, and making sure ${u} knows what it costs`, 'toxic', 'resentful devotion martyr', []],
    ['Push and pull', d => d.vo >= 40 && d.op <= 30 && d.r >= 30, (n, u) => `${n} pulls ${u} close and shoves ${u} away by turns: warmth, then distance, then a sudden need to be near`, 'toxic', 'push pull hot cold mixed signals', ['push_and_pull']],
    ['Bitter history', d => d.rs >= 50 && d.r >= 20 && d.f <= 10, (n, u) => `${n} still feels something for ${u} under a heap of grievances: digs about the past, jealousy ${n} won't admit, softness that slips out and gets punished`, 'toxic', 'bitter history exes grudge past', ['bad_blood']],
    ['Blame game', d => d.rs >= 55 && d.gu >= 30, (n, u) => `everything that went wrong is ${u}'s fault as far as ${n} is concerned, and ${n} half knows it isn't: accusations, guilt, more accusations`, 'toxic', 'blame game blaming fault', []],
    ['Bully romance', d => d.hu >= 30 && d.r >= 35 && d.re <= 0, (n, u) => `${n} torments ${u} and wants ${u}: shoving, mocking, keeping ${u} close the only way ${n} knows how`, 'toxic', 'bully romance bullying torment', ['bully_romance']],
    // Friends, rivals & enemies
    ['Ride or die', d => d.ly >= 70 && d.f >= 50, (n, u) => `${n} would go to the wall for ${u}: no questions, no hesitation, and ${u}'s enemies become ${n}'s on sight`, 'allies', 'ride or die loyal best friend', ['ride_or_die']],
    ['Partners in crime', d => d.ly >= 50 && d.f >= 30 && d.t >= 30, (n, u) => `${n} and ${u} are in it together: shared secrets, covering for each other, a look that says the plan without words`, 'allies', 'partners in crime accomplice accomplices team', ['partners_in_crime', 'devoted_accomplice']],
    ['Bickering friends', d => d.f >= 40 && d.vo >= 35, (n, u) => `${n} and ${u} argue constantly and would be lost without it: insults with no real teeth, keeping score, showing up when it matters`, 'allies', 'bickering banter squabbling', []],
    ['Frenemies', d => d.f >= 0 && d.f <= 40 && d.rs >= 30, (n, u) => `${n} plays friendly with ${u} and keeps a tally: compliments with an edge, small sabotage, real help when it's least expected`, 'allies', 'frenemies frenemy fake friends', ['frenemies']],
    // Distance & strangers
    ['Done with you', d => d.rs >= 60 && d.f <= -30 && (d.ob ?? 0) < 20, (n, u) => `${n} has had enough of ${u}: flat voice, no second chances, already halfway out of ${u}'s life`, 'distance', 'done over finished leaving fed up', []],
    ['Ghost of what we were', d => d.pe <= -40 && d.r >= 10 && d.r < 20 && (d.ob ?? 0) < 40, (n, u) => `${n} keeps comparing ${u} to who ${u} used to be: wistful, disappointed, reaching for something that isn't there any more`, 'distance', 'ghost used to be nostalgia lost', []],
    ['Estranged', d => d.f <= -10 && d.ly >= 30 && d.r < 20, (n, u) => `${n} and ${u} are tied together and barely speaking: stiff politeness, old hurts, the door never quite closed`, 'distance', 'estranged estrangement not speaking', ['estranged_family', 'estranged_friends']],
    ['Cold shoulder', d => d.f <= -20 && d.op <= 20, (n, u) => `${n} has shut ${u} out: one-word answers, leaving rooms, perfectly polite and completely unreachable`, 'distance', 'cold shoulder shut out silent treatment', []],
];

// Checked just before the general dynamics: one meter, or the base meters only.
export const LATE_DYNAMICS = [
    ['Rules and rewards', d => d.di >= 55, (n, u) => `${n} runs things on rules and rewards with ${u}: expectations said plainly, good behaviour noticed and paid for, slips corrected`, 'power', 'rules rewards reward good behaviour discipline strict', []],
    ['Tending', d => d.ca >= 60, (n, u) => `${n} looks after ${u} like it's ${n}'s job: feeding, cleaning wounds, tucking blankets, fussing quietly`, 'power', 'tending caring nursing looking after', []],
    ['Under their wing', d => d.gd >= 55 && (d.hu ?? 0) < 30, (n, u) => `${n} has taken ${u} under ${n}'s wing: teaching, correcting, showing ${u} how things are done and quietly proud when ${u} gets it`, 'power', 'under wing mentoring guiding', []],
    ['Powder keg', d => d.vo >= 60, (n, u) => `${n} and ${u} are always a breath from an explosion: tempers spike over nothing, and the making up is as intense as the fight`, 'toxic', 'powder keg volatile explosive', []],
    ['Loyal to the end', d => d.ly >= 65, (n, u) => `${n} is loyal to ${u} past sense: defending ${u} to anyone, keeping ${u}'s secrets, forgiving what shouldn't be forgiven`, 'allies', 'loyal loyalty devoted faithful', []],
    ['Grudge', d => d.rs >= 60, (n, u) => `${n} holds a grudge against ${u} and feeds it: cool silences, remembering every slight, small paybacks`, 'toxic', 'grudge resentment resentful', []],
    ['Charged', d => heat(d) >= 60, (n, u) => `${n} is hungry for ${u} and it colours everything: standing close, touching often, sex never far from ${n}'s mind`, 'heat', 'charged heat hungry wanting', []],
    ['It’s complicated', d => d.r >= 20 && (d.t <= -10 || d.f <= -10), (n, u) => `nobody could say what ${n} and ${u} are to each other, least of all them: mixed signals, jealousy with no right to it, closeness that never gets named`, 'toxic', 'complicated its complicated mixed signals situationship undefined', ['its_complicated', 'situationship']],
    ['Platon-ish', d => d.f >= 50 && d.r >= 10 && d.r < 30, (n, u) => `${n} and ${u} are best-friend close with a blur at the edges: casual touches, falling asleep on each other, the odd look that lasts a beat too long`, 'romance', 'platonish platonic ish best friends blurry', []],
    ['Crush ({n} on {u})', d => d.r >= 15 && d.r < 45 && d.l <= -15, (n, u) => `${n} has a crush on ${u} and isn't handling it well: overthinking every exchange, showing off, going quiet when ${u} smiles`, 'romance', 'crush crushing has a crush', []],
    ['Crush ({u} on {n})', d => d.l >= 30 && d.r < 30, (n, u) => `${u} is crushing on ${n} and ${n} can tell: ${n} notices the blushes and the excuses to be near, and decides what to do with that`, 'romance', 'crush crushing has a crush on', []],
];

// 1.44.0: 40 more that fire on their own from the meters. Dark, manipulative, romantic, teasing, dominant
// and submissive shapes, most needing two or three meters at once so they only show up when the scene has
// really built them. FRONT_MORE is tried before everything else; LATE_MORE reads the base meters only and
// sits with the other late ones.
export const FRONT_MORE = [
    // Captor & prey
    ['Doll and dresser', d => d.p >= 35 && d.co >= 45 && d.ca >= 45, (n, u) => `${n} dresses, poses and corrects ${u} like a doll: clothes chosen, hair brushed, manners scripted, and displeasure when ${u} moves out of place`, 'captor', 'doll dollhouse dressed dressing posed plaything pretty thing', []],
    ['Lab pet', d => d.fa >= 50 && d.ca >= 40 && d.p >= 30, (n, u) => `${n} keeps ${u} as a favourite subject: tests and treats, a nickname, better conditions than the others get, and notes on everything`, 'captor', 'lab pet favourite subject test subject favoured', ['scientist_and_subject']],
    ['Saved and kept', d => d.pr >= 50 && d.po >= 50 && d.p >= 25, (n, u) => `${n} saved ${u} and now won't give ${u} back: the rescue has become a debt, and every step toward the door counts as ingratitude`, 'captor', 'saved kept rescuer rescued debt owes won\'t let go', []],
    ['Tender sadist', d => d.hu >= 45 && d.ca >= 45, (n, u) => `${n} hurts ${u} and then tends what ${n} has hurt, with the same careful hands: a wound made, cleaned and kissed, and no contradiction felt`, 'captor', 'tender sadist hurts heals hurt comfort cruel kind', []],
    ['Predatory patience', d => d.hu >= 45 && d.kn >= 45 && d.op <= 35, (n, u) => `${n} already knows how this ends for ${u} and is in no hurry: pleasant, attentive, running small tests and enjoying the wait`, 'captor', 'predator predatory patience patient waiting game', []],
    ['Trauma bond', d => d.hu >= 30 && d.de >= 40 && d.l >= 30, (n, u) => `${n} hurts ${u} and is also the only comfort ${u} has: cruelty, then tenderness, and ${u} holding on tighter after each round`, 'toxic', 'trauma bond bonded hurt comfort cycle', ['trauma_bond']],
    // Obsession
    ['Stalker’s courtship', d => d.kn >= 50 && d.ob >= 50 && d.r >= 30, (n, u) => `${n} courts ${u} with things ${n} shouldn't know: the favourite flowers, the right song, turning up exactly where ${u} happens to be`, 'obsess', 'stalker courtship stalking courting knows too much', ['stalker_romance']],
    ['Insatiable', d => d.ob >= 55 && heat(d) >= 55, (n, u) => `${n} can't get enough of ${u}: always touching, wanting every hour, greedy again the moment it's over`, 'heat', 'insatiable can\'t get enough greedy ravenous', []],
    ['Addicted', d => d.de >= 50 && d.ob >= 50, (n, u) => `${u} is ${n}'s habit: craving, bargaining, promising to cut down, and coming apart when ${u} is out of reach`, 'obsess', 'addicted addiction habit fix craving withdrawal hooked', ['addicted_to_each_other']],
    ['Compromised observer', d => d.fa >= 50 && d.gu >= 35 && d.r >= 25, (n, u) => `${n} was meant to stay objective about ${u} and hasn't: notes that drift off the subject, rules bent, excuses for why this one is different`, 'obsess', 'compromised objectivity observer too close attached unprofessional', []],
    // Manipulation
    ['Gaslit', d => d.kn >= 45 && d.co >= 35 && d.op <= 25, (n, u) => `${n} keeps ${u} unsure of ${u}'s own mind: things moved, conversations denied, and a calm, kind voice explaining what really happened`, 'toxic', 'gaslit gaslight gaslighting doubting memory crazy-making', []],
    ['Puppet strings', d => d.kn >= 50 && d.co >= 50, (n, u) => `${n} steers ${u} without ${u} seeing the hands: ideas planted, coincidences arranged, other people quietly moved out of the way`, 'toxic', 'puppet strings puppeteer manipulating manipulation steering', []],
    ['Closing the circle', d => d.po >= 50 && d.pr >= 40 && d.je >= 35, (n, u) => `${n} is cutting ${u} off from everyone else, one reasonable excuse at a time: friends found wanting, calls missed, plans that somehow fall through`, 'toxic', 'isolating isolation cutting off closing circle alone only me', []],
    ['Blackmail', d => d.kn >= 50 && d.t <= -25 && d.p >= 25, (n, u) => `${n} has something on ${u} and both know it: requests that aren't requests, reminders dropped in passing, politeness with a hook in it`, 'toxic', 'blackmail leverage holding over secret threat', ['held_by_threat', 'mutual_blackmail']],
    ['Honey trap', d => heat(d) >= 35 && d.op <= 20 && d.fa >= 35, (n, u) => `${n} is seducing ${u} for a reason: charm measured out, interest performed, every soft moment checked against the goal`, 'heat', 'honey trap seducing seduction false charm agenda', []],
    ['Love as leverage', d => d.r >= 35 && d.di >= 40 && d.op <= 35, (n, u) => `${n} hands out affection as payment: warmth when ${u} complies, a chill when ${u} doesn't, and never a word admitting to it`, 'toxic', 'leverage conditional love withholding affection silent treatment', []],
    ['Kept small', d => d.re <= -20 && d.r >= 25 && d.po >= 30, (n, u) => `${n} keeps ${u} small so ${u} stays: compliments with a barb in them, jokes at ${u}'s expense, praise only when ${u} is doubting`, 'toxic', 'negging belittling kept small put down undermining', []],
    ['Guilt trip', d => d.de >= 40 && d.rs >= 30 && d.rs < 50 && d.r >= 25, (n, u) => `${n} makes ${u} responsible for ${n}'s misery: sighs, sacrifices listed, a crisis arriving whenever ${u} pulls away`, 'toxic', 'guilt trip guilting martyr emotional blackmail', []],
    ['Borrowed time', d => d.de >= 45 && d.gu >= 35 && d.ly >= 35, (n, u) => `${n} knows this can't last and stays anyway: gallows jokes, promises nobody believes, and a grip on ${u} like the last good thing left`, 'toxic', 'borrowed time doomed living on borrowed last good thing', ['doomed']],
    ['Can’t quit you', d => d.ob >= 40 && d.rs >= 40 && d.r >= 20, (n, u) => `${n} can't forgive ${u} and can't stay away: turning up, picking the scab, leaving angry and coming back`, 'toxic', 'can\'t quit keeps coming back unfinished', ['unfinished_business']],
    // Dominant and submissive
    ['Owned', d => d.po >= 60 && d.di >= 40 && d.p >= 40, (n, u) => `${n} owns ${u} and both act like it: permission asked, marks left where they show, a word from ${n} deciding what ${u} wears, eats and does`, 'power', 'owned ownership owner property belongs collar', []],
    ['Tease and denial', d => heat(d) >= 50 && d.di >= 30 && d.p >= 25, (n, u) => `${n} keeps ${u} wanting on purpose: almost-touches, promises for later, permission withheld, and open pleasure at the frustration`, 'heat', 'tease denial teasing edging withholding made to wait', []],
    ['Brat taming', d => d.di >= 40 && heat(d) >= 40 && d.f >= 10, (n, u) => `${u} pushes ${n}'s rules to get caught and ${n} enjoys the catching: warnings with a smile in them, and consequences both were hoping for`, 'power', 'brat taming bratty tamer pushing buttons misbehaving', []],
    ['Firm hand', d => d.p >= 35 && d.di >= 40 && d.r >= 35 && d.t >= 15, (n, u) => `${n} leads and ${u} is glad to follow: decisions made, a hand at the small of the back, correction that stays calm and affection that's certain`, 'power', 'firm hand dominant leads in charge follows', []],
    ['Provider and kept', d => d.p >= 30 && d.ca >= 40 && d.pr >= 40, (n, u) => `${n} pays, provides and decides, and ${u} is kept comfortable and close: bills handled, clothes bought, an allowance, and the understanding that comes with it`, 'power', 'provider kept woman allowance sugar pays provides', ['bought_and_paid']],
    ['Trophy', d => d.po >= 50 && d.re <= -20, (n, u) => `${n} shows ${u} off and doesn't listen to ${u}: dressed for display, spoken for at the table, admired like something bought`, 'power', 'trophy arm candy shown off display', []],
    ['Devoted servant', d => d.p <= -30 && d.ly >= 45, (n, u) => `${n} serves ${u} and takes pride in it: anticipating, fetching, standing ready, stung by any hint the service wasn't perfect`, 'power', 'servant serving service devoted butler attendant', []],
    ['Monster on a leash', d => d.p <= -25 && d.hu >= 40 && d.re >= 25, (n, u) => `${n} is dangerous to everyone except ${u}, who holds the leash: one word from ${u} stops ${n}, and ${n} half hates how well it works`, 'power', 'monster leash tamed heel attack dog', ['monster_on_leash']],
    ['At {u}’s feet', d => d.pe >= 45 && d.l <= -30 && d.p <= -15, (n, u) => `${n} kneels to ${u} gladly: asking permission, waiting to be told, happiest with an order to carry out`, 'power', 'feet kneeling submissive kneels obeys worshipful', []],
    // Romance, teasing and allies
    ['Playful lovers', d => d.r >= 45 && d.f >= 45 && heat(d) >= 30 && !(d.r >= 60 && heat(d) >= 50), (n, u) => `${n} and ${u} love each other and can't stop teasing: mock insults, bets with forfeits, a hand wandering in the middle of an argument`, 'romance', 'playful lovers teasing banter flirty couple', []],
    ['Two against the world', d => d.ly >= 50 && d.r >= 45 && d.f >= 35, (n, u) => `${n} and ${u} against everyone else: a shared bed, a shared enemy list, and no secret kept from each other`, 'romance', 'against the world us against them inseparable', []],
    ['Safe harbour', d => d.t >= 50 && d.ca >= 40 && d.pr >= 30 && d.p < 35, (n, u) => `${n} is where ${u} comes to be safe: a door always open, tea made, no questions until ${u} is ready`, 'romance', 'safe harbour haven refuge safe place comfort', []],
    ['Rivals in heat', d => d.re >= 35 && heat(d) >= 45 && d.f <= 25, (n, u) => `${n} competes with ${u} and wants ${u}, and the two are getting hard to tell apart: one-upmanship, standing too close, wins celebrated like conquests`, 'heat', 'rivals heat rivalry tension competitive attraction', []],
    ['Sparring partners', d => d.re >= 35 && d.f >= 30 && d.r < 30 && (d.fa ?? 0) < 40, (n, u) => `${n} and ${u} trade shots for fun and keep score: quick insults, grudging laughs, each sharper for the other`, 'allies', 'sparring banter verbal sparring trading barbs', []],
];
export const LATE_MORE = [
    ['Power behind the throne', d => d.p >= 25 && d.l <= -35 && d.r < 40, (n, u) => `${n} gives the orders and ${u} decides what they'll be: a sulk, a look or a well-timed word, and ${n} ends up doing what ${u} wanted all along`, 'power', 'power behind throne wrapped around finger gets her way', []],
    ['Under {u}’s thumb', d => d.p <= -45 && d.r >= 20 && d.l <= -10, (n, u) => `${u} decides and ${n} goes along: plans changed without asking, opinions kept quiet, and a private relief at being told what to do`, 'power', 'under thumb henpecked bossed submissive gives in', []],
    ['Smug and flustered', d => d.l >= 35 && d.r >= 30 && d.p >= 15 && d.p < 50, (n, u) => `${n} knows exactly what ${n} does to ${u} and plays with it: leaning in close, a low voice, watching the blush and making it worse`, 'romance', 'smug flustered teasing blushing knows the effect', []],
    ['Old married couple', d => d.f >= 50 && d.r >= 30 && d.r < 55 && d.t >= 45, (n, u) => `${n} and ${u} bicker like they've been married for decades: finishing sentences, arguing over nothing, reaching for each other without looking`, 'romance', 'old married couple domestic bickering comfortable', []],
    ['Courting', d => d.r >= 30 && d.r < 55 && d.t >= 45 && d.f >= 25, (n, u) => `${n} is courting ${u} properly: flowers, doors held, walking ${u} home, asking before a kiss`, 'romance', 'courting courtship wooing dating properly', []],
    ['Slow burn', d => d.r >= 12 && d.r < 30 && d.t >= 30 && d.f >= 25 && d.f < 50, (n, u) => `${n} and ${u} are getting closer by inches: longer conversations, small touches neither mentions, and no rush`, 'romance', 'slow burn getting closer gradually', []],
];

// Never read from the meters: you pick these, or the story names them.
export const PICKED_DYNAMICS = [
    ['Captor and captive', null, (n, u) => `${n} holds ${u} captive: locks, routines, rules, and the slow work of getting through each day of it`, 'captor', 'captor captive kidnapped kidnapper prisoner held captive', ['captor_captive']],
    ['Doctor and patient', null, (n, u) => `${n} treats ${u} with clinical authority: examinations, instructions, notes taken, and ${u}'s body discussed like a case`, 'roles', 'doctor patient clinical examination exam medical', []],
    ['Scientist and subject', null, (n, u) => `${n} studies ${u} like an experiment: tests, measurements, careful records, and ${u}'s reactions logged as data`, 'roles', 'scientist subject experiment test lab', ['scientist_and_subject']],
    ['Photographer and model', null, (n, u) => `${n} directs ${u} through a lens: posing, adjusting light and angle, praise and correction, the camera deciding how close ${n} gets`, 'roles', 'photographer model photoshoot camera posing', []],
    ['Teacher and student (classroom)', null, (n, u) => `${n} is ${u}'s teacher: lessons, deadlines, office hours, and the line between them that both are aware of`, 'roles', 'teacher student classroom school college', []],
    ['Boss and secretary', null, (n, u) => `${n} gives the orders and ${u} keeps ${n}'s life running: dictation, coffee, schedules, and an office door that closes`, 'roles', 'boss secretary assistant office employer', []],
    ['Master and servant', null, (n, u) => `${n} gives orders and ${u} serves: titles, chores, expected silence, and a household's worth of rules about who may do what`, 'roles', 'master servant maid butler household service', []],
    ['Patriarchal power (1960s)', null, (n, u) => `${n} runs things the way a 1960s man was raised to: ${n} decides, provides and corrects, ${u} is expected to defer, and the era itself backs ${n} up`, 'roles', 'patriarchal 1960s sixties husband provider traditional head of household', []],
    ['Fatherly ({n} to {u})', null, (n, u) => `${n} looks out for ${u} like a father would: steady advice, rules for ${u}'s own good, quiet pride, and a temper saved for anyone who hurts ${u}`, 'roles', 'fatherly father figure dad paternal', []],
    ['Motherly ({n} to {u})', null, (n, u) => `${n} looks out for ${u} like a mother would: feeding, fussing, worrying out loud, and a fierce streak when ${u} is threatened`, 'roles', 'motherly mother figure mum mom maternal', []],
    ['Guardian and ward', null, (n, u) => `${n} is responsible for ${u}: rules, allowances, worry disguised as strictness, decisions ${u} isn't asked about`, 'roles', 'guardian ward custody responsible', []],
    ['Brother and sister', null, (n, u) => `${n} and ${u} are siblings: shared history, private jokes, merciless teasing and fierce loyalty when an outsider steps in`, 'roles', 'brother sister siblings sibling', ['siblings']],
    ['Siblings', null, (n, u) => `${n} and ${u} grew up as family: old fights, inside jokes, knowing exactly which buttons to press`, 'roles', 'siblings sibling family', ['siblings', 'step_siblings']],
    ['Therapist and patient', null, (n, u) => `${n} sits across from ${u} as the one who listens: careful questions, notes, boundaries that may or may not hold`, 'roles', 'therapist psychiatrist patient session counselling', []],
    ['Handler and asset', null, (n, u) => `${n} runs ${u} like an operative: orders, debriefs, need-to-know, and trust that's mostly leverage`, 'roles', 'handler asset spy operative agent', []],
    ['Bodyguard and client', null, (n, u) => `${n} keeps ${u} alive for a living: always a step behind, scanning every room, and it's getting personal`, 'roles', 'bodyguard client protection', ['bodyguard']],
    ['Star and fan', null, (n, u) => `one of ${n} and ${u} is famous and the other is a fan: starstruck nerves, signed things, and the famous one deciding how much of the real person to let through`, 'roles', 'star fan celebrity famous idol', []],
    ['Dealer and user', null, (n, u) => `one of ${n} and ${u} supplies what the other is hooked on: transactions, debts, favours, and the hold that comes with being the source`, 'roles', 'dealer user drugs supplier addict', []],
    ['Bandmates', null, (n, u) => `${n} and ${u} make music together: rehearsals, fights over the set list, the closeness of the stage, the strain of the road`, 'roles', 'bandmates band musicians music', []],
    ['Owner and pet', null, (n, u) => `${n} keeps ${u} as a pet: a name ${n} chose, a collar, praise and scolding, rules about where ${u} sleeps and eats`, 'roles', 'owner pet petplay collar', []],
    ['Arranged marriage', null, (n, u) => `${n} and ${u} are married by someone else's arrangement: separate rooms, public performance, and learning each other whether they like it or not`, 'roles', 'arranged marriage', ['arranged_marriage']],
    ['Marriage of convenience', null, (n, u) => `${n} and ${u} married for practical reasons: a contract, appearances kept up, and feelings nobody planned for`, 'roles', 'marriage convenience contract', ['marriage_of_convenience']],
    ['Fake relationship', null, (n, u) => `${n} and ${u} are pretending to be together: rehearsed stories, hand-holding for an audience, and moments that stop feeling fake`, 'roles', 'fake relationship fake dating pretend', ['fake_dating']],
    ['Secret affair', null, (n, u) => `${n} and ${u} are sleeping together behind someone's back: stolen hours, careful lies, the thrill and the dread of being caught`, 'roles', 'affair secret cheating', ['affair', 'secret_relationship']],
    ['Exes', null, (n, u) => `${n} and ${u} used to be together: old jokes that still land, old wounds that still sting, knowing exactly where to press`, 'distance', 'exes ex former ex boyfriend ex girlfriend', ['exes']],
    ['Killer couple', null, (n, u) => `${n} and ${u} kill together: planning, cleaning up, the intimacy of a secret nobody else could survive knowing`, 'toxic', 'killer couple killers murder together bonnie clyde', ['killer_couple', 'bonnie_and_clyde']],
    ['Grieving them', null, (n, u) => `${n} has lost ${u}, or is losing ${u}: ${u} in every thought, and every reminder a fresh wound`, 'distance', 'grieving grief lost mourning', []],
];

// Groups, matching words and lines covered, for the dynamics that were already built in.
export const BUILT_IN_META = {
    'Gilded cage': ['captor', 'gilded cage spoiled captive servant locked', ['gilded_cage']],
    'Captive’s hold': ['captor', 'captives hold hooked captive demands', []],
    'Toxic obsession': ['obsess', 'toxic obsession suspicion testing', ['love_without_trust']],
    'Possession': ['captor', 'possession possessive property keep owned', []],
    'Worship': ['obsess', 'worship worshipping adores gives way', []],
    'Hate-love': ['toxic', 'hate love hate-love love hate', ['love_hate', 'hate_need']],
    'Guarded love': ['romance', 'guarded love begrudging wont say', ['begrudging_love']],
    'Devoted': ['romance', 'devoted love trust', []],
    'Captor': ['captor', 'captor cold captor handled rules routines', ['captor_captive']],
    'Nemesis': ['allies', 'nemesis enemy enemies', ['enemies']],
    'Found family': ['allies', 'found family chosen family loyal', ['chosen_family']],
    'Falling': ['romance', 'falling falling for', []],
    'Uneasy alliance': ['allies', 'uneasy alliance allies reluctant', ['reluctant_allies']],
    'Friends': ['allies', 'friends friendly', []],
    'Power play': ['power', 'power play power struggle control', ['power_swings']],
    'Hostile': ['distance', 'hostile cold hostility', []],
    'Strangers': ['distance', 'strangers new unknown', []],
    'Shrine': ['obsess', 'shrine holy idolised', []],
    'Muse and maker': ['obsess', 'muse maker artist muse', []],
    'Dangerous adoration': ['obsess', 'dangerous adoration', []],
    'Prey': ['captor', 'prey predator', ['predator_and_prey']],
    'Fallen idol': ['obsess', 'fallen idol disillusioned', []],
    'Watcher': ['obsess', 'watcher watching stalking knows', []],
    'Lifeline': ['toxic', 'lifeline needs', []],
    'Pet project': ['power', 'pet project remaking', []],
    'Toy': ['power', 'toy plaything', []],
    'Worthy rival': ['allies', 'worthy rival rivals rivalry', ['rivals']],
    'Cold war': ['allies', 'cold war needling', []],
    'Unmasked': ['toxic', 'unmasked mask', []],
    'Penitent': ['toxic', 'penitent atone atonement', []],
    'Claimed': ['obsess', 'claimed claim mine', []],
    'Jealous storm': ['obsess', 'jealous storm jealousy', []],
    'Protector': ['power', 'protector protective', []],
    'Corruption': ['power', 'corruption corrupting', []],
    'Specimen': ['power', 'specimen study case', []],
    'Codependent': ['toxic', 'codependent', ['codependent_pair']],
    'Obsessed': ['obsess', 'obsessed obsession', ['obsessive_love']],
    'Grudging respect': ['allies', 'grudging respect', ['grudging_bond']],
    'Contempt': ['allies', 'contempt looks down', []],
    'Bored of you': ['distance', 'bored losing interest', []],
};

// Your own dynamics: a name and what it looks like, kept with your settings for every chat.
let own = [];
export const cleanOwnDynamics = list => (Array.isArray(list) ? list : []).map(x => ({
    name: String(x?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 50),
    cue: String(x?.cue ?? '').replace(/\s+/g, ' ').trim().slice(0, 240),
})).filter(x => x.name && x.cue).slice(0, 40);
export function setOwnDynamics(list) { own = cleanOwnDynamics(list); }
export const ownDynamics = () => own;
export const ownRows = () => own.map(x => [x.name, null, (n, u) => fill(x.cue, n, u), 'own', x.name.toLowerCase(), []]);

export const fill = (text, n, u) => String(text).replaceAll('{n}', n).replaceAll('{u}', u).replaceAll('{{char}}', n).replaceAll('{{user}}', u);
const norm = s => String(s ?? '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['and', 'the', 'of', 'to', 'on', 'for', 'a', 'an', 'with', 'their', 'them', 'they', 'is', 'in', 'it']);
// The story's own words for the dynamic, matched to a name: the exact name first, then the best overlap
// with names and matching words. rows: [name, test, cue, group, keys]. Returns the row or null.
export function matchDynamic(text, rows, n = '', u = '') {
    const t = norm(text); if (!t) return null;
    const named = rows.find(r => norm(fill(r[0], n, u)) === t || norm(r[0].replace(/\s*\(.*?\)/g, '')) === t);
    if (named) return named;
    const words = t.split(' ').filter(w => w.length > 2 && !STOP.has(w));
    if (!words.length) return null;
    const stem = w => w.replace(/(ing|ed|es|s)$/, '');
    let best = null, score = 0;
    for (const r of rows) {
        const pool = new Set(`${norm(fill(r[0], n, u))} ${norm(r[4] ?? '')}`.split(' ').filter(w => w.length > 2 && !STOP.has(w)).map(stem));
        const hit = words.filter(w => pool.has(stem(w))).length, s = hit / words.length;
        if (hit && s > score) { best = r; score = s; }
    }
    return score >= 0.5 ? best : null;
}
