const { CosmosClient } = require("@azure/cosmos");

class Model {
	constructor(modelName, options) {
		this.__HOST = options.host || process.env.DB_HOST;
		this.__KEY = options.key || process.env.DB_KEY;
		this.__DATABASE_NAME = options.database || process.env.DB_NAME;
		this.__CONTAINER_NAME = modelName.toLowerCase();
		this.__CLIENT = new CosmosClient({ endpoint: this.__HOST, key: this.__KEY });

		this.database = this.__CLIENT.database(this.__DATABASE_NAME);

		this.container = null;

	}

	formatDocument(document) {
		const formattedDocument = document;
		
		delete formattedDocument._rid;
		delete formattedDocument._self;
		delete formattedDocument._etag;
		delete formattedDocument._attachments;
		delete formattedDocument._ts;
		
		return formattedDocument;
	}

	async init() {
		if(!this.container) {
			const container = await this.database.containers.createIfNotExists({id: this.__CONTAINER_NAME})
				.then(()=>{
					this.container = container;
				})
				.catch((e) => {
					console.log('Container created/already exists. skipping creation');
				});
		}
    }

	async createContainer() {
        try {
            const { container } = await this.database.containers.createIfNotExists({id: this.__CONTAINER_NAME.toLowerCase()})
            this.container = container;
        }
        catch(e) {
            console.log(e)
        }
	}

	async save(document) {
        // Check to see if database and container exists
		await this.init();

		const currentDate = new Date();
		const newDocument = this.formatDocument(document);
		
		newDocument.createdAt = document.createdAt ? document.createdAt : currentDate;
		newDocument.updatedAt = document.updatedAt ? document.updatedAt : currentDate;

        if(!this.container) {
            await this.createContainer();
        }

		try {
			const savedDocument = await this.container.items.create(newDocument);
			return savedDocument.resource;
		}
		catch(e) {
			console.error("Some Save Failure")
			console.error(e);
			throw(e)
		}
	}

	async findAll() {
		await this.init();

		const { resources } = await this.container.items
			.query("SELECT * FROM docs")
			.fetchAll();

		return resources;
	}

	async find(id) {
		await this.init();

		const response = await this.container.item(id).read();
		const item = response.resource;

		if (response.statusCode < 400) {
			return item;
		}
		else {
			throw(response);
		}
	}

	async update(id, document) {
		await this.init();

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

	async destroy(id) {
		await this.init();

		const response = await this.container.item(id).delete();
		return response;
	}

}

const CosmosODM = {
	models: []
};

CosmosODM.model = function(modelName, options = {}) {
	const model = {};

	model[modelName] = new Model(modelName, options)

	this.models.push(model);
    model[modelName].init();
    return model[modelName];
}

module.exports = CosmosODM;