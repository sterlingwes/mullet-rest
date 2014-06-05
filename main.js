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
                    resp[name] = EJSON.toJSONValue(posts);
                    res.json(err ? 500 : 200, resp);
                    
                    if(typeof cfg.done === 'function')
                        cfg.done('get');
                });
            });
            
            app.post(name, function(req,res) {
                var data = EJSON.toJSONValue(_.pick(req.body, cfg.whitelist))
                  , host = req.get('host');
                  
                data.domain = host;
                
                cfg.schema.insert(data, function(err,result) {
                    var resp = getBasicResponse(err);
                    resp.added = data;
                    
                    if(typeof cfg.done === 'function') {
                        cfg.done('post', result);
                    }
                    res.json(err ? 500 : 200, resp);
                });
            });
            
            app.put(name, function(req,res) {
                var data = EJSON.fromJSONValue(_.pick(req.body, cfg.whitelist));
                    
                if(!req.body._id)
                    return res.json({ok:false, reason:'Invalid selector for update.', data:data});
                
                cfg.schema.update({_id: req.body._id}, {$set: data}, function(err,result) {
                    var resp = getBasicResponse(err);
                    resp.result = result;
                    if(err)
                        resp.data = data;
                    
                    if(typeof cfg.done === 'function' && result) {
                        var updPost = _.extend({}, data, {_id:req.body._id});
                        cfg.done('put', updPost);
                    }
                    
                    res.json(err ? 500 : 200, resp);
                });
            });
            
            app.delete(name + '/:id', function(req,res) {
                var selector = { _id : req.params.id };
                  
                if(!selector._id)
                    return res.json({ok:false, reason:'Invalid selector for removal.', selector:selector});
                    
                cfg.schema.remove(selector, function(err,result) {
                    var resp = getBasicResponse(err);
                    resp.result = result;
                    
                    if(typeof cfg.done === 'function' && result) {
                        cfg.done('delete');
                    }
                    res.json(err ? 500 : 200, resp);
                });
            });
            
        }
    };
    
};