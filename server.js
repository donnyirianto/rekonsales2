import { logger } from './config/logger.js';
import { prosesRekon } from './controllers/prosesRekon.js';
import { prosesInsertCabang } from './controllers/prosesInsertCabang.js';
import { prosesInsertCabangGagal } from './controllers/prosesInsertCabangGagal.js';
import { client } from './services/redis.js';
import { query } from './services/db.js';
import {queryAnyDb} from "./services/anydb.js";
import dayjs from 'dayjs';
import * as cron from 'node-cron';

let taskLoad = true
let taskLoadSapu = true

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    client.disconnect()
    logger.info('Service Stopped');
    process.exit(1); 
};
  
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
});

// Service Cron-job : Proses setiap 10 Detik
logger.info(`Service Proses Logs - Running`);

cron.schedule('*/5 * * * * *', async() => { 
     try {
        if (!taskLoad) {
            return;
        } 
        taskLoad = false
        
        logger.info(`[START] Proses Rekon Sales:  ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`) 
        
        await prosesRekon(logger,client,query);
        
        await prosesInsertCabang(logger,client);

        logger.info(`[FINISH] Proses  Rekon Sales:  ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`) 

        taskLoad = true

    } catch (error) {
        logger.error(error);
        taskLoad =true
    } 
});

cron.schedule('*/10 * * * *', async() => { 
    try {
       if (!taskLoadSapu) {
           return;
       } 
       taskLoadSapu = false
       
       logger.info(`[START] Proses Rekon Sales - Gagal Insert Api:  ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`) 
       
       await prosesInsertCabangGagal(logger,client,queryAnyDb); 
       
       logger.info(`[FINISH] Proses  Rekon Sales - Gagal Insert Api:  ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`) 

       taskLoadSapu = true

   } catch (error) {
       logger.error(error);
       taskLoadSapu =true
   } 
});
