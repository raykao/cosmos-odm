const { CosmosClient } = require("@azure/cosmos");

const Model = function(settings) {
    this.__HOST = settings.host || process.env.DB_HOST;
    this.__KEY = settings.key || process.env.DB_KEY;
    this.__DATABASE = settings.database || process.env.DB_NAME;
    this.__CONTAINER_NAME = settings.name;
    this.__CLIENT = new CosmosClient({ endpoint: this.__HOST, key: this.__KEY });
	this.container = this.__CLIENT.database(this.__DATABASE).container(this.__CONTAINER_NAME)
}

Model.prototype.formatModel = function (document) {
    return {
        id: document.id,
        firstname: document.firstname,
        lastname: document.lastname,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
    }
}

Model.prototype.save = async function(document) {
    const currentDate = new Date();
    let item = this.formatModel(document);

	try {
		item.createdAt = document.createdAt ? document.createdAt : currentDate;
		item.updatedAt = document.updatedAt ? document.updatedAt : currentDate;
		
		item = await this.container.items.create(item);
		return item.resource;
	}
	catch(e) {
		throw(e)
	}
}

Model.prototype.findAll = async function() {
    const { resources } = await this.container.items
        .query("SELECT * FROM docs")
        .fetchAll();

    return resources;
}

Model.prototype.find = async function(id) {
    const response = await this.container.item(id).read();
    const item = response.resource;

    if (response.statusCode < 400) {
        return item;
    }
    else {
        throw(response);
    }
}

Model.prototype.update = async function(id, document) {
    try {
        const oldRecord = await this.find(id);
        let updatedRecord = {...oldRecord, ...document};
        
        updatedRecord.id = id;
        updatedRecord.updatedAt = new Date();
        
        updatedRecord = await this.container
            .item(id)
            .replace(updatedRecord);
        
        return updatedRecord;
    }
    catch(e) {
        throw new Error(e);
    }
}

Model.prototype.destroy = async function(id) {
    const response = await this.container.item(id).delete();
    return response;
}

module.exports = {
	Model: Model
};