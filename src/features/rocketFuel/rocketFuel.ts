import { player } from '@/main';
import { addFeature } from '@/util/feature';
import { formatWhole } from '@/util/format';
import { computed } from '@vue/reactivity';
import Decimal from 'break_eternity.js';
import type { DecimalSource } from 'break_eternity.js';

import type { Feature } from '@/util/feature';

interface RocketFuelData {
  cost: Decimal;
  eff1: Decimal;
  eff2: Decimal;
  eff3: Decimal;
  eff4: Decimal;
  eff5: Decimal;
  bulk: Decimal;
}
function costAtLevel(lvl: DecimalSource) {
  return Decimal.pow(1.6, Decimal.pow(lvl, 1.5)).times(25).floor();
}
export const rocketFuel: Feature<
  RocketFuelData,
  { fuelUp: () => void; bulk: () => void }
> = addFeature('rocketFuel', 4, {
  unl: {
    reached: computed(() => Decimal.gte(player.rockets, 10)),
    desc: computed(
      () => `Reach ${formatWhole(10)} Rockets to unlock Rocket Fuel.`
    ),
  },

  data: {
    cost: computed(() => costAtLevel(player.rocketFuel)),
    bulk: computed(() => {
      if (Decimal.lt(player.rockets, 25)) return Decimal.dZero;
      return Decimal.div(player.rockets, 25)
        .log(1.6)
        .root(1.5)
        .sub(player.rocketFuel)
        .plus(1)
        .max(0)
        .floor();
    }),
    eff1: computed(() =>
      Decimal.lt(player.rocketFuel, 1)
        ? Decimal.dOne
        : Decimal.pow(
            10,
            Decimal.sqrt(player.rocketFuel).times(0.75).plus(0.25)
          )
            .div(20)
            .plus(1)
    ),
    eff2: computed(() =>
      Decimal.lt(player.rocketFuel, 2)
        ? Decimal.dOne
        : Decimal.pow(Math.sqrt(2), Decimal.sub(player.rocketFuel, 1).pow(0.75))
    ),
    eff3: computed(() =>
      Decimal.lt(player.rocketFuel, 3)
        ? Decimal.dOne
        : Decimal.pow(
            Math.pow(2, 0.25),
            Decimal.sub(player.rocketFuel, 2).pow(0.7)
          )
    ),
    eff4: computed(() => Decimal.sub(player.rocketFuel, 2).max(1).root(9)),
    eff5: computed(() =>
      Decimal.pow(1.5, Decimal.sub(player.rocketFuel, 5).max(0).cbrt())
    ),
  },

  receptors: {
    reset: (id) => {
      if (id >= 3) {
        player.rocketFuel = 0;
      }
    },
  },

  actions: {
    bulk: () => {
      if (Decimal.eq(0, rocketFuel.data.bulk.value)) return;
      player.rocketFuel = Decimal.add(
        player.rocketFuel,
        rocketFuel.data.bulk.value
      );
      player.rockets = Decimal.sub(
        player.rockets,
        costAtLevel(
          Decimal.add(player.rocketFuel, rocketFuel.data.bulk.value).sub(1)
        )
      ).max(0);
    },
    fuelUp: () => {
      if (Decimal.lt(player.rockets, rocketFuel.data.cost.value)) return;

      player.rockets = Decimal.sub(player.rockets, rocketFuel.data.cost.value);
      player.rocketFuel = Decimal.add(player.rocketFuel, 1);
    },
  },
});
