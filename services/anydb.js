import mysql from 'mysql2/promise';

export const queryAnyDb = async (host,user,password,database,port, queryx) => {
  try {
    
      const dbnya = {
          host: host,
          user: user,
          password: password,
          database: database,
          port: port, 
          idleTimeout: 60000,
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
