// Relationships come in two kinds.
// Shared ("between them"): true for both people and sent once, like dating or enemies to lovers.
// Directed: one person's side only, like a crush, an opinion or "they're mine".
// Each row: id, label, description for the panel, wording sent to the model ({other} becomes their name).
export const SHARED_CATEGORIES = [
    ['What they are', '⚭', '#d7a0b4', [
        ["reluctant_allies", "Reluctant allies", "working together because they need to, with distrust still in the way", "reluctant allies: working together because they need to, with distrust still in the way"],
        ["estranged_friends", "Estranged friends", "used to be close; old familiarity keeps meeting the distance between them", "estranged friends: used to be close; old familiarity keeps meeting the distance between them"],
        ["pen_pals", "Pen pals", "a connection built through letters or messages, with distance shaping what they share", "pen pals: a connection built through letters or messages, with distance shaping what they share"],
        ["long_distance", "Long distance", "a relationship shaped by time apart, limited contact and anticipated reunions", "long distance: a relationship shaped by time apart, limited contact and anticipated reunions"],
        ["queerplatonic", "Queerplatonic partners", "a committed bond outside ordinary friendship and romance expectations", "queerplatonic partners: a committed bond outside ordinary friendship and romance expectations"],
        ["open_relationship", "Open relationship", "together with an agreement allowing other connections; follow their established terms", "open relationship: together with an agreement allowing other connections; follow their established terms"],
        ["polycule_members", "Polycule members", "part of the same network of relationships; direct bonds follow established history", "polycule members: part of the same network of relationships; direct bonds follow established history"],
        ["in_laws", "In-laws", "connected through marriage, with family expectations shaping how they get along", "in-laws: connected through marriage, with family expectations shaping how they get along"],
        ['strangers', 'Strangers', 'they don’t know each other yet', 'strangers'],
        ['acquaintances', 'Acquaintances', 'they know each other a little, nothing more', 'acquaintances'],
        ['classmates', 'Classmates', 'they study together', 'classmates'],
        ['coworkers', 'Coworkers', 'they work together', 'coworkers'],
        ['neighbours', 'Neighbours', 'they live next door to each other', 'neighbours'],
        ['roommates', 'Roommates', 'they live under the same roof', 'roommates'],
        ['childhood_friends', 'Childhood friends', 'friends since they were kids', 'childhood friends'],
        ['friends', 'Friends', 'a real friendship with history behind it', 'friends'],
        ['best_friends', 'Best friends', 'each other’s closest friend', 'best friends'],
        ['family', 'Family', 'related by blood or raised together', 'family'],
        ['partners_in_crime', 'Partners in crime', 'in on something together, trouble included', 'partners in crime'],
        ['frenemies', 'Frenemies', 'friends on the surface, rivals underneath', 'frenemies: friendly on the surface, competing underneath'],
        ['rivals', 'Rivals', 'always competing and keeping score', 'rivals'],
        ['enemies', 'Enemies', 'openly against each other', 'enemies'],
        ['its_complicated', 'It’s complicated', 'too tangled to put a name on', 'it’s complicated: too tangled to name, and both of them feel it'],
        ['situationship', 'Situationship', 'more than friends, never defined', 'in a situationship: more than friends, never defined'],
        ['friends_with_benefits', 'Friends with benefits', 'friends who sleep together', 'friends with benefits'],
        ['casual', 'Casual', 'hooking up without strings', 'casual, no strings'],
        ['one_night_stand', 'One night stand', 'they slept together once, no promises', 'a one night stand'],
        ['dating', 'Dating', 'they’re together', 'dating'],
        ['engaged', 'Engaged', 'promised to marry', 'engaged'],
        ['married', 'Married', 'married to each other', 'married'],
        ['exes', 'Exes', 'they used to be together', 'exes'],
        ['on_off', 'On again, off again', 'they keep breaking up and coming back', 'on again, off again'],
        ['affair', 'Affair', 'sleeping together behind someone’s back', 'having an affair'],
        ['secret_relationship', 'Secret relationship', 'together, but hiding it from everyone', 'in a secret relationship'],
        ['sugar', 'Sugar arrangement', 'money and gifts in exchange for company', 'in a sugar arrangement'],
        ['first_time', 'First time together', 'their first time being intimate', 'having their first time together'],
        ['soulmates', 'Soulmates', 'feel made for each other', 'soulmates'],
        ['love_hate', 'Love-hate', 'can’t stand each other, can’t stay away', 'a love-hate relationship: can’t stand each other, can’t stay away'],
        ['toxic', 'Toxic', 'bad for each other and still together', 'toxic for each other and still in it'],
        ['codependent_pair', 'Codependent', 'can’t function apart', 'codependent: they can’t function apart'],
        ['bad_blood', 'Bad blood', 'history between them that hasn’t healed', 'bad blood between them'],
        ['unfinished_business', 'Unfinished business', 'something between them was never settled', 'unfinished business between them'],
        ['power_imbalance', 'Power imbalance', 'one of them has real power over the other', 'a power imbalance: one holds real power over the other'],
        ['age_gap', 'Big age gap', 'a gap in age that both of them feel', 'a big age gap between them'],
    ]],
    ['Their story', '❧', '#a8bfe0', [
        ["right_person_wrong_time", "Right person, wrong time", "the connection fits but their current circumstances get in its way", "right person, wrong time: the connection fits but their current circumstances get in its way"],
        ["fast_chemistry_slow_trust", "Fast chemistry, slow trust", "attraction comes easily while trust takes time and evidence", "fast chemistry, slow trust: attraction comes easily while trust takes time and evidence"],
        ["mutual_blackmail", "Mutual blackmail", "each knows something damaging about the other, keeping both tied to uneasy terms", "mutual blackmail: each knows something damaging about the other, keeping both tied to uneasy terms"],
        ["shared_alibi", "Shared alibi", "they depend on the same version of events and both have something to lose", "shared alibi: they depend on the same version of events and both have something to lose"],
        ["public_rivals_private_allies", "Public rivals, private allies", "they help each other in private while keeping up a public rivalry", "public rivals, private allies: they help each other in private while keeping up a public rivalry"],
        ["growing_apart", "Growing apart", "their lives and priorities are drifting apart despite what they once shared", "growing apart: their lives and priorities are drifting apart despite what they once shared"],
        ["rebuilding_trust", "Rebuilding trust", "trust was damaged; what they do now slowly earns it back or loses it again", "rebuilding trust: trust was damaged; what they do now slowly earns it back or loses it again"],
        ["bound_by_promise", "Bound by a promise", "a promise between them keeps shaping choices as keeping it becomes harder", "bound by a promise: a promise between them keeps shaping choices as keeping it becomes harder"],
        ['slow_burn', 'Slow burn', 'the attraction builds slowly; payoff is delayed and earned', 'slow burn: attraction builds gradually and the payoff keeps being earned, not rushed'],
        ['mutual_pining', 'Mutual pining', 'both want each other and neither says it', 'mutual pining: both want each other and neither has said so'],
        ['unrequited_love', 'Unrequited love', 'one loves and the other doesn’t love them back', 'unrequited love: one loves, the other doesn’t love them back'],
        ['secret_admirer', 'Secret admirer', 'one admires the other from a distance without revealing it', 'secret admirer: one admires the other and hasn’t revealed it'],
        ['first_love', 'First love', 'the first time falling in love, with all its intensity', 'first love'],
        ['confession', 'Confession', 'building toward or living through a confession of feelings', 'a love confession is coming or has just happened'],
        ['friends_to_lovers', 'Friends to lovers', 'friends slowly becoming something more', 'friends to lovers'],
        ['enemies_to_lovers', 'Enemies to lovers', 'hostility slowly turning into attraction', 'enemies to lovers'],
        ['rivals_to_lovers', 'Rivals to lovers', 'competition slowly turning into attraction', 'rivals to lovers'],
        ['opposites_attract', 'Opposites attract', 'two very different people drawn together', 'opposites attract: very different people drawn together'],
        ['grumpy_sunshine', 'Grumpy/sunshine', 'a grump paired with a ray of sunshine', 'grumpy/sunshine: one is a grump, the other relentlessly warm'],
        ['forbidden_love', 'Forbidden love', 'love that breaks rules or would cost them everything', 'forbidden love'],
        ['star_crossed', 'Star-crossed lovers', 'meant for each other and doomed by circumstance', 'star-crossed lovers'],
        ['second_chance', 'Second chance', 'another shot after it went wrong', 'second chance: trying again after it went wrong the first time'],
        ['fake_dating', 'Fake relationship', 'pretending to be together until it gets real', 'fake relationship: pretending to be together, and it’s getting harder to tell what’s pretend'],
        ['forced_proximity', 'Forced proximity', 'stuck together with no way to avoid each other', 'forced proximity: stuck together, no way to avoid each other'],
        ['only_one_bed', 'Only one bed', 'circumstances force them to share a bed', 'only one bed'],
        ['arranged_marriage', 'Arranged marriage', 'married by someone else’s arrangement', 'arranged marriage'],
        ['marriage_of_convenience', 'Marriage of convenience', 'married for practical reasons, not love', 'marriage of convenience'],
        ['office_romance', 'Office romance', 'romance at work with all its risks', 'office romance'],
        ['bodyguard', 'Bodyguard', 'one protects the other for a living, and it gets personal', 'bodyguard romance'],
        ['size_difference', 'Size difference', 'a big difference in size that keeps getting noticed', 'size difference'],
        ['beauty_and_beast', 'Beauty and the beast', 'gentleness finding something lovable in a monster', 'beauty and the beast'],
        ['hurt_comfort', 'Hurt/comfort', 'one is hurt, the other takes care of them', 'hurt/comfort: one is hurt and the other takes care of them'],
        ['who_did_this', 'Who did this to you', 'furious protectiveness when one of them gets hurt', '"who did this to you" protectiveness'],
        ['touch_and_die', 'Touch them and die', 'one would destroy anyone who lays a hand on the other', '"touch them and die"'],
        ['villain_romance', 'Villain romance', 'one of them is the villain, and the other falls anyway', 'villain romance'],
        ['obsessive_love', 'Obsessive love', 'love that becomes fixation and consumes', 'obsessive love'],
        ['if_i_cant_have_you', 'If I can’t have you', 'if I can’t have you, no one can', '"if I can’t have you, no one can"'],
        ['captor_captive', 'Captor and captive', 'one holds the other, and something grows between them', 'captor and captive'],
        ['stockholm', 'Stockholm syndrome', 'the captive falling for their captor', 'Stockholm syndrome'],
        ['trauma_bond', 'Trauma bond', 'bonded through shared trauma or harm', 'a trauma bond'],
        ['corrupting_love', 'Corrupting love', 'loving each other makes one of them worse', 'a love that corrupts'],
        ['redeeming_love', 'Redeeming love', 'loving each other makes one of them better', 'a love that redeems'],
    ]],
];
export const RELATIONSHIP_CATEGORIES = [
    ['Their role', '♜', '#d7b3a0', [
        ['mentor', 'Mentor to', 'teaches and guides them', '{other}’s mentor'],
        ['student_of', 'Student of', 'learns from them', '{other}’s student'],
        ['teacher_of', 'Teacher of', 'teaches them in a classroom', '{other}’s teacher'],
        ['sees_as_muse', 'Artist to their muse', 'they’re the inspiration for this person’s art', 'sees {other} as their muse'],
        ['is_muse', 'Muse to', 'the person who inspires the other’s art', '{other}’s muse'],
        ['boss_of', 'Boss of', 'employs or manages them', '{other}’s boss'],
        ['works_for', 'Works for', 'answers to them at work', 'works for {other}'],
        ['caretaker_of', 'Carer of', 'looks after them day to day', 'looks after {other} day to day'],
        ['captor_of', 'Captor of', 'holds them against their will', 'holding {other} captive'],
        ['captive_of', 'Captive of', 'held by them against their will', 'held captive by {other}'],
        ['has_power_over', 'Has power over', 'holds real power over them, like a boss, teacher or captor', 'holds power over {other}'],
        ['under_power', 'Under their power', 'the other person holds real power over them', 'under {other}’s power'],
    ]],
    ['Next to each other', '⇕', '#c9b9e0', [
        ['older', 'Older', 'older, and it shows in how they relate', 'older than {other}'],
        ['younger', 'Younger', 'younger, and it shows in how they relate', 'younger than {other}'],
        ['taller', 'Taller', 'towers over them', 'taller than {other}, a real height difference'],
        ['shorter', 'Shorter', 'has to look up at them', 'shorter than {other}, a real height difference'],
        ['bigger', 'Bigger', 'bigger built, takes up more space', 'bigger than {other}, a real size difference'],
        ['smaller', 'Smaller', 'smaller beside them, easy to overpower', 'smaller than {other}, a real size difference'],
        ['stronger', 'Stronger', 'physically stronger', 'stronger than {other}'],
        ['smarter', 'Smarter', 'sharper, and both can tell', 'smarter than {other}'],
        ['richer', 'Richer', 'has more money and the power that comes with it', 'richer than {other}'],
    ]],
    ['What they think of them', '◉', '#b9c9e0', [
        ['fascinated', 'Fascinated by', 'can’t figure them out and wants to', 'fascinated by {other} and wants to figure them out'],
        ['intrigued_by', 'Curious about', 'wants to know more about them', 'curious about {other}'],
        ['impressed_by', 'Impressed by', 'rates them more than expected', 'impressed by {other}'],
        ['respects', 'Respects', 'takes them seriously and gives them their due', 'respects {other}'],
        ['sees_potential', 'Sees potential in', 'thinks they could be more, with the right push', 'sees potential in {other}'],
        ['thinks_smart', 'Thinks they’re clever', 'rates their mind', 'thinks {other} is clever'],
        ['thinks_talented', 'Thinks they’re talented', 'rates what they can do', 'thinks {other} is talented'],
        ['thinks_kind', 'Thinks they’re kind', 'sees a good heart in them', 'thinks {other} is kind'],
        ['thinks_pure', 'Thinks they’re pure', 'sees them as innocent and untouched', 'thinks {other} is pure and innocent'],
        ['thinks_classy', 'Thinks they’re classy', 'sees taste and refinement in them', 'thinks {other} is classy'],
        ['finds_funny', 'Finds funny', 'laughs at their jokes and their antics', 'finds {other} funny'],
        ['thinks_weird', 'Thinks they’re weird', 'finds them odd, for better or worse', 'thinks {other} is weird'],
        ['thinks_naive', 'Thinks they’re naive', 'thinks they don’t see how the world works', 'thinks {other} is naive'],
        ['thinks_stupid', 'Thinks they’re stupid', 'thinks they’re slow or dim', 'thinks {other} is stupid'],
        ['thinks_boring', 'Finds boring', 'struggles to stay interested in them', 'finds {other} boring'],
        ['finds_annoying', 'Finds annoying', 'they get on their nerves', 'finds {other} annoying'],
        ['offputting', 'Finds offputting', 'something about them rubs the wrong way', 'finds something about {other} offputting'],
        ['thinks_fake', 'Thinks they’re fake', 'sees a pose, not a real person', 'thinks {other} is fake, putting on an act'],
        ['thinks_trashy', 'Thinks they’re trashy', 'sees them as cheap and low class', 'thinks {other} is trashy'],
        ['thinks_slutty', 'Thinks they’re slutty', 'judges them as easy and loose', 'thinks {other} is slutty'],
        ['thinks_immature', 'Thinks they’re immature', 'sees them as a kid playing grown-up', 'thinks {other} is immature'],
        ['thinks_spoilt', 'Thinks they’re spoilt', 'thinks they’ve had everything handed to them', 'thinks {other} is spoilt'],
        ['thinks_pathetic', 'Thinks they’re pathetic', 'sees them as weak and pitiable', 'thinks {other} is pathetic'],
        ['thinks_crazy', 'Thinks they’re unstable', 'sees them as unhinged or unpredictable', 'thinks {other} is unstable'],
        ['thinks_cruel', 'Thinks they’re cruel', 'sees cruelty in them', 'thinks {other} is cruel'],
        ['thinks_dangerous', 'Thinks they’re dangerous', 'sees them as someone who could do real harm', 'thinks {other} is dangerous'],
        ['underestimates', 'Underestimates', 'assumes they’re less capable than they are', 'underestimates {other}'],
        ['pities', 'Pities', 'feels sorry for them, maybe a little condescendingly', 'pities {other}'],
        ['suspicious_of', 'Suspicious of', 'thinks they’re up to something', 'suspicious of {other}'],
    ]],
    ['Friendship & trust', '♡', '#dba6b9', [
        ['devoted', 'Devoted to', 'keeps choosing them and making time or sacrifices for them', 'devoted to {other}; makes them a priority and follows through'],
        ['likes', 'Likes', 'enjoys them and is glad when they’re around', 'likes {other}'],
        ['enjoys_company', 'Enjoys their company', 'time with them is easy and fun', 'enjoys {other}’s company'],
        ['comfortable_with', 'Comfortable with', 'can relax and be themselves around them', 'comfortable around {other}'],
        ['trusts', 'Trusts', 'believes their intentions and will rely on them', 'trusts {other}'],
        ['confides_in', 'Confides in', 'tells them things they don’t tell others', 'confides in {other}'],
        ['safe_with', 'Feels safe with', 'lets their guard down around them', 'feels safe with {other}'],
        ['understands', 'Feels understood by', 'feels they get a side of them most people miss', 'feels understood by {other}'],
        ['admires', 'Admires', 'looks up to them and values what they do', 'admires {other}'],
        ['believes_in', 'Believes in', 'has faith in them when others don’t', 'believes in {other}'],
        ['proud', 'Proud of', 'takes pride in them and what they’ve done', 'proud of {other}'],
        ['grateful_to', 'Grateful to', 'owes them thanks and feels it', 'grateful to {other}'],
        ['loves', 'Loves', 'loves them; what kind of love depends on what they are to each other', 'loves {other}'],
        ['cherishes', 'Cherishes', 'holds them dear; their presence feels precious', 'cherishes {other}'],
        ['dotes', 'Dotes on', 'spoils them with attention and little favours', 'dotes on {other}'],
        ['protects', 'Wants to protect', 'wants to keep them safe and steps in when they’re threatened', 'wants to protect {other}'],
        ['would_die_for', 'Would die for', 'would put themselves between them and anything', 'would die for {other}'],
        ['wants_to_fix', 'Wants to fix', 'wants to heal or save them, whether they asked or not', 'wants to fix {other}'],
        ['misses', 'Misses', 'misses their company and wants that closeness back', 'misses {other}'],
        ['forgives', 'Wants to forgive', 'wants to forgive them, even if the hurt is still there', 'wants to forgive {other}'],
    ]],
    ['Attraction & romance', '✧', '#d7afd4', [
        ['finds_attractive', 'Finds attractive', 'physically drawn to them', 'finds {other} attractive'],
        ['finds_hot', 'Finds hot', 'finds them sexy and it’s hard to ignore', 'finds {other} hot'],
        ['finds_pretty', 'Finds pretty', 'thinks they’re lovely to look at', 'finds {other} pretty'],
        ['finds_cute', 'Finds cute', 'finds their looks or little habits endearing', 'finds {other} cute'],
        ['cant_look_away', 'Can’t keep their eyes off', 'keeps catching themselves staring', 'can’t keep their eyes off {other}'],
        ['turned_on_by', 'Turned on by', 'their presence alone gets them going', 'turned on by {other}'],
        ['charmed_by', 'Charmed by', 'won over by them', 'charmed by {other}'],
        ['star_struck_by', 'Star-struck by', 'dazzled by them, up to giddy fandom', 'star-struck by {other}'],
        ['crush', 'Has a crush on', 'giddy and nervous about them', 'has a crush on {other}'],
        ['smitten', 'Smitten with', 'romantic fascination, up to head over heels', 'smitten with {other}'],
        ['in_love', 'In love with', 'romantically, deeply in love', 'in love with {other}'],
        ['idealises', 'Idealises', 'sees them as a beautiful, perfect image more than a person', 'idealises {other} as a beautiful, perfect image more than a person'],
        ['lusts_after', 'Lusts after', 'wants them sexually and badly', 'lusts after {other}'],
        ['fantasises', 'Fantasises about', 'pictures them in private and can’t stop', 'fantasises about {other}'],
        ['longs_for', 'Longs for', 'aches for them, especially when apart', 'longs for {other}'],
        ['flirts_with', 'Flirts with', 'can’t help flirting when they’re around', 'flirts with {other}'],
        ['drawn_despite', 'Drawn to them despite themselves', 'attracted and hates that they are', 'drawn to {other} despite themselves'],
        ['not_attracted', 'Not attracted to', 'no spark at all', 'not attracted to {other}'],
        ['finds_plain', 'Finds plain', 'thinks they’re nothing special to look at', 'finds {other} plain'],
        ['finds_ugly', 'Finds ugly', 'doesn’t like how they look', 'finds {other} ugly'],
        ['turned_off_by', 'Turned off by', 'something about them kills the mood', 'turned off by {other}'],
        ['finds_creepy', 'Finds creepy', 'their attention makes their skin crawl', 'finds {other} creepy'],
        ['grossed_out', 'Grossed out by', 'physically repelled by them', 'grossed out by {other}'],
        ['heartbroken_over', 'Heartbroken over', 'they broke their heart, or losing them did', 'heartbroken over {other}'],
    ]],
    ['Attachment & power', '◆', '#c0acd9', [
        ['obsessed', 'Obsessed with', 'fixates on them; attention keeps circling back', 'obsessed with {other}'],
        ['theyre_mine', 'They’re mine', 'has claimed them, and that’s that', 'sees {other} as theirs, full stop'],
        ['possessive', 'Possessive of', 'wants them to themselves and resents sharing them', 'possessive of {other}'],
        ['wants_to_own', 'Wants to own', 'wants them as theirs, completely', 'wants to own {other}'],
        ['idolises', 'Idolises', 'puts them on a pedestal and can’t see their flaws', 'idolises {other}'],
        ['cant_let_go', 'Can’t let go of', 'tries to move on and can’t', 'can’t let go of {other}'],
        ['cant_live_without', 'Can’t live without', 'the thought of losing them is unbearable', 'can’t live without {other}'],
        ['preserves', 'Wants to preserve', 'wants to keep them just as they are; change or loss feels like a threat', 'wants to preserve {other} exactly as they are'],
        ['wants_to_capture', 'Wants to capture', 'wants them on camera, canvas or paper, held forever', 'wants to capture {other} in their art'],
        ['wants_to_mould', 'Wants to mould', 'wants to shape them into who they should be', 'wants to mould {other}'],
        ['jealous', 'Jealous over', 'threatened when anyone else gets close to them', 'jealous over {other}'],
        ['envies', 'Envies', 'wants what they have and feels the comparison', 'envies {other}'],
        ['rival', 'Competes with', 'needs to come out ahead of them', 'competes with {other}'],
        ['approval', 'Wants their approval', 'their opinion matters and they want it to be good', 'wants {other}’s approval'],
        ['impresses', 'Wants to impress', 'plays up whatever might impress them', 'wants to impress {other}'],
        ['depends', 'Depends on', 'leans on them and can’t picture managing without them', 'depends on {other}'],
        ['wrapped', 'Wrapped around their finger', 'bends to their wishes easily', 'wrapped around {other}’s finger'],
        ['submits_to', 'Submits to', 'yields to them and wants to be under their control', 'submits to {other}'],
        ['dominates', 'Dominates', 'takes charge of them and expects to be obeyed', 'dominates {other}'],
        ['controls', 'Wants to control', 'wants a say in their choices and steers them', 'wants to control {other}'],
        ['wants_to_isolate', 'Wants to isolate', 'wants them cut off from everyone else', 'wants to isolate {other} from everyone else'],
        ['manipulates', 'Manipulates', 'plays them to get what they want', 'manipulates {other}'],
        ['uses', 'Uses', 'sees them as useful, more tool than person', 'uses {other}'],
        ['wants_to_corrupt', 'Wants to corrupt', 'wants to pull them into darker things', 'wants to corrupt {other}'],
        ['brings_out_worst', 'Brings out their worst', 'drags the other person down with them', 'brings out the worst in {other}'],
        ['worst_in_them', 'They bring out my worst', 'the other person drags them down', '{other} brings out their worst'],
        ['wants_to_break', 'Wants to break', 'wants to tear them down until they give in', 'wants to break {other}'],
        ['owes', 'Owes', 'in their debt, and both know it', 'owes {other}'],
    ]],
    ['Hurt & guilt', '☂', '#a5b5e3', [
        ['hurt_by', 'Hurt by', 'still stinging from something they did', 'hurt by {other}'],
        ['betrayed_by', 'Betrayed by', 'trusted them and got burned', 'betrayed by {other}'],
        ['rejected_by', 'Rejected by', 'reached out and got pushed away', 'feels rejected by {other}'],
        ['used_by', 'Feels used by', 'feels like they only get used', 'feels used by {other}'],
        ['abandoned_by', 'Abandoned by', 'feels left behind by them', 'feels abandoned by {other}'],
        ['humiliated_by', 'Humiliated by', 'they made them feel small, and it stuck', 'humiliated by {other}'],
        ['scarred_by', 'Scarred by', 'what they did left lasting damage', 'scarred by what {other} did'],
        ['disappointed', 'Disappointed in', 'hoped for more from them', 'disappointed in {other}'],
        ['embarrassed_by', 'Embarrassed by', 'cringes at them, especially in front of others', 'embarrassed by {other}'],
        ['guilty_toward', 'Feels guilty toward', 'did them wrong and it weighs on them', 'feels guilty toward {other}'],
        ['regrets', 'Regrets', 'wishes things had gone differently with them', 'regrets how things went with {other}'],
    ]],
    ['Dislike & hostility', '↯', '#d69d95', [
        ['cold_shoulder', 'Giving the cold shoulder', 'deliberately withholds warmth and attention from them', 'gives {other} the cold shoulder, withholding warmth and attention'],
        ['irritated_by', 'Irritated by', 'little things they do grate', 'irritated by {other}'],
        ['sick_of', 'Sick of', 'had enough of them', 'sick of {other}'],
        ['cant_stand', 'Can’t stand', 'their presence alone is too much', 'can’t stand {other}'],
        ['judges', 'Judgemental of', 'holds them to harsh standards and notices every failing', 'judgemental of {other}'],
        ['looks_down', 'Looks down on', 'sees them as beneath them', 'looks down on {other}'],
        ['disgusted_by', 'Disgusted by', 'finds who they are or what they do disgusting', 'disgusted by {other}'],
        ['distrusts', 'Distrusts', 'questions their motives and looks for what they’re hiding', 'distrusts {other}'],
        ['threatened_by', 'Threatened by', 'sees them as a threat to what they have', 'threatened by {other}'],
        ['resents', 'Resents', 'carries a grudge that colours everything', 'resents {other}'],
        ['blames', 'Blames', 'holds them responsible for what went wrong', 'blames {other}'],
        ['intimidated_by', 'Intimidated by', 'feels small and wary around them', 'intimidated by {other}'],
        ['fears', 'Afraid of', 'sees them as a threat', 'afraid of {other}'],
        ['avoids', 'Wants to avoid', 'looks for ways out of their company', 'wants to avoid {other}'],
        ['mocks', 'Mocks', 'makes fun of them, to their face or behind their back', 'mocks {other}'],
        ['sabotages', 'Sabotages', 'quietly undermines them', 'sabotages {other}'],
        ['wants_gone', 'Wants them gone', 'wants them out of the picture', 'wants {other} out of the picture'],
        ['wants_to_expose', 'Wants to expose', 'wants their secrets out', 'wants to expose {other}'],
        ['despises', 'Despises', 'holds them in contempt', 'despises {other}'],
        ['hates', 'Hates', 'feels hatred toward them', 'hates {other}'],
        ['wants_to_humiliate', 'Wants to humiliate', 'wants to see them shamed and brought low', 'wants to humiliate {other}'],
        ['wants_to_torment', 'Wants to torment', 'wants to keep them suffering', 'wants to torment {other}'],
        ['wants_to_hurt', 'Wants to hurt', 'wants them to suffer', 'wants to hurt {other}'],
        ['wants_to_ruin', 'Wants to ruin', 'wants to wreck their life', 'wants to ruin {other}'],
        ['revenge', 'Wants revenge on', 'wants to make them pay', 'wants revenge on {other}'],
        ['wants_kill', 'Wants to kill', 'wants them dead and considers acting on it', 'wants {other} dead'],
    ]],
];

const tags = cats => cats.flatMap(([category, , color, rows]) => rows.map(([id, label, cue, prompt]) => ({ id, label, cue, prompt, category, color })));
// 1.25.0: feelings for devoted monsters, grudging favourites and the people who love them anyway.
const DIRECTED_ADDITIONS = {
    'Friendship & trust': [
        ['nurses', 'Nurses them', 'tends them through illness or injury with total focus', 'nurses {other} through illness or injury with total focus'],
        ['shows_up_for', 'Always shows up for them', 'turns up whenever they need someone, no questions asked', 'always shows up for {other}, no questions asked'],
        ['never_pressures', 'Never pressures them', 'won’t push them into anything, least of all their own bad habits', 'never pressures {other} into anything, least of all their own habits'],
        ['big_sibling_to', 'Big sibling to them', 'looks out for them like an older sibling: teasing, protective, loyal', 'looks out for {other} like a big sibling'],
        ['cheers_up', 'Cheers them up', 'knows exactly how to drag them out of a bad mood or a boring day', 'knows how to cheer {other} up and drag them out of boredom'],
        ['grudgingly_tolerates', 'Grudgingly tolerates', 'puts up with them more than anyone else and won’t admit why', 'grudgingly tolerates {other}, more than anyone else, and won’t admit why'],
    ],
    'Attachment & power': [
        ['watches_over', 'Watches over them', 'watches them constantly, on screens, through windows or while they sleep, and calls it care', 'watches over {other} constantly, even while they sleep, and calls it care'],
        ['covers_for', 'Covers for them', 'hides and cleans up after their mistakes or crimes', 'covers for {other}, hiding and cleaning up after what they do'],
        ['pleads_with', 'Pleads with them', 'openly begs and bargains for their attention, love or survival', 'pleads openly with {other}, dignity forgotten'],
        ['sees_as_miracle', 'Their miracle', 'believes they’re a once-in-a-lifetime discovery, scientifically and romantically', 'sees {other} as a miracle: a discovery and a great love at once'],
        ['studies', 'Studies them', 'treats them as a fascinating subject: observes, tests and takes notes', 'studies {other} like a subject, testing and recording them'],
        ['cant_hurt', 'Can’t bring themselves to hurt', 'the one person their violence won’t touch, to their own confusion', 'can’t bring themselves to hurt {other}, and it confuses them'],
    ],
    'Hurt & guilt': [
        ['hides_life_from', 'Hides their life from them', 'keeps a whole side of their life secret from them, out of love or shame', 'hides how they really live from {other}'],
        ['worries_about_habits', 'Worries about their habits', 'scared of where someone’s drinking, using or recklessness is heading', 'worries about where {other}’s habits are heading'],
        ['afraid_to_lose', 'Terrified of losing them', 'the thought of them dying or leaving is unbearable', 'is terrified of losing {other}'],
        ['already_mourning', 'Already mourning them', 'grieving them before they’re even gone', 'is already mourning {other} while they’re still here'],
        ['blames_self_for', 'Blames themselves', 'holds themselves responsible for what happened to them', 'blames themselves for what happened to {other}'],
        ['cant_forgive', 'Can’t forgive them', 'wants to and can’t; the hurt is too deep', 'can’t forgive {other}, however much they want to'],
        ['never_told', 'Never told them', 'something important was never said and maybe never will be', 'never told {other} what really mattered'],
        ['lost', 'Lost them', 'they’re gone, through death, distance or a door that won’t reopen', 'has lost {other}'],
        ['grieves', 'Grieves', 'mourns them, lost or dead', 'grieves {other}'],
        ['haunted_by', 'Haunted by', 'can’t stop seeing them in memory, guilt or dreams', 'is haunted by {other}'],
    ],
};
// 1.29.0: family and household roles, care and duty, plus a few common feelings that were missing.
const DIRECTED_ADDITIONS_2 = {
    'Their role': [
        ['parent_of', 'Parent of', 'their mother or father, by blood or by raising them', '{other}’s parent'],
        ['child_of', 'Child of', 'their son or daughter, whatever age they are now', '{other}’s child'],
        ['older_sibling_of', 'Older sibling of', 'their older brother or sister', '{other}’s older sibling'],
        ['younger_sibling_of', 'Younger sibling of', 'their younger brother or sister', '{other}’s younger sibling'],
        ['guardian_of', 'Guardian of', 'legally or morally responsible for them', 'responsible for {other} as their guardian'],
        ['ward_of', 'Ward of', 'in their care and under their authority', '{other}’s ward, under their care and authority'],
        ['doctor_of', 'Doctor to', 'their doctor; their body and treatment are this person’s business', '{other}’s doctor, in charge of their treatment'],
        ['patient_of', 'Patient of', 'under their medical care, for better or worse', '{other}’s patient'],
        ['employs_in_house', 'Has them in service', 'employs them as a servant, maid, valet or housekeeper', 'has {other} in service as a servant'],
        ['in_service_to', 'In service to', 'their servant, maid, valet or housekeeper', 'in service to {other} as a servant'],
        ['leads', 'Leads', 'their leader, commander or head of the group', 'leads {other} and expects to be followed'],
        ['follows', 'Follows', 'takes orders from them and follows where they lead', 'follows {other}’s lead and orders'],
        ['creator_of', 'Creator of', 'made or remade them, by science, magic or design', 'made or remade {other} and feels that gives them a claim'],
        ['creation_of', 'Creation of', 'was made or remade by them', 'was made or remade by {other}'],
    ],
    'Friendship & trust': [
        ['loyal_to', 'Loyal to', 'sticks by them and won’t betray them', 'loyal to {other}'],
        ['worries_about', 'Worries about', 'their safety and wellbeing sit on their mind', 'worries about {other}'],
        ['teases', 'Teases', 'pokes fun at them with affection, not malice', 'teases {other} fondly'],
        ['feels_responsible', 'Feels responsible for', 'feels it’s on them to keep them safe or set them right', 'feels responsible for {other}'],
        ['owes_life', 'Owes their life to', 'they saved this person’s life, and it’s never forgotten', 'owes {other} their life'],
        ['sees_as_family', 'Sees as family', 'thinks of them as family, related or not', 'sees {other} as family'],
        ['sees_as_equal', 'Sees as an equal', 'treats them as a match, not above or below', 'sees {other} as an equal'],
    ],
    'What they think of them': [
        ['thinks_liar', 'Thinks they’re a liar', 'doesn’t believe what they say', 'thinks {other} is lying'],
        ['thinks_brave', 'Thinks they’re brave', 'rates their courage', 'thinks {other} is brave'],
        ['thinks_out_of_league', 'Thinks they’re out of their league', 'feels they could never deserve or win them', 'thinks {other} is out of their league'],
    ],
    'Attraction & romance': [
        ['attracted_wont_act', 'Attracted but won’t act', 'wants them and keeps it to themselves, for a reason', 'attracted to {other} and won’t act on it'],
        ['flustered_by', 'Flustered by', 'gets tongue-tied and clumsy around them', 'gets flustered around {other}'],
        ['courting', 'Courting', 'formally pursuing them with a view to marriage', 'courting {other} with marriage in mind'],
    ],
    'Hurt & guilt': [
        ['wants_to_apologise', 'Wants to apologise', 'owes them an apology and can’t find the moment or the words', 'wants to apologise to {other} and can’t find the words'],
        ['feels_inferior', 'Feels inferior to', 'feels smaller, lesser or not enough beside them', 'feels inferior to {other}'],
    ],
};
const SHARED_ADDITIONS = {
    'What they are': [
        ['siblings', 'Siblings', 'brothers, sisters or a mix', 'siblings'],
        ['step_siblings', 'Step-siblings', 'family through a parent’s marriage, not blood', 'step-siblings, family by marriage not blood'],
        ['cousins', 'Cousins', 'related through their parents', 'cousins'],
        ['estranged_family', 'Estranged family', 'family who stopped speaking, and it still hurts', 'estranged family: related and no longer speaking'],
        ['lovers', 'Lovers', 'sleeping together and in love, without being married', 'lovers, not married'],
        ['long_term_partners', 'Long-term partners', 'committed and settled, without being married', 'long-term partners, committed but not married'],
        ['courting_pair', 'Courting', 'a formal, often chaperoned romance heading toward marriage', 'courting: a formal romance heading toward marriage'],
        ['co_parents', 'Co-parents', 'raising a child together, whatever they are to each other now', 'co-parents raising a child together'],
        ['business_partners', 'Business partners', 'own or run something together', 'business partners'],
        ['teammates', 'Teammates', 'on the same team or crew', 'teammates'],
        ['comrades', 'Comrades', 'have fought or survived something side by side', 'comrades: fought or survived something side by side'],
        ['cellmates', 'Cellmates', 'locked up together', 'cellmates'],
    ],
    'Their story': [
        ['class_divide', 'Class divide', 'from different classes, and it shows in everything between them', 'a class divide: different classes, and it shows in everything between them'],
        ['reunited', 'Reunited', 'back together after years apart, both changed', 'reunited after years apart, both changed'],
        ['fated_mates', 'Fated mates', 'bound by fate, magic or instinct, whether they like it or not', 'fated mates: bound by fate or instinct, whether they like it or not'],
        ['pretend_strangers', 'Pretending not to know each other', 'they have history and act like strangers in front of others', 'pretending to be strangers in front of others despite their history'],
        ['tangled_timelines', 'Tangled timelines', 'bound by a hidden shared history at least one of them doesn’t know yet', 'tangled timelines: bound by a hidden shared history at least one of them doesn’t know yet'],
        ['scientist_and_subject', 'Scientist and subject', 'one tests the other; data, care and feelings keep blurring', 'scientist and subject: tests, data, care and feelings keep blurring'],
        ['ride_or_die', 'Ride or die', 'them against the world; loyalty first, questions later', 'ride or die: them against the world, loyalty first'],
        ['platonic_soulmates', 'Platonic soulmates', 'the most important person in each other’s life, with no romance involved', 'platonic soulmates: the most important person in each other’s life, no romance involved'],
        ['party_buddies', 'Party buddies', 'their friendship lives in nights out, bad decisions and morning-after debriefs', 'party buddies: nights out, bad decisions and morning-after debriefs'],
        ['chosen_family', 'Chosen family', 'not related, but family all the same', 'chosen family: not related, but family all the same'],
        ['doomed', 'Doomed', 'it can’t end well, and both of them feel it', 'doomed: it can’t end well and both feel it'],
        ['what_could_have_been', 'What could have been', 'haunted by the life they might have had together', 'what could have been: haunted by the life they might have had'],
        ['broken_promise', 'Broken promise', 'one promise between them was broken and it still sits there', 'a broken promise still sits between them'],
        ['last_chance', 'Last chance', 'this may be their final chance to fix things', 'last chance: this may be their final chance to fix things'],
        ['grudging_bond', 'Grudging bond', 'neither will admit how much they need each other', 'a grudging bond neither will admit to'],
    ],
};
for (const [cats, additions] of [[RELATIONSHIP_CATEGORIES, DIRECTED_ADDITIONS], [RELATIONSHIP_CATEGORIES, DIRECTED_ADDITIONS_2], [SHARED_CATEGORIES, SHARED_ADDITIONS]])
    for (const [name, rows] of Object.entries(additions)) cats.find(([n]) => n === name)[3].push(...rows);
export const RELATIONSHIP_TAGS = tags(RELATIONSHIP_CATEGORIES);
export const SHARED_TAGS = tags(SHARED_CATEGORIES);
export const RELATIONSHIP_BY_ID = Object.fromEntries(RELATIONSHIP_TAGS.map(tag => [tag.id, tag]));
export const SHARED_BY_ID = Object.fromEntries(SHARED_TAGS.map(tag => [tag.id, tag]));
export const SHARED_IDS = new Set(SHARED_TAGS.map(tag => tag.id));
// Both-ways tags where the two people play different parts. Opus 5.5 is weaker at inferring who's who unprompted.
export const TWO_ROLE_SHARED = new Set(['unrequited_love', 'secret_admirer', 'hurt_comfort', 'bodyguard', 'villain_romance', 'beauty_and_beast',
    'captor_captive', 'stockholm', 'corrupting_love', 'redeeming_love', 'power_imbalance', 'grumpy_sunshine', 'who_did_this', 'touch_and_die',
    'scientist_and_subject', 'sugar', 'size_difference', 'age_gap', 'if_i_cant_have_you', 'class_divide']);

// Moods and story tropes that were really about one particular person now live in relationships.
// Old values move automatically: '{{other}}' means "whoever this sheet used to point at".
export const MOVED_TO_RELATIONSHIPS = {
    enamoured: 'smitten', in_love: 'in_love', star_struck: 'star_struck_by', charmed: 'charmed_by',
    wrapped_around_finger: 'wrapped', worshipful: 'idolises', sees_muse: 'sees_as_muse', idealising: 'idealises',
    preserving: 'preserves', making_worse: 'brings_out_worst', being_made_worse: 'worst_in_them',
    hates_user: 'hates', hates_char: 'hates', hates_other: 'hates',
    // The old Facts & scene "Relationship" section and the pair-level romance tropes.
    friends: 'friends', childhood_friends: 'childhood_friends', roommates: 'roommates', coworkers: 'coworkers',
    neighbours: 'neighbours', rivals: 'rivals', enemies: 'enemies', partners_in_crime: 'partners_in_crime',
    one_night_stand: 'one_night_stand', casual: 'casual', dating: 'dating', engaged: 'engaged', married: 'married',
    exes: 'exes', affair: 'affair', secret_relationship: 'secret_relationship', sugar: 'sugar', first_time: 'first_time',
    is_muse: 'is_muse', power_imbalance: 'power_imbalance', age_gap: 'age_gap', older: 'older', younger: 'younger',
    taller: 'taller', shorter: 'shorter', bigger: 'bigger', smaller: 'smaller', stronger: 'stronger', smarter: 'smarter',
    slow_burn: 'slow_burn', mutual_pining: 'mutual_pining', unrequited_love: 'unrequited_love', secret_admirer: 'secret_admirer',
    first_love: 'first_love', confession: 'confession', friends_to_lovers: 'friends_to_lovers', enemies_to_lovers: 'enemies_to_lovers',
    opposites_attract: 'opposites_attract', grumpy_sunshine: 'grumpy_sunshine', forbidden_love: 'forbidden_love',
    second_chance: 'second_chance', fake_dating: 'fake_dating', forced_proximity: 'forced_proximity', only_one_bed: 'only_one_bed',
    arranged_marriage: 'arranged_marriage', marriage_of_convenience: 'marriage_of_convenience', office_romance: 'office_romance',
    size_difference: 'size_difference', beauty_and_beast: 'beauty_and_beast', hurt_comfort: 'hurt_comfort', who_did_this: 'who_did_this',
    villain_romance: 'villain_romance', obsessive_love: 'obsessive_love', if_i_cant_have_you: 'if_i_cant_have_you',
    captor_captive: 'captor_captive', stockholm: 'stockholm', trauma_bond: 'trauma_bond',
};
export const MOVED_TARGET = { hates_user: '{{user}}', hates_char: '{{char}}' };

const strength = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 0;
export const relationshipName = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
export const relationshipKey = (relation, tagId) => `relationship:${relation.id}:${tagId}`;
const cleanNote = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);
export const FAVOURS = ['them', 'other', 'neither'];
export function cleanCompare(compare) {
    return { with: relationshipName(compare?.with), favours: FAVOURS.includes(compare?.favours) ? compare.favours : 'them', value: strength(compare?.value) };
}
// Shared labels are kept on a relation too, so older saves never lose a value before they're moved.
export function cloneRelationships(list) {
    return (Array.isArray(list) ? list : []).map(relation => ({
        id: String(relation.id ?? ''), target: relationshipName(relation.target),
        enabled: relation.enabled !== false,
        moods: Object.fromEntries([...RELATIONSHIP_TAGS, ...SHARED_TAGS].map(tag => [tag.id, strength(relation.moods?.[tag.id])])),
        compare: cleanCompare(relation.compare), note: cleanNote(relation.note),
    }));
}
export const activeRelationshipTags = relation => RELATIONSHIP_TAGS
    .filter(tag => strength(relation?.moods?.[tag.id]) > 0)
    .sort((a, b) => relation.moods[b.id] - relation.moods[a.id]);
export const activeSharedTags = pair => SHARED_TAGS
    .filter(tag => strength(pair?.moods?.[tag.id]) > 0)
    .sort((a, b) => pair.moods[b.id] - pair.moods[a.id]);

// Hate and murderous intent change kind, not just amount, as they rise.
const SCALED = {
    hates: [[100, 'is consumed by hatred for {other}'], [81, 'loathes {other}'], [41, 'hates {other}'], [11, 'dislikes {other}'], [1, 'feels a flicker of hostility toward {other}']],
    wants_kill: [[100, 'killing {other} is a driving goal; their choices and actions work toward it'], [81, 'intends to kill {other} and looks for the chance'],
        [41, 'wants {other} dead, and it weighs on their choices'], [11, 'sometimes wishes {other} were dead'], [1, 'has a fleeting wish that {other} were dead']],
};
export function relationshipCue(tag, value) {
    const scaled = SCALED[tag.id]?.find(([min]) => value >= min)?.[1];
    return scaled ? scaled.replaceAll('{other}', 'them') : tag.cue;
}
export function relationshipText(tag, value, other) {
    const full = RELATIONSHIP_BY_ID[tag.id] ?? SHARED_BY_ID[tag.id] ?? tag;
    const scaled = SCALED[tag.id]?.find(([min]) => value >= min)?.[1];
    return (scaled ?? full.prompt ?? full.cue).replaceAll('{other}', other);
}
export function compareText(subject, target, compare) {
    const { with: other, favours } = compare;
    return favours === 'them' ? `keeps comparing ${target} with ${other}, and ${target} comes out better`
        : favours === 'other' ? `keeps comparing ${target} with ${other}, and ${target} comes off worse`
        : `keeps weighing ${target} against ${other}`;
}

// One person's side toward everyone else. Absent people still count: they get woven in, not summoned.
export function relationshipSets(state, name, extras = {}) {
    const player = extras.player?.name || 'the player’s character';
    const cast = Array.isArray(extras.cast) ? extras.cast : [];
    const resolve = value => relationshipName(value).replaceAll('{{char}}', name).replaceAll('{{user}}', player);
    const owners = [{ name, state }, { name: player, state: extras.player?.state, isPlayer: true },
        ...cast.filter(p => p.inScene).map(p => ({ name: p.name, state: p.state }))];
    return owners.flatMap(owner => !owner.state?.enabled ? [] : cloneRelationships(owner.state.relationships).flatMap(relation => {
        const target = resolve(relation.target), tags = activeRelationshipTags(relation);
        const compare = relation.compare.value && relation.compare.with ? { ...relation.compare, with: resolve(relation.compare.with) } : null;
        const usable = compare && compare.with.toLowerCase() !== target.toLowerCase() ? compare : null;
        if (!relation.enabled || !target || target.toLowerCase() === owner.name.toLowerCase() || (!tags.length && !usable && !relation.note)) return [];
        return [{ ...owner, relation, target, tags, compare: usable, note: relation.note }];
    }));
}
