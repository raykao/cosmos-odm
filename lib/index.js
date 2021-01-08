const { CosmosClient } = require("@azure/cosmos");

const Model = function(settings) {
    this.HOST = settings.host || process.env.DB_HOST;
    this.KEY = settings.key || process.env.DB_KEY;
    this.DATABASE = settings.database || process.env.DB_NAME;
    this.CLIENT = new CosmosClient({ endpoint: this.HOST, key: this.KEY });
    this.containerName = settings.name;
}

Model.prototype.initialize = async function(){
    if (!this.container) {
        this.DB = await (await this.CLIENT.databases.createIfNotExists({ id: this.DATABASE })).database;
        this.container = await (await this.DB.containers.createIfNotExists({ id: this.containerName })).container;
    }
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
    await this.initialize();

    item.createdAt = document.createdAt ? document.createdAt : currentDate;
    item.updatedAt = document.updatedAt ? document.updatedAt : currentDate;
    
    item = await this.container.items.create(item);
    return item.resource;
}

Model.prototype.findAll = async function() {
    await this.initialize();
    
    const { resources } = await this.container.items
        .query("SELECT * FROM docs")
        .fetchAll();

    return resources;
}

Model.prototype.find = async function(id) {
    await this.initialize();
    
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
    await this.initialize();
    
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
    await this.initialize();
    
    const response = await this.container.item(id).delete();
    return response;
}


module.exports = Model;