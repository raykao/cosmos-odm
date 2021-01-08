const { CosmosClient } = require("@azure/cosmos");

const Model = function(settings) {
    this.__HOST = settings.host || process.env.DB_HOST;
    this.__KEY = settings.key || process.env.DB_KEY;
    this.__DATABASE = settings.database || process.env.DB_NAME;
    this.__CONTAINER_NAME = settings.modelName;
    this.__CLIENT = new CosmosClient({ endpoint: this.__HOST, key: this.__KEY });

	this.container = this.__CLIENT.database(this.__DATABASE).container(this.__CONTAINER_NAME);
}

Model.prototype.formatDocument = function(document) {
    const formattedDocument = document;
    
    delete formattedDocument._rid
    delete formattedDocument._self
    delete formattedDocument._etag
    delete formattedDocument._attachments
    delete formattedDocument._ts
    
    return formattedDocument;
}

Model.prototype.save = async function(document) {
    const currentDate = new Date();
    const newDocument = this.formatDocument(document);
    
    newDocument.createdAt = document.createdAt ? document.createdAt : currentDate;
    newDocument.updatedAt = document.updatedAt ? document.updatedAt : currentDate;
		
	try {	
		const savedDocument = await this.container.items.create(newDocument);
		return savedDocument.resource;
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
        const oldDocument = await this.find(id);
        let updatedDocument = {...oldDocument, ...document};
        updatedDocument = this.formatDocument(updatedDocument)
        
        updatedDocument.id = id;
        updatedDocument.updatedAt = new Date();

        const result = await this.container
            .item(id)
            .replace(updatedDocument);
        
        return result;
    }
    catch(e) {
        throw new Error(e);
    }
}

Model.prototype.destroy = async function(id) {
    const response = await this.container.item(id).delete();
    return response;
}

module.exports = Model;