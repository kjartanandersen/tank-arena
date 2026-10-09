import { createMatch, encodeAim, Move, TRAINING_GROUND } from '@arena/game';

// Usage: pnpm sim [ticks=600] [seed=1]
const ticks = Number(process.argv[2] ?? 600);
const seed = Number(process.argv[3] ?? 1);

const match = createMatch({ level: TRAINING_GROUND, seed });
for (let i = 0; i < ticks; i++) {
  match.step({ move: i % 240 < 120 ? Move.Right : Move.Down, aim: encodeAim(i / 60) });
}

const hash = match.hash().toString(16).padStart(8, '0');
console.log(JSON.stringify({ tick: match.world.tick, seed, hash, tanks: match.world.tanks }));
