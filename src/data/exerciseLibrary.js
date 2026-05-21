import {
  CORE_EXERCISE_LIBRARY,
  exerciseId,
} from "./exercises.js";
import { EXERCISE_DB_EXTENDED } from "./exercisedb.js";

export const FULL_EXERCISE_LIBRARY = [
  ...CORE_EXERCISE_LIBRARY,
  ...EXERCISE_DB_EXTENDED,
];

export function getFullExerciseById(id) {
  return CORE_EXERCISE_LIBRARY.find(ex => ex.id === id)
    || CORE_EXERCISE_LIBRARY.find(ex => exerciseId(ex.name) === id)
    || EXERCISE_DB_EXTENDED.find(ex => ex.id === id)
    || EXERCISE_DB_EXTENDED.find(ex => exerciseId(ex.name) === id);
}
