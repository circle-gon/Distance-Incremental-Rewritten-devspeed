import { player } from '@/main';
import Decimal from 'break_eternity.js';
import type { DecimalSource } from 'break_eternity.js';
import { addFeature } from '@/util/feature';
import { computed } from 'vue';
import { format, formatWhole } from '@/util/format';
import { basics } from '../basics/basics';

import type { Feature } from '@/util/feature';
import type { ComputedRef } from 'vue';

export enum Automated {
  Ranks,
  Tiers,
}

export const AUTO_COUNT = 2;

type AutoData = Record<
  Automated,
  {
    visible: boolean;
    unl: boolean;
    desc: string;
    power: Decimal;
    upgReq: Decimal;
    canBuyUpg: boolean;
    masteryDesc: string;
    bulkBuy: Decimal;
  }
>;

interface AutoActions {
  upgrade: (type: Automated) => void;
  master: (type: Automated) => void;
  toggle: (type: Automated) => void;
  bulk: (type: Automated) => void;
}

type AutoExtensions = {
  constants: Record<
    Automated,
    {
      upgResName: string;
      masteryReq: number | string;
    }
  >;
};
const costs = {
  [Automated.Ranks]: (lvl: DecimalSource) =>
    Decimal.pow(2, Decimal.pow(lvl, 2)).times(1e3),
  [Automated.Tiers]: (lvl: DecimalSource) =>
    Decimal.pow(3, Decimal.pow(lvl, 2)).times(1e4),
};
export function generateInitialAutoState() {
  return new Array(AUTO_COUNT)
    .fill({
      unl: false,
      active: false,
      mastered: false,
      level: 0,
    })
    .reduce((acc, cur, i) => {
      acc[i as Automated] = { ...cur };
      return acc;
    }, {} as Record<Automated, { unl: boolean; active: boolean; mastered: boolean; level: number }>);
}

export const auto: Feature<
  AutoData,
  AutoActions,
  AutoExtensions,
  {
    [key in keyof AutoData]: {
      [key2 in keyof AutoData[key]]: ComputedRef<AutoData[key][key2]>;
    };
  }
> = addFeature('auto', 5, {
  unl: {
    reached: computed(() => Decimal.gte(player.rockets, 1e4)),
    desc: computed(
      () => `Reach ${formatWhole(1e4)} Rockets to unlock Automation.`
    ),
  },

  data: {
    [Automated.Ranks]: {
      visible: computed(() => player.featuresUnl.includes('auto')),
      unl: computed(() => player.featuresUnl.includes('auto')),
      desc: computed(() => `Nothing :)`),
      power: computed(() =>
        Decimal.sub(
          1,
          Decimal.div(
            1,
            Decimal.add(player.auto[Automated.Ranks].level, 1).log(4).plus(1)
          )
        )
      ),
      upgReq: computed(() =>
        costs[Automated.Ranks](player.auto[Automated.Ranks].level)
      ),
      bulkBuy: computed(() => {
        if (Decimal.lt(player.rockets, 1e3)) return Decimal.dZero;
        return Decimal.div(player.rockets, 1e3)
          .log(2)
          .sqrt()
          .sub(player.auto[Automated.Ranks].level)
          .plus(1)
          .floor();
      }),
      canBuyUpg: computed(() =>
        Decimal.gte(player.rockets, auto.data[Automated.Ranks].upgReq.value)
      ),
      masteryDesc: computed(
        () => `Reduce Rank requirement base by ${format(0.1)}.`
      ),
    },
    [Automated.Tiers]: {
      visible: computed(() => player.featuresUnl.includes('auto')),
      unl: computed(() => Decimal.gte(player.rockets, 1e5)),
      desc: computed(() => `${formatWhole(1e5)} Rockets`),
      power: computed(() =>
        Decimal.sub(
          1,
          Decimal.div(
            1,
            Decimal.add(player.auto[Automated.Tiers].level, 1).log(9).plus(1)
          )
        )
      ),
      upgReq: computed(() =>
        costs[Automated.Tiers](player.auto[Automated.Tiers].level)
      ),
      bulkBuy: computed(() => {
        if (Decimal.lt(player.rockets, 1e4)) return Decimal.dZero;
        return Decimal.div(player.rockets, 1e4)
          .log(3)
          .sqrt()
          .sub(player.auto[Automated.Tiers].level)
          .plus(1)
          .floor()
      }),
      canBuyUpg: computed(() =>
        Decimal.gte(player.rockets, auto.data[Automated.Tiers].upgReq.value)
      ),
      masteryDesc: computed(
        () => `Decrease Tier requirement by ${formatWhole(20)}%.`
      ),
    },
  },

  constants: {
    [Automated.Ranks]: {
      upgResName: 'Rockets',
      masteryReq: 1e14,
    },
    [Automated.Tiers]: {
      upgResName: 'Rockets',
      masteryReq: 2.5e15,
    },
  },

  receptors: {
    tick: () => {
      if (player.auto[Automated.Ranks].active) {
        const bulk = Decimal.sub(basics.data.rankTarget.value, player.rank)
          .times(auto.data[Automated.Ranks].power.value)
          .max(0)
          .floor();
        player.rank = Decimal.add(player.rank, bulk);
      }
      if (player.auto[Automated.Tiers].active) {
        const bulk = Decimal.sub(basics.data.tierTarget.value, player.tier)
          .times(auto.data[Automated.Tiers].power.value)
          .max(0)
          .floor();
        player.tier = Decimal.add(player.tier, bulk);
      }
    },

    reset: (id) => {
      if (id >= 3) {
        player.auto = generateInitialAutoState();
      }
    },
  },

  actions: {
    upgrade: (type) => {
      if (Decimal.lt(player.rockets, auto.data[type].upgReq.value)) return;

      player.rockets = Decimal.sub(
        player.rockets,
        auto.data[type].upgReq.value
      );
      player.auto[type].level = Decimal.add(player.auto[type].level, 1);
    },
    bulk: (type) => {
      const auto1 = auto.data[type];
      if (Decimal.eq(auto1.bulkBuy.value, 0)) return;
      player.auto[type].level = Decimal.add(
        player.auto[type].level,
        auto1.bulkBuy.value
      );
      player.rockets = Decimal.sub(
        player.rockets,
        costs[type](
          Decimal.add(player.auto[type].level, auto1.bulkBuy.value).sub(1)
        )
      ).max(0);
    },
    master: (type) => {
      if (
        player.auto[type].mastered ||
        Decimal.lt(player.distance, auto.constants[type].masteryReq)
      )
        return;

      player.distance = Decimal.sub(
        player.distance,
        auto.constants[type].masteryReq
      );
      player.auto[type].mastered = true;
    },

    toggle: (type) => {
      if (Decimal.eq(player.auto[type].level, 0)) return;

      player.auto[type].active = !player.auto[type].active;
    },
  },

  watchers: new Array(AUTO_COUNT).fill({}).map((_, i) => {
    const a = i as Automated;
    return () => ({
      toWatch: auto.data[a].unl,
      callback: (unl) => {
        if (!player.auto[a].unl && unl) player.auto[a].unl = true;
      },
    });
  }),
});
