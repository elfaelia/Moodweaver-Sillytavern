// Venue music (1.88.1): places where music is playing in the room (a club, a jazz bar, a cocktail bar, a dance, a party,
// a gig) switch the music from film score to what the characters can hear. Songs come from your playlists when their
// Spotify genres fit, then from Spotify search (by genre and the story's era, or the band named at a gig).
import { plainStory } from './scene-words.js';

// id: { label for Claude, place facts, words, genres that fit (matched inside Spotify's genre names), search genres }
export const VENUES = [
    { id: 'jazz', label: 'the band in the jazz club', places: ['jazz_club'], words: /\b(?:jazz (?:club|bar|band|trio|quartet|singer|joint)|speakeasy|piano bar|supper club|lounge singer|torch singer)\b/i,
        genres: ['jazz', 'swing', 'blues', 'bebop', 'big band', 'lounge', 'bossa nova', 'torch', 'crooner'], search: ['jazz', 'vocal jazz', 'swing', 'blues', 'cool jazz', 'bossa nova'] },
    { id: 'club', label: 'the DJ in the club', places: [], words: /\b(?:night ?club|the club\b|dance ?floor|rave|the dj\b|dj booth|strobe lights?|bass (?:thumps|pounds|drops))\b/i,
        genres: ['dance', 'house', 'techno', 'electro', 'edm', 'disco', 'trance', 'club', 'electronic', 'synthpop', 'eurodance'], search: ['dance', 'house', 'electronic', 'disco', 'techno', 'dance pop'] },
    { id: 'cocktail', label: 'the bar\u2019s playlist', places: [], words: /\b(?:cocktail (?:bar|lounge)|rooftop bar|wine bar|hotel bar|martinis?|cosmopolitans?|mojitos?|happy hour)\b/i,
        genres: ['pop', 'dance pop', 'indie pop', 'synthpop', 'disco', 'r&b', 'neo soul', 'funk'], search: ['pop', 'dance pop', 'indie pop', 'disco', 'r&b'] },
    { id: 'dance', label: 'the band at the dance', places: ['dance_hall'], words: /\b(?:dance hall|ballroom|sock hop|prom\b|school dance|homecoming dance|the dance\b|slow dance|wedding reception)\b/i,
        genres: ['rock-and-roll', 'rockabilly', 'doo-wop', 'swing', 'big band', 'soul', 'motown', 'pop', 'rhythm and blues'], search: ['rock-and-roll', 'doo-wop', 'soul', 'motown', 'swing', 'pop'] },
    { id: 'party', label: 'the music at the party', places: ['party'], words: /\b(?:house party|frat party|(?:the|a|this) party\b|keg|vortex club)\b/i,
        genres: ['pop', 'dance', 'hip hop', 'rap', 'indie', 'rock', 'electro', 'punk'], search: ['pop', 'dance', 'hip hop', 'indie rock', 'electro'] },
    { id: 'gig', label: 'the band on stage', places: [], words: /\b(?:concert|gig\b|the show\b|mosh pit|crowd surf\w*|on stage|the stage\b|the band (?:plays|played|kicks|launches|tears)|front row|encore|soundcheck)\b/i,
        genres: ['rock', 'punk', 'indie', 'alternative', 'metal', 'grunge'], search: ['rock', 'punk', 'alternative rock', 'indie rock'] },
];
export const VENUE_BY_ID = Object.fromEntries(VENUES.map(v => [v.id, v]));
const LEFT = /\b(?:(?:leave|left|leaving|walk(?:s|ed)? out of|step(?:s|ped)? out of|outside) the (?:club|bar|party|venue|concert|gig|show|dance)|the (?:music|band|show|set|concert) (?:stops|stopped|ends|ended|is over)|last song)\b/i;

// The band or artist named at a gig: "a Descendents show", "seeing the Descendents", "the Misfits concert".
const NAMED = [
    /\b(?:see(?:ing)?|saw|watch(?:ing|ed)?|at|to|for) (?:a |an |the )?((?:[A-Z][\w'\u2019&.!-]*)(?: (?:[A-Z][\w'\u2019&.!-]*|of|the|and|&)){0,4}) (?:concert|gig|show|set)\b/,
    /\b(?:concert|gig|show|set) (?:by|from|of) (?:the )?((?:[A-Z][\w'\u2019&.!-]*)(?: (?:[A-Z][\w'\u2019&.!-]*|of|the|and|&)){0,4})/,
    /\b((?:[A-Z][\w'\u2019&.!-]*)(?: (?:[A-Z][\w'\u2019&.!-]*|of|the|and|&)){0,4}) (?:take|took|takes|hit|hits) the stage\b/,
];
const NOT_NAMES = /^(?:The|A|An|His|Her|Their|This|That|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Tonight|Last|First|School|Prom|Halloween|Christmas|New Year)$/;
export function artistIn(text) {
    const t = plainStory(text);
    for (const re of NAMED) { const m = t.match(re); if (m && m[1] && !NOT_NAMES.test(m[1].trim())) return m[1].replace(/^the\s+/i, '').trim(); }
    return '';
}

// Which venue the scene is in: a place fact first, else the newest of the last few messages to name one. A message that
// has them leaving (or the music stopping) ends it. texts: newest first. Returns { id, artist } or null.
export function venueNow(places = new Set(), texts = []) {
    for (const v of VENUES) if (v.places.some(p => places.has(p))) return { id: v.id, artist: v.id === 'gig' ? texts.slice(0, 4).map(artistIn).find(Boolean) ?? '' : '' };
    for (const t of texts.slice(0, 4)) {
        if (LEFT.test(t)) return null;
        const v = VENUES.find(x => x.words.test(t)); if (!v) continue;
        const artist = artistIn(t) || (v.id === 'gig' ? texts.slice(0, 4).map(artistIn).find(Boolean) ?? '' : '');
        return { id: artist ? 'gig' : v.id, artist };
    }
    return null;
}
// Your songs whose Spotify genres fit the venue.
export const fitsVenue = (genres = [], venue) => (genres ?? []).some(g => VENUE_BY_ID[venue]?.genres.some(x => String(g).toLowerCase().includes(x)));
// Spotify search lines: the artist, or the venue's genres within the story's era.
export function searchesFor(venue, artist = '', eraEnd = 0) {
    if (artist) return [`artist:"${artist}"`, artist];
    const years = eraEnd ? ` year:${Math.max(1900, eraEnd - 25)}-${eraEnd}` : '';
    return (VENUE_BY_ID[venue]?.search ?? []).map(g => `genre:"${g}"${years}`);
}
// The same artist, loosely: "the Descendents" and "Descendents", any of a track's artists.
const bare = x => String(x ?? '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const artistMatch = (artists, name) => { const n = bare(name); return Boolean(n) && String(artists ?? '').split(/,\s*/).some(a => bare(a) === n); };
