// Imports-------------------------------
import express from 'express';
import database from './database.js';
import cors from 'cors';


//Configure express app------------------
const app = new express();


//Confgure middleware--------------------
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const buildSetFields = (fields) => fields.reduce((setSQL, field, index) =>
  setSQL + `${field}=:${field}` + ((index === fields.length - 1) ? '' : ','), 'SET '
);

const buildUpdateHomeworkSql = () => {
    let table = 'homework';
    let updatedFields = ['Details', 'DueDay', 'ModuleId', 'TeacherId'];
    return `UPDATE ${table} `+buildSetFields(updatedFields)+` WHERE HomeworkId =:HomeworkId`;
};
const buildDeleteHomeworkSql = () => {
    let table = 'homework';
    return `DELETE FROM  ${table} WHERE HomeworkId =:HomeworkId`;
};

const buildInsertHomeworkSql = () => {
    let table = 'homework';
    let insertedFields = ['Details', 'DueDay', 'ModuleId', 'TeacherId'];
    return `INSERT INTO ${table} SET Details = "${record[`Details`]}",DueDay = "${record['DueDay']}",ModuleId = ${record['ModuleId']},TeacherId = ${record['TeacherId']}`;
};
const buildSelectHwSql = (id, variant) => {
    let table = 'homework';
    let fields = ['HomeworkId', 'Details', 'DueDay', 'TeacherId', 'ModuleId'];
    let sql = "";
    if (variant) {
        sql = `SELECT ${fields} FROM ${table} WHERE TeacherId = ${id}`
    } else {
        sql = `SELECT ${fields} FROM ${table} WHERE HomeworkId = ${id}`
    }
    return sql;
}
const buildModulesSelectSql = (id, variant) => {
    let sql = '';
    const table = 'Modules INNER JOIN teachersmodules ON teachersmodules.ModuleId = modules.ModuleId';
    const fields = ['TeacherId', 'ModuleName', 'ModuleCode'];
    if (variant) {

        sql = `SELECT ${fields} FROM ${table} WHERE teacherId = ${id}`;
    }
    else {
        sql = `SELECT ${fields} FROM ${table}`
    }
    return sql;
}
const getModulesController = async (res, id, variant) => {
    //let id = req.params.id;//if undefined in the case  of /api/modules endpoint
    const sql = buildModulesSelectSql(id, variant);
    const { isSuccess, result, message: accessorMessage } = await read(sql);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });
    res.status(200).json(result);
}
const getHomeworkController = async (res, id, variant) => {
    //let id = req.params.id;//if undefined in the case  of /api/modules endpoint
    const sql = buildSelectHwSql(id, variant);
    const { isSuccess, result, message: accessorMessage } = await read(sql);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });
    res.status(200).json(result);
}
const postHomeworkController = async (req, res) => {
    const sql = buildInsertHomeworkSql(req.body);
    const { isSuccess, result, message: accessorMessage } = await create(sql);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });
    //response to request
    res.status(201).json(result); //id quesry executed successfully we return status 200 and the json encoded array of results
};
const putHomeworkController = async (req, res) => {
    const id = req.params.id;
    const record = req.body;
    //Access Data
    const sql = buildUpdateHomeworkSql();
    const { isSuccess, result, message: accessorMessage } = await update(sql,id,record);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });
    //response to request
    res.status(200).json(result); //id quesry executed successfully we return status 200 and the json encoded array of results
};
const deleteHomeworkController = async (req, res) => {
    const id = req.params.id;
    //Access Data
    const sql = buildDeleteHomeworkSql();
    const { isSuccess, result, message: accessorMessage } = await deleteMethod(sql,id);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });
    //response to request
    res.status(200).json({message: accessorMessage}); //id quesry executed successfully we return status 200 and the json encoded array of results
};

//CRUD FUNCTIONS-------------------------------------------------------------------------------------------------------------------------------------------------
const read = async (sql) => {
    try {
        //console.log(`sql=[${sql}]`);
        const [result] = await database.query(sql);
        return (result.length === 0)

            ? { isSuccess: false, result: null, message: 'No Record(s) Found ' }
            : { isSuccess: true, result: result, message: 'Record(s) succesfully found' };
    }
    catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query:${error.message}` };

    }
};
const create = async (sql) => {
    try {
        const status = await database.query(sql);//deconstraction (the sql will return an array but only first element is needed)
        const lastRecordSql = buildSelectHwSql(status[0].insertId, null);
        const { isSuccess, result, message } = await read(lastRecordSql);
        return isSuccess

            ? { isSuccess: true, result: result, message: 'Record(s) successfully recovered' }
            : { isSuccess: false, result: null, message: `Failed to recover inserted record: ${message}` };
    }
    catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` }
    }
};
const update = async (sql,id,record) => {
    try {
        const status = await database.query(sql,{...record, HomeworkId: id}); 
        if (status[0].affectedRows ===0)
            return { isSuccess: false, result: null, message: 'Failed to update record:no rows were affected' };

        const recoverRecordSql = buildSelectHwSql(id, null);
        const { isSuccess, result, message } = await read(recoverRecordSql);
        return isSuccess

            ? { isSuccess: true, result: result, message: 'Record(s) successfully recovered' }
            : { isSuccess: false, result: null, message: `Failed to recover updated record: ${message}` };
    }
    catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` }
    }
};
const deleteMethod = async (sql,id) => {
    try {
        const status = await database.query(sql,{HomeworkId: id}); 
        return status[0].affectedRows ===0
            ? { isSuccess: false, result: null, message: `Failed to delete record: ${id}` }
            : { isSuccess: true, result: null, message: 'Record successfully deleted' };    
    }
    catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` }
    }
};
//Endpoint-------------------------------------------------------------------------------------------------------------------------------------------------
//GET
app.get('/api/modules', (req, res) => getModulesController(res, req, null));//first endpoint-get all modules
app.get('/api/modules/teachers/:id', (req, res) => getModulesController(res, req.params.id, 'teacher'));//second endpoint-get modules where teacher id = any
app.get('/api/homework/:id', (req, res) => getHomeworkController(res, req.params.id, 'homework'));

//POST 
app.post('/api/homework', postHomeworkController)

//PUT
app.put('/api/homework/:id', putHomeworkController);

//DELETE
app.delete('/api/homework/:id', deleteHomeworkController);

//Start server---------------------------
const PORT = process.env.PORT || 5000;//define port variable if process.env.PORT is not set use 5000
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));// ask server to start running 
