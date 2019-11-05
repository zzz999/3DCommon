var Util = {
    extend:function(destination, source, alias) {
        for (var property in source) {
            destination[property] = source[property];
            if(alias){
                alias[property] = source[property];
            }
        }
        return destination;
    }
}

export {Util};