(function(window)
{
    var Gitana = window.Gitana;
    
    Gitana.AbstractObject = Gitana.AbstractPersistable.extend(
    /** @lends Gitana.AbstractObject.prototype */
    {
        /**
         * @constructs
         * @augments Gitana.AbstractPersistable
         *
         * @class Abstract base class for Gitana document objects.
         *
         * @param {Gitana.Platform} platform
         * @param [Object] object
         */
        constructor: function(platform, object)
        {
            if (!this.system)
            {
                this.system = new Gitana.SystemMetadata(platform);
            }


            ///////////////////////////////////////////////////////////////////////////////////////////////
            //
            // INSTANCE CHAINABLE METHODS
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////

            /**
             * Executes an HTTP delete for this object and continues the chain with the chainable.
             *
             * @param chainable
             * @param uri
             * @param params
             */
            this.chainDelete = function(chainable, uri, params)
            {
                var self = this;

                return this.link(chainable).then(function() {

                    var chain = this;

                    // allow for closures on uri for late resolution
                    if (Gitana.isFunction(uri)) {
                        uri = uri.call(self);
                    }

                    // delete
                    chain.getDriver().gitanaDelete(uri, params, function() {
                        chain.next();
                    }, function(http) {
                        self.httpError(http);
                    });

                    // NOTE: we return false to tell the chain that we'll manually call next()
                    return false;
                });
            };

            /**
             * Reloads this object from the server and then passes control to the chainable.
             *
             * @param uri
             * @param params
             */
            this.chainReload = function(chainable, uri, params)
            {
                var self = this;

                return this.link(chainable).then(function() {

                    var chain = this;

                    // allow for closures on uri for late resolution
                    if (Gitana.isFunction(uri)) {
                        uri = uri.call(self);
                    }

                    // reload
                    chain.getDriver().gitanaGet(uri, params, function(obj) {
                        chain.handleResponse(obj);
                        chain.next();
                    }, function(http) {
                        self.httpError(http);
                    });

                    // NOTE: we return false to tell the chain that we'll manually call next()
                    return false;
                });
            };

            /**
             * Executes an update (write + read) of this object and then passes control to the chainable.
             *
             * @param chainable
             * @param uri
             * @param params
             */
            this.chainUpdate = function(chainable, uri, params)
            {
                var self = this;

                return this.link(chainable).then(function() {

                    var chain = this;

                    // allow for closures on uri for late resolution
                    if (Gitana.isFunction(uri)) {
                        uri = uri.call(self);
                    }

                    // delete
                    chain.getDriver().gitanaPut(uri, params, chain.object, function() {
                        chain.getDriver().gitanaGet(uri, params, function(obj) {
                            chain.handleResponse(obj);
                            chain.next();
                        }, function(http) {
                            self.httpError(http);
                        });
                    }, function(http) {
                        self.httpError(http);
                    });

                    // NOTE: we return false to tell the chain that we'll manually call next()
                    return false;
                });
            };


            // finally chain to parent prototype
            this.base(platform, object);
        },

        /**
         * @EXTENSION_POINT
         */
        getUri: function()
        {
            return null;
        },

        getDownloadUri: function()
        {
            return this.getDriver().proxyURI + this.getUri();
        },

        /**
         * Get a json property
         *
         * @param key
         */
        get: function(key)
        {
            return this.object[key];
        },

        /**
         * Set a json property
         *
         * @param key
         * @param value
         */
        set: function(key ,value)
        {
            this.object[key] = value;
        },

        /**
         * Hands back the ID ("_doc") of this object.
         *
         * @public
         *
         * @returns {String} id
         */
        getId: function()
        {
            return this.get("_doc");
        },

        /**
         * Hands back the system metadata for this object.
         *
         * @public
         *
         * @returns {Gitana.SystemMetadata} system metadata
         */
        getSystemMetadata: function()
        {
            return this.system;
        },

        /**
         * The title for the object.
         *
         * @public
         *
         * @returns {String} the title
         */
        getTitle: function()
        {
            return this.get("title");
        },

        /**
         * The description for the object.
         *
         * @public
         *
         * @returns {String} the description
         */
        getDescription: function()
        {
            return this.get("description");
        },

        // TODO: this is a temporary workaround at the moment
        // it has to do all kinds of special treatment for _ variables because these variables are
        // actually system managed but they're on the top level object.
        //
        // TODO:
        // 1) gitana repo system managed properties should all be under _system
        // 2) the system block should be pulled off the object on read and not required on write

        /**
         * Replaces all of the properties of this object with those of the given object.
         * This method should be used to update the state of this object.
         *
         * Any functions from the incoming object will not be copied.
         *
         * @public
         *
         * @param object {Object} object containing the properties
         */
        replacePropertiesWith: function(object)
        {
            // create a copy of the incoming object
            var candidate = {};
            Gitana.copyInto(candidate, object);

            // we don't allow the following values to be replaced
            var backups = {};
            backups["_doc"] = this.object["_doc"];
            delete candidate["_doc"];
            backups["_type"] = this.object["_type"];
            delete candidate["_type"];
            backups["_qname"] = this.object["_qname"];
            delete candidate["_qname"];

            // remove our properties
            for (var i in this.object) {
                if (this.object.hasOwnProperty(i) && !Gitana.isFunction(this.object[i])) {
                    delete this.object[i];
                }
            }

            // restore
            this.object["_doc"] = backups["_doc"];
            this.object["_type"] = backups["_type"];
            this.object["_qname"] = backups["_qname"];

            // copy in candidate properties
            Gitana.copyInto(this.object, candidate);
        },

        /**
         * @override
         */
        handleSystemProperties: function()
        {
            if (this.object)
            {
                if (this.object["_system"])
                {
                    // strip out system metadata
                    var json = {};
                    Gitana.copyInto(json, this.object["_system"]);
                    delete this.object["_system"];

                    // update system properties
                    this.system.updateFrom(json);
                }
            }
        },

        /**
         * Helper function to convert the object portion to JSON
         *
         * @param pretty
         */
        stringify: function(pretty)
        {
            return Gitana.stringify(this.object, pretty);
        },

        /**
         * Helper method that loads this object from another object of the same type.
         *
         * For example, loading a node from another loaded node.
         *
         * @param anotherObject
         */
        loadFrom: function(anotherObject)
        {
            this.handleResponse(anotherObject.object);
            this.system.updateFrom(anotherObject.system._system);
        }

    });

})(window);
