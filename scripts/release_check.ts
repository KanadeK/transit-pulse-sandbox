import { execFileSync, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const runNpm = (command: string) => process.platform === 'win32'
  ? spawnSync('cmd.exe', ['/d', '/s', '/c', `npm run ${command}`], { stdio: 'inherit' })
  : spawnSync('npm', ['run', command], { stdio: 'inherit' });
const output = (args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (output(['status', '--short'])) throw new Error('Release check requires a clean worktree.');
if (!(await readFile('package.json', 'utf8')).includes('"version": "0.1.0"')) throw new Error('Package version is not v0.1.0.');
if (!(await readFile('CHANGELOG.md', 'utf8')).includes('## v0.1.0')) throw new Error('CHANGELOG does not include v0.1.0.');
if (!output(['log', '--format=%B']).includes('Co-authored-by') && output(['log', '--format=%an <%ae>']).split('\n').every((author) => author === 'KanadeK <121669563+KanadeK@users.noreply.github.com>')) {
  // Author history matches the authenticated release identity recorded in this repository.
} else throw new Error('Unexpected commit author or co-author trailer.');
for (const command of ['lint', 'typecheck', 'test:coverage', 'test:e2e', 'build', 'package']) {
  if (runNpm(command).status !== 0) throw new Error(`npm run ${command} failed.`);
}
const grep = (expression: string) => spawnSync('git', ['grep', '-nEi', expression, '--', ':!docs/ROADMAP.md'], { encoding: 'utf8' });
const forbiddenResult = grep('TODO|FIXME|NotImplemented|placeholder|coming soon|lorem ipsum');
if (forbiddenResult.status !== 0 && forbiddenResult.status !== 1) throw new Error(forbiddenResult.stderr || 'Unfinished-marker scan failed.');
const forbidden = forbiddenResult.stdout.trim();
if (forbidden) throw new Error(`Forbidden unfinished marker found:\n${forbidden}`);
const secretResult = spawnSync('git', ['grep', '-nEi', 'AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|BEGIN (RSA|OPENSSH) PRIVATE KEY', '--', '.'], { encoding: 'utf8' });
if (secretResult.status !== 0 && secretResult.status !== 1) throw new Error(secretResult.stderr || 'Secret scan failed.');
const secrets = secretResult.stdout.trim();
if (secrets) throw new Error(`Potential secret found:\n${secrets}`);
console.log('Release checks passed.');
