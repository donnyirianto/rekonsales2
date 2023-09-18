const mysql = require('mysql2/promise');
const config = require('../config');

const conn =  mysql.createPool(config.dbho); 
async function query(query) {
  const result = await conn.query(query)

  return result
} 

module.exports = {
  query 
}