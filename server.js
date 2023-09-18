var cron = require('node-cron');
const Controller = require('./controller/controller')
var dayjs = require("dayjs"); 
var taskRunning = true;

console.log("EDP REG IV - Cek Data Mtran & Mstran Toko");
cron.schedule('*/1 * * * *', async() => { 
//(async () =>{ 
    try {      
        var now = new Date(); 
        
        console.log(`[START] Service Running (${dayjs().format("YYYY-MM-DD HH:mm:ss")}`)
        if(taskRunning){
            taskRunning = false                     
            console.log("Pengecekan Mtran Toko: " + dayjs().format("YYYY-MM-DD HH:mm:ss"))     
            const kodecabang = "G004,G025,G030,G034,G244,G146,G148,G149,G158,G174,G301,G305,G177,G224,G232,G234,G236,G237"
            await Controller.runningAll(kodecabang);
            taskRunning = true
        } else{
            taskRunning = true
            console.log("Task On Delay: " + dayjs().format("YYYY-MM-DD HH:mm:ss") )	
        }  
                
    } catch (err) {
    
        taskRunning = true
        console.log(err);
    } 
});