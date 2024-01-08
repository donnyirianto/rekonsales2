import axios from "axios";
import dayjs from "dayjs";

export const readRespSql =  async(jenis,kdcab,toko,query,timeout) => {
  try {
        const payload = [{
            kdcab:kdcab,
            toko: toko,
            id: dayjs().format("YYYYMMDDHHmmss"),
            task: "SQL",
            idtask : "3",
            taskdesc: jenis,
            timeout: 60,
            isinduk: true,
            station: "01",
            command: query
        }] 
        let resp = await axios.post("http://172.24.52.10:2905/CekStore",payload, {timeout : parseInt(timeout)});
          
        if(resp.data.code != 200 ){ 
            throw new Error("Response Code Api != 200");
        }
        let dataRes = JSON.parse(resp.data.data)
        if(dataRes[0].msg.substring(0,6) !='succes'){
            throw new Error(dataRes[0].msg);
        }
        
        let dataReponse = JSON.parse(dataRes[0].data)
        dataReponse= JSON.parse(dataReponse[0])
        
        if (dataReponse.hasOwnProperty('error') || dataReponse[0].hasOwnProperty('pesan')){
            throw new Error("Data Error atau Pesan");
        } 
        
        return dataReponse

   } catch(err) {  
        
        return {
            code : 400,
            message : "Gagal Akses Toko"
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
        
