const { Customer } = require('./models/customer');
const { Config, Scripts, ExcelConfig } = require('../config');
const { Customers } = require('./utils/mapping-import');
const { Query } = require('./utils/query');
const { NewId } = require('./utils/random');
const { Excel } = require('./utils/excel');
const { MySqlConfig } = require('../config');

const mysql = require('sync-mysql');
const fs = require('fs');

const async = async () => {
    console.log('Iniciando...');
    const connection = new mysql(MySqlConfig);
    const queryUsers = "select id, upper(name) from users where removed=0";
    const users = await connection.query(queryUsers);
    const getUser = (userStr) => {
        if (!userStr) return null;
        const userName = userStr.toUpperCase();
        const user = users.find(u => u.name === userName);
        if (!user) return null;
        return user.id;
    };

    const queryPriorities = "select id, upper(name) from customers_priorities";
    const priorities = await connection.query(queryPriorities);
    const getPriority = (priorityStr) => {
        if (!priorityStr) return null;
        const priorityName = priorityStr.toUpperCase();
        const priority = priorities.find(f => f.name === priorityName);
        if (!priority) return null;
        return priority.id;
    };

    const queryStatus = "select id, upper(name) from tasks_status";
    const status = await connection.query(queryStatus);
    const getStatus = (statusStr) => {
        if (!statusStr) return null;
        const statusName = statusStr.toUpperCase();
        const stat = status.find(f => f.name === statusName);
        if (!stat) return null;
        return stat.id;
    };

    const queryLists = "select id, upper(name) from customer_lists where removed=0";
    const lists = await connection.query(queryLists);
    const getList = (listStr) => {
        if (!listStr) return null;
        const listName = listStr.toUpperCase();
        const list = lists.find(l => l.name === listName);
        if (!list) return null;
        return list.id;
    };

    const queryStates = "select id, upper(code) as uf from states";
    const states = await connection.query(queryStates);
    const getState = (ufStr) => {
        if (!ufStr) return null;
        const ufName = _.deburr(ufStr.toUpperCase());
        const state = states.find(f => f.uf === ufName);
        if (!state) return null;
        return state.id;
    };

    const queryCities = "select id, upper(name), id_state from cities";
    const cities = await connection.query(queryCities);
    const getCity = (stateId, cityStr) => {
        if (!stateId || !cityStr) return null;
        const cityName = _.deburr(cityStr.toUpperCase());
        const city = cities.find(f => f.id_state === stateId && f.name === cityName);
        if (!city) return null;
        return city.id;
    };

    const getDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) return date;

        if (date.length === 4 && !isNaN(parseInt(date))) {
            const result = new Date(parseInt(date), 0, 1);
            if (result == 'Invalid Date') return null;
            return result;
        }

        const arr = date.split('/');
        const day = parseInt(arr[0]);
        const month = parseInt(arr[1]);
        const year = parseInt(arr[2]);
        const result = new Date(year, month, day);
        if (result == 'Invalid Date') return null;
        return result;
    }

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

        const imports = [];
        for (var r = 2; r <= data.worksheet.rowCount; r++) {
            const lineRows = Excel.readLine(data.worksheet, data.columns, r);

            const hasCustomer = !!lineRows['NOME'];
            const hasAccompaniment = !!lineRows['CLIENTES_ACOMPANHAMENTOS::DATA'];
            const hasTask = !!lineRows['CLIENTES_TAREFAS::DATA'];

            if (!hasCustomer && !hasAccompaniment && !hasTask)
                continue;

            if (hasCustomer) {
                const state = getState(lineRows['UF']);
                const city = getCity(state, lineRows['CIDADE']);
                const address = {
                    id: NewId(),
                    id_state: state,
                    id_city: city,
                };

                const cpf_cnpj = lineRows['CPFOUCNPJ'] || '';

                if (getDate(lineRows['NASC']) == 'Invalid Date')
                    console.log(lineRows['NASC']);

                const customer = new Customer(
                    NewId(),
                    lineRows['NOME'],
                    getUser(lineRows['CONSULTOR']) || Config.idUser,
                    undefined,
                    cpf_cnpj.length === 11 ? cpf_cnpj : null,
                    cpf_cnpj.length === 14 ? cpf_cnpj : null,
                    undefined,
                    undefined,
                    undefined,
                    getDate(lineRows['NASC']),
                    lineRows['SITUACAOCPF'],
                    lineRows['DIRF'],
                    undefined,
                    undefined,
                    true,
                    undefined,
                    new Date(),
                    new Date(),
                    Config.idUser,
                    Config.idUser,
                    address.id,
                    getPriority(lineRows['PRIORIDADE']),
                    undefined,
                    getList(lineRows['LISTA']),
                    Config.idUser,
                    Config.idUser
                );

                const progress = {
                    id: NewId(),
                    id_customer: customer.id
                };

                const dirf = {
                    id: NewId(),
                    id_customer: customer.id
                }

                const history = {
                    id: NewId(),
                    id_type: 'j6d9oq7b',
                    id_customer: customer.id,
                    id_creation_user: Config.idUser
                }

                imports.push({
                    address, customer, progress, dirf, history,
                    accompaniments: [],
                    tasks: [],
                });
            }

            const lastImport = imports[imports.length - 1];
            if (hasAccompaniment) {
                const accompaniment = {
                    id: NewId(),
                    date: getDate(lineRows['CLIENTES_ACOMPANHAMENTOS::DATA']),
                    description: lineRows['CLIENTES_ACOMPANHAMENTOS::DESCRICAO'],
                    id_customer: lastImport.customer.id,
                    id_create_user: getUser(lineRows['CLIENTES_ACOMPANHAMENTOS::USUARIO_CRIACAO']) || Config.idUser,
                    id_update_user: Config.idUser,
                    accompaniment_created: new Date(),
                    accompaniment_updated: new Date()
                };
                lastImport.accompaniments.push(accompaniment);
            }

            if (hasTask) {
                const task = {
                    id: NewId(),
                    date: getDate(lineRows['CLIENTES_TAREFAS::DATA']),
                    description: lineRows['CLIENTES_TAREFAS::DESCRICAO'],
                    status: getStatus(lineRows['CLIENTES_TAREFAS::STATUS']) || 'c61d68a1',
                    id_customer: lastImport.customer.id,
                    id_create_user: Config.idUser,
                    task_created: new Date(),
                    task_updated: new Date()
                };
                lastImport.tasks.push(task);
            }
        }

        let partial = 0;
        while (partial * Config.limit < imports.length) {
            const offset = partial * Config.limit;
            console.log('Processando: ' + (offset + Config.limit) + ' / ' + imports.length);
            const partialImport = imports.slice(offset, offset + Config.limit);

            const addressRows = [];
            const customerRows = [];
            const ProgressRows = [];
            const DirfRows = [];
            const HistoryRows = [];
            const TaskRows = [];
            const AccompanimentRows = [];

            for (let index in partialImport) {
                const {
                    address,
                    customer,
                    progress,
                    dirf,
                    history,
                    accompaniments,
                    tasks
                } = partialImport[index];

                addressRows.push([
                    address.id,
                    address.id_state,
                    address.id_city
                ]);
                customerRows.push([
                    customer.id,
                    customer.name,
                    customer.id_responsible,
                    customer.cpf,
                    customer.cnpj,
                    customer.birth,
                    customer.situation_doc,
                    customer.dirf_observation,
                    customer.child_can_view,
                    customer.date_update_cpf,
                    customer.date_update_cnpj,
                    customer.id_update_cpf_user,
                    customer.id_update_cnpj_user,
                    customer.id_address,
                    customer.id_priority,
                    customer.id_list,
                    customer.id_creation_user,
                    customer.id_update_user
                ]);
                ProgressRows.push([
                    progress.id,
                    progress.id_customer
                ]);
                DirfRows.push([
                    dirf.id,
                    dirf.id_customer
                ]);
                HistoryRows.push([
                    history.id,
                    history.id_type,
                    history.id_customer,
                    history.id_creation_user
                ]);

                for (let indexTask in tasks) {
                    const task = tasks[indexTask];
                    TaskRows.push([
                        task.id,
                        task.date,
                        task.description ? task.description : '[Importado]',
                        task.status,
                        task.id_customer,
                        task.id_create_user,
                        task.task_created,
                        task.task_updated
                    ]);
                }

                for (let indexAccompaniment in accompaniments) {
                    const accompaniment = accompaniments[indexAccompaniment];
                    AccompanimentRows.push([
                        accompaniment.id,
                        accompaniment.date,
                        accompaniment.description
                            ? accompaniment.description.slice(0, 15) + '...'
                            : '[Título]',
                        accompaniment.description ? accompaniment.description : '[Importado]',
                        accompaniment.id_customer,
                        accompaniment.id_create_user,
                        accompaniment.id_update_user,
                        accompaniment.accompaniment_created,
                        accompaniment.accompaniment_updated
                    ]);
                }
            }

            await connection.query(Query.get(Scripts.insertAddress, addressRows));
            await connection.query(Query.get(Scripts.insertCustomer, customerRows));
            await connection.query(Query.get(Scripts.insertProgress, ProgressRows));
            await connection.query(Query.get(Scripts.insertDirf, DirfRows));
            await connection.query(Query.get(Scripts.insertHistory, HistoryRows));
            await connection.query(Query.get(Scripts.insertTask, TaskRows));
            await connection.query(Query.get(Scripts.insertAccompaniment, AccompanimentRows));

            partial++;
        }
    }

    console.log('Fim...');
}


async();