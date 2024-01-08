import { getListIpToko, updateGagal, updatePending } from "../models/model.js";
import { readRespSql } from "../helpers/readresp.js";
import { config } from "../config/config.js";

const prepareData = async (logger,client,r) => {
    try {
        const querySQL = `SELECT b.kirim as kdcab, b.toko, b.nama as nama_toko,
                SHOP,
                cast(TANGGAL as char) AS WDATE,
                SUM(IF(RTYPE='J',GROSS,0)) AS TJUALN,
                SUM(IF(RTYPE='D',GROSS,0)) AS TRETN,
                SUM(IF(RTYPE='J',IF(SUB_BKP NOT IN ('P','W','G'),ifnull(PPN,gross*ppn_rate/(1+ppn_rate)),0),IF(SUB_BKP NOT IN ('P','W','G'),ifnull(PPN,gross*ppn_rate/(1+ppn_rate)) * -1,0))) AS TPPN,
                SUM(IF(RTYPE='J',(QTY * round(HPP)),((-QTY) * round(HPP) ))) AS THPP,
                SUM(IF(RTYPE='J',GROSS-IF(SUB_BKP='Y',PPN,0),0)) AS TJUAL,
                SUM(IF(RTYPE='D',GROSS-IF(SUB_BKP='Y',PPN,0),0)) AS TRET,
                SUM(IF(RTYPE='J',QTY,0)) AS JQTY,
                SUM(IF(RTYPE='D',QTY,0)) AS DQTY,
                SUM(IF(RTYPE='J',IF(BKP='Y' AND SUB_BKP<>'Y',GROSS*PPN_RATE/100,0),IF(BKP='Y' AND SUB_BKP<>'Y',GROSS*PPN_RATE/100*-1,0))) AS BBS_PPN
                FROM MTRAN a
                LEFT JOIN toko b ON a.shop=b.toko
                WHERE 
                ((tanggal<'2023-01-03' AND plu NOT IN(20052297,20052298,20054875,20054876,20054877,20052299,20052300,20052301,20052302,20054878,20054879,20054880,00000000,0,'')) OR (tanggal>='2023-01-03' AND plu NOT IN(00000000,0,'')))
                AND (CATCODE NOT LIKE ('55%') AND CATCODE NOT LIKE ('055%') AND 
                CATCODE NOT IN('54901','54902','54005','054901','054902','054005')) 
                AND tanggal BETWEEN '${r.tanggal1}' AND '${r.tanggal2}'
                GROUP BY TANGGAL
                `;
                
        const dataToko = await readRespSql("SQL",r.kdcab,r.kdtk,querySQL,25000)
        
        if(dataToko.code == 400) throw new Error("Gagal Akses Toko")

        const dataCache = {
            kdcab: r.kdcab,
            kdtk: r.kdtk,
            tanggal1: r.tanggal1,
            tanggal2: r.tanggal2,
            api_server: r.api_server,
            host: r.host,
            user: r.user,
            pass: r.pass,
            db: r.db,
            port: r.port,
            data: dataToko
        }
        await client.set(`rekonsales-insert-${r.kdtk}`,JSON.stringify(dataCache))
        return {
            status: "Sukses",
            kdtk: r.kdtk
        };
    } catch (error) {
        return { 
            status: "Gagal",
            kdtk: r.kdtk
        };
    }
  };

export const prosesRekon = async (logger,client,query) => {
    try{
         
        const allPending = await getListIpToko(query,config.proses); 

        //Return jika tidak ada data pending
        if (allPending.length === 0) return 

        const belumAct = allPending.filter(r => r.ket === "BELUM" || r.ket === "belum" || r.ket == "")
        const gagalAct = allPending.filter(r => r.ket === "GAGAL")
        const allPendingAct = belumAct.length >= gagalAct.length ? belumAct : gagalAct

        logger.info(`Total Pending proses: ${allPendingAct.length} Data`)

        const dataPending = allPendingAct.slice(0,config.proses)
        logger.info(`Proses Get Data Toko: ${dataPending.length} Data`)
        const getPrepareData = dataPending.map(r => prepareData(logger,client,r));
        const dataCache = await Promise.allSettled(getPrepareData);

        let dataResult = dataCache.filter(r => r.status === 'fulfilled').map(r => r.value);
        const dataResultGagal = dataResult.filter(r => r.status != 'Sukses')
            dataResult = dataResult.filter(r => r.status === 'Sukses')
        
        //Return jika tidak ada data prepare yg sukses
        if (dataResult.length > 0) {
            const queryUpdate = dataResult.map(r=> `'${r.kdtk}'`);
            await updatePending(query,queryUpdate)
        }
        
        if(dataResultGagal.length > 0){
            const queryUpdateGagal = dataResultGagal.map(r=> `'${r.kdtk}'`);
            await updateGagal(query,queryUpdateGagal)
        }

        logger.info(`___ Total Sukses Get Data Toko: ${dataResult.length}`)
        logger.info(`___ Total Gagal Get Data Toko: ${dataResultGagal.length}`)
        logger.info(`Proses Get Data Selesai`)
        return 

    }catch(e){
        logger.error("Error :: "+ e)
        return "Error"
    }
}