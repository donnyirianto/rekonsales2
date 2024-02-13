module.exports = {
  apps : [{
      name: "rekonsales",
      script: "server.js",
      max_memory_restart: "1G", 
      watch: false, 
      exec_mode: "fork", 
    },
  ], 
};
