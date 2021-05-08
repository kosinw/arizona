import { SyntaxNode } from '../parser/types';
import { TraverseMap } from './types';

// Pre-order AST walker
export const traverse = (map: TraverseMap) => {
  const walk = (node: SyntaxNode) => {
    if (node === null) {
      return node;
    }
    const { params } = node;
    const mappingFunction = (() => {
      if ('*' in map && typeof map['*'] === 'function') {
        return map['*'];
      }
      if (node.type in map && typeof map[node.type] === 'function') {
        return map[node.type];
      }
      return () => node;
    })();
    if (mappingFunction!.length === 2) {
      mappingFunction!(node, walk);
      return node;
    }
    mappingFunction!(node);
    params.forEach(walk);
    return node;
  };
  return walk;
};
