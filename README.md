# Cosmos DB SQL/Core API ODM

This project is meant to be a simple ODM library for Cosmos DB via the SQL/"Core" API.

## Dependencies
- the [@azure/cosmos](https://www.npmjs.com/package/@azure/cosmos) package

## How to use:

```bash
npm install --save @cloudnativegbb/cosmos-orm
```


```js
// models/user-model.js

const Model = require('cosmos-odm');
const settings = {name: "Users"};
const User = new Model(settings);

module.exports = User;
```

```js
// controllers/users-controller.js
const User = require('../models/user-model');

const index = async function(req, res, next) {
  try {
    const users = await User.findAll();

    res.send({
      users: users
    })
  }
  catch(e){
    next(e);
  }
}
```