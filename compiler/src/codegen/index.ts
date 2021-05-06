import { Syn, SyntaxType } from '../parser/types';
import { GeneratorResult } from './types';
import binaryen from 'binaryen';
import invariant from 'invariant';
import { traverse } from '../common/traverse';
import { TraverseMap } from '../common/types';

export const generatorTypeMap: { [x: string]: binaryen.Type } = {
  i32: binaryen.i32,
  i64: binaryen.i64,
  bool: binaryen.i32,
  f32: binaryen.f32,
  f64: binaryen.f64,
};

// all of this is so hacky and probably deserves to be burned in a fire
export function generate(ast: Syn): GeneratorResult {
  const program = new binaryen.Module();

  const generateFunctionBlock = (func: Syn) => {
    const [args, result, ...body] = func.params;

    const arglist = ((args: Syn): binaryen.Type[] => {
      return args.params
        .map((arg) => {
          return arg.params[1].staticType!;
        })
        .map((arg) => generatorTypeMap[arg]);
    })(args);

    const resultType =
      result.staticType === null
        ? binaryen.none
        : generatorTypeMap[result.staticType!];

    const functionName = func.value!;
  };

  const traverseMap: TraverseMap = {
    [SyntaxType.FunctionDeclaration]: generateFunctionBlock,
  };

  traverse(traverseMap)(ast);

  invariant(
    !!program.validate(),
    'WebAssembly module could not validate, code generation was poor.'
  );

  program.optimize();

  return program;
}
