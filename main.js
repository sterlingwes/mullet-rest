/*
* # Rest API Helper
* 
* Creates standard CRUD endpoints for content management systems.
* 
* @exports {Object} api
*/

var EJSON = require('meteor-ejson')
  , _ = require('underscore');

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
         * @param {Object} app is a reference to the server app
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
            
            app.post(name, function(req,res) {
                var data = _.pick(req.body, cfg.whitelist);
                
                cfg.schema.insert(data, function(err,result) {
                    var resp = getBasicResponse(err);
                    resp.added = data;
                    
                    if(typeof cfg.done === 'function') {
                        cfg.done('post', result);
                    }
                    res.json(resp, err ? 500 : 200);
                });
            });
            
            // allow partial update / removal
            app.put(name, function(req,res) {
                var data = EJSON.parse(req.body);
                    
                if(!data._id)
                    return res.json({ok:false, reason:'Invalid selector for update.', data:data});
                    
                if(!data && !req.body.field)
                    return res.json({ok:false, reason:'Invalid request.'});
                
                var chgSet = {};
                
                // we're unsetting something
                if(!data) {
                    chgSet.$unset = {};
                    chgSet.$unset[req.body.field] = 1;
                }
                else {
                    chgSet.$set = {};
                    chgSet.$set[data.field] = _.pick(data, 'title', 'body');
                }
                
                cfg.schema.update({_id: data._id}, chgSet, function(err,result) {
                    var resp = getBasicResponse(err);
                    resp.result = result;
                    
                    if(typeof cfg.done === 'function' && result) {
                        cfg.schema.find({_id:data._id}, function(err,posts) {
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
            
            app.delete(name, function(req,res) {
                var selector = EJSON.parse(req.body.selector);
                    
                if(!selector._id)
                    return res.json({ok:false, reason:'Invalid selector for removal.', selector:selector});
                    
                cfg.schema.remove(selector, function(err,result) {
                    var resp = getBasicResponse(err);
                    resp.result = result;
                    
                    if(typeof cfg.done === 'function' && result) {
                        cfg.done('delete', selector._id);
                    }
                    res.json(resp, err ? 500 : 200);
                });
            });
            
        }
    };
    
};