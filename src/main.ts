import { reactive } from 'vue';
import { checkNextNews, newsMovement } from './flourish/newsticker/newsticker';
import {
  loadSave,
  saveGame,
  startingMetaSave,
  startingSave,
  versionControl,
} from './util/saveload';
import { signal, setupWatchers } from './util/feature';

import type { Save, MetaSave } from './util/saveload';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
export const metaSave: MetaSave = reactive(startingMetaSave());
export const player: Save = reactive(startingSave(0));
export function gameLoop() {
  requestAnimationFrame(gameLoop);

  const currentTime = Date.now();
  const diff = (currentTime - player.lastTime) / 1000;
  player.lastTime = currentTime;

  signal('tick', diff);

  if (player.opts.newsticker) {
    newsMovement.value += diff * 8;
    checkNextNews();
  }
}

export function load() {
  Object.assign(metaSave, loadSave());
  Object.assign(
    player,
    metaSave.saves[metaSave.currentSave] ?? startingSave(metaSave.currentSave)
  );
  versionControl();

  if (!player.opts.offlineTime) player.lastTime = Date.now();

  setupWatchers();
  signal('load', 0);

  gameLoop();

  setInterval(() => {
    if (player.opts.autoSave) saveGame(true, true);
  }, 5000);
}
