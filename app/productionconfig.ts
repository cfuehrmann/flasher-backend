import * as fileDb from './filedb';

// Configuration of the database to avoid the "constrained construction" antipattern
export const db = fileDb.createFileDb(__dirname + '/productiondb.json');
