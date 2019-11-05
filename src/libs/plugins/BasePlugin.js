function BasePlugin(viewer, options) {
    this.options = options || {};
    viewer[this.name] = {};
    this.alias;
    if(this.options.alias){
        this.alias = viewer[this.options.alias] = {};
    }
}

export {BasePlugin};