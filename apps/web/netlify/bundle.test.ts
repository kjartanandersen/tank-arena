import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { zipFunction } from '@netlify/zip-it-and-ship-it';
import { afterAll, describe, expect, it } from 'vitest';
import { HealthResponse } from '@arena/contracts';

const run = promisify(execFile);
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const functionsDir = fileURLToPath(new URL('./functions/', import.meta.url));
const outDirs: string[] = [];

afterAll(async () => {
  await Promise.all(outDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

/** Bundles one function the way Netlify's build does, then calls it in a fresh Node process. */
async function bundleAndCall(file: string, url: string): Promise<{ status: number; body: string }> {
  // Outside the repo on purpose: Node must only find what Netlify would ship, not the repo's node_modules.
  const out = await mkdtemp(join(tmpdir(), 'arena-fn-'));
  outDirs.push(out);
  const result = await zipFunction(join(functionsDir, file), out, {
    archiveFormat: 'none',
    basePath: repoRoot,
    repositoryRoot: repoRoot,
    config: { '*': {} },
  });
  if (!result) throw new Error(`zip-it-and-ship-it did not recognise ${file} as a function`);

  const name = file.replace(/\.ts$/, '.mjs');
  const files = await readdir(result.path, { recursive: true });
  const main = files.find((f) => f.split(sep).join('/').endsWith(`netlify/functions/${name}`));
  if (!main) throw new Error(`bundle for ${file} has no ${name}`);

  const script = `
    const { default: handler } = await import(${JSON.stringify(pathToFileURL(join(result.path, main)).href)});
    const res = await handler(new Request(${JSON.stringify(url)}));
    console.log(JSON.stringify({ status: res.status, body: await res.text() }));`;
  const { stdout } = await run(process.execPath, ['--input-type=module', '-e', script], {
    cwd: out,
  });
  return JSON.parse(stdout) as { status: number; body: string };
}

describe('Netlify function bundles', () => {
  it('api.ts serves /api/health when deployed', async () => {
    const { status, body } = await bundleAndCall('api.ts', 'http://localhost/api/health');
    expect(status).toBe(200);
    expect(HealthResponse.parse(JSON.parse(body)).ok).toBe(true);
  });
});
