import { config } from "../config/config.js";
import axios from "axios";

const prepareData = async (client,r) => {
    try {
        let dataCache = await client.get(r)
        if(!dataCache) throw new Error("Data not found");
        dataCache = JSON.parse(dataCache)
        
        const insert = dataCache.data.map((r)=> `('${r.kdcab}','${r.toko}','${r.nama_toko.substring(0,20)}','${r.SHOP}','${r.WDATE}','${r.TJUALN}','${r.TRETN}','${r.TPPN}','${r.THPP}','${r.TJUAL}','${r.TRET}','${r.JQTY}','${r.DQTY}','${r.BBS_PPN}')`)
        
        const queryInsert = `REPLACE INTO m_rekonsales values ${insert.join(",")};`
        const req = await axios.post(`${dataCache.api_server}/proses/multi_query`, {kdcab:dataCache.kdcab,sintak: queryInsert}, {
            headers: {
                Authorization: "eDpmERDEKA_sel4lu"
            },
            timeout: 25000
        })
        if(req.status != 200) throw new Error("Error Insert Data");
        return {
            status: "Sukses",
            key: r
        };
    } catch (error) {
        
        return { status: "Gagal" };
    }
  };

export const prosesInsertCabang = async (logger,client) => {
    try{
         
        const allPending = await client.keys("rekonsales-insert-*");
        
        //Return jika tidak ada data pending
        if (allPending.length === 0) return 
        
        logger.info(`Proses Insert Data Toko: ${allPending.length} Data`)

        const dataPending = allPending.slice(0,config.prosesInsert)
        const getPrepareData = dataPending.map(r => prepareData(client,r));
        const dataCache = await Promise.allSettled(getPrepareData);

        let dataResult = dataCache.filter(r => r.status === 'fulfilled').map(r => r.value);
        const dataResultGagal = dataResult.filter(r => r.status != 'Sukses')
            dataResult = dataResult.filter(r => r.status === 'Sukses')
        
        //Return jika tidak ada data prepare yg sukses
        if (dataResult.length === 0) return  

        const listKeySukses = dataResult.map(r=> r.key)
        
        for(let i of listKeySukses){
            await client.del(i)
        }
        logger.info(`___ Total Sukses Insert DB Cabang: ${dataResult.length}`)
        logger.info(`___ Total Gagal Insert DB Cabang: ${dataResultGagal.length}`)
        logger.info(`Proses Insert DB Cabang Selesai`)
        return

    }catch(e){
        logger.error("Error :: "+ e)
        return "Error"
    }
}