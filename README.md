# Cosmos DB SQL/Core API ODM

This project is meant to be a simple ODM library for Cosmos DB via the SQL/"Core" API.

## Dependencies
- the [@azure/cosmos](https://www.npmjs.com/package/@azure/cosmos) package

## How to use:

```bash
npm install --save @cloudnativegbb/cosmos-odm
```


```js
// models/user-model.js

const CosmosODM = require('cosmos-odm');
const User = CosmosODM.model("collectionName");

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

const show = async function(req, res, next) {
  try {
    const user = await User.findById(req.params.user)

    res.send({
      user: user
    });
  }
  catch(e) {
    next(e)
  }
}

const create = async function(req, res, next) {
  try {
    const newUser = await User.save(req.body)

    res.send({
      user: newUser
    })
  }
}
```