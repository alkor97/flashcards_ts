import {rmSync} from 'fs';
import {DIST} from './constants.js';

rmSync(DIST, {recursive: true, force: true});
