import * as fileDb from '../app/filedb';

// Configuration of the database to avoid the "constrained construction" antipattern
export const dbConnector = fileDb.createFileDb(__dirname + '/testdb.json');
