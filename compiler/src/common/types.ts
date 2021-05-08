import { SyntaxNode, SyntaxType } from '../parser/types';

export type TraverseCallback = (
  node: SyntaxNode,
  walk?: (node: SyntaxNode) => SyntaxNode
) => void;

export type TraverseMap = {
  [x in SyntaxType | '*']?: TraverseCallback;
};

export type TransformMap<T> = {
  [x in SyntaxType]?: TransformCallback<T> | TransformMapEntry<T>;
};

export type TransformLifetimeCallback = (node: SyntaxNode) => void;

export interface TransformMapEntry<T> {
  pre?: TransformLifetimeCallback;
  callback: TransformCallback<T>;
  post?: TransformLifetimeCallback;
}

export type Nullable<T> = T | null;
export type Voidable<T> = T | void;

export type TransformCallback<T> = (
  node: SyntaxNode,
  children: Nullable<T>[]
) => Voidable<T>;
