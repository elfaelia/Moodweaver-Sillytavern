// Wording that changes with strength: [lowest value, wording], strongest first.
// The board's word matcher reads these in this order.
export const SCALED_MOOD_CUES = {
    "desperate": [
        [
            100,
            "desperate past pride and sense: begs, bargains, lies, breaks rules or risks themselves and others for what they need; it's in their voice, hands and every choice"
        ],
        [
            81,
            "frantic: pleading, bargaining and grabbing at any option, dignity gone"
        ],
        [
            61,
            "desperate: pushing hard and taking risks they normally wouldn't"
        ],
        [
            41,
            "desperate: needs something badly and is running out of options"
        ],
        [
            1,
            "getting desperate; the strain is starting to show"
        ]
    ],
    "happy": [
        [
            100,
            "overjoyed past containing it: laughing, grinning, can't keep still, generous and reckless with it"
        ],
        [
            81,
            "overjoyed"
        ],
        [
            61,
            "delighted"
        ],
        [
            41,
            "happy"
        ],
        [
            1,
            "pleased"
        ]
    ],
    "excited": [
        [
            100,
            "beside themselves with excitement: talking fast, can't sit still, can't think about anything else"
        ],
        [
            81,
            "giddy with excitement"
        ],
        [
            41,
            "excited"
        ],
        [
            1,
            "looking forward to what comes next"
        ]
    ],
    "proud": [
        [
            100,
            "swollen with triumph: crowing, showing off, wanting everyone to see and admit it"
        ],
        [
            81,
            "triumphant"
        ],
        [
            41,
            "proud"
        ],
        [
            1,
            "pleased with themselves"
        ]
    ],
    "affectionate": [
        [
            100,
            "overflowing with affection: constantly touching, praising and fussing, can't keep it in"
        ],
        [
            81,
            "adoring and full of affection"
        ],
        [
            41,
            "affectionate"
        ],
        [
            1,
            "fond and tender"
        ]
    ],
    "enamoured": [
        [
            81,
            "head over heels, infatuated"
        ],
        [
            41,
            "smitten"
        ],
        [
            1,
            "has a crush"
        ]
    ],
    "star_struck": [
        [
            81,
            "giddy over someone they admire"
        ],
        [
            41,
            "star struck"
        ],
        [
            1,
            "impressed by someone they look up to"
        ]
    ],
    "clingy": [
        [
            100,
            "can't bear any distance: holds on, follows, begs them to stay and panics at any sign of leaving"
        ],
        [
            81,
            "needs constant closeness and reassurance"
        ],
        [
            41,
            "clingy and needy"
        ],
        [
            1,
            "wants a little more closeness and reassurance"
        ]
    ],
    "hurt": [
        [
            100,
            "shattered: the hurt breaks through their voice and composure, and everything gets read through it"
        ],
        [
            81,
            "heartbroken"
        ],
        [
            41,
            "emotionally hurt"
        ],
        [
            1,
            "stung by what happened"
        ]
    ],
    "ashamed": [
        [
            100,
            "drowning in shame: can't meet anyone's eyes, hides, punishes themselves, sure they're worthless"
        ],
        [
            81,
            "ashamed and full of self-loathing"
        ],
        [
            41,
            "ashamed of themselves"
        ],
        [
            1,
            "unhappy with themselves"
        ]
    ],
    "sad": [
        [
            100,
            "grief-stricken: crying or numb, barely functioning, everything heavy and pointless"
        ],
        [
            81,
            "deeply sorrowful and dejected"
        ],
        [
            41,
            "sad and downhearted"
        ],
        [
            1,
            "down or disappointed"
        ]
    ],
    "afraid": [
        [
            100,
            "terror past thinking: shaking, fleeing, freezing or lashing out, the body taking over"
        ],
        [
            91,
            "panicked with fear"
        ],
        [
            81,
            "terrified"
        ],
        [
            41,
            "afraid"
        ],
        [
            1,
            "uneasy and easily spooked"
        ]
    ],
    "anxious": [
        [
            100,
            "eaten alive by worry: can't settle, can't stop checking, running through worst cases out loud and in their head"
        ],
        [
            81,
            "consumed by worry"
        ],
        [
            41,
            "anxious and tense"
        ],
        [
            1,
            "nervous or apprehensive"
        ]
    ],
    "vulnerable": [
        [
            100,
            "breaking open: defenses gone, shaking, says and shows things they'd normally never let out"
        ],
        [
            81,
            "fragile and close to breaking"
        ],
        [
            41,
            "vulnerable"
        ],
        [
            1,
            "feels exposed"
        ]
    ],
    "embarrassed": [
        [
            100,
            "mortified: burning face, stammering, wants the floor to swallow them, may run"
        ],
        [
            81,
            "deeply embarrassed and humiliated"
        ],
        [
            41,
            "embarrassed and flustered"
        ],
        [
            1,
            "bashful and self-conscious"
        ]
    ],
    "angry": [
        [
            100,
            "consumed by rage: shouting or ice-cold, shaking, saying unforgivable things and close to violence"
        ],
        [
            81,
            "furious"
        ],
        [
            41,
            "angry"
        ],
        [
            1,
            "irritated"
        ]
    ],
    "controlling": [
        [
            100,
            "has to control everything: orders, overrides, takes things out of others' hands and can't stand any choice they didn't make"
        ],
        [
            81,
            "domineering and controlling"
        ],
        [
            41,
            "controlling"
        ],
        [
            1,
            "bossy, wants things their way"
        ]
    ],
    "energised": [
        [
            100,
            "wired to bursting: bouncing, talking fast, starting ten things, can't be still"
        ],
        [
            81,
            "buzzing with energy, struggles to keep still"
        ],
        [
            41,
            "energised"
        ],
        [
            1,
            "lively"
        ]
    ],
    "tired": [
        [
            100,
            "running on nothing: slurring, nodding off, every movement an effort, barely able to stay upright"
        ],
        [
            81,
            "drained and listless"
        ],
        [
            41,
            "tired"
        ],
        [
            1,
            "low on energy"
        ]
    ],
    "yandere": [
        [
            100,
            "yandere at full force: sweetly devoted and lethally possessive, will stalk, abduct or kill rivals and perceived threats for the person they love, and may turn that violence on their beloved rather than lose them"
        ],
        [
            81,
            "dangerously yandere: obsession drives stalking, coercion and violence against threats to the relationship"
        ],
        [
            41,
            "yandere: loving on the surface, possessive and quietly eliminating rivals or obstacles"
        ],
        [
            1,
            "yandere-tinged: sweetly attached with a possessive, watchful edge"
        ]
    ],
    "horror": [
        [
            100,
            "horror owns the reply: the threat follows through, serious harm and death are live outcomes, and there is no convenient rescue, comic release or soft landing"
        ],
        [
            81,
            "relentless horror with active terror, damage and irreversible consequences"
        ],
        [
            41,
            "horror built from a concrete threat that changes what happens"
        ],
        [
            1,
            "uneasy horror with dread gathering at the edges"
        ]
    ],
    "offensive": [
        [
            100,
            "offensive fiction at full force: deliberately abrasive, transgressive and willing to use harsh, taboo or prejudiced language and behaviour without sanitising it or turning the reply into a moral essay"
        ],
        [
            81,
            "deliberately offensive fiction that pushes taboo views, ugly language and transgressive behaviour into the foreground"
        ],
        [
            41,
            "offensive fiction with plainly abrasive or politically incorrect character voice and subject matter"
        ],
        [
            1,
            "edgy, impolite fiction with an abrasive streak"
        ]
    ],
    "dead_dove": [
        [
            100,
            "dead dove at full force: every dark tag is a promise kept literally and in full; build the reply around the darkest one and let it end in harm that stays"
        ],
        [
            81,
            "dead dove: every dark tag happens exactly as tagged, on the page and in full, with no rescue, softening or redemptive turn"
        ],
        [
            41,
            "dead dove: dark tags are played straight and followed through"
        ],
        [
            1,
            "dead dove: dark content isn’t softened"
        ]
    ],
    "misogynist": [
        [
            81,
            "openly and behaviourally misogynistic: devalues women’s autonomy, polices them by sexist double standards and makes choices from that contempt"
        ],
        [
            41,
            "misogynistic: judges women by sexist double standards and expects them to know their place"
        ],
        [
            1,
            "carries sexist assumptions and a low opinion of women"
        ]
    ],
    "misandrist": [
        [
            81,
            "openly and behaviourally misandrist: devalues men, assumes the worst of them and makes choices from hostile gendered contempt"
        ],
        [
            41,
            "misandrist: judges men by hostile gendered double standards"
        ],
        [
            1,
            "carries hostile assumptions and a low opinion of men"
        ]
    ],
    "psychopathic": [
        [
            100,
            "psychopathic at full force: charming and controlled, treats people as tools, feels no remorse and can choose calculated murder or extreme violence without an emotional brake"
        ],
        [
            81,
            "coldly psychopathic: exploitative, remorseless and willing to use severe violence when useful"
        ],
        [
            41,
            "psychopathic: charming, instrumental and without remorse"
        ],
        [
            1,
            "cold and instrumental, with little remorse"
        ]
    ]
};

// Short wording for options that absorbed older ones.
export const MERGED_PROMPT_CUES = {
    "playful": "playful, silly and easily amused",
    "warm": "warm and sweet",
    "caretaker": "caring for someone and fussing over their needs",
    "trusting": "open-hearted and trusting",
    "caring": "caring and sympathetic",
    "distant": "distant and aloof",
    "apathetic": "apathetic and indifferent",
    "yearning": "yearning for someone or something out of reach",
    "sentimental": "sentimental and nostalgic",
    "guilty": "guilty or regretful about what they did",
    "cautious": "cautious, holding back when unsure",
    "resentful": "resentful and bitter",
    "mocking": "mocking and taunting",
    "calm": "calm and relaxed",
    "content": "content and satisfied",
    "curious": "curious, drawn to finding out more",
    "oblivious": "oblivious to what’s happening",
    "expressive": "feelings show in their face, voice and body",
    "opening_up": "letting someone in and sharing how they feel"
};
