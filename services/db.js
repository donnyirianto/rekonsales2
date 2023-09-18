const mysql = require('mysql2/promise');
const config = require('../config');

const conn =  mysql.createPool(config.dbho); 

async function query(query, param) {
  try {
    const [result] = await conn.query(query, param) 
    return result
  } catch (error) {   
    console.log("Gagal Koneksi HO ::" + error)
    return "Gagal"
  }
}
async function execute(query) {
  const result = await conn.execute(query) 
  return result 
}

module.exports = {
  query, execute
}