import { player } from '@/main';
import Decimal from 'break_eternity.js';
import type { DecimalSource } from 'break_eternity.js';
import { addFeature } from '@/util/feature';
import { hasAch } from '../achs/achs';
import { computed } from 'vue';
import { format, formatWhole } from '@/util/format';
import { basics } from '../basics/basics';
import { rockets } from '../rockets/rockets';

import type { Feature } from '@/util/feature';
import type { ComputedRef } from 'vue';

export enum Automated {
  Ranks,
  Tiers,
  Rockets,
}

export const AUTO_COUNT = 3;

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
  [Automated.Rockets]: (lvl: DecimalSource) =>
    Decimal.pow(1.5, Decimal.pow(lvl, 2)).times(500),
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
          .max(0)
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
          .max(0)
          .floor();
      }),
      canBuyUpg: computed(() =>
        Decimal.gte(player.rockets, auto.data[Automated.Tiers].upgReq.value)
      ),
      masteryDesc: computed(
        () => `Decrease Tier requirement by ${formatWhole(20)}%.`
      ),
    },
    [Automated.Rockets]: {
      visible: computed(() => hasAch(17)),
      unl: computed(() => Decimal.gte(player.timeReversal.cubes, 1e3)),
      desc: computed(() => `${formatWhole(1e3)} Time Cubes`),
      power: computed(() =>
        Decimal.div(player.auto[Automated.Rockets]?.level ?? 0, 80)
          .plus(1)
          .log(4)
          .min(1)
      ),
      upgReq: computed(() =>
        costs[Automated.Rockets](player.auto[Automated.Rockets].level)
      ),
      canBuyUpg: computed(() =>
        Decimal.gte(
          player.timeReversal.cubes,
          auto.data[Automated.Rockets].upgReq.value
        )
      ),
      bulkBuy: computed(() => {
        if (Decimal.lt(player.timeReversal.cubes, 1e4)) return Decimal.dZero;
        return Decimal.div(player.timeReversal.cubes, 500)
          .log(1.5)
          .sqrt()
          .sub(player.auto[Automated.Rockets].level)
          .plus(1)
          .max(0)
          .floor();
      }),
      masteryDesc: computed(() => `Multiply Rocket gain by ${format(2.5)}.`),
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
    [Automated.Rockets]: {
      upgResName: 'Time Cubes',
      masteryReq: '1e40',
    },
  },

  receptors: {
    tick: () => {
      if (player.auto[Automated.Ranks].active) {
        player.rank = Decimal.max(player.rank, basics.data.rankTarget.value);
      }
      if (player.auto[Automated.Tiers].active) {
        player.tier = Decimal.max(player.tier, basics.data.tierTarget.value);
      }
      if (player.auto[Automated.Rockets].active) {
        player.rockets = Decimal.mul(
          rockets.data.resetGain.value,
          player.devSpeed
        );
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
      switch (auto.constants[type].upgResName) {
        case 'Time Cubes':
          if (
            Decimal.lt(player.timeReversal.cubes, auto.data[type].upgReq.value)
          )
            return;

          player.timeReversal.cubes = Decimal.sub(
            player.timeReversal.cubes,
            auto.data[type].upgReq.value
          );
          break;

        default:
          if (Decimal.lt(player.rockets, auto.data[type].upgReq.value)) return;

          player.rockets = Decimal.sub(
            player.rockets,
            auto.data[type].upgReq.value
          );
      }
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
    return () => {
      if (player.auto[a] === undefined) {
        player.auto[a] = {
          unl: false,
          active: false,
          mastered: false,
          level: 0,
        };
      }
      if (!player.auto[a].unl && auto.data[a].unl.value)
        player.auto[a].unl = true;
    };
  }),
});
