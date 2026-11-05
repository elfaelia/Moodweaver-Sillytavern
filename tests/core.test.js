import test from 'node:test';
import assert from 'node:assert/strict';
import { MOODS, MERGED_SEARCH_NAMES, freshState, extendCatalogue, composePrompt, blendAnalysis, parseAnalysis, sceneData, fingerprint } from '../core.js';
import { RELATIONSHIP_TAGS, SHARED_TAGS } from '../relationships.js';
// Options get renamed and merged over time ("Cautious" is now "Cautious / hesitant", "Adoring" lives in
// Affectionate). What matters is that each requested one can still be found by searching for it.
const findable = new Set([...MOODS.flatMap(m => [m.label, ...m.label.split(/\s*\/\s*/)]), ...Object.values(MERGED_SEARCH_NAMES).flat(),
    ...RELATIONSHIP_TAGS.map(t => t.label), ...SHARED_TAGS.map(t => t.label)].map(n => n.toLowerCase().trim()));

test('catalogue contains every requested mood, with unique IDs', () => {
    const requested = 'Horny|Manipulative|Cautious|Inspired|Obsessed|Angry|Annoyed|Sexually frustrated|Confused|Offended|Violent|Calm|Jealous|Vulnerable|Playful|Betrayed|Hurt|Worried|Clingy|Tired|Embarrassed|Stoic|Warm|Focused|Chatty|Sad|Irked|Tense|Affectionate|Anxious|Disgusted|Enamoured|Insecure|Brave|Planning|Worshipful|Confident|Lazy|Resentful|Satisfied|Apathetic|Bitter|Suave|Drunk|High|Vengeful|Protective'.split('|');
    for (const name of requested) assert.ok(findable.has(name.toLowerCase()), name);
    assert.equal(MOODS.length, new Set(MOODS.map(m => m.id)).size);
});
test('fresh chat copies default values without sharing state or analysis history', () => {
    const baseline = freshState({ moods: { calm: 45 } });
    const a = freshState(baseline), b = freshState(baseline); a.moods.calm = 99;
    assert.equal(b.moods.calm, 45); assert.equal(b.lastFingerprint, '');
});
test('old saved states gain new sliders without losing values, pins or history', () => {
    const history = [{ moods: { calm: 30 } }];
    const old = { moods: { calm: 67 }, pins: { calm: true }, history, mode: 'dynamic', profile: 'chosen' };
    assert.equal(extendCatalogue(old), old);
    assert.equal(old.moods.calm, 67); assert.equal(old.pins.calm, true);
    assert.equal(old.moods.master, 0); assert.equal(old.pins.masking_warmth, false);
    assert.equal(old.history, history); assert.equal(old.profile, 'chosen');
    assert.ok(MOODS.every(m => Number.isFinite(old.moods[m.id])));
});
test('masking preserves inner feelings, and roles go out at their own strength', () => {
    const s = freshState({ moods: { angry: 70, masking_warmth: 60, dominant: 50 } });
    const p = composePrompt(s, 'Alex');
    // The mask hides the anger; it doesn't replace it. Both go out at their own strength.
    assert.match(p, /- strong: angry/); assert.match(p, /- clear: acting warm to hide how they really feel/);
    assert.match(p, /- clear: dominant/);
});
test('prompt carries mixed feelings and escapes character names', () => {
    const s = freshState({ moods: { affectionate: 72, jealous: 46 } });
    const p = composePrompt(s, '<Alex>');
    // Strength words, not numbers; a name can't open or close a tag in the note.
    assert.match(p, /- strong: affectionate/); assert.match(p, /- clear: jealous/); assert.match(p, /‹Alex›/); assert.doesNotMatch(p, /<Alex>/);
    assert.doesNotMatch(p, /Drunk/); s.enabled = false; assert.equal(composePrompt(s, 'Alex'), '');
});
test('expanded catalogue contains all newly requested states', () => {
    const names = 'Adoring|Content|Patient|Relaxed|Cynical|Grounded|Smug|Caring|Disappointed|Yearning|Aloof|Distant|Apprehensive|Hesitant|Delighted|Humble|Narcissistic|Psychopathic|Sociopathic|Maniacal|Deliberate|Argumentative|Assertive|Introverted|Extroverted|Intuitive|Egotistical|Fatherly|Paranoid|Unhinged|God Complexed|Histrionic|Clinical'.split('|');
    for (const name of names) assert.ok(findable.has(name.toLowerCase()), name);
});
test('strict analysis parser rejects malformed or out-of-range responses', () => {
    for (const text of ['oops', '{}', '{"moods":[]}', '{"moods":{"angry":200}}', '{"moods":{"angry":"80"}}', '{"moods":{"fake":80}}']) assert.throws(() => parseAnalysis(text));
    assert.equal(parseAnalysis('```json\n{"moods":{"calm":40},"reason":"A pause."}\n```').moods.calm, 40);
    assert.deepEqual(parseAnalysis('{"moods":{}}').moods, {});
});
test('dynamic smoothing preserves pins, bounds jumps, and decays absent moods', () => {
    const s = freshState({ moods: { angry: 50, calm: 60, hurt: 50 }, pins: { angry: true } });
    const next = blendAnalysis(s, { moods: { angry: 0, playful: 100, calm: 0 } });
    // Pinned stays; each read moves 90% (follow) toward the estimate; a feeling the reader leaves out fades by 5.
    assert.equal(next.angry, 50); assert.equal(next.playful, 90); assert.equal(next.calm, 6); assert.equal(next.hurt, 45);
    s.follow = 10; const slow = blendAnalysis(s, { moods: { playful: 100 } });
    assert.equal(slow.playful, 10, 'a low follow moves slowly'); assert.ok(slow.hurt < 50, 'absent feelings still fade');
});
test('analysis sends bounded visible scene only, without message extras', () => {
    const chat = [{ is_system: true, mes: 'hidden text' }, { name: 'Alex', mes: 'x'.repeat(200), extra: { reasoning: 'private reasoning' } }];
    const data = sceneData(chat, { name: 'Alex', description: 'z'.repeat(9000) }, freshState(), { sceneChars: 100, sceneMessages: 8 });
    assert.equal(data.scene[0].text.length, 100); assert.ok(data.character.notes.length <= 2400, 'the character text is capped');
    assert.doesNotMatch(JSON.stringify(data), /private reasoning|hidden text/);
});
test('editing or swiping scene changes its fingerprint', () => {
    assert.notEqual(fingerprint([{ mes: 'Hello', swipe_id: 0 }]), fingerprint([{ mes: 'Hello', swipe_id: 1 }]));
    assert.notEqual(fingerprint([{ mes: 'Hello' }]), fingerprint([{ mes: 'Goodbye' }]));
});
