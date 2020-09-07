import { writable, readable, derived } from 'svelte/store';
import { spring, tweened } from 'svelte/motion';

export type Pos = {
    x: number;
    y: number;
};

function numspring() {
    return spring<number>();
}
function posspring() {
    return spring<Pos>();
}
function numtweened() {
    return tweened<number>();
}
export type NumSpring = ReturnType<typeof numspring>;
export type PosSpring = ReturnType<typeof posspring>;
export type NumTweened = ReturnType<typeof numtweened>;

function numreadable() {
    return readable<number>(undefined, undefined);
}
export type NumReadable = ReturnType<typeof numreadable>;

function anyarraywritable() {
    return writable<any[]>(undefined);
}
function booleanwritable() {
    return writable<boolean>(undefined);
}
function numwritable() {
    return writable<number>(undefined);
}
function poswritable() {
    return writable<Pos>(undefined);
}
function strwritable() {
    return writable<string>(undefined);
}
export type AnyArrayWritable = ReturnType<typeof anyarraywritable>;
export type BooleanWritable = ReturnType<typeof booleanwritable>;
export type NumWritable = ReturnType<typeof numwritable>;
export type PosWritable = ReturnType<typeof poswritable>;
export type StrWritable = ReturnType<typeof strwritable>;

function anyderived() {
    return derived<any, any>(undefined, undefined);
}
function numderived() {
    return derived<any, number>(undefined, undefined);
}
function posderived() {
    return derived<any, Pos>(undefined, undefined);
}
function strderived() {
    return derived<any, string>(undefined, undefined);
}
export type AnyDerived = ReturnType<typeof anyderived>;
export type NumDerived = ReturnType<typeof anyderived>;
export type PosDerived = ReturnType<typeof posderived>;
export type StrDerived = ReturnType<typeof strderived>;
