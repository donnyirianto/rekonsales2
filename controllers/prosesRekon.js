import { getListIpToko, updateGagal, updatePending } from "../models/model.js";
import { readRespSql, LoginESS } from "../helpers/readresp.js";
import { config } from "../config/config.js";
import { prosesInsertCabang } from './prosesInsertCabang.js';

const requestTask = async (token,dataPayload)=>{
    try {
        
        const respTask = await instance.post("http://172.24.52.30:7321/ReportFromListener/v1/CekStore", dataPayload, {
            headers: {
                "Token": `${token}`
            },
            timeout: 60000
        })  
        
        if( respTask.data.code =="200"){
            let readResponse = JSON.parse(respTask.data.data)

            for( let r of readResponse){
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
            }

            return {
                status: "OK",
                msg : JSON.stringify(respTask.data.msg)
            }
        }
        return {            
            status: "NOK",
            msg : JSON.stringify(respTask.data)
        }
 

    } catch (e) {       
        console.log(e.errno)  
        return {
            status: "ERROR", 
            msg : `${e.code}: ${e.errno}`
        }
    }
}

const prepareData = async (r) => {
    try {
        const querySQL = `SELECT 
                '${r.host}' as ip_server,
                '${r.db}' as db,
                '${r.user}' as user,
                '${r.pass}' as pass,
                '${r.port}' as port,
                b.kirim as kdcab, b.toko, b.nama as nama_toko,
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
        const dataPayload = {
                kdcab: r.kdcab,
                toko: r.kdtk,
                task:"SQL",
                idtask:`rekonsales-${r.kdtk}`,
                station:"01",
                command: querySQL
            }
            
        return {
            status: "Sukses",
            data: dataPayload
        };
    } catch (error) {
        
        return { 
            status: "Gagal",
            data: r.kdtk
        };
    }
};

export const prosesRekon = async (logger,client,query) => {
    try{
         
        const allPending = await getListIpToko(query); 

        //Return jika tidak ada data pending
        if (allPending.length === 0) return 

        const dataLogin = await LoginESS()
        
        if(dataLogin.code != 200) throw new Error(dataLogin)

        const belumAct = allPending.filter(r => r.ket === "BELUM" || r.ket === "belum" || r.ket == "")
        const gagalAct = allPending.filter(r => r.ket === "GAGAL")
        const allPendingAct = belumAct.length >= gagalAct.length ? belumAct : gagalAct

        logger.info(`Total Pending proses: ${allPendingAct.length} Data`)

        const dataPending = allPendingAct
        logger.info(`Proses Get Data Toko: ${dataPending.length} Data`) 

        for (let i = 0; i < dataPending.length; i += 1000) {
            logger.info(`[collect] run ${i}-${Math.min(i + 1000, dataPending.length)}`);
            let allPromise = [];
        
            for (let j = i; j < Math.min(i + 1000, dataPending.length); j++) {
                const promise = new Promise((res, rej) => {
                    prepareData(dataPending[j])
                        .then((val) => { res(val) })
                        .catch((e) => { rej(e) });
                });

                allPromise.push(promise);
            } 

            const dataCache = await Promise.allSettled(allPromise);

            let dataResult = dataCache.filter(r => r.status === 'fulfilled').map(r => r.value);
                dataResult = dataResult.filter(r => r.status === 'Sukses')
            
            const dataPayload = dataResult.map(r=> r.data);

            if(dataPayload.length == 0) throw new Error("tidak ada pending list")

            if(dataPayload.length >= 400){
                let allPromise = [
                    readRespSql(client, dataLogin.data, dataPayload.slice(0,250)),
                    readRespSql(client, dataLogin.data, dataPayload.slice(250,500)),
                    readRespSql(client, dataLogin.data, dataPayload.slice(500,750)),
                    readRespSql(client, dataLogin.data, dataPayload.slice(750,1000)), 
                ];
                await Promise.allSettled(allPromise);
            }else{
                await readRespSql(client, dataLogin.data, dataPayload)
            } 

            await prosesInsertCabang(logger,client,query);

            logger.info(`[collect] Total Task: Looping request ${i}-${Math.min(i + 1000, dataPending.length)}`);

        } 
        logger.info(`Proses Get Data Selesai`)
        return 

    }catch(e){
        logger.error("Error :: "+ e)
        return "Error"
    }
}