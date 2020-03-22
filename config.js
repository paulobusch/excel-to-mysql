module.exports = {
    Config: {
        idUser: 'oiyhjkmn',
        limit: 500,
    },
    MySqlConfig: {
        host: 'locahost',
        user: 'root',
        password: 'root',
        database: 'vetorial'
    },
    ExcelConfig: {
        path: 'data'
    },
    Columns: {
        address: ['id', `id_state`, `id_city`, 'cep', 'public_place', 'number', 'complement', 'neighborhood'],
        customer: [`id`, `kf`, `birth`, `situation_doc`, `child_can_view`, `date_update_cpf`, `date_update_cnpj`, `id_update_cpf_user`, `id_update_cnpj_user`, `name`, 'email', 'id_responsible', `cpf`, `cnpj`, 'tel_fix', 'phone', 'contact', 'id_address', 'id_priority', `id_creation_user`, `id_update_user`, `customer_created`, `customer_updated`, `observation`, `id_status`, 'id_list'],
        progress: [`id`, `id_customer`, 'open_date', 'work_date', 'negotiate_date', 'contract_date', 'license_date', 'paid_date', 'lower_date'],
        dirf: [`id`, `id_customer`, 'solicitation_date', 'receive_date', 'comment', 'id_status'],
        history: [`id`, `id_type`, `id_customer`, `id_creation_user`],
        action: ['id', 'quantity', 'dividends', 'id_code_dirf', 'id_customer', 'eo', 'ep', 'on', 'pn', 'pa', 'pb', 'or', 'id_create_user', 'id_update_user', 'action_created', 'action_updated'],
        task: [`id`, `date`, `description`, `id_status`, `id_customer`, `id_create_user`, `task_created`, `task_updated`],
        accompaniment: [`id`, `date`, `title`, `description`, `id_customer`, `id_create_user`, `id_update_user`, `accompaniment_created`, `accompaniment_updated`],
        finance: ['id', 'date', 'value', 'description', 'is_positive', 'id_category', 'id_customer', 'id_create_user', 'id_update_user', 'finance_created', 'finance_updated'],
        document: ['id', 'name', 'extension', 'size', 'description', 'id_customer', 'id_create_user', 'id_update_user', 'document_created', 'document_updated'],
        categories: ['id', 'name'],
    }
}