"use strict";
var fs = require("fs");

module.exports = function(configFile){
    try {
        var stats = fs.statSync(configFile);
        
        if (stats.isFile()){
            require("./" + configFile);
        }
    } catch (err){
    }
};