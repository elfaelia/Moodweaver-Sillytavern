# Moodweaver 1.31.0 — every description read

Every built-in option (1,767) and relationship (210 one-sided, 113 both ways) was read as it is actually sent to the model. About 175 were rewritten. The rest were already clear and were left alone. The panel shows the new wording too.

## What was wrong, and the fix
- **Bare labels.** "a hipster", "goth style", "crime fiction", "into bondage", "kitten (pet play)", "an antihero", "high on cocaine". Each now says what it looks like on the page: clothes, behaviour, technique.
- **Descriptions Claude couldn't act on.** "gaslighting someone", "in teacher mode", "lost in thought", "physically injured". These now name the behaviour.
- **Hedges that weakened 100.** "puts on a bit of a display", "a little dulled", "sometimes pushes them first". The few left are where the hedge is the meaning ("Shirley Jackson: normality feels slightly wrong").
- **Authors described by theme instead of technique.** Le Guin, Morrison, Tartt, Meyer, Highsmith, du Maurier, Rice, Pratchett, Jackson, Updike, Yanagihara, Vuong, French, Flynn, Palahniuk, Nin, Woolf. Each now says how the prose works.
- **Relationships that sent less than the panel showed.** "owes Y", "uses Y", "dominates Y" and 24 more now carry their meaning. Both-ways story tropes ("a trauma bond", "villain romance", "only one bed") now include theirs too.
- **Duplicate.** In the bedroom already had **Wet**, so 1.30.0's "Wet (aroused)" doubled it. They're one option again, called **Wet (aroused)**, and any value you set moves over automatically.

## Correction
1.30.1's notes said every option had been checked at 100 for hedging words. That check was broken: it read the strength-scale line instead of each option. This release does the check properly.

Tests show the same failures as 1.28.0 and no new ones.
