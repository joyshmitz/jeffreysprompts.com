import { readFileSync, writeFileSync } from 'fs';
import { Glob } from 'bun';

const glob = new Glob('apps/web/src/**/*.test.{ts,tsx}');

for (const file of glob.scanSync('.')) {
  let content = readFileSync(file, 'utf8');
  if (content.includes('globalThis.fetch =') || content.includes('globalThis.fetch as ReturnType')) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('globalThis.fetch =') && (i === 0 || (!lines[i-1].includes('ts-ignore') && !lines[i-1].includes('ts-expect-error')))) {
         // preserve indentation
         const indent = lines[i].match(/^\s*/)?.[0] || '';
         lines[i] = `${indent}// @ts-ignore\n${lines[i]}`;
      }
    }
    
    let newContent = lines.join('\n');
    newContent = newContent.replaceAll(
      '(globalThis.fetch as ReturnType<typeof vi.fn>)',
      '((globalThis.fetch as unknown) as ReturnType<typeof vi.fn>)'
    );
    newContent = newContent.replaceAll(
      '(globalThis.fetch as Mock<Procedure>)',
      '((globalThis.fetch as unknown) as ReturnType<typeof vi.fn>)'
    );
    
    if (newContent !== content) {
      writeFileSync(file, newContent, 'utf8');
      console.log('Fixed', file);
    }
  }
}
