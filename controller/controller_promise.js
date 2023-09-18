

const Models = require('../models/model');
const Eksekusiall = require('./eksekusiall');
 
const runningAll = async (kdcab) => {
    try{
        
            
        const allPromises = []; 
        const results = await Models.getListIpToko();
        for (const r of results) {
            const promisenya = new Promise( async(resolve, reject) => {
                try {
                    const x = await Eksekusiall.run(r)    
                    resolve(x)
                } catch (error) {
                    reject(error)
                }
                
            });
        
            allPromises.push(promisenya);  
        }                 
        await Promise.all(allPromises).then( (r) => {
            console.log(r)
        }).catch( (e)=>{
            console.log(e)
        });  

        return "Sukses"   

    }catch(e){
        console.log("Error :: "+ e)
        return "Error"
    }
}  
  
const getjadwal = async () => {
    try{ 
        const querysql = `SELECT * FROM m_acuan_rekon 
        WHERE ket in('BELUM','GAGAL') 
        group by kdcab;`
        
        const result = await Models.cekjadwal(querysql)  
        
        return result

    }catch(e){
        return "Error"
    }
}  
const insertRekon  = async (toko) => {
    try{ 

        start = toko.tanggal1.substr(8,2)
        end = toko.tanggal2.substr(8,2)

        for(var i = start; i<=end; i++){
            const tgl = i.lenght > 1 ? toko.tanggal1.substr(0,8)+"0"+i : toko.tanggal1.substr(0,8)+""+i 
            const  p = i.lenght > 1 ? `${toko.tanggal1.substr(2,2)}${toko.tanggal1.substr(5,2)}0${i}` : `${toko.tanggal1.substr(2,2)}${toko.tanggal1.substr(5,2)}${i}`;
            const queryTembak = `
            INSERT INTO m_rekonsales_rekap
            (kdcab, kdtk, nama, shop, wdate, tjualn, tretn, tppn, thpp, tjual, tret, jqty, dqty, bbs_ppn, sales, ppn, hpp, Sel_Sales, Sel_Hpp, Sel_PPn,addtime)
                SELECT a.*,
                b.sales,b.ppn,b.hpp,
                a.tjual-tret-sales Sel_Sales,thpp-hpp Sel_Hpp,tppn-ppn Sel_PPn,now()

                FROM
                (SELECT * FROM m_rekonsales WHERE wdate='${tgl}') a
                LEFT JOIN
                (
                SELECT kode_toko AS kdtk,DATE('${tgl}') tanggal,
                                    SUM(IF(kode='01' AND subkode NOT IN ('04'),amount_cr+fee_dpp_cr+fee_cr_ppn,0)) Sales,
                                    ROUND(SUM(IF(kode='02' AND subkode NOT IN ('04'),amount_cr+fee_dpp_cr+fee_cr_ppn,0))-SUM(IF(kode='51',amount_dr+fee_dpp_dr+fee_dr_ppn,0)) +
									SUM(IF(kode='11' AND subkode NOT IN ('999','X'),ref_1,0)) - SUM(IF(kode='27' AND subkode NOT IN ('999','X'),ref_3,0)),3)   Ppn,
                                    SUM(IF(kode='25' AND subkode NOT IN ('04'),amount_dr+fee_dpp_dr+fee_dr_ppn,0))  Hpp
                FROM glslp_${p} GROUP BY kode_toko) b ON a.kdtk = b.kdtk
                WHERE ((ABS(a.tjual-tret)- sales) > 100 OR ABS(thpp-hpp)>10 OR ABS(tppn-ppn)>10)
            `; 
            
            await Models.insertRekon(toko, queryTembak)   
            
        }
       
        return "Sukses"

    }catch(e){
        return "Error"
    }
}

const getrekon = async (toko) => {
    try{ 

        const queryTembak = `SELECT  '${toko.kdcab}' as kdcab, '${toko.kdtk}' as kdtk, '${toko.nama}' as nama_toko,
            SHOP,
            TANGGAL AS WDATE,
            SUM(IF(RTYPE='J',GROSS,0)) AS TJUALN,
            SUM(IF(RTYPE='D',GROSS,0)) AS TRETN,
            SUM(IF(RTYPE='J',IF(SUB_BKP NOT IN ('P','W','G'),PPN,0),IF(SUB_BKP NOT IN ('P','W','G'),PPN*-1,0))) AS TPPN,            
            SUM(IF(RTYPE='J',(QTY*HPP),(-QTY)*HPP)) AS THPP,
            SUM(IF(RTYPE='J',GROSS-PPN,0)) AS TJUAL,
            SUM(IF(RTYPE='D',GROSS-PPN,0)) AS TRET,
            SUM(IF(RTYPE='J',QTY,0)) AS JQTY,
            SUM(IF(RTYPE='D',QTY,0)) AS DQTY,
            SUM(IF(RTYPE='J',IF(SUB_BKP IN ('P','W','G'),PPN,0),IF(SUB_BKP IN ('P','W','G'),PPN*-1,0))) AS BBS_PPN
            FROM MTRAN
            WHERE ((tanggal<'2023-01-03' AND plu NOT IN(20052297,20052298,20054875,20054876,20054877,20052299,20052300,20052301,20052302,20054878,20054879,20054880,00000000,0,'')) OR (tanggal>='2023-01-03' AND plu NOT IN(00000000,0,'')))
            AND (CATCODE NOT LIKE ('55%') AND CATCODE NOT LIKE ('055%') AND 
            CATCODE NOT IN('54901','54902','54005','054901','054902','054005')) 
            AND  (tanggal BETWEEN '${toko.tanggal1}' AND '${toko.tanggal2}')
            GROUP BY TANGGAL
          `; 

          const result = await Models.vquery(toko, queryTembak) 

        return result

    }catch(e){
        return "Error"
    }
}  
module.exports = {
    getjadwal,getrekon,insertRekon,runningAll
  }
