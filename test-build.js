import { execSync } from 'child_process';
try {
  const output = execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });
  console.log(output);
} catch (err) {
  console.error('Error:', err.message);
  console.error('Stdout:', err.stdout);
  console.error('Stderr:', err.stderr);
}
