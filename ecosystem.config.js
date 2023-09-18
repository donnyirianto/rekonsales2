module.exports = {
  apps : [{
      name: "rekonsales",
      script: "server.js", 
      autorestart: true,
      max_memory_restart: "900M",
      exec_mode  : "fork"
    },
  ], 
};
