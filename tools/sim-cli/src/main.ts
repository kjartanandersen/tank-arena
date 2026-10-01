import { createMatch, Move } from '@arena/game';

const ticks = Number(process.argv[2] ?? 600);
const match = createMatch();
for (let i = 0; i < ticks; i++) match.step({ move: i % 120 < 60 ? Move.Right : Move.Down });
console.log(JSON.stringify({ ticks: match.world.tick, tank: match.world.tank }));
