# Relationships

Choose the person whose feelings you want to set: the main character, your persona, or someone under Cast. Open **Relationships** and choose or type another person's name. Press **Add**. That pairing now has its own sliders. Add more people and switch between them from the list.

For example, Mark → Chloe can combine Finds cute, Judgemental of and Wants to protect at different strengths. Chloe → Mark is a separate relationship. Admiration or hatred in one direction never assumes it is mutual, and an opinion about someone's looks doesn't change their actual appearance.

## The feelings

- **First impressions:** Finds ugly, Finds attractive, Finds pretty, Finds cute, Grossed out by, Finds offputting, Fascinated by.
- **Affection & trust:** Admires, Loves, Cherishes, Wants to protect, Trusts, Dotes on, Misses, Proud of, Feels safe with, Feels understood by, Wants to forgive.
- **Attachment & power:** Obsessed with, Wants to preserve, Wrapped around their finger, Possessive of, Jealous over, Envies, Competes with, Wants their approval, Wants to impress, Depends on, Wants to control.
- **Friction & hostility:** Judgemental of, Despises, Hates, Wants to kill, Resents, Distrusts, Afraid of, Looks down on, Disappointed in, Blames, Wants to avoid, Wants revenge on.

These use the existing strength bands, from faint through maximum. They mix with the person's other moods and qualities. Each active feeling is sent once beneath a named direction such as `Mark → Chloe`, sharing the main strength legend. Zero values and unused pairings cost no prompt tokens. The prompt inspector includes the relationship text and its token count.

Your persona keeps the same four knowledge choices. Scene only relies on existing knowledge or visible clues. Private stays private until you give a clue. Suspected gives the main character a hunch to act on. Known gives them knowledge of that feeling. Strength changes its weight in the response, not how certain they are. Your character's words, actions and thoughts remain yours to write; another person does not automatically inherit the main character's knowledge.

**Send this relationship** pauses a pairing while keeping its values. Turning off the owner's main Send/Enabled switch also stops their relationship directions. A Cast member marked off scene pauses relationships both from and toward them. Names typed without a Cast profile are treated as intended scene participants; the prompt tells the model not to bring someone into the scene just because of these settings.

Relationships save with the owner's current chat state. The existing Save character/persona default and Save cast controls include them for future chats. Knowledge choices stay in the current chat and are not copied into defaults; new chats start with Scene only. `{{user}}` and `{{char}}` can be used as target names to follow those roles. Renaming a Cast member updates matching relationship targets in the current chat. Relationships stay manual in Dynamic mode.

The older directed hate and comparison sliders remain available, and existing blends are preserved. If you set the same feeling in both places, both directions will be sent; turn the older slider off when moving it into a relationship pairing.

No automated tests, browser tests or model requests were run for this update, as requested. The user will test it in their own chats.
