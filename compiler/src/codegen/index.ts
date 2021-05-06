import { Syn, SyntaxType } from '../parser/types';
import { GeneratorResult } from './types';
import binaryen from 'binaryen';
import invariant from 'invariant';
import { traverse } from '../common/traverse';
import { TraverseMap } from '../common/types';

export function generate(ast: Syn): GeneratorResult {
  const program = new binaryen.Module();

  const traverseMap: TraverseMap = {
    [SyntaxType.FunctionDeclaration]: (node: Syn) => {
      const functionName = node.value;

      console.log(functionName);
    },
  };

  traverse(traverseMap)(ast);

  invariant(
    !!program.validate(),
    'WebAssembly module could not validate, code generation was poor.'
  );

  program.optimize();

  return program;
}
