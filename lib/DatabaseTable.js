const DB_TYPE  = 'sqlite3';
const dbUtils = require('./databaseUtils');
const { isStringObject } = require('util/types');
//const sqlite3 = require(DB_TYPE);

class DatabaseTable {

    constructor(db, tableDef, init, debugFn){

        this.db = db;
        this._db = db.DatabaseObject;
        this.tableDef = tableDef;
        this.debugFn = debugFn;
        this.tableExists = false;
    }

    init(force){

        if (force)
            this.dropTable();
            
        return this.createTable(force);
    }

   dropTable() {
        let sql = dbUtils.dropTableSQL(DB_TYPE, this.tableDef);
        this.db.run(sql,[]);
        this.tableExists = false;
        return true;
    }
     
    createTable(force) {
        const sql = dbUtils.createTableSQL(DB_TYPE, this.tableDef, force);
        
        let info = this.db.run(sql,[]); 

        this.tableExists = true;
        this.logMessage(`Table '${this.tableDef.name}' created`);

        return info;
    }

    deleteAll() {
        let sql = dbUtils.deleteTableSQL(DB_TYPE, this.tableDef);
        let info = this.db.run(sql);
        return info;
    }

    insert(data){

        let values = [];

        for (const field of this.tableDef.fields) {
            
            let value;
            
            if (data.hasOwnProperty(field.name)) 
                value = data[field.name];
            else
                value = field.default;
   
            if (field.datatype == 'DateTime')
            {
                //let x;
            }
            else if (field.datatype == 'JSON' && !isStringObject(value))
                value = JSON.stringify(value);


            values.push(value)

        }

        const sql = dbUtils.insertTableSQL(DB_TYPE, this.tableDef, '?');
        //console.log(sql);
        this.debugFn(values);

        const stmt = this._db.prepare(sql);
        let info = stmt.run(values);
        info.values = values;
        
        return info;
    }

    selectAll(limit){

        let sql = `SELECT rowid, * FROM ${this.tableDef.name}`; //ORDER BY ${this.tableDef.pk} ASC

        if (parseInt(limit) > 0)
            sql = sql + ` LIMIT ${limit}`;

        const rows = this.db.all(sql,[]);
        return rows;
    }

    selectBy(parameters){

        let sql = `SELECT * FROM ${this.tableDef.name}`
        let values = [];

        if (parameters.length > 0) {
            sql += " WHERE "
            for (const param of parameters) {
                sql += `${param.name} = ?`
                values.push(param.value);
            }
        }

        const rows = this.db.all(sql, values);
        return rows;
    }

    //pass a callback
    tableCount(){
        const sql = dbUtils.tableStatusSQL(DB_TYPE, this.tableDef);
        const rows = this.db.get(sql, []);
        return rows;
    }

    loadTestData(){

        let info = {};
        info.changes = 0;
        info.rows = [];
        //info.data = [];

        let testData = this.tableDef.testdata;
        //info.testdata = testData;

        let sql = dbUtils.insertTableSQL(DB_TYPE, this.tableDef, '?');
        const stmt = this._db.prepare(sql);
        info.sql = stmt.source;

        if (testData.length > 0) {

            //each row
            for (let i = 0; i < testData.length; i++){
                let values = testData[i];
                /*
                let fIdx = 0;
                let data = {};

                for (const field of this.tableDef.fields) {
                    data[field.name] = values[fIdx];
                    fIdx++;
                }
                */
                //let r = this.insert(data);

                let r = stmt.run(values);

                info.rows.push(r)
                info.changes++;
            }
            
        }

        return info;
    }

    logMessage(message) {
        console.log(message);
        //this.debugFn(message);
    }

    debug(message){
        this.debugFn(message);
        //console.log(message);
    }

    dump(val){
        this.debugFn(JSON.stringify(val));
    }

}

module.exports = DatabaseTable;