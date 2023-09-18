const conn_local = require('../services/db');
const conn_toko = require('../services/anydb'); 
var dayjs = require("dayjs");
 
const getListIpToko = async (kdcab) => {
    try{
       const query =`            
       select a.kdcab,a.kdtk,b.nama,a.tanggal1,a.tanggal2,ip_induk,
c.ipserver,c.database as db,c.user,c.pass,c.port
from (select kdcab, kdtk, tanggal1,tanggal2,ket from m_rekonsales_jadwal where ket in('BELUM','GAGAL')) a
left join  m_toko_ip b on a.kdtk = b.toko and a.kdcab = b.kdcab
left join  m_server_iris c on a.kdcab = c.kdcab and c.jenis = 'IRIS'
where a.kdcab in('${kdcab}')
order by a.kdcab;
       `
        const rows = await conn_local.query(query)
        return rows
    }catch(e){
        //console.log(e)
        return "Error"
    }
}
const vquery = async (iptoko,kdtk, param) => {
    try{ 
        
        const rows = await conn_toko.zconn(iptoko,"kasir","mJDC2ASrWJqKKlDFoh1WPiZWgy6oBwAKU=ljvYW1kTDi","pos", 3306, param)
        
        if(rows === "Gagal"){
            const rows2 = await conn_toko.zconn(iptoko,"kasir","ydUcgx+VcZOXOvtX8CgOQerivop3oMXGk=WosaavE+Cm","pos", 3306, param)
            if(rows2 === "Gagal"){
                const rows3 = await conn_toko.zconn(iptoko,"kasir","5wRVkMKPJ8LufhKX2W+eJ3hi++btMn7Sc=XZT/xPyvPB","pos", 3306, param)   
                if(rows3 === "Gagal"){
                    return "Gagal"
                }else{
                    return rows3
                }
                
            }else{
                return rows2
            }
        }else{
            
            return rows
        }
        
    }catch(e){ 
        console.log(e)
        return "Gagal"
    }
} 

const cekjadwal = async (queryx) => {
    try{  
         
        const result = await conn_local.query(queryx);

        return result
    }catch(e){
        return "Gagal"
    }
}

const insertQuery = async (r,data) => {
    try{  
        var d = data.map( (res) => {
            return `('${res.kdcab}' ,'${res.kdtk}', '${res.nama_toko.substr(0,15)}', '${res.SHOP}',
            '${dayjs(res.WDATE).format("YYYY-MM-DD")}','${res.TJUALN}',
            '${res.TRETN}','${res.TPPN}','${res.THPP}','${res.TJUAL}','${res.TRET}',
            '${res.JQTY}','${res.DQTY}','${res.BBS_PPN}')`
        }) 
        
        const queryx = `REPLACE INTO m_rekonsales() values ${d.join(",")};`
        
        await conn_toko.zconn(r.ipserver,r.user,r.pass,r.db, r.port, queryx);
        
        //await conn_toko.zconn(r.ipserver,r.user,r.pass,r.db, r.port, rekap)
        
        return "Sukses Insert"
    }catch(e){
        return "Gagal Insert"
    }
}
 
const insertRekon = async (r,data) => {
    try{  
                
        await conn_toko.zconn(r.ipserver,r.user,r.pass,r.db, r.port, data)
        return "Sukses Insert"
    }catch(e){
        return "Gagal Insert"
    }
}

const updateFlag = async (kdtk, ket) => {
    try{ 
        const queryx = `UPDATE m_rekonsales_jadwal SET ket='${ket}', updtime= now() where kdtk ='${kdtk}'; `
        await conn_local.query(queryx)
      
        return queryx
    }catch(e){
        
        return "Error Update"
    }
} 

module.exports = {
    vquery,insertQuery,
    cekjadwal,updateFlag,getListIpToko,insertRekon
  }
