import {copyFileSync, mkdirSync, rmSync} from 'fs';
import {DIST} from './constants.js';

rmSync(DIST, {recursive: true, force: true});
mkdirSync(DIST);
copyFileSync('./src/data/pol-esp.tsv', DIST + '/pol-esp.tsv');
