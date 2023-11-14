const { isStringObject } = require('util/types');

function createTableSQL(sqlType, tableDef, force){

    let modifier = '';
    if (!force)
        modifier = ' IF NOT EXISTS ';

    let sql = `CREATE TABLE ${modifier} ${tableDef.name} (`;
        
    for (let i = 0; i < tableDef.fields.length; i++) {
    
        let field = tableDef.fields[i];
        let datatype = resolveDataType(sqlType, field.datatype);
        if (i > 0) sql = sql + ',';
        sql = sql + `${field.name} ${datatype}`;
    }

    sql += ')';

    return sql;
}

exports.createTableSQL = createTableSQL;

function dropTableSQL(sqlType, tableDef){
    let sql = `DROP TABLE ${tableDef.name}`;
    return sql;
}

exports.dropTableSQL = dropTableSQL;

function deleteTableSQL(sqlType, tableDef){
    let sql = `DELETE FROM ${tableDef.name}`;
    return sql;
}

exports.deleteTableSQL = deleteTableSQL;

function insertTableSQL(sqlType, tableDef, parameterStyle, values){
    let sql = `INSERT INTO ${tableDef.name} (`;

    for (let i = 0; i < tableDef.fields.length; i++) {
        let field = tableDef.fields[i];
        //let datatype = resolveDataType(sqlType, tablefield.datatype);
        if (i > 0) sql += ', ';
        sql += field.name ;
    }

    sql += ') VALUES (';

    for (let i = 0; i < tableDef.fields.length; i++) {
        let field = tableDef.fields[i];
    
        if (i > 0) 
            sql += ', ';

        if (values){

            let value;

            if (values.length)
                value = values[i];
            else
                values[field.column];

            if ( field.datatype == 'text' )
                sql += `'${value}'`;
            else
                sql += value;

            /**/
        
        }
        else {

            if (parameterStyle == '?') 
                sql += '?'
            else if (parameterStyle == '@') 
                sql += '@' + field.name ;
    
        }
    }
    
    sql += ')';

    return sql;
}
exports.insertTableSQL = insertTableSQL;

function tableStatusSQL(sqlType, tableDef){

    let sql = `SELECT max(DateTime) as newest, min(DateTime) as oldest, count() as entries  FROM ${tableDef.name}`;
    return sql;
}
exports.tableStatusSQL = tableStatusSQL;

function selectByPKSQL(sqlType, tableDef){

    let sql = `SELECT * FROM ${tableDef.name} WHERE ${tableDef.pk} = ?`;
    return sql;
}
exports.selectByPKSQL = selectByPKSQL;

function resolveDataType(sqlType, genericDataType){

    let sqlDataType = genericDataType.toUpperCase();

    switch (genericDataType.toLowerCase()) {
        case 'string':
        case 'varchar': 
            if (sqlType == 'sqlite3') sqlDataType = 'TEXT';
            break;
        case 'datetime':
            if (sqlType == 'sqlite3') sqlDataType = 'REAL';
            break;
        case 'integer':
            if (sqlType == 'sqlite3') sqlDataType = 'INTEGER';
            break;
    }

    return sqlDataType;
}

