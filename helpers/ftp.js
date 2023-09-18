const ftp = require("basic-ftp")
module.exports = {
  ceckfile: async(ip,user,pass,ftpdir) => {
    try {
      const client = new ftp.Client()
      client.ftp.verbose = false
      await client.access({
        host: ip,
        user: user,
        password: pass,
        secure: false
      })
      const a = await client.list(ftpdir).then( (r) => { 
        client.close() 
        return r
      })
      
      return a

     } catch(err) { 
       return "None"     
    } 
    
  }
}  