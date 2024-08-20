export const getListIpToko = async (query) => {
    try{
       const sqlQuery =`SELECT a.kdcab,
       a.kdtk,cast(a.tanggal1 as char) as tanggal1,cast(a.tanggal2 as char) as tanggal2,
       ipserver as host,\`database\` as db, user,pass,port,
       c.api_server,a.ket
       from m_rekonsales_jadwal a 
       LEFT JOIN  m_server_iris c on a.kdcab = c.kdcab and c.jenis = 'IRIS'
       where ket in('BELUM','GAGAL','')
       AND date(a.addtime) = curdate();`

       const rows = await query(sqlQuery)
 
       return rows
    }catch(e){ 
        throw e
    }
}
export const updatePending = async (query,kdtk) => {
    try{
       
        const sqlQuery =`UPDATE m_rekonsales_jadwal set ket = 'SUKSES' where kdtk in(${kdtk.join(",")});`
        
        await query(sqlQuery)

        return "Sukses"
    }catch(e){ 
        throw e
    }
}
export const updateGagal = async (query,kdtk) => {
    try{
       
        const sqlQuery =`UPDATE m_rekonsales_jadwal set ket = 'GAGAL' where kdtk in(${kdtk.join(",")});`
        
        await query(sqlQuery)

        return "Sukses"
    }catch(e){ 
        throw e
    }
}