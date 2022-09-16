#!/usr/bin/env node
import * as fs from 'fs';
import * as chalk from 'chalk';
import * as minimist from 'minimist';
import { SourceMapConsumer } from 'source-map';
import { dirname, join, isAbsolute } from 'path';

const argv = minimist(process.argv.slice(2));
const projectNameInput = argv._[0];
const mapInput = argv._[1];

if (!projectNameInput || !mapInput) {
  console.log();
  console.log(
    chalk.white('Usage: unpack'),
    chalk.green('<project-directory> <path-to-map-file>'),
  );
  console.log();
  console.log(
    chalk.blue(
      '*Note:   Minified file should be placed under path specified in .map file.',
    ),
  );
  console.log();
  process.exit();
}

const pathToProject = join(process.cwd(), projectNameInput);
const pathToMap = isAbsolute(mapInput)
  ? mapInput
  : join(process.cwd(), mapInput);

if (fs.existsSync(pathToProject)) {
  console.log();
  console.log(chalk.red(`Project folder already exists at: ${pathToProject}`));
  console.log();
  process.exit(1);
}

if (!fs.existsSync(pathToMap)) {
  console.log();
  console.log(chalk.red(`Can't find map file under : ${pathToMap}`));
  console.log();
  process.exit(1);
}

try {
  const mapFile = fs.readFileSync(pathToMap, 'utf8');
  SourceMapConsumer.with(mapFile, null, (consumer: SourceMapConsumer) => {
    console.log(chalk.green(`Unpacking 🛍  your source maps 🗺`));
    const sources = (consumer as any).sources;

    sources.forEach((source: string) => {
      const WEBPACK_SUBSTRING_INDEX = 11;
      const content = consumer.sourceContentFor(source) as string;

      let relativePath = source.substring(WEBPACK_SUBSTRING_INDEX);

      const isExternal = relativePath.startsWith('external')
        || relativePath.startsWith('webpack')
        || relativePath.startsWith('node_modules');

      if (isExternal) {
        return;
      }

      const fileExtension = relativePath.split('.').pop();

      if (fileExtension?.includes('?')) {
        relativePath = relativePath.split('?')[0];
      }

      const filePath = `${process.cwd()}/${projectNameInput}/${relativePath}`;

      console.log(chalk.green(`Unpacking ${filePath}`));

      fs.mkdirSync(dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    });
    console.log(chalk.green('🎉  All done! Enjoy exploring your code 💻'));
  });
} catch (err) {
  console.log(chalk.red('Oops! Something is wrong with the source map'));
  console.log(
    chalk.red(
      'Make sure .min.js is correctly placed under the path specified in .map file',
    ),
  );
  console.log('\n', err);
  process.exit(1);
}
