import { SyntaxNode } from '../parser/types';
import {
  Nullable,
  TransformCallback,
  TransformLifetimeCallback,
  TransformMap,
  TransformMapEntry,
} from './types';

// Post-order AST walker
export function transform<T>(map: TransformMap<T>) {
  const walk = (node: SyntaxNode): Nullable<T> => {
    if (node === null) {
      return null;
    }
    const { params } = node;

    let mappingFunction: TransformCallback<T> = (_, __) => {};
    let preCallback: Nullable<TransformLifetimeCallback> = null;
    let postCallback: Nullable<TransformLifetimeCallback> = null;

    if (node.type in map && typeof map[node.type] === 'function') {
      mappingFunction = map[node.type]! as TransformCallback<T>;
    } else if (node.type in map && typeof map[node.type] !== 'function') {
      const entry = map[node.type]! as TransformMapEntry<T>;
      mappingFunction = entry.callback;
      preCallback = entry.pre || null;
      postCallback = entry.post || null;
    }
    if (preCallback) {
      preCallback(node);
    }
    if (params.length === 0) {
      let result = mappingFunction(node, []);
      if (postCallback) {
        postCallback(node);
      }
      return !!result ? result : null;
    } else {
      const transformedParams = params.map((n) => {
        n.parent = node;
        return walk(n);
      });
      let result = mappingFunction(node, transformedParams);
      if (postCallback) {
        postCallback(node);
      }
      return !!result ? result : null;
    }
  };
  return walk;
}
