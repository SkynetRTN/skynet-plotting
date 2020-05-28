
import { strict as assert } from "assert";
import { ArrMath } from "../src/my-math.js";

let arr1 = [1, 2, 3, 4];
let arr2 = [8, 7, 6, 5];

assert(ArrMath.max(arr1) === 4, "Error: max(arr1)");
assert(ArrMath.max(arr2) === 8, "Error: max(arr2)");

assert(ArrMath.min(arr1) === 1, "Error: min(arr1)");
assert(ArrMath.min(arr2) === 5, "Error: min(arr2)");

assert(ArrMath.sum(arr1) === 10, "Error: sum(arr1)");
assert(ArrMath.sum(arr2) === 26, "Error: sum(arr2)");

assert(ArrMath.mean(arr1) === 2.5, "Error: mean(arr1)");
assert(ArrMath.mean(arr2) === 6.5, "Error: mean(arr2)");

assert.deepEqual(ArrMath.mul(arr1, arr2), [8, 14, 18, 20], "Error: mul()");
