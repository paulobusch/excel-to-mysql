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

    const queryCompanies = "select id, upper(name) as name from companies";
    const companies = await connection.query(queryCompanies);
    const getCompany = (companyStr) => {
        if (!companyStr) return null;
        const comapanyName = companyStr.toUpperCase();
        const company = companies.find(c => c.name === comapanyName);
        if (!company) return null;
        return company.id;
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
        return txt
            .replace(/[^0-9,.]/gi, '') || 'NULL';
    }

    const isPositive = (txt) => {
        if (!txt) return false;
        const value = txt.replace(/[^a-z]/gi, '');
        return value === 'Entrada';
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
            const hasAction = !!lineRows['EO']
                || !!lineRows['EP']
                || !!lineRows['ON']
                || !!lineRows['PN']
                || !!lineRows['PA']
                || !!lineRows['PB']
                || !!lineRows['ACAOOR'];

            if (!hasCustomer && !hasAction && !hasFinance)
                continue;

            if (hasCustomer) {
                const state = getState(lineRows['UF_ESTADO']);
                const address = {
                    id: NewId(),
                    id_state: state,
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
                    undefined,
                    undefined,
                    'VALOR POUP OU DJ: ' + lineRows['VALOR.POUP.OU.DJ'] +
                    'OBSERVACOES: ' + lineRows['OBSERVACOES'] +
                    'DIRF: ' + lineRows['DIRF']
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
                }

                imports.push({
                    address, customer, progress, dirf,
                    actions: [],
                    finances: [],
                    categories: []
                });
            }

            const lastImport = imports[imports.length - 1];
            if (hasAction) {
                const action = {
                    id: NewId(),
                    quantity: 1,
                    dividends: 0,
                    id_company: getCompany('Zerado'),
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

                const finance = {
                    id: NewId(),
                    date: getDate(lineRows['CLIENTES_PAGAMENTOS::DATA']),
                    value: getNumber(lineRows['CLIENTES_PAGAMENTOS::VALOR']),
                    description: lineRows['CLIENTES_PAGAMENTOS::DESCRICAO'],
                    is_positive: isPositive(lineRows['CLIENTES_PAGAMENTOS::CATEGORIA2']),
                    id_category: getCategory(lineRows['CLIENTES_PAGAMENTOS::CATEGORIA']),
                    id_customer: lastImport.customer.id,
                    id_create_user: getUser(lineRows['CLIENTES_PAGAMENTOS::USUARIO_CRIACAO']) || Config.idUser,
                    id_update_user: Config.idUser,
                    finance_created: new Date(),
                    finance_updated: new Date()
                };
                lastImport.finances.push(finance);
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

            for (let index in partialImport) {
                const {
                    address,
                    customer,
                    progress,
                    dirf,
                    actions,
                    categories,
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
                    address.cep,
                    address.public_place,
                    address.number,
                    address.complement,
                    address.neighborhood
                ]);
                customerRows.push([
                    customer.id,
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
                    customer.dirf_observation
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

                for (let indexAction in actions) {
                    const action = actions[indexAction];
                    ActionRows.push([
                        action.id,
                        action.quantity,
                        action.dividends,
                        action.id_company,
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
            }

            await connection.query(Query.get('address', Columns.address, addressRows));
            await connection.query(Query.get('customers', Columns.customer, customerRows));
            await connection.query(Query.get('customers_progress', Columns.progress, ProgressRows));
            await connection.query(Query.get('customers_dirf', Columns.dirf, DirfRows));
            await connection.query(Query.get('actions', Columns.action, ActionRows));
            await connection.query(Query.get('finances_categories', Columns.categories, CategoryRows));
            await connection.query(Query.get('finances', Columns.finance, FinanceRows));

            partial++;
        }
    }

    console.log('Fim...');
}


async();