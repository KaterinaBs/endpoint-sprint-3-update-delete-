//Imports-------------------
import mysql from 'mysql2/promise';


//Database Connection-------

const dbConfig = {
    database: process.env.DB_NAME||'fyp',
    port:process.env.DB_PORT||3306,
    host:process.env.DB_HOST||'localhost',
    user:process.env.DB_USER||'root',
    password:process.env.DB_PSWD ||'',
    namedPlaceholders:true

};

let database = null; 
try {
     database = await mysql.createConnection(dbConfig);//create connection
}
catch(error){
    console.log('Error creating databse conection:' + error.message);
    process.exit();
}
export default database;