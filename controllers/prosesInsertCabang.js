import { config } from "../config/config.js";
import { queryAnyDb } from "../services/anydb.js";
import axios from "axios";
import {updatePending, updateGagal} from "../models/model.js";

const prepareData = async (client,r) => {
    let dataCache = await client.get(r)
    if(!dataCache) throw new Error("Data not found");
    dataCache = JSON.parse(dataCache)
    
    try { 

        if(dataCache.data[0].nama_toko == undefined) {
            console.log(dataCache)
            throw new Error("Gagal")
        }

        const insert = dataCache.data.map((r)=> `('${r.kdcab}','${r.toko}','${r.nama_toko.substring(0,20)}','${r.SHOP}','${r.WDATE}','${r.TJUALN}','${r.TRETN}','${r.TPPN}','${r.THPP}','${r.TJUAL}','${r.TRET}','${r.JQTY}','${r.DQTY}','${r.BBS_PPN}')`)
        
        const queryInsert = `REPLACE INTO m_rekonsales values ${insert.join(",")};`
        await queryAnyDb(dataCache.host,dataCache.user,dataCache.pass,dataCache.db,dataCache.port, queryInsert)    
        
        // const req = await axios.post(`${dataCache.api_server}/proses/multi_query`, {kdcab:dataCache.kdcab,sintak: queryInsert}, {
        //     headers: {
        //         Authorization: "eDpmERDEKA_sel4lu"
        //     },
        //     timeout: 25000
        // })

        //if(req.status != 200) throw new Error("Error Insert Data");

        return {
            status: "Sukses",
            key: r,
            kdtk: dataCache.kdtk,
        };
    } catch (error) {
        console.log(error)
        return { status: "Gagal",
            kdtk: dataCache.kdtk, };
    }
  };

export const prosesInsertCabang = async (logger,client,query) => {
    try{
         
        const allPending = await client.keys("rekonsales-insert-*");
        
        //Return jika tidak ada data pending
        if (allPending.length === 0) return 
        
        logger.info(`Proses Insert Data Toko: ${allPending.length} Data`)

        const dataPending = allPending.slice(0,1000)
        const getPrepareData = dataPending.map(r => prepareData(client,r));
        const dataCache = await Promise.allSettled(getPrepareData);

        let dataResult = dataCache.filter(r => r.status === 'fulfilled').map(r => r.value);
        const dataResultGagal = dataResult.filter(r => r.status != 'Sukses')
        const dataResultSukses = dataResult.filter(r => r.status === 'Sukses')
        
        if(dataResultSukses.length > 0){
            await updatePending(query,dataResultSukses.map(r=> `'${r.kdtk}'`))
        }
        if(dataResultGagal.length > 0){
            await updateGagal(query,dataResultGagal.map(r=> `'${r.kdtk}'`))
        } 

        for(let i of dataPending){
            await client.del(i)
        }
        logger.info(`___ Total Sukses Insert DB Cabang: ${dataResultSukses.length}`)
        logger.info(`___ Total Gagal Insert DB Cabang: ${dataResultGagal.length}`)
        logger.info(`Proses Insert DB Cabang Selesai`)
        return

    }catch(e){
        console.log(e)
        logger.error("Error :: "+ e)
        return "Error"
    }
}