# Moodweaver 1.41.0: skills, the world leads, cleaner writing and a lighter note

Install the new `skills.js` too.

## Skills (new ✪ tab)
- **113 skills, each with a level out of 10**, for the character, your character and the cast.
  - **From The Sims 3 and 4, packs included:** Charisma, Cooking, Mixology, Logic, Writing, Romance, Thanatology, Pottery, Tattooing, Apothecary, Martial Arts, Alchemy and the rest.
  - **Not in the Sims:** Teaching, Medicine, Surgery, Psychiatry, Lying, Manipulation, Seduction, Promiscuity, Violence, Murder, Torture, Drug dealing, Poisoning, Lockpicking, Blackmail, Stealth, Kidnapping, Covering tracks and more.
  - **Your own:** a name, the words that call for it, and a level.
- **They cost nothing until the scene calls for them.** A skill goes to Claude only when:
  - its words come up in your latest message or the last reply;
  - the hidden line says someone used it last reply; or
  - you set it to ◆ always.
- **What Claude gets:** one line per person, like "Eli: lying 9/10 (expert)", plus one rule: levels decide how attempts go, yours included.
- **Look back** sets how many replies it reads, and ✧ marks what's going this reply.
- **No false alarms on everyday words:** "lying on the bed", "riding", "baby" and "writhing" don't light anything.

## The world leads (Story → Stakes)
For when you want to be carried. The characters and events make the big moves, and Claude is told the exact handoffs to stop doing:
- ending on the threshold of the act;
- putting a question or a choice to you;
- an NPC waiting for a go-ahead they wouldn't wait for;
- cutting to your reaction before the act lands.

Strong or above makes it push forward every reply. Stopping on the threshold is also a named dodge under Follow through and Dead dove now.

## Cleaner writing (new group)
- **Moved here:** No AI tells, Unmannered and Pattern breaker.
- **New:** No echoing, Lead with the action, Trust the reader, No stock gestures, No stock senses, No flourish words, No fragment drama, No therapy-speak, Dialogue like people.
- Each one names the exact habit, which Opus 5.5 follows far better than "avoid clichés". Pick the few that bother you most; a long list makes prose stiff.

## Turn-ons: 25 more, and a much wider net
- **New:** wrists, ears, blushing, navels, wearing their clothes, missing limbs, clinical smells, being carried, being held, sitting in their lap, forehead kisses, aftercare, scratches, nipple play, face-sitting, shower and bath sex, sleepy morning sex, people they shouldn't want, rivals, the possessed, someone on their knees, tight spaces, straitjackets, mourning dress and veils, thunderstorms.
- **Extra match words for 367 of 368 turn-ons**, so the hidden line's loose wording still finds them:
  - "bit her lip" lights Biting;
  - "the slap stung" lights Spanking;
  - "she flushed" lights Blushing;
  - "hand around her throat" lights Choking.

## Hurt/comfort, fixed
It's the AO3 kind now. The hurt is dwelt on in the body, the care is intimate and charged and can turn possessive, pain is the only time they let each other close, and the hurt is slow to heal or comes back. **Hurt/no comfort** is new.

## Clear everything (⚙ → Clear everything)
- **Clears for one person:** every moodlet, trait, turn-on, fact, want, item, skill and row of your own, plus their relationships (their side, both-ways and memories).
- **Keep personality types** is ticked by default.
- **↺ Bring it back** undoes it until you clear again.
- **Not touched:** Bonds meters, the board and saved defaults.

## Bonds keeps your place
Clearing the last thing set for someone could drop them from the people list. That counted as a new view, so the panel snapped to the top or to an old position. Now, if you didn't pick another person yourself, the panel stays where you were. The opinion chips, meters and other Bonds blocks also anchor your place while you remove things.

## A lighter note
- **Same rules, fewer words:** the opening line, the strength key, and the feelings, relationships, turn-ons and closing paragraphs.
- **Shorter hidden-line request.**
- **Faint and subtle feelings** keep their own line and strength word but drop the "how it shows" wording. Anything you wrote yourself still goes.
- **A new "Leading together, as one state" line** comes first when several feelings lead at once, so Claude writes one fused state instead of taking turns.
- **Saving:** a heavy Easterman-style setup measured about 3,420 tokens in 1.40 and about 3,070 now, roughly 350 fewer every reply.

122 tests pass, including the new `tests/skills-1.41.test.js`. Checked in a phone-sized browser with no errors:
- the Skills tab, search, setting a level and lighting;
- Clear everything and Bring it back;
- Bonds scroll while removing opinions and clearing a relationship.

These are code checks, not paid Opus 5.5 runs.
