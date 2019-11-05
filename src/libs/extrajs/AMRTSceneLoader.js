THREE.AMRTSceneLoader = function ( manager ) {
    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    this.cacheMats = [];
    this.cacheMeshes = [];
    this.isTOK = false;
    this.scene = null;
    this.isAndroid = false;
};

THREE.AMRTSceneLoader.prototype = {

    constructor: THREE.AMRTSceneLoader,

    crossOrigin: 'anonymous',

    load: function (url, onLoad, onProgress, onError) {

        var scope = this;

        var loader = new THREE.FileLoader(scope.manager);

        loader.load(url, function (text) {

            try {
                scope.parse(JSON.parse(text));
                onLoad(scope.scene);
            } catch (exception) {

                if (onError) {

                    onError(exception);

                }

            }

        }, onProgress, onError);

    },


    loadTexture:function (url, onProgress, onError) {

        var scope = this;

        var loader = new THREE.FileLoader(scope.manager);

        loader.load(url, function (text) {

            try {
                scope.isTOK = true;
                scope.parseTexture(JSON.parse(text));

            } catch (exception) {

                if (onError) {
                    onError(exception);

                }

            }

        }, onProgress, onError);
    },

    loadThumbTexture:function (url, onProgress, onError) {

        var scope = this;

        var loader = new THREE.FileLoader(scope.manager);

        loader.load(url, function (text) {

            try {
                if(!scope.isTOK){
                    scope.parseThumbnil(JSON.parse(text));
                }

            } catch (exception) {

                if (onError) {

                    onError(exception);

                }

            }

        }, onProgress, onError);
    },

    loadEnvMap:function (url, onProgress, onError) {
        var scope = this;

        var loader = new THREE.FileLoader(scope.manager);

        loader.load(url, function (text) {

            try {

                scope.parseEvnMap(JSON.parse(text));

            } catch (exception) {

                if (onError) {

                    onError(exception);

                }

            }

        }, onProgress, onError);

    },

    loadLightMap:function (url, onProgress, onError) {
        var scope = this;

        var loader = new THREE.FileLoader(scope.manager);

        loader.load(url, function (text) {

            try {

                scope.parseLightMap(JSON.parse(text));

            } catch (exception) {

                if (onError) {

                    onError(exception);

                }

            }

        }, onProgress, onError);

    },

    parse: function (data) {
        if (!this.scene) {
            this.parseScene(data);
        }

        this.parseGeometry(data);
    },

    parseScene: function(data){
        this.scene = new THREE.Scene();
        this.scene.name = "Scene";
        var light;
        if(data.lights && data.lights.length > 0){
            for(var lightIndex = 0;lightIndex<data.lights.length;lightIndex++){
                if(data.lights[lightIndex].type === 0){
                    light = new THREE.AmbientLight(new THREE.Color().fromArray(data.lights[lightIndex].color),data.lights[lightIndex].intensity);
                }else if(data.lights[lightIndex].type === 1){
                    light = new THREE.DirectionalLight(new THREE.Color().fromArray(data.lights[lightIndex].color),data.lights[lightIndex].intensity);
                    light.position.copy(new THREE.Vector3().fromArray(data.lights[lightIndex].position));
                    light.rotation.copy(new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(data.lights[lightIndex].rotation),"XYZ"));
                }else if(data.lights[lightIndex].type === 2){
                    light = new THREE.PointLight(new THREE.Color().fromArray(data.lights[lightIndex].color),data.lights[lightIndex].intensity,data.lights[lightIndex].range);
                }else if(data.lights[lightIndex].type === 3){
                    light = new THREE.SpotLight(new THREE.Color().fromArray(data.lights[lightIndex].color),data.lights[lightIndex].intensity,data.lights[lightIndex].range,data.lights[lightIndex].angle);
                }
                this.scene.add(light);
            }
        }

        //this.scene.scale.x = -1;
    },

    parseGeometry: function(data){
        this.scene.name = data.name;
        var meshes = data.meshes;

        var baseMat = new THREE.MeshBasicMaterial({color:0xcccccc});
        for(var i = 0;i < meshes.length; i++){
            var geo = this.genGeometry(meshes[i].geometry);
            var mesh;
            //Empty Unity GameObject
            if(geo === null){
                mesh = new THREE.Object3D();
            }else{
                mesh = new THREE.Mesh(geo,[baseMat]);
                mesh.matNames = meshes[i].materials;
            }
            mesh.name = meshes[i].name;
            mesh.ID = meshes[i].transform.ID;
            mesh.pid = meshes[i].pid;
            mesh.lid = meshes[i].lid;

            mesh.parentID = meshes[i].transform.parentID;

            mesh.position.copy(this.parseVector3(meshes[i].transform.position));

            mesh.rotation.copy(new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(meshes[i].transform.rotation),"XYZ"));
            mesh.scale.copy(this.parseVector3(meshes[i].transform.scale));

            if(mesh.parentID === -1){
                this.scene.add(mesh);
            }else{
                this.scene.traverse(function (obj) {
                    {
                        if (obj.ID === mesh.parentID) {
                            obj.add(mesh);
                        }
                    }
                });
            }
            this.cacheMeshes.push(mesh);
            if(mesh.name === "chushiweizhi"){
                //todo
            }
        }

        this.parseHierarchy(meshes);

        //shared materials
        if(data.materials != null)
        for(var matIndex = 0;matIndex < data.materials.length;matIndex++){
            var mat = this.genMaterial(data.materials[matIndex]);
            for(var mIndex = 0;mIndex < this.cacheMeshes.length;mIndex++) {
                if(this.cacheMeshes[mIndex].matNames && this.cacheMeshes[mIndex].matNames.length > 0){
                    for(var i = 0;i<this.cacheMeshes[mIndex].matNames.length;i++){
                        if(this.cacheMeshes[mIndex].matNames[i] === mat.name){
                            this.cacheMeshes[mIndex].material[i] = mat;
                            this.cacheMeshes[mIndex].material.needsUpdate = true;

                        }
                    }
                }
            }
        }

    },

    parseHierarchy:function (data) {
        //todo recoding
    },

    parseEvnMap:function (data) {
        //posx, negx, posy, negy, posz, negz

        if(data && data.name && data.px && data.px !== ""){

            var envMap = new THREE.CubeTexture();

            this.createCubeTextureFromString(data.px,envMap,data.name,0);

            this.createCubeTextureFromString(data.nx,envMap,data.name,1);

            this.createCubeTextureFromString(data.py,envMap,data.name,2);

            this.createCubeTextureFromString(data.ny,envMap,data.name,3);

            this.createCubeTextureFromString(data.pz,envMap,data.name,4);

            this.createCubeTextureFromString(data.nz,envMap,data.name,5);

        }
    },

    parseLightMap:function (data) {
        if(data && data.index !== undefined){
            var lightMap = this.createTextureFromString(data.base64str);

            for(var matIndex = 0; matIndex < this.cacheMeshes.length; matIndex++){
                if(this.cacheMeshes[matIndex].lid === data.index){
                    //todo only update one material
                    this.cacheMeshes[matIndex].material.forEach(function(mat){
                        mat.lightMap = lightMap;
                        mat.needsUpdate = true;
                    });
                }
            }
        }
    },

    genGeometry: function(geoData){
        var geo = new THREE.BufferGeometry();
        geo.name = geoData.name;

        //postion
        if(geoData.vertexes && geoData.vertexes.length > 0){
            geo.addAttribute('position',new THREE.Float32BufferAttribute(geoData.vertexes,3));
        }else{
            return null;
        }

        //normal
        if(geoData.normals && geoData.normals.length > 0){
            geo.addAttribute( 'normal', new THREE.Float32BufferAttribute( geoData.normals, 3 ) );
        }

        //uv
        if(geoData.uv && geoData.uv.length > 0){
            geo.addAttribute( 'uv', new THREE.Float32BufferAttribute( geoData.uv, 2 ) );
        }

        //uv3
        if(geoData.uv3 && geoData.uv3.length > 0){
            geo.addAttribute( 'uv3', new THREE.Float32BufferAttribute( geoData.uv3, 2 ) );
        }

        geo.setIndex(geoData.faces);

        geo.clearGroups();

        if(geoData.groups && geoData.groups.length > 0){
            var groupsCount = geoData.groups.length/3;
            for(var groupindex = 0;groupindex < groupsCount;groupindex++){
                geo.addGroup(geoData.groups[groupindex*3],geoData.groups[groupindex*3+1],geoData.groups[groupindex*3+2]);
            }
        }

        return geo;
    },

    genMaterial: function(MatData){
        var mat;
        if(MatData.type === "Physical"){
            var params = {};

            params.color = this.parseColor(MatData.color);
            params.emissive = this.parseColor(MatData.emissive);

            if (MatData.eintensity !== undefined) {
                params.emissiveIntensity = MatData.eintensity;
            }

            if (MatData.metallic !== undefined) {
                params.metalness = MatData.metallic;
            } else {
                params.metalness = 0.5;
            }

            if (MatData.smoothness !== undefined) {
                params.roughness = 1 - MatData.smoothness;
            } else {
                params.roughness = 0.5;
            }

            if(MatData.opacity && MatData.opacity < 1){
                params.transparent = true;
                params.opacity = MatData.opacity;
            }

            params.envMapIntensity = 1;
            params.clearCoat = 1;
            params.clearCoatRoughness = 1;
            params.reflectivity = 1;
            params.lightMapIntensity = 1;
            params.fog = false;

            for(var index = 0;index < MatData.textures.length;index++){
                var texture = MatData.textures[index];
                switch (texture.propname){
                    case "_Albedo":
                        params.mapName = texture.name === undefined ? '' : texture.name;
                        params.mapscale = new THREE.Vector2().fromArray(texture.scale);
                        params.mapoffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_Normal":
                        params.normalMapName = texture.name === undefined ? '' : texture.name;
                        params.norscale = new THREE.Vector2().fromArray(texture.scale);
                        params.noroffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_EmissionMap":
                        params.emissionMapName = texture.name === undefined ? '' : texture.name;
                        params.emiscale = new THREE.Vector2().fromArray(texture.scale);
                        params.emioffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                }
            }

            var normals = MatData.normalscale > 1 ? 1 :MatData.normalscale;
            if(MatData.normalscale){
                params.normalScale = new THREE.Vector2(normals,normals);
            }else{
                params.normalScale = new THREE.Vector2(1,1);
            }

            params.name = MatData.name;
            mat = new THREE.MeshAMRTHXMaterial(params);

            //∫Í∂®“Â
            mat.defines.MAX_MIPLEVEL = this.isAndroid ? 9 : 10;
        } else {
            mat = new THREE.MeshStandardMaterial();
            mat.name = MatData.name;
            mat.color = this.parseColor(MatData.color);
            mat.emissive = this.parseColor(MatData.emissive);
            mat.emissiveIntensity = MatData.eintensity === undefined ? 1 : MatData.eintensity;
            mat.lightMapIntensity = 1;
            mat.envMapIntensity = 1;
            mat.fog = false;

            if (MatData.metallic !== undefined) {
                mat.metalness = MatData.metallic;
            } else {
                mat.metalness = 0.5;
            }

            if (MatData.smoothness !== undefined) {
                mat.roughness = 1 - MatData.smoothness;
            } else {
                mat.roughness = 0.5;
            }
            
            if (MatData.opacity && MatData.opacity < 1) {
                mat.transparent = true;
                mat.opacity = MatData.opacity;
            }

            for (var index = 0; index < MatData.textures.length; index++) {
                var texture = MatData.textures[index];
                switch (texture.propname) {
                    case "_Albedo":
                        mat.mapName = texture.name === undefined ? '' : texture.name;
                        mat.mapscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.mapoffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_Normal":
                        mat.normalMapName = texture.name === undefined ? '' : texture.name;
                        mat.norscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.noroffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_EmissionMap":
                        mat.emissionMapName = texture.name === undefined ? '' : texture.name;
                        mat.emiscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.emioffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                }
            }
           
            var normals = MatData.normalscale > 1 ? 1 : MatData.normalscale;
            if (MatData.normalscale) {
                mat.normalScale = new THREE.Vector2(normals, normals);
            } else {
                mat.normalScale = new THREE.Vector2(1, 1);
            }
        }

        if(mat){
            //the index of lightmap
            mat.lightmapIndex = MatData.lightmapindex;
            mat.envmapid = MatData.envmapid;
            //cache material
            this.cacheMats.push(mat);
        }

        return mat;
    },

    parseTexture: function (data) {
        this.genTexture(data.base64str,data.name);
    },

    parseThumbnil: function (data) {

        var textures = data;

        for(var i = 0;i < textures.length;i++){

            this.genTexture(textures[i].base64str,textures[i].name);

        }
    },

    genTexture: function (base64str,tname) {

        var image = new Image();
        image.src = 'data:image/png;base64,' + base64str;

        var loadData = this;
        var Tname = tname;
        image.onload = function () {

            for(var mi = 0; mi <loadData.cacheMats.length;mi++){
                if(loadData.cacheMats[mi].mapName === Tname){

                    loadData.setTexture(loadData.cacheMats[mi],image,0);

                }
                if(loadData.cacheMats[mi].normalMapName === Tname){

                    loadData.setTexture(loadData.cacheMats[mi],image,1);

                }
                if (loadData.cacheMats[mi].emissionMapName === Tname) {

                    loadData.setTexture(loadData.cacheMats[mi],image,2);

                }
            }
        }
    },

    setTexture:function(mat,img,type){
        var texture = new THREE.Texture();
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.image = img;

        if(mat.isShadow){
            mat.opacity = mat.ropacity;
        }

        switch (type){
            case 0:
                texture.repeat.copy(mat.mapscale);
                texture.offset.copy(mat.mapoffset);
                mat.map = texture;
                break;
            case 1:
                texture.repeat.copy(mat.norscale);
                texture.offset.copy(mat.noroffset);
                mat.normalMap = texture;
                break;
            case 2:
                texture.repeat.copy(mat.emiscale);
                texture.offset.copy(mat.emioffset);
                mat.emissiveMap = texture;
                break;
        }
        texture.needsUpdate = true;
        texture.updateMatrix();
        mat.needsUpdate = true;
    },

    createTextureFromString:function (base64str) {
        var image = new Image();
        image.src = 'data:image/jpg;base64,' + base64str;
        var texture = new THREE.Texture();
        texture.image = image;
        image.onload = function(){
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            texture.isReady = true;
        };
        return texture;
    },

    createCubeTextureFromString:function (base64str,map,envmapid,t) {
        var image = new Image();
        image.crossOrigin = "anonymous";
        image.src = 'data:image/png;base64,' + base64str;
        var envMap = map;
        var type = t;
        var cscope = this;
        image.onload = function(){
            if(type === 0){
                envMap.images[0] = image;
            }else if(type === 1){
                envMap.images[1] = image;
            }else if(type === 2){
                envMap.images[2] = image;
            }else if(type === 3){
                envMap.images[3] = image;
            }else if(type === 4){
                envMap.images[4] = image;
            }else if(type === 5){
                envMap.images[5] = image;
            }
            if(envMap.images[0] && envMap.images[1] && envMap.images[2] && envMap.images[3] && envMap.images[4] && envMap.images[5]){
                envMap.format = THREE.RGBAFormat;
                envMap.encoding = THREE.LinearEncoding;
                envMap.mapping = THREE.CubeReflectionMapping;
                envMap.needsUpdate = true;
                if(envmapid === "sky"){
                    cscope.scene.background = envMap;
                }else{
                    //for(var matIndex = 0; matIndex < cscope.cacheMeshes.length; matIndex++){
                    //    if(cscope.cacheMeshes[matIndex].pid === parseInt(envmapid)){
                    //        cscope.cacheMeshes[matIndex].material.forEach(function(mat){
                    //            mat.envMap = envMap;
                    //            mat.needsUpdate = true;
                    //        });
                    //    }
                    //}
                    for (var matIndex = 0; matIndex < cscope.cacheMats.length; matIndex++) {
                        cscope.cacheMats[matIndex].envMap = envMap;
                        cscope.cacheMats[matIndex].needsUpdate = true;
                    }
                }
            }

        };
    },

    parseColor: function(rgbArray){
        return new THREE.Color(rgbArray[0],rgbArray[1],rgbArray[2],rgbArray[3]?rgbArray[3]:1);
    },

    parseVector3:function(v3){
        return new THREE.Vector3(v3[0],v3[1],v3[2]);
    }

};