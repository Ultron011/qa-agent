import { readFile } from 'node:fs/promises';
export function parseExpectations(md) {
    const out = [];
    let category = '';
    for (const line of md.split('\n')) {
        const h = line.match(/^##\s+(.+)$/);
        if (h) {
            category = h[1].trim();
            continue;
        }
        const b = line.match(/^[-*]\s+(.+)$/);
        if (b && category)
            out.push({ category, description: b[1].trim() });
    }
    return out;
}
export async function loadExpectations(filePath) {
    const md = await readFile(filePath, 'utf8');
    return parseExpectations(md);
}
