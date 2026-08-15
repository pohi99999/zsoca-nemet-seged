import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest', () => {
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');

  it('should exist in public directory', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it('should have valid JSON structure with required PWA fields', () => {
    const rawData = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(rawData);

    expect(manifest.name).toBe('Zsóca Német Segéd');
    expect(manifest.short_name).toBe('Német Segéd');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBeDefined();
    expect(manifest.theme_color).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
