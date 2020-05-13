import * as helpers from '@redred/helpers/server';
import * as t from 'io-ts';
import * as types from '../../types';
import Container from '@redred/pages/private/Container';
import addMessage from './addMessage';
import temporaryOutputFileContainerByPath from './temporaryOutputFileContainerByPath';
import path from 'path';
import { OUTPUT_FILE_NAME } from './readOutputFile';

type CompilerInputFileContainer = t.TypeOf<
  typeof types.CompilerInputFileContainer
>;

type CompilerOutputFile = t.TypeOf<typeof types.CompilerOutputFile>;

let $$: [string, Container][] = [];

function afterCompilation(
  inputFileContainer: CompilerInputFileContainer,
  test: () => void,
  version: string
) {
  try {
    const container = temporaryOutputFileContainerByPath(
      inputFileContainer.path
    );

    if (container) {
      if (
        container.filesToCompile.length ===
        inputFileContainer.filesToCompile.length
      ) {
        const $ = path.resolve(container.path, 'public/server.js');

        delete __non_webpack_require__.cache[
          __non_webpack_require__.resolve($)
        ];

        const compiledContainer: Container = __non_webpack_require__($).default;

        compiledContainer.filesToCompile = container.filesToCompile;
        compiledContainer.path = container.path;
        compiledContainer.version = version;

        for (let i = 0; i < compiledContainer.pages.length; i += 1) {
          const compiledContainerPage = compiledContainer.pages[i];

          compiledContainerPage.context = {
            ...compiledContainerPage.context,
            container: compiledContainer,
          };

          compiledContainerPage.toHTML();

          if (typeof compiledContainerPage.html === 'string') {
            helpers.writeFile(
              `${container.path}/public/${compiledContainerPage.name}.html`,
              compiledContainerPage.html
            );
          }

          delete compiledContainerPage.context.container;

          addMessage(
            `The file "${container.path}/public/${compiledContainerPage.name}.html" was written.`
          );
        }

        const hihi = () => {
          for (let i = 0; i < $$.length; i += 1) {
            if ($$[i][0] === container.path) {
              $$[i][1] = compiledContainer;

              return;
            }
          }

          $$ = [...$$, [container.path, compiledContainer]];
        };

        hihi();

        const outputFile: CompilerOutputFile = { containers: [] };

        for (let i = 0; i < $$.length; i += 1) {
          const x = $$[i];

          outputFile.containers = [...outputFile.containers, x[1].toJSON()];
        }

        helpers.writeFile(OUTPUT_FILE_NAME, `${JSON.stringify(outputFile)}\n`);

        addMessage(`The output file "${OUTPUT_FILE_NAME}" was written.`);

        test();
      }
    }
  } catch (error) {
    addMessage([error.message, error.stack]);
  }
}

export default afterCompilation;
