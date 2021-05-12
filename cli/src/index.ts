#!/usr/bin/env node

import chalk from 'chalk';
import { promises as fs, existsSync, exists } from 'fs';
import path from 'path';
import { program, Option } from 'commander';
import { compile, CompileResult, CompileOptions } from '@arizona/compiler';
import dedent from 'dedent';

const { version } = require('../package.json');

async function run(entryFile: string) {
  const options = program.opts();

  const compilerOptions: CompileOptions = {
    optimization: {
      level: parseInt(options.optimize),
      debug: options.debug,
      shrinkLevel: parseInt(options.shrink),
    },
    binaryen: {
      noValidate: options.noValidate,
    },
    memory: {
      import: options.memoryImport
    }
  };

  const sourcePath = path.resolve(process.cwd(), entryFile);

  let outFile = options.outFile;
  let textFile = options.textFile;

  if (!existsSync(sourcePath)) {
    console.error(
      `azc: ${chalk.red('error:')} no such file: '${path.basename(sourcePath)}'`
    );
    return;
  }

  const source = (
    await fs.readFile(path.resolve(process.cwd(), entryFile))
  ).toString();

  const result = compile(source, compilerOptions);

  if (!outFile && !textFile) {
    console.log(`\n ${chalk.green(result.text)}`);
  }

  if (outFile) {
    const outPath = path.resolve(process.cwd(), outFile);
    await fs.writeFile(outPath, result.buffer);
  }

  if (textFile) {
    const textPath = path.resolve(process.cwd(), textFile);
    await fs.writeFile(textPath, result.text);
  }
}

async function main() {
  if (!chalk.supportsColor) {
    chalk.level = 0;
  }

  program.exitOverride((err) => {
    if (err.code === 'commander.missingArgument') {
      program.outputHelp();
      console.log('\n');
    }
    process.exit(err.exitCode);
  });

  program
    .name('azc')
    .version(version)
    .arguments('<entryFile>')
    .usage('[options] <entryFile.az>')
    .addOption(
      new Option(
        '-O, --optimize <level>',
        'How much to focus on optimizing code.'
      )
        .choices(['0', '1', '2', '3'])
        .default('0')
    )
    .addOption(
      new Option(
        '-S, --shrink <level>',
        'How much to focus on shrinking binary size.'
      )
        .choices(['0', '1', '2'])
        .default('0')
    )
    .option('--debug', 'Enable debug information in binaries.')
    .option('--sourceMap', 'Enables source map generation.')
    .option('--noValidate', 'Skips Binaryen module validation.')
    .option('--memoryImport', 'Imports the memory from env.memory')
    .option('-o, --outFile <file>', 'Specifies the binary output file (.wasm)')
    .option('-t, --textFile <file>', 'Specifies the text output file (.wat)')
    .description(
      dedent`
            ${chalk.greenBright(`The Arizona Compiler. Version ${version}.`)}

            This program takes in Arizona files and compiles the source into
            WebAssembly programs into stdout or a specified file.

            Visit ${chalk.underline.blue(
              'https://github.com/kosinw/arizona/'
            )} for more information.
            `,
      {
        entryFile: 'Entry Arizona file',
      }
    )
    .action(run);

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(-1);
});
