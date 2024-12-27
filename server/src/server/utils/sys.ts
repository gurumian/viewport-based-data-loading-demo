import * as fs from 'fs';
import * as path from 'path';

function getFiles(
  dir: string,
  baseDir: string,
  files: string[] = []
): string[] {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, baseDir, files);
    } else {
      const relativePath = path.relative(baseDir, name);
      files.push(relativePath);
    }
  }
  return files;
}

function mkdir(path: string) {
  console.log(`path ${path}, ${path.length}`);
  for (var at = 0; ; ++at) {
    at = path.indexOf("/", at);
    if (at == 0) continue;

    if (at == -1) at = path.length;

    let tmp = path.slice(0, at);

    if (!fs.existsSync(tmp)) {
      fs.mkdirSync(tmp);
    }

    if (at == path.length) break;
  }
}

export { mkdir, getFiles };
