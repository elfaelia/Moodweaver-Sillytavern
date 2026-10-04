# Supporting cast and directed settings

Open **Cast**, type a supporting character's name, and press **Add**. Pick a character from the list to use their own Moods & traits and Facts & scene sliders. Several supporting characters can be active together. They use the same strength scale and blending rules as the main character.

**In this scene** decides whether that profile is sent. Turn it off when someone leaves; their sliders stay saved. Disabled, off-scene and empty profiles add no prompt text. Presence is manual, and cast controls make no extra model requests.

Everything saves in the current chat under the selected main character. **Save cast for [name]** saves the whole cast and its blends for that character's future chats. New chats start with those profiles off scene. **Load saved cast** lets you bring that set into an existing chat; it asks before replacing an existing cast. Each chat then keeps its own changes. Group speakers have separate casts.

The prompt names each supporting character in a separate block and shares one strength legend. It keeps their feelings separate, preserves the current viewpoint and the player's control of their own character, and does not give anyone access to another person's private thoughts. The prompt inspector includes these blocks and their token cost.

## New settings

| Setting | Section | Meaning |
| --- | --- | --- |
| Doe-eyed | Looks | Wide, soft, expressive eyes with an innocent, open look. |
| Prissy | Personality | Prim, fussy about propriety and easily put out by coarse or untidy things. |
| Homophobic | Morals & views | A fictional character's prejudice affecting their judgments, remarks and treatment of others. |
| One step ahead | Calm & focused | Anticipates the next move and prepares using what they could know. |
| One step behind | Calm & focused | Catches on late and keeps reacting after things have moved on. |
| Comparing people | Calm & focused | Weighs two named people against each other in attention, judgments and treatment. |
| Hates someone in the scene | Angry & hostile | Hostility toward a named supporting character. |
| Hates {{user}} | Angry & hostile | Hostility toward the player's character. The panel shows their actual name. |
| Hates {{char}} | Angry & hostile | Hostility toward the main character, usable for the persona or supporting cast. |

Turn up **Comparing people** to reveal **Compare** and **With**. For example, on Mark's panel, choose Chloe and Ellie. It will describe Mark comparing Chloe with Ellie. Leaving With blank uses the player character. You can also type `{{user}}` or `{{char}}` to follow those names automatically.

Turn up **Hates someone in the scene** to reveal **Who?**. Type a supporting character's name. This option excludes the main and player characters; use their dedicated hate sliders for those targets. Hatred scales from a flicker of hostility through dislike and hatred to consuming hatred. The rest of that person's blend decides how it comes out. These four directed settings stay manual when the main character uses Dynamic mode.

Doe-eyed is restored separately from Trusting. [Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/doe-eyed) describes large eyes suggesting gentleness and innocence; [American Heritage](https://ahdictionary.com/word/search.html?q=doe-eyed) also records the figurative naive sense. This setting uses the expressive, innocent-looking gaze, while Trusting controls trust. Older saves still containing a Doe-eyed value keep it separately. Values already merged into Trusting remain there because their original source can no longer be recovered reliably.

All nine additions start off unless a save already contains that specific setting. Cast directions are included in the same Moodweaver prompt; the extension does not modify your preset or character notes.
