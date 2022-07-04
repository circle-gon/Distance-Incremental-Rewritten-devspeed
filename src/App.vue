<template>
  <div class="left">
    <div class="scrollable">
      <div>
        Devspeed: {{ format(player.devSpeed) }}<br />
        Input devSpeed: <input type="input" v-model="devSpeed" />
        <button @click="setDevSpeed">Set devspeed</button>
      </div>
      <Basics />
      <div>
        <button
          v-if="player.tab !== null"
          @click="player.tab = null"
          class="btn min"
        >
          Hide
        </button>
        <Options v-if="player.tab === 'Options'" />
        <Stats v-if="player.tab === 'Stats'" />
        <Achs v-if="player.tab === 'Achievements'" />
        <Rockets v-if="player.tab === 'Rockets'" />
        <Auto v-if="player.tab === 'Automation'" />
      </div>
    </div>
  </div>
  <div class="right">
    <Tabs />
  </div>
</template>

<script setup lang="ts">
import { load, player } from './main';
import { format } from './util/format';
import Decimal from 'break_eternity.js';
import { ref } from 'vue';
import Tabs from './flourish/tabs/tabs.vue';
import Options from './flourish/options/options.vue';
import Stats from './flourish/other/stats.vue';
import Achs from './features/achs/achs.vue';
import Basics from './features/basics/basics.vue';
import Rockets from './features/rockets/rockets.vue';
import Auto from './features/auto/auto.vue';

load();
const devSpeed = ref('');
function setDevSpeed() {
  const num = new Decimal(devSpeed.value);
  console.log(Decimal.isFinite(num), Decimal.isNaN(num));
  if (Decimal.isNaN(num) || !Decimal.isFinite(num)) return;
  player.devSpeed = devSpeed.value;
}
</script>

<style>
* {
  color: #989a9e;
  margin: 0 auto;
  text-align: center;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  transition-duration: 0.2s;
  cursor: default;
  user-select: none;
  line-height: 1em;
}

input {
  color: black;
}
body {
  background-color: rgb(28, 28, 28) !important;
}

#app {
  display: flex;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 150px;
  max-height: 100vh;
}

.left {
  flex: 4;
  min-height: 100vh;
  height: 100vh;
}

.right {
  flex: 1;
  z-index: 5;
  border-left: thick solid hsl(0, 0%, 30%);
  min-height: 100vh;
}

.band {
  width: 100%;
  min-height: 75px;
}

.lb {
  background-color: hsl(0, 0%, 20%);
}

.btn.min {
  float: left;
}
</style>
