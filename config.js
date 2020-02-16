module.exports = {
    Config: {
        idUser: 'oiyhjkmn',
        limit: 500,
    },
    MySqlConfig: {
        host: 'vcsystem.com.br',
        user: 'wwvcsy_root',
        password: '@GGf01022000',
        database: 'wwvcsy_vetorial'
    },
    ExcelConfig: {
        path: 'data'
    },
    Columns: {
        address: ['id', 'cep', 'public_place', 'number', 'complement', 'neighborhood'],
        customer: [`id`, `name`, 'email', 'id_responsible', `cpf`, `cnpj`, 'tel_fix', 'phone', 'contact', 'id_address', 'id_priority', `id_creation_user`, `id_update_user`, `customer_created`, `customer_updated`],
        progress: [`id`, `id_customer`, 'open_date', 'work_date', 'negotiate_date', 'contract_date', 'license_date', 'paid_date', 'lower_date'],
        dirf: [`id`, `id_customer`, 'solicitation_date', 'receive_date', 'comment', 'id_status'],
        action: ['id', 'quantity', 'dividends', 'id_company', 'id_customer', 'eo', 'ep', 'on', 'pn', 'pa', 'pb', 'or', 'id_create_user', 'id_update_user', 'action_created', 'action_updated'],
    }
}