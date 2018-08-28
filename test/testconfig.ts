import { createFileDb } from "../app/filedb";

// Configuration of the database to avoid the "constrained construction" antipattern
export const dbConnector = createFileDb(__dirname + "/testdb.json");
