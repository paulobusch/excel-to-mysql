module.exports = {
    Config: {
        limit: 500,
        idUser: 'oiyhjkmn',
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
    Scripts: {
        insertAddress: "insert into address(`id`, `id_state`, `id_city`)",
        insertCustomer: "insert into customers(`id`, `name`, `id_responsible`, `cpf`, `cnpj`, `birth`, `situation_doc`, `dirf_observation`, `child_can_view`, `date_update_cpf`, `date_update_cnpj`, `id_update_cpf_user`, `id_update_cnpj_user`, `id_address`, `id_priority`, `id_list`, `id_creation_user`, `id_update_user`)",
        insertProgress: "insert into customers_progress(`id`, `id_customer`)",
        insertDirf: "insert into customers_dirf(`id`, `id_customer`)",
        insertHistory: "insert into customer_histories(`id`, `id_type`, `id_customer`, `id_creation_user`)",
        insertTask: "insert into tasks(`id`, `date`, `description`, `id_status`, `id_customer`, `id_create_user`, `task_created`, `task_updated`)",
        insertAccompaniment: "insert into accompaniments(`id`, `date`, `title`, `description`, `id_customer`, `id_create_user`, `id_update_user`, `accompaniment_created`, `accompaniment_updated`)",
    }
}