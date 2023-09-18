//const conn_toko = require('../services/anydb'); 
const Models = require('../models/model'); 

const run = async (r) => {
    try{
        
        //console.log(r.kdcab,r.kdtk)
        const querysql = `SELECT  '${r.kdcab}' as kdcab, '${r.kdtk}' as kdtk, '${r.nama}' as nama_toko,
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
            WHERE PLU NOT IN ('20052297','20052298','20052299','20052300','20052301','20052302','20054875','20054876','20054877','20054878','20054879','20054880')
            AND (CATCODE NOT LIKE ('55%') AND CATCODE NOT LIKE ('055%') AND 
            CATCODE NOT IN('54901','54902','54005','054901','054902','054005')) 
            AND  (tanggal BETWEEN '${r.tanggal1}' AND '${r.tanggal2}')
            GROUP BY TANGGAL
            `; 
        const rv = await Models.vquery(r.ip_induk, querysql)  
        
        if(rv === "G" || rv === "Gagal" ){
            await Models.updateFlag(r.kdtk, 'Gagal')   
        }else{             
            
            const start = r.tanggal1.substr(8,2)
            const end = r.tanggal2.substr(8,2)
            var qjoin = []
            for(var i = parseInt(start); i<=end; i++){
                const tgl = i < 10 ? r.tanggal1.substr(0,8)+"0"+i : r.tanggal1.substr(0,8)+""+i 
                const  p = i < 10 ? r.tanggal1.substr(2,2)+r.tanggal1.substr(5,2)+"0"+i : r.tanggal1.substr(2,2)+r.tanggal1.substr(5,2)+i;
                
                qjoin.push(`SELECT kode_toko AS kdtk,DATE('${tgl}') tanggal,
                                    SUM(IF(kode='01' AND subkode NOT IN ('04'),amount_cr+fee_dpp_cr+fee_cr_ppn,0)) Sales,
                                    ROUND(SUM(IF(kode='02' AND subkode NOT IN ('04'),amount_cr+fee_dpp_cr+fee_cr_ppn,0))-SUM(IF(kode='51',amount_dr+fee_dpp_dr+fee_dr_ppn,0)) +
									SUM(IF(kode='11' AND subkode NOT IN ('999','X'),ref_1,0)) - SUM(IF(kode='27' AND subkode NOT IN ('999','X'),ref_3,0)),3)   Ppn,
                                    SUM(IF(kode='25' AND subkode NOT IN ('04'),amount_dr+fee_dpp_dr+fee_dr_ppn,0))  Hpp
                        FROM glslp_${p} where kode_toko = '${r.kdtk}' GROUP BY kode_toko`)
            }    
            const queryInsertRekap = `
            INSERT INTO m_rekonsales_rekap
            (kdcab, kdtk, nama, shop, wdate, tjualn, tretn, tppn, thpp, tjual, tret, jqty, dqty, bbs_ppn, sales, ppn, hpp, Sel_Sales, Sel_Hpp, Sel_PPn,addtime)
                SELECT a.*,
                b.sales,b.ppn,b.hpp,
                a.tjual-tret-sales Sel_Sales,thpp-hpp Sel_Hpp,tppn-ppn Sel_PPn,now()
                FROM
                (SELECT * FROM m_rekonsales where kdtk  = '${r.kdtk}') a
                LEFT JOIN
                (  
                    ${qjoin.join(" union  all ")}
                ) b ON a.kdtk = b.kdtk and a.wdate = b.tanggal
                WHERE ((ABS(a.tjual-tret)- sales) > 100 OR ABS(thpp-hpp)>10 OR ABS(tppn-ppn)>10);`
            await Models.insertQuery(r,rv,queryInsertRekap)  
            //await Models.insertRekon(r,queryInsert)   
            await Models.updateFlag(r.kdtk, 'Sukses') 
        }   

        return "Proses"   

    }catch(e){
        
        return "Error : " + e
    }
}  
  module.exports = {
    run
  }
