# Rest API Helper

Creates standard CRUD endpoints for content management systems.


****

listen(cfg)

*	*server* `Object` is a reference to the server app
*	*cfg* `Object` is an object literal with:
*	*cfg.name* `String` for endpoint, will lead to: /api/cfg.name
*	*cfg.schema* `Object` instance of database schema forming resource basis