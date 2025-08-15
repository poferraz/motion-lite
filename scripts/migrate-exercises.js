import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../public/ex-library/exercises.json');
const backupPath = filePath + '.bak';

// Mapping for bodyPart based on primaryMuscles
const muscleToBodyPart = {
  abdominals: 'core',
  abductors: 'lower body',
  adductors: 'lower body',
  biceps: 'upper body',
  calves: 'lower body',
  chest: 'upper body',
  forearms: 'upper body',
  glutes: 'lower body',
  hamstrings: 'lower body',
  lats: 'upper body',
  'lower back': 'core',
  'middle back': 'upper body',
  neck: 'upper body',
  quadriceps: 'lower body',
  shoulders: 'upper body',
  traps: 'upper body',
  triceps: 'upper body',
};

function getBodyPart(primaryMuscles) {
  if (!primaryMuscles || !primaryMuscles.length) return null;
  // If all muscles map to the same body part, use that; else 'full body'
  const parts = new Set(primaryMuscles.map(m => muscleToBodyPart[m] || null).filter(Boolean));
  if (parts.size === 1) return [...parts][0];
  if (parts.size > 1) return 'full body';
  return null;
}

async function migrate() {
  const raw = await readFile(filePath, 'utf8');
  const data = JSON.parse(raw);

  // Backup original
  await writeFile(backupPath, raw);

  const migrated = data.map(ex => {
    // Remove images
    const { images, ...rest } = ex;
    // Auto-populate bodyPart
    const bodyPart = getBodyPart(rest.primaryMuscles);
    // Set exerciseType to 'main' by default
    const exerciseType = 'main';
    return {
      ...rest,
      bodyPart,
      exerciseType,
      duration: null,
      repsRange: null,
      setsRange: null,
      videoUrl: null,
      tags: [],
      source: 'library',
    };
  });

  await writeFile(filePath, JSON.stringify(migrated, null, 2));
  console.log('Migration complete. Backup saved as exercises.json.bak');
}

migrate();
