const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const { Config, ExcelConfig } = require('../config');
const { Customers } = require('./utils/mapping-import');
const { Excel } = require('./utils/excel');

const mysql = require('sync-mysql');
const fs = require('fs');
const _ = require('lodash');

const async = async () => {
    console.log('Iniciando...');
    const connection = new mysql({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    const queryLists = "select id, upper(name) as name from customer_lists where removed=0";
    const lists = await connection.query(queryLists);
    _.forEach(lists, c => c.name = _.deburr(c.name));
    const getList = (listStr) => {
        if (!listStr) return null;
        const listName = _.deburr(listStr.toUpperCase());
        const list = lists.find(l => l.name === listName);
        if (!list) return null;
        return list.id;
    }

    const getText = (txt) => {
        if (!txt) return null;
        return txt
            .replace(/'/gi, "\\'")
            .replace(/[^a-z,0-9, ,áàâã,éèê,íìî,óòôõ,úùû,ç]/gi, '')
            .trim();
    }

    const timeUpdate = new Date().toISOString();
    const files = fs.readdirSync(ExcelConfig.path);
    for (let index in files) {
        const file = files[index];

        console.log('');
        console.log('===========================');
        console.log('Importando: ' + file);
        const data = await Excel.load(file, Customers);
        if (!data || !data.worksheet || !data.columns) {
            console.log('Require columns maped: ');
            console.log(Customers);
            break;
        }

        const customers = [];
        const listId = getList(file.substr(0, file.indexOf('.')));
        for (var r = 2; r <= data.worksheet.rowCount; r++) {
            const lineRows = Excel.readLine(data.worksheet, data.columns, r);
            const hasCustomer = !!lineRows['NOME'] || !!lineRows['CNPJ.CPF'];
            if (!hasCustomer) continue;

            const cpf_cnpj = lineRows['CNPJ.CPF'] || '';
            const customer = {
              name: getText(lineRows['NOME']),
              cpf: cpf_cnpj.length === 11 ? cpf_cnpj : null,
              cnpj: cpf_cnpj.length === 14 ? cpf_cnpj : null
            };

            customers.push(customer);
        }

        let partial = 0;
        let countNotFound = 0;
        let countFounded = 0;
        while (partial * Config.limit < customers.length) {
            const offset = partial * Config.limit;
            console.log('Processando: ' + (offset + Config.limit) + ' / ' + customers.length);
            const partialCustomers = customers.slice(offset, offset + Config.limit);

            const customerConditions = partialCustomers.map(c => 
              "("+
                  `c.cpf${c.cpf ? `='${c.cpf}'` : ' is null'} ` +
                  `and c.cnpj${c.cnpj ? `='${c.cnpj}'` : ' is null'} ` +
                  `and c.name like '${c.name}'` +
              ")"
            );
            const queryCustomers = "" +
                "select c.id, c.name, c.cpf, c.cnpj from customers c " +
                "where c.id_list is null and (" + customerConditions.join(' or ') + ") ";

            const customerExistings = await connection.query(queryCustomers);

            const commands = [];
            for (let index in partialCustomers) {
                const customer = partialCustomers[index];
                const filterCustomer = 
                  f => f.name && customer.name && f.name.toUpperCase() === customer.name.toUpperCase()
                    && f.cpf === customer.cpf
                    && f.cnpj === customer.cnpj;
                const customerFinded = customerExistings.find(filterCustomer);
                if (!customerFinded) {
                  countNotFound++;
                  continue;
                }

                countFounded++;
                const command = "" +
                  "update customers c set " +
                    `c.id_list='${listId}', ` +
                    `c.customer_updated='${timeUpdate}' ` +
                  `where c.id_list is null and c.id='${customerFinded.id}'`;
                commands.push(command);
            }

            // await connection.query(commands.join(';\n'));

            partial++;
        }
        
        console.log('Registros atualizados: ' + countFounded);
        console.log('Registros não encontrados: ' + countNotFound);
    }

    console.log('Fim...');
}


async();
