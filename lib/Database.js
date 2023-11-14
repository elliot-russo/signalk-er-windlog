const DB_TYPE  = 'sqlite3';

//const { isStringObject } = require('util/types');
const fs = require('fs');
const path = require('path');
const SQLite3 = require('better-sqlite3');
const DatabaseTable = require('./DatabaseTable');

/*
const options = {
    readonly : false,
    fileMustExists : false,
    verbose: console.log,
    timeout: 5000,
    nativeBinding: 'path'
}
*/

class Database {

    constructor(fileName, folderPath, schemaDef, forceNew, debugFn){

        this.debugFn = debugFn;

        //this.fullFolderPath = path.join(FILE_ROOT, folderName);
        this.fullFolderPath = folderPath;

        this.debugFn(`Folder: ${this.fullFolderPath}`);

        this.fullFilePath = path.join(this.fullFolderPath, fileName); //'logbook.sqlite3.db'

        this.debugFn(`File: ${this.fullFilePath}`);

        this.dbOpen = false;
        this.db = null;
    
        this.open(forceNew);
        this.init(schemaDef);

    }

    get FilePath () {
        return this.fullFilePath;
    }

        
    get DatabaseObject(){
        return this.db
    }

    get Tables() {
        return this.tables;
    }
/*
    logMessage(message) {
        this.debugFn(message);
        //console.log(message);
        //this.debugFn(message);
    }
*/ 
    isOpen() {
        return this.dbOpen;
    }

    open(forceNew){

        if (!fs.existsSync(this.fullFolderPath))
        {
            this.debugFn("Attempting to create folder " + this.fullFolderPath);
            fs.mkdirSync(this.fullFolderPath);
        }
            
        if (forceNew && fs.existsSync(this.fullFilePath))
        {
            this.debugFn("Attempting to remove " + this.fullFilePath);
            fs.rmSync(this.fullFilePath);
        }
        else
           this.debugFn("Exists at " + this.fullFilePath); 
        
        this.debugFn("Attempt to open sqlite db at " + this.fullFilePath);

        /* filePath or ":memory:"  or temporary file "" */
        this.db = new SQLite3(this.fullFilePath, {}); //Better!
        this.db.pragma('journal_mode = WAL');

        // this.db = new SQLite3.Database(this.fullFilePath);

        this.debugFn(`Database open: ${this.db.open}`);

        this.dbOpen = true;
        return this.dbOpen;
    }

    init(schemaDef){

        this.tables = {};

        this.debugFn(`Attempting to initialise schema`);
        for (let tableName in schemaDef.tables) {
            let tableDef = schemaDef.tables[tableName];
            //console.log(tableDef);
            
            this.tables[tableDef.name] = new DatabaseTable(this, tableDef, false, this.debugFn);
            this.tables[tableDef.name].init();
        }

    }

    close(){
        this.db.close();
        //this.db = null;
        //this.db.
    }

    run(sql, parameters) {
        const stmt = this.db.prepare(sql);
        const info = stmt.run(parameters);
        return info;
    }

    /* single row */
    get(sql, parameters) {
        const stmt = this.db.prepare(sql);
        const row = stmt.get(parameters);
        return row;
    }

    /* all rows */ 
    all(sql, parameters) {
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(parameters);
        return rows;
    }

    getDataTable(name){
        return this.tables[name];
    }

}

module.exports = Database;