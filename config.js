module.exports = {
    Config: {
        idUser: 'oiyhjkmn',
        limit: 100,
    },
    MySqlConfig: {
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'vetorial'
    },
    ExcelConfig: {
        path: 'data'
    },
    Columns: {
        address: ['id', 'cep', 'public_place', 'number', 'complement', 'neighborhood'],
        customer: [`id`, `name`, 'email', 'id_responsible', `cpf`, `cnpj`, 'tel_fix', 'phone', 'contact', 'dirf_observation', 'id_address', 'id_priority', `id_creation_user`, `id_update_user`, `customer_created`, `customer_updated`],
        progress: [`id`, `id_customer`, 'open_date', 'work_date', 'negotiate_date', 'contract_date', 'license_date', 'paid_date', 'lower_date'],
        dirf: [`id`, `id_customer`, 'solicitation_date', 'receive_date', 'comment', 'id_status'],
        action: ['id', 'quantity', 'dividends', 'id_company', 'eo', 'ep', 'on', 'pn', 'pa', 'pb', 'or', 'id_customer', 'id_create_user', 'id_update_user', 'action_created', 'action_updated'],
    }
}