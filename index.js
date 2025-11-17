import express from 'express';
import usersRouter from './routes/users.js';
import projektiRouter from './routes/projects.js';
//const express = require('express'); //jer smo stavili u package.json type:module umisto commonjs
const router = express.Router();

const app = express();


const PORT = 3000;
app.use(express.json());

app.use('/users', usersRouter);

app.listen(PORT, error => {
    if(error){
        console.error(`Greška prilikom pokretanja poslužitelja: ${error.message}`);
    } else {
        console.log(`Server dela na portu: ${PORT}`);
    };
});
;



export default router;