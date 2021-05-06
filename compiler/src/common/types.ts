import { Syn, SyntaxType } from "../parser/types";

export type TraverseMapFunctor = (node: Syn, walk?: TraverseMapFunctor) => void; 

export type TraverseMap = {
    [x in SyntaxType | '*']?: TraverseMapFunctor;
};