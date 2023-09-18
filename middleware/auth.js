const jwt = require('jsonwebtoken');
require('dotenv').config();
const authModel = require('../modules/auth/models/model');
var mqttHandler = require('./mqtt');
var ip = require('ip');
var mqttClient = new mqttHandler();
mqttClient.connect();

module.exports = {
  isAuth: (req,res,next) => {
    try {
      const a = req.headers.authorization;
      const token = a.slice(7, a.length)      
      var decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded; 
      next();
     } catch(err) { 
      res.status(401).json({
        message: 'Token is Invalid'
      });
    }  
  },
  isAuthorized: async (req,res,next) => {
    const kdcab = req.user.kdcab
    const id_dep = req.user.id_dep
    const id_jabatan = req.user.id_jabatan
    const id = req.user.id
    const username = req.user.username
    const nama = req.user.nama
    const link = req.baseUrl.split("/")[2]
    const auth_access = await authModel.auth_access(kdcab,id_dep,id_jabatan,link)
    if (auth_access[0].getAkses === "1") {
      const identityUser = {
        id_users : id,
        kdcab : kdcab,
        id_dep : id_dep,
        id_jabatan : id_jabatan,
        username : username,
        nama : nama,
        bp : link,
        link : req.baseUrl,
      }
      const message = {
            TASK: link,
            ID: Date.now(),
            SOURCE: 'IrisAdminApi',
            COMMAND: identityUser,
            OTP: '-',
            TANGGAL_JAM: Date.now(),
            VERSI: '0.0.1',
            HASIL: '',
            FROM: 'IrisAdminApi',
            TO: 'IDMReporter',
            SN_HDD: '-',
            IP_ADDRESS: ip.address(),
            STATION: '-',
            CABANG: 'HO',
            FILE: '-',
            NAMA_FILE: '-',
            CHAT_MESSAGE: '-',
            REMOTE_PATH: '-',
            LOCAL_PATH: '-',
            SUB_ID: Date.now()
      }
      mqttClient.sendMessage(JSON.stringify(message))
      next();
    } else {
      res.status(401).json({
        message: 'User Not Authorized'
      });
    }
  },  
  isRefresh: (req,res,next) => {
    try {
      const refresh_token = req.body.refresh_token; 
      console.log(refresh_token)
      var decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
      req.user = decoded;
      next();
    } catch(err) {
      res.status(401).json({
        message: 'Refresh Token is Invalid'
      });
    }
  },
};