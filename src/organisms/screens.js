/* The two screens, in a dot-matrix pixel font and nothing else: the synth's reads MY PROJECTS, the remote's reads CONTACT.
   Drawn once (they don't change). drawScreens still runs every frame to hand the music level to the speaker. */
import { scope } from '../core/audio.js';
import { pixelScreen } from '../atoms/pixelfont.js';
import { scr } from './synth.js';
import { rs } from './remote.js';

export const SCREEN_COL = '#ff5d1a';
pixelScreen(scr.x, 800, 380, 'My Projects', SCREEN_COL, 46); scr.t.needsUpdate = true;
pixelScreen(rs.x, 300, 200, 'Contact', SCREEN_COL, 26); rs.t.needsUpdate = true;

/* returns the music level (0..1) so the speaker can pulse with it */
export function drawScreens() { return scope().level }
