import { config } from "../config/config.js";

const prepareData = async (queryAnyDb,client,r) => {
    try {

        let dataCache = await client.get(r)
        if(!dataCache) throw new Error("Data not found");
        dataCache = JSON.parse(dataCache) 
          
        return {
            status: "Sukses",
            kdcab: dataCache.kdcab,
            key: r,
            data: dataCache
        };
    } catch (error) {
        
        return { status: "Gagal" };
    }
  };

export const prosesInsertCabangGagal = async (logger,client,queryAnyDb) => {
    try{
         
        const allPending = await client.keys("rekonsales-insert-*");
        
        //Return jika tidak ada data pending
        if (allPending.length === 0) return 
        
        logger.info(`Proses Insert Data - not Api: ${allPending.length} Data`)

        const dataPending = allPending.slice(0,config.prosesInsert)
        const getPrepareData = dataPending.map(r => prepareData(queryAnyDb,client,r));
        const dataCache = await Promise.allSettled(getPrepareData);

        let dataResult = dataCache.filter(r => r.status === 'fulfilled').map(r => r.value);
        const dataResultGagal = dataResult.filter(r => r.status != 'Sukses')
            dataResult = dataResult.filter(r => r.status === 'Sukses')
        const prep = dataResult.filter(r => r.status === 'Sukses').map(r => r.data)
        
        //Return jika tidak ada data prepare yg sukses
        if (prep.length === 0) return   
        
        const groupedData = prep.reduce((result, item) => {
            const key = item.kdcab;
            
            if (!result[key]) {
              result[key] = { 
                                kdcab: item.kdcab,
                                host: item.host,
                                user: item.user,
                                pass: item.pass,
                                db: item.db,
                                port: item.port,
                                data: [] 
                            };
            }
            
            result[key].data.push(...item.data);
            
            return result;
        }, {});
        
        const finalResult = Object.values(groupedData);
        
        for(let i of finalResult){
            const insert = i.data.map((r)=> `('${r.kdcab}','${r.toko}','${r.nama_toko.substring(0,20)}','${r.SHOP}','${r.WDATE}','${r.TJUALN}','${r.TRETN}','${r.TPPN}','${r.THPP}','${r.TJUAL}','${r.TRET}','${r.JQTY}','${r.DQTY}','${r.BBS_PPN}')`)
                    
            const queryInsert = `REPLACE INTO m_rekonsales values ${insert.join(",")};`
            
            const act = await queryAnyDb(i.host,i.user,i.pass,i.db,i.port, queryInsert)
            
            if(act != "Sukses") throw new Error("Error Insert Data");

            const listKeySukses = dataResult.filter(r=> r.kdcab == i.kdcab).map(r=> r.key)
        
            for(let idel of listKeySukses){
                await client.del(idel)
            }
            logger.info(`___Total Sukses Insert DB Cabang not APi: ${listKeySukses.length}`)
        }
         
        logger.info(`Proses Insert DB Cabang not APi Selesai`)
        return

    }catch(e){
        logger.error("Error :: "+ e)
        return "Error"
    }
}