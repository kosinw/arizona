import { SyntaxNode, SyntaxType } from '../parser/types';

export type TraverseMapFunctor = (
  node: SyntaxNode,
  walk?: (node: SyntaxNode) => SyntaxNode
) => void;

export type TraverseMap = {
  [x in SyntaxType | '*']?: TraverseMapFunctor;
};
