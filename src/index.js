const { Customer } = require('./models/customer');
const { Config, Columns, ExcelConfig } = require('../config');
const { Customers } = require('./utils/mapping-import');
const { Query } = require('./utils/query');
const { NewId } = require('./utils/random');
const { Excel } = require('./utils/excel');
const { MySqlConfig } = require('../config');

const mysql = require('sync-mysql');
const fs = require('fs');
const _ = require('lodash');

const async = async () => {
    console.log('Iniciando...');
    const connection = new mysql(MySqlConfig);
    const queryUsers = "select id, upper(name) as name from users where removed=0";
    const users = await connection.query(queryUsers);
    const getUser = (userStr) => {
        if (!userStr) return null;
        const userName = userStr.toUpperCase();
        const user = users.find(u => u.name === userName);
        if (!user) return null;
        return user.id;
    };

    const queryUsersKf = "select id, kf from users_keys";
    const usersKf = await connection.query(queryUsersKf);
    const getUserKf = (userKf) => {
        if (!userKf) return null;
        const user = usersKf.find(u => u.kf == userKf);
        if (!user) return null;
        return user.id;
    };

    const queryDirfCodes = "select id, upper(name) as name from dirf_codes";
    const dirfCodes = await connection.query(queryDirfCodes);
    const getDirfCode = (dirfCodeStr) => {
        if (!dirfCodeStr) return null;
        const codeName = dirfCodeStr.toUpperCase();
        const code = dirfCodes.find(c => c.name === codeName);
        if (!code) return null;
        return code.id;
    };

    const getStatusTask = (statusStr) => {
        if (!statusStr) return 'c61d68a1';
        const statusName = statusStr.toUpperCase();
        if (statusName == 'CONCLUÍDA') return 'c61d7iuy';
        return 'c61d68a1';
    };

    const queryStatus = "select id, upper(name) as name from dirf_status";
    const status = await connection.query(queryStatus);
    const getStatus = (statusStr) => {
        if (!statusStr) return null;
        const statusName = statusStr.toUpperCase();
        const stat = status.find(f => f.name === statusName);
        if (!stat) return null;
        return stat.id;
    };

    const queryStates = "select id, upper(code) as uf from states";
    const states = await connection.query(queryStates);
    _.forEach(states, s => s.uf = _.deburr(s.uf.toUpperCase()));
    const getState = (ufStr) => {
        if (!ufStr) return null;
        const ufName = _.deburr(ufStr.toUpperCase());
        const state = states.find(f => f.uf === ufName);
        if (!state) return null;
        return state.id;
    };

    const queryLists = "select id, upper(name) as name from customer_lists where removed=0";
    const lists = await connection.query(queryLists);
    _.forEach(lists, c => c.name = _.deburr(c.name));
    const getList = (listStr) => {
        if (!listStr) return null;
        const listName = _.deburr(listStr.toUpperCase());
        const list = lists.find(l => l.name === listName);
        if (!list) return null;
        return list.id;
    };

    const queryPriority = "select id, upper(name) as name from customers_priorities";
    const priorities = await connection.query(queryPriority);
    const getPriority = (ptrStr) => {
        if (!ptrStr) return null;
        const ptrName = ptrStr.toUpperCase();
        const ptr = priorities.find(l => l.name === ptrName);
        if (!ptr) return null;
        return ptr.id;
    }

    const queryCities = "select id, upper(name) as name, id_state from cities";
    const cities = await connection.query(queryCities);
    _.forEach(cities, c => c.name = _.deburr(c.name.toUpperCase()));
    const getCity = (stateId, cityStr) => {
        if (!stateId || !cityStr) return null;
        const cityName = _.deburr(cityStr.toUpperCase());
        const city = cities.find(f => f.id_state === stateId && f.name === cityName);
        if (!city) return null;
        return city.id;
    };

    const queryCategories = "select id, name from finances_categories";
    const categories = await connection.query(queryCategories);
    const getCategory = (ctStr) => {
        if (!ctStr) return null;
        const category = categories.find(c => c.name === ctStr);
        if (!category) return null;
        return category.id;
    };

    const formatDate = (date) => {
        if (!date) return 'NULL';
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() + 2}`;
    }

    const getDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) return formatDate(date);

        if (date.length === 4 && !isNaN(parseInt(date))) {
            const result = new Date(parseInt(date), 0, 1);
            if (result == 'Invalid Date') return null;
            return formatDate(result);
        }

        const arr = date.split('/');
        const day = parseInt(arr[0]);
        const month = parseInt(arr[1]);
        const year = parseInt(arr[2]);
        const result = new Date(year, month, day);
        if (result == 'Invalid Date') return null;
        return formatDate(result);
    }

    const getFloat = (num) => {
        if (!num) return null;
        const value = parseFloat(num);
        return isNaN(value) ? null : value;
    }

    const getText = (txt) => {
        if (!txt) return null;
        return txt
            .replace(/'/gi, "\\'")
            .replace(/[^a-z,0-9, ,áàâã,éèê,íìî,óòôõ,úùû,ç]/gi, '');
    }

    const getNumber = (txt) => {
        if (!txt) return null;
        var raw = txt.replace(/[^0-9,.-]/gi, '');
        var value = parseFloat(raw);
        if (isNaN(value)) return 'NULL';
        return value;
    }

    const isPositive = (txt) => {
        if (!txt) return false;
        const value = txt.replace(/[^a-z]/gi, '');
        return value === 'Entrada';
    }

    const getExtension = (txt) => {
        if (!txt) return null;
        return txt.substring(txt.lastIndexOf('.'))
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

            const hasCustomer = !!lineRows['___KP_CLIENTE'];
            const hasFinance = !!lineRows['CLIENTES_PAGAMENTOS::__KP_PAGAMENTO'];
            const hasAccompaniment = !!lineRows['CLIENTES_ACOMPANHAMENTOS::DATA'];
            const hasTask = !!lineRows['CLIENTES_TAREFAS::DATA'];
            const hasDocument = !!lineRows['CLIENTES_DOCUMENTOS::__KP_DOCUMENTO'];
            const hasAction = !!lineRows['EO']
                || !!lineRows['EP']
                || !!lineRows['ON']
                || !!lineRows['PN']
                || !!lineRows['PA']
                || !!lineRows['PB']
                || !!lineRows['ACAOOR'];

            if (!hasCustomer && !hasFinance && !hasAccompaniment && !hasTask && !hasDocument && !hasAction)
                continue;

            if (hasCustomer) {
                const state = getState(lineRows['UF_ESTADO']);
                const city = getCity(state, lineRows['CIDADE']);
                const address = {
                    id: NewId(),
                    id_state: state,
                    id_city: city,
                    cep: lineRows['CEP'],
                    public_place: lineRows['LOGRADOURO'],
                    number: lineRows['NUMERO'],
                    complement: lineRows['COMPLEMENTO'],
                    neighborhood: lineRows['BAIRRO']
                };

                const cpf_cnpj = lineRows['CPFOUCNPJ'] || '';
                const customer = new Customer(
                    NewId(),
                    lineRows['___KP_CLIENTE'],
                    getText(lineRows['NOME']),
                    getUserKf(lineRows['__KF_CONSULTOR']) || Config.idUser,
                    lineRows['EMAIL'],
                    cpf_cnpj.length === 11 ? cpf_cnpj : null,
                    cpf_cnpj.length === 14 ? cpf_cnpj : null,
                    lineRows['TELEFONEFIXO'],
                    lineRows['TELEFONECELULAR'],
                    lineRows['CONTATO'],
                    getDate(lineRows['NASC']),
                    lineRows['SITUACAOCPF'],
                    undefined,
                    undefined,
                    undefined,
                    true,
                    `
DIRF: ${lineRows['DIRF'] || '[vazio]'}
GOOGLE: ${lineRows['GOOGLE'] || '[vazio]'}
VALOR POUP OU DJ: ${lineRows['VALOR.POUP.OU.DJ'] || '[vazio]'}
OBSERVACOES: ${lineRows['OBSERVACOES'] || '[vazio]'}`,
                    new Date(),
                    new Date(),
                    Config.idUser,
                    Config.idUser,
                    undefined,
                    getPriority(lineRows['PRIORIDADE']),
                    getDate(lineRows['DATASITBAIXADO']) ? 'vrfenn0n' : 'vrfenn0f',
                    getList(lineRows['LISTA']),
                    Config.idUser,
                    getUser(lineRows['_USUARIO_MODIFICACAO']) || Config.idUser
                );
                customer.id_address = address.id;
                customer.id_creation_user = Config.idUser;
                customer.id_update_user = Config.idUser;

                const progress = {
                    id: NewId(),
                    id_customer: customer.id,
                    open_date: getDate(lineRows['DATASITABERTO']),
                    work_date: getDate(lineRows['DATASITTRABALHANDO']),
                    negotiate_date: getDate(lineRows['DATASITNEGOCIADO']),
                    contract_date: getDate(lineRows['DATASITCOMCONTRATO']),
                    license_date: getDate(lineRows['DATASITCOMALVARA']),
                    paid_date: getDate(lineRows['DATASITPAGO']),
                    lower_date: getDate(lineRows['DATASITBAIXADO'])
                };

                const dirf = {
                    id: NewId(),
                    id_customer: customer.id,
                    solicitation_date: getDate(lineRows['DATASOLDIRF']),
                    receive_date: getDate(lineRows['DATARECBDIRF']),
                    comment: lineRows['COMENTARIODIRF'],
                    id_status: getStatus(lineRows['STATUSDIRF'])
                };

                const history = {
                    id: NewId(),
                    id_type: 'j6d9oq7b',
                    id_customer: customer.id,
                    id_creation_user: Config.idUser
                }

                imports.push({
                    address, history, customer, progress, dirf,
                    actions: [],
                    finances: [],
                    categories: [],
                    accompaniments: [],
                    tasks: [],
                    documents: [],
                });
            }

            const lastImport = imports[imports.length - 1];
            if (hasAction) {
                const action = {
                    id: NewId(),
                    quantity: 1,
                    dividends: 0,
                    id_code_dirf: getDirfCode('Zerado'),
                    eo: getFloat(lineRows['EO']),
                    ep: getFloat(lineRows['EP']),
                    on: getFloat(lineRows['ON']),
                    pn: getFloat(lineRows['PN']),
                    pa: getFloat(lineRows['PA']),
                    pb: getFloat(lineRows['PB']),
                    or: getFloat(lineRows['ACAOOR']),
                    id_customer: lastImport.customer.id,
                    id_create_user: Config.idUser,
                    id_update_user: Config.idUser,
                    action_created: new Date(),
                    action_updated: new Date()
                };
                lastImport.actions.push(action);
            }
            if (hasFinance) {
                const categoryName = lineRows['CLIENTES_PAGAMENTOS::CATEGORIA'];
                if (categoryName && !getCategory(categoryName)) {
                    const category = { id: NewId(), name: categoryName };
                    categories.push(category);
                    lastImport.categories.push(category);
                }

                const value = getNumber(lineRows['CLIENTES_PAGAMENTOS::VALOR']);
                let isPositive = value > 0 ? true : false;
                if (value == 0.0)
                    isPositive = isPositive(lineRows['CLIENTES_PAGAMENTOS::CATEGORIA2']);
                const finance = {
                    id: NewId(),
                    date: getDate(lineRows['CLIENTES_PAGAMENTOS::DATA']),
                    value: value,
                    description: lineRows['CLIENTES_PAGAMENTOS::DESCRICAO'],
                    is_positive: isPositive,
                    id_category: getCategory(lineRows['CLIENTES_PAGAMENTOS::CATEGORIA']),
                    id_customer: lastImport.customer.id,
                    id_create_user: getUser(lineRows['CLIENTES_PAGAMENTOS::USUARIO_CRIACAO']) || Config.idUser,
                    id_update_user: Config.idUser,
                    finance_created: new Date(),
                    finance_updated: new Date()
                };
                lastImport.finances.push(finance);
            }

            if (hasAccompaniment) {
                const accompaniment = {
                    id: NewId(),
                    date: getDate(lineRows['CLIENTES_ACOMPANHAMENTOS::DATA']),
                    title: lineRows['CLIENTES_ACOMPANHAMENTOS::ENVOLVIDO'],
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
                    status: getStatusTask(lineRows['CLIENTES_TAREFAS::STATUS']),
                    id_customer: lastImport.customer.id,
                    id_create_user: Config.idUser,
                    task_created: new Date(),
                    task_updated: new Date()
                };
                lastImport.tasks.push(task);
            }

            if (hasDocument) {
                const document = {
                    id: NewId(),
                    name: getText(lineRows['CLIENTES_DOCUMENTOS::NOME']),
                    extension: getExtension(lineRows['CLIENTES_DOCUMENTOS::NOMEDOARQUIVO']),
                    size: getNumber(lineRows['CLIENTES_DOCUMENTOS::TAMANHOARQUIVO']) || 0,
                    description: getText(lineRows['CLIENTES_DOCUMENTOS::OBSERVACAO']),
                    id_customer: lastImport.customer.id,
                    id_create_user: getUser(lineRows['CLIENTES_DOCUMENTOS::USUARIO_CRIACAO']) || Config.idUser,
                    id_update_user: getUser(lineRows['CLIENTES_DOCUMENTOS::USUARIO_MODIFICACAO']) || Config.idUser,
                    document_created: getDate(lineRows['CLIENTES_DOCUMENTOS::DATA_CRIACAO']) || new Date(),
                    document_updated: getDate(lineRows['CLIENTES_DOCUMENTOS::DATA_CRIACAO']) || new Date()
                };
                lastImport.documents.push(document);
            }
        }

        let partial = 0;
        while (partial * Config.limit < imports.length) {
            const offset = partial * Config.limit;
            console.log('Processando: ' + (offset + Config.limit) + ' / ' + imports.length);
            const partialImport = imports.slice(offset, offset + Config.limit);

            const customerKfs = partialImport.map(m => "" + getNumber(m.customer.kf) + "").join(', ');
            const queryCustomers = "" +
                "select c.id, c.name, c.cpf, c.cnpj, a.id as id_address, p.id as progress_id, d.id as dirf_id, a.id_state from customers c " +
                "join address a on a.id=c.id_address " +
                "join customers_progress p on p.id_customer=c.id " +
                "join customers_dirf d on d.id_customer=c.id " +
                "where c.kf in(" + customerKfs + ") ";

            const customerExistings = await connection.query(queryCustomers);

            const addressRows = [];
            const customerRows = [];
            const ProgressRows = [];
            const DirfRows = [];
            const ActionRows = [];
            const CategoryRows = [];
            const FinanceRows = [];
            const HistoryRows = [];
            const TaskRows = [];
            const AccompanimentRows = [];
            const DocumentRows = [];

            for (let index in partialImport) {
                const {
                    address,
                    customer,
                    history,
                    progress,
                    dirf,
                    actions,
                    tasks,
                    categories,
                    accompaniments,
                    documents,
                    finances
                } = partialImport[index];
                const customerExisting = customerExistings.find(
                    f => f.name && customer.name && f.name.toUpperCase() === customer.name.toUpperCase()
                        && f.cpf === customer.cpf
                        && f.cnpj === customer.cnpj
                        && f.id_state === address.id_state
                );
                if (customerExisting) {
                    address.id = customerExisting.id_address;
                    dirf.id = customerExisting.dirf_id;
                    customer.id_address = customerExisting.id_address;
                    customer.id = customerExisting.id;
                    progress.id_customer = customerExisting.id;
                    dirf.id_customer = customerExisting.id;
                    for (let indexAction in customer.actions) {
                        customer.actions[indexAction].id_customer = customerExisting.id;
                    }
                }

                addressRows.push([
                    address.id,
                    address.id_state,
                    address.id_city,
                    address.cep,
                    address.public_place,
                    address.number,
                    address.complement,
                    address.neighborhood
                ]);
                customerRows.push([
                    customer.id,
                    customer.kf,
                    customer.birth,
                    customer.situation_doc,
                    customer.child_can_view,
                    customer.date_update_cpf,
                    customer.date_update_cnpj,
                    customer.id_update_cpf_user,
                    customer.id_update_cnpj_user,
                    customer.name,
                    customer.email,
                    customer.id_responsible,
                    customer.cpf,
                    customer.cnpj,
                    customer.tel_fix,
                    customer.phone,
                    customer.contact,
                    customer.id_address,
                    customer.id_priority,
                    customer.id_creation_user,
                    customer.id_update_user,
                    new Date(),
                    new Date(),
                    customer.observation,
                    customer.id_status,
                    customer.id_list
                ]);
                ProgressRows.push([
                    progress.id,
                    customer.id,
                    progress.open_date,
                    progress.work_date,
                    progress.negotiate_date,
                    progress.contract_date,
                    progress.license_date,
                    progress.paid_date,
                    progress.lower_date
                ]);
                DirfRows.push([
                    dirf.id,
                    customer.id,
                    dirf.solicitation_date,
                    dirf.receive_date,
                    dirf.comment,
                    dirf.id_status
                ]);
                HistoryRows.push([
                    history.id,
                    history.id_type,
                    customer.id,
                    history.id_creation_user
                ]);

                for (let indexAction in actions) {
                    const action = actions[indexAction];
                    ActionRows.push([
                        action.id,
                        action.quantity,
                        action.dividends,
                        action.id_code_dirf,
                        customer.id,
                        action.eo,
                        action.ep,
                        action.on,
                        action.pn,
                        action.pa,
                        action.pb,
                        action.or,
                        action.id_create_user,
                        action.id_update_user,
                        action.action_created,
                        action.action_updated
                    ]);
                }

                for (let indexTask in tasks) {
                    const task = tasks[indexTask];
                    TaskRows.push([
                        task.id,
                        task.date,
                        task.description ? task.description : '[Importado]',
                        task.status,
                        customer.id,
                        task.id_create_user,
                        task.task_created,
                        task.task_updated
                    ]);
                }

                for (let indexCategory in categories) {
                    const category = categories[indexCategory];
                    CategoryRows.push([
                        category.id,
                        category.name
                    ]);
                }

                for (let indexFinance in finances) {
                    const finance = finances[indexFinance];
                    FinanceRows.push([
                        finance.id,
                        finance.date,
                        finance.value,
                        finance.description,
                        finance.is_positive,
                        finance.id_category,
                        customer.id,
                        finance.id_create_user,
                        finance.id_update_user,
                        finance.finance_created,
                        finance.finance_updated
                    ]);
                }

                for (let indexAccompaniment in accompaniments) {
                    const accompaniment = accompaniments[indexAccompaniment];
                    AccompanimentRows.push([
                        accompaniment.id,
                        accompaniment.date,
                        accompaniment.title
                            ? accompaniment.title.slice(0, 45) + '...'
                            : '[Título]',
                        accompaniment.description ? accompaniment.description : '[Importado]',
                        customer.id,
                        accompaniment.id_create_user,
                        accompaniment.id_update_user,
                        accompaniment.accompaniment_created,
                        accompaniment.accompaniment_updated
                    ]);
                }

                for (let indexDocument in documents) {
                    const document = documents[indexDocument];
                    DocumentRows.push([
                        document.id,
                        document.name,
                        document.extension,
                        document.size,
                        document.description,
                        customer.id,
                        document.id_create_user,
                        document.id_update_user,
                        document.document_created,
                        document.document_updated
                    ]);
                }
            }

            await connection.query(Query.get('address', Columns.address, addressRows));
            await connection.query(Query.get('customers', Columns.customer, customerRows));
            await connection.query(Query.get('customers_progress', Columns.progress, ProgressRows));
            await connection.query(Query.get('customers_dirf', Columns.dirf, DirfRows));
            await connection.query(Query.get('actions', Columns.action, ActionRows));
            await connection.query(Query.get('finances_categories', Columns.categories, CategoryRows));
            await connection.query(Query.get('accompaniments', Columns.accompaniment, AccompanimentRows));
            await connection.query(Query.get('tasks', Columns.task, TaskRows));
            await connection.query(Query.get('documents', Columns.document, DocumentRows));
            await connection.query(Query.get('customer_histories', Columns.history, HistoryRows));
            await connection.query(Query.get('finances', Columns.finance, FinanceRows));

            partial++;
        }
    }

    console.log('Fim...');
}


async();