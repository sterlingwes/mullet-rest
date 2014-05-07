/*
* # Rest API Helper
* 
* Creates standard CRUD endpoints for content management systems.
* 
* @exports {Object} api
*/

var EJSON = require('meteor-ejson');

module.exports = function() {
    
    function getBasicResponse(err) {
        return {
               ok:     !err,
               reason: err ? err.reason || err.message || err.trace : undefined
           };
    }
    
    return {
        
        /*
         * listen(cfg)
         *
         * @param {Object} server is a reference to the server app
         * @param {Object} cfg is an object literal with:
         * @param {String} cfg.name for endpoint, will lead to: /api/cfg.name
         * @param {Object} cfg.schema instance of database schema forming resource basis
         */
        listen: function(app, cfg) {
            
            if(!cfg.name || !cfg.schema) {
                return console.error('A resource name and model schema are required to build the rest endpoints!');
            }
            
            var name = cfg.name.toLowerCase();
            
            // fetch resource
            app.get(name, function(req,res) {
                cfg.schema.find({}, function(err,posts) {
                    var resp = getBasicResponse(err);
                    resp[name] = posts;
                    res.json(resp, err ? 500 : 200);
                    
                    if(typeof cfg.done === 'function')
                        cfg.done('get');
                });
            });
            
            // allow partial update
            app.put(name, function(req,res) {
                var selector = EJSON.parse(req.body.selector)
                  , data = EJSON.parse(req.body.data);
                    
                if(!selector._id)
                    return res.json({ok:false, reason:'Invalid selector for update.', selector:selector});
                
                cfg.schema.update(selector, {$set: data}, function(err,result) {
                    var resp = getBasicResponse(err);
                    resp.result = result;
                    
                    if(typeof cfg.done === 'function' && result) {
                        cfg.schema.find({_id:selector._id.toHexString()}, function(err,posts) {
                            if(posts && posts.length) {
                                cfg.done('put', posts[0]);
                                res.json(resp, err ? 500 : 200);
                            }
                        });
                    }
                    else
                        res.json(resp, err ? 500 : 200);
                });
            });
            
        }
    };
    
};