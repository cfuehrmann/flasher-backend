import { createFileDb } from './filedb';

// Configuration of the database to avoid the "constrained construction" antipattern
export const db = createFileDb(__dirname + '/productiondb.json');
