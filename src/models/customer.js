class Customer {
    constructor(
        id,
        name,
        id_responsible,
        email,
        cpf,
        cnpj,
        tel_fix,
        phone,
        contact,
        birth,
        situation_doc,
        dirf_observation,
        dirf_total,
        low_observation,
        child_can_view,
        observation,
        date_update_cpf,
        date_update_cnpj,
        id_update_cpf_user,
        id_update_cnpj_user,
        id_address,
        id_priority,
        id_status,
        id_list,
        id_creation_user,
        id_update_user
    ) {
        this.id = id;
        this.name = name;
        this.id_responsible = id_responsible;
        this.email = email;
        this.cpf = cpf;
        this.cnpj = cnpj;
        this.tel_fix = tel_fix;
        this.phone = phone;
        this.contact = contact;
        this.birth = birth;
        this.situation_doc = situation_doc;
        this.dirf_observation = dirf_observation;
        this.dirf_total = dirf_total;
        this.low_observation = low_observation;
        this.child_can_view = child_can_view;
        this.observation = observation;
        this.date_update_cpf = date_update_cpf;
        this.date_update_cnpj = date_update_cnpj;
        this.id_update_cpf_user = id_update_cpf_user;
        this.id_update_cnpj_user = id_update_cnpj_user;
        this.id_address = id_address;
        this.id_priority = id_priority;
        this.id_status = id_status;
        this.id_list = id_list;
        this.id_creation_user = id_creation_user;
        this.id_update_user = id_update_user;
    }
}

module.exports = {
    Customer
}