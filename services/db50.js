const mysql = require('mysql2/promise');
const config = require('../config');

const conn =  mysql.createPool(config.db50); 

async function query(query, param) {
  const [result] = await conn.query(query, param)

  return result
}

async function execute(query) {
  const result = await conn.execute(query)

  return result

}

module.exports = {
  query, execute
}