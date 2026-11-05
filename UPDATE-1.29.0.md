# Moodweaver 1.29.0 — tuned for Claude Opus 5.5

## Place-and-time locks
Ten regional eras in **Period & era**, each under the decade it refines: 1890s Britain, 1890s Scotland, 1900s Britain, 1900s Scotland, 1960s America, 1960s Britain, 1990s America, 2000s America, 2010s America, 2020s America.

- A regional era replaces its plain decade in the prompt, so the period isn't described twice.
- One dialect line is sent once. It says what to write and names the other side's giveaways to leave out (Mum, flat, "bloody", "reckon", "whilst"… for American). Anthropic's Opus 5.5 guide says the model responds to named patterns, while a general instruction tends to swap one default for another.
- It also says authors and styles shape technique, never accent or spelling, so a British author on an American story can't pull the voice over.
- When an American era leads, the whole note is respelled American (colour → color, realise → realize…). Text you typed inside “quotes” is left alone.
- Two regional eras at once: the stronger sets narration, the other covers its own speakers.
- Easterman, Mother Gooseberry, Joe and Chloe starter blends now use the American eras.

## Prompt wording
- Mild no longer says "shows at least once". Opus 5.5 holds rules closely, and a quota on every mild row makes replies stiff.
- The opening line gives a reason for the notes taking priority (they're newer) instead of a bare "these win".
- The relationship footer drops its repeat of the strength scale.
- Twelve both-ways relationship tags that were sent as bare labels now say what they mean.
- When a both-ways tag gives the pair different parts (captor and captive, unrequited love…), one line says the card, chat and one-sided lines decide who's who.
- Generic 1960s cue and mother/father issues reworded to spelling-neutral words.

## Scene reader
- Opus 5.5 always thinks, and thinking counts toward the reply cap. The cap now goes up to 16000 (around 4000 suits Opus 5.5), and the "not valid JSON" error says so.

## New relationships (45, all start off)
**Their role:** Parent of, Child of, Older sibling of, Younger sibling of, Guardian of, Ward of, Doctor to, Patient of, Has them in service, In service to, Leads, Follows, Creator of, Creation of.
**Friendship & trust:** Loyal to, Worries about, Teases, Feels responsible for, Owes their life to, Sees as family, Sees as an equal.
**What they think of them:** Thinks they're a liar, Thinks they're brave, Thinks they're out of their league.
**Attraction & romance:** Attracted but won't act, Flustered by, Courting.
**Hurt & guilt:** Wants to apologise, Feels inferior to.
**Both ways, what they are:** Siblings, Step-siblings, Cousins, Estranged family, Lovers, Long-term partners, Courting, Co-parents, Business partners, Teammates, Comrades, Cellmates.
**Both ways, their story:** Class divide, Reunited, Fated mates, Pretending not to know each other.

New file: `locale.js`. Install it with the rest. Tests show the same failures as 1.28.0 and no new ones.
