import mysql from 'mysql2/promise';

export const queryAnyDb = async (host,user,password,database,port, queryx) => {
  try {
      
      const dbnya = { /* don't expose password or any sensitive info, done only for demo */
          host: host,
          user: user,
          password: password,
          database: database,
          port: port,
          dateStrings:true,
          multipleStatements: true
      }

      const conn =  await mysql.createConnection(dbnya); 
      
      await conn.query(queryx)
      conn.end()
      return "Sukses"
    
  } catch (error) {
    return "Error"
  }
}
