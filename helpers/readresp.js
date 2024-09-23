import axios from "axios";
import dayjs from "dayjs";

export const readRespSql =  async(client, token, payload) => {
    try {
    
        let respTask = await axios.post("http://172.24.52.10:7321/ReportFromListener/v1/CekStore", payload, {
            headers: {
                "Token": `${token}`
            },
            timeout: 100000
        });
        
        if(respTask.data.code != 200 ){ 
            throw new Error("Response Code Api != 200");
        }
    
        let readResponse = JSON.parse(respTask.data.data)
        
        readResponse = readResponse.filter(r => r.data != '')

        for(let i of readResponse){
            if(i.msg == 'Succes SQL Native'){
                let u = JSON.parse(i.data)
                const dataCache = {
                    kdcab: i.kdcab,
                    kdtk: i.toko,
                    host: u[0].ip_server,
                    user: u[0].user,
                    pass: u[0].pass,
                    db: u[0].db,
                    port: u[0].port,
                    data: u
                }
                
                await client.set(`rekonsales-insert-${i.toko}`,JSON.stringify(dataCache),{EX: 60 * 15})
            }else{
                let u = JSON.parse(i.data)
                const dataCache = {
                    kdcab: i.kdcab,
                    kdtk: i.toko,
                    host: u[0].ip_server,
                    user: u[0].user,
                    pass: u[0].pass,
                    db: u[0].db,
                    port: u[0].port,
                    data: JSON. parse(u[0])
                }
                await client.set(`rekonsales-insert-${i.toko}`,JSON.stringify(dataCache),{EX: 60 * 15})
            }
        }

        return {
            code : 200,
            message : "Sukses"
        }
          
     } catch(err) {   
          return {
              code : 400,
              message : "Gagal Akses API",
          }
    } 
    
  }

export const readRespNative =  async(jenis,toko,queryEx,timeout) => {
    try { 
        let dataReponse=""
        let ip = await bykdtk("",toko)

        if(ip === "Gagal")
            throw e
        
        for(let i of ip.data[0].PASSWORD.split("|")){
            dataReponse = await query(ip.data[0].IP,ip.data[0].USER,i,"POS",3306, queryEx)            
            if(dataReponse != "Gagal")
                break;
        }

        return {
            code : 200,
            message : "Sukses",
            jenis: jenis,
            data: dataReponse
        }
    } catch(err) {  
        return {
            code : 400,
            message : "Gagal",
            jenis: jenis,
            data: err
        }
    }
}
        

export const LoginESS =  async() => {
    try {
          const payload = {
            "username": "2012073403",
            "password" : "N3wbi330m3D@2406"
          }
          let resp = await axios.post("http://172.24.52.30:7321/login",payload, {timeout : parseInt(20000)});
          
          if(resp.data.code != 200 ){ 
              throw new Error("Response Code Api != 200");
          }
  
          let dataRes = JSON.parse(resp.data.data)
          
          
          return {
              code : 200,
              status : "Sukses",
              data: dataRes.token
          }
     } catch(err) {  
          
          return {
              code : 400,
              status : "Gagal",
              data: "Error - Response Api",
              err: err
          }
    } 
    
  }