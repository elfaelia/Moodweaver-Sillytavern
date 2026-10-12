# Moodweaver 1.19.0

## Personality types now stay with the right person

Before, every type line just said "Personality type:", so a persona's INFJ could get read as the character's. Now:

- Each type is headed with its owner's name, e.g. `Chloe's personality type, not Mark's (Mark only knows what the scene shows):`
- One short summary line says whose is whose: `Mark is MBTI ENTJ; Chloe (the player's character) is MBTI INFJ + Enneagram 4.`
- A persona's type tells the character how the persona comes across. It never tells the bot to give that type to the character, and the player still writes their own character.
- MBTI descriptions say "introverted" instead of "private", so they can't be mixed up with the **Private** knowledge setting.
- Expressions now read as **good side** / **bad side** in both the panel and the prompt.

## Clearer prompt wording

About 70 options used to go out as a bare word (`top`, `master`, `biased`, `free use`) or with roundabout wording. They now send a short plain explanation, and the slider description in the panel matches. Nothing was removed or renamed, and saved values are untouched.

No tests run, as requested.
