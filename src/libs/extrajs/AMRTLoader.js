//Loader for AMRT Files
//
//
THREE.AMRTLoader = function ( manager ) {

    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    this.endLoad = false;
    this.cacheMats = [];
    this.cacheMeshes = [];
    this.cacheAnimations = [];
    this.cacheActions = [];
    this.isTOK = false;
    this.scene = null;

    this.textureNum = 0;
    this.count = 0;
    this.isAndroid = false;
    this.envMapNum = 1;
    this.envMapCount = 0;
};

THREE.AMRTLoader.prototype = {

    constructor: THREE.AMRTLoader,

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

    loadRealTexture: function (url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new THREE.FileLoader(scope.manager);
        loader.load(url, function (text) {
            try {
                scope.isTOK = true;
                scope.parseRealTexture(JSON.parse(text), onLoad);
            } catch (exception) {
                if (onError) {
                    onError(exception);
                }
            }
        }, onProgress, onError);
    },

    parseRealTexture: function (data, callback) {
        var textures = data;
        this.genTexture(textures.base64str, textures.name, callback);
    },

    loadTexture: function (url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new THREE.FileLoader(scope.manager);
        loader.load(url, function (text) {
            try {
                scope.isTOK = true;
                scope.parseTexture(JSON.parse(text), onLoad);
            } catch (exception) {
                if (onError) {
                    onError(exception);
                }
            }
        }, onProgress, onError);
    },

    parseTexture: function (data, callback) {
        var textures = data;
        this.textureNum = textures.length;
        for (var i = 0; i < textures.length; i++) {
            this.genTexture(textures[i].base64str, textures[i].name, callback);
        }
    },

    loadThumbTexture: function (url, onProgress, onError) {
        var scope = this;
        var loader = new THREE.FileLoader(scope.manager);
        loader.load(url, function (text) {
            try {
                if(!scope.isTOK){
                    scope.parseThumbTexture(JSON.parse(text));
                }
            } catch (exception) {

                if (onError) {

                    onError(exception);

                }

            }

        }, onProgress, onError);
    },

    parseThumbTexture: function (data) {

        var textures = data;

        for (var i = 0; i < textures.length; i++) {

            this.genTexture(textures[i].base64str, textures[i].name);

        }
    },

    loadEnvMap:function (url, callback, onProgress, onError) {
        var scope = this;

        var loader = new THREE.FileLoader(scope.manager);

        loader.load(url, function (text) {

            try {

                scope.parseEvnMap(JSON.parse(text), callback);

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
        var ambient = new THREE.AmbientLight();
        ambient.color = new THREE.Color('#cccccc');
        ambient.intensity = 0.775;
        this.scene.add(ambient);
        var directionLight = new THREE.DirectionalLight('#ffffff', 0.3);
        directionLight.castShadow = false;
        directionLight.position.copy(new THREE.Vector3(0, 355, 0));
        directionLight.rotation.x = 1.0471976;
        directionLight.rotation.y = 0.7853982;
        directionLight.rotation.z = 0;
        this.scene.add(directionLight);
        this.scene.scale.x = -1;
    },

    parseGeometry: function(data){
        this.scene.name = data.name;

        var meshes = data.meshes;

        var baseMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        for (var i = 0; i < meshes.length; i++) {
            var geo = this.genGeometry(meshes[i].geometry);
            var mesh;
            //Empty Unity GameObject
            if (geo === null) {
                if (meshes[i].light) {
                    if (meshes[i].light.isLight) {
                        continue;
                    } else {
                        mesh = new THREE.Object3D();
                    }
                } else {
                    mesh = new THREE.Object3D();
                }

            } else {
                mesh = new THREE.Mesh(geo, [baseMat]);
                mesh.matNames = meshes[i].materials;
                //mesh.onBeforeRender = this.onBeforeRender;
            }
            mesh.name = meshes[i].name;
            mesh.ID = meshes[i].transform.ID;

            mesh.parentID = meshes[i].transform.parentID;

            mesh.position.copy(this.parseVector3(meshes[i].transform.position));

            mesh.rotation.copy(new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(meshes[i].transform.rotation), "XYZ"));
            mesh.scale.copy(this.parseVector3(meshes[i].transform.scale));
            //2018-12-8
            mesh.skinned = meshes[i].skinned;

            this.parseAnimations(meshes[i], mesh);
            this.cacheMeshes.push(mesh);
            this.scene.add(mesh);
        }
     
        if (this.endLoad) {
            this.parseHierarchy(meshes);

            for (var index = 0; index < this.cacheMeshes.length; index++) {
                var amesh = this.cacheMeshes[index];
                if (amesh.clip) {
                    var mixer = new THREE.AnimationMixer(amesh);
                    var action = mixer.clipAction(amesh.clip);
                    action.play();
                    this.cacheActions.push(action);
                    this.cacheAnimations.push(mixer);
                }
            }

            //shared materials
            if (data.materials != null) {
                for (var matIndex = 0; matIndex < data.materials.length; matIndex++) {
                    var mat = this.genMaterial(data.materials[matIndex]);
                    for (var mIndex = 0; mIndex < this.cacheMeshes.length; mIndex++) {
                        if (this.cacheMeshes[mIndex].matNames && this.cacheMeshes[mIndex].matNames.length > 0) {
                            for (var i = 0; i < this.cacheMeshes[mIndex].matNames.length; i++) {
                                if (this.cacheMeshes[mIndex].matNames[i] === mat.name) {
                                    this.cacheMeshes[mIndex].material[i] = mat;
                                    this.cacheMeshes[mIndex].material.needsUpdate = true;

                                }
                            }
                        }
                    }
                }
            }
        }
    },

    parseHierarchy:function (data) {
        for (var index = 0; index < this.cacheMeshes.length; index++) {
            if (this.cacheMeshes[index].parentID !== -1 && this.cacheMeshes[index].parent === this.scene) {
                for (var j = 0; j < this.cacheMeshes.length; j++) {
                    if (this.cacheMeshes[j].ID === this.cacheMeshes[index].parentID) {
                        this.cacheMeshes[j].add(this.cacheMeshes[index]);
                        break;
                    }
                }
            }
        }
    },

    //2018-12-8
    updateSkinned: function () {
        for (var index = 0; index < this.cacheMeshes.length; index++) {
            var mesh = this.cacheMeshes[index];
            if (mesh.skinned && mesh.skinned.skinned) {
                mesh.material.forEach(function (mat) {
                    mat.skinning = true;
                    mat.needsUpdate = true;
                });
                mesh.type = 'SkinnedMesh';
                mesh.isSkinnedMesh = true;
                mesh.bindMode = 'attached';
                mesh.updateMatrixWorld(true);

                var bones = [];
                var boneInverses = [];
                for (var boneindex = 0; boneindex < mesh.skinned.bones.length; boneindex++) {
                    for (var mindex = 0, l = this.cacheMeshes.length; mindex < l; mindex++) {
                        var m = this.cacheMeshes[mindex];
                        if (m.ID === mesh.skinned.bones[boneindex]) {
                            m.isBone = true;
                            m.type = 'Bone';
                            bones.push(m);
                            var inverse = new THREE.Matrix4();
                            boneInverses.push(inverse.getInverse(m.matrixWorld));
                            break;
                        }
                    }
                }

                mesh.bindMatrix = new THREE.Matrix4().copy(mesh.matrixWorld);
                mesh.bindMatrixInverse = new THREE.Matrix4().getInverse(mesh.matrixWorld);



                mesh.skeleton = new THREE.Skeleton(bones, boneInverses);

                mesh.updateMatrixWorld = function (force) {
                    THREE.Mesh.prototype.updateMatrixWorld.call(this, force);

                    this.bindMatrixInverse.getInverse(this.matrixWorld);
                };
            }
        }
    },

    loadAnimations:function(url,onLoad, onProgress, onError){
        var scope = this;

        var loader = new THREE.FileLoader(scope.manager);

        loader.load(url, function (text) {

            try {
                //2018-12-8
                scope.updateSkinned();
                scope.parseDetachAnimations(JSON.parse(text));
                onLoad();

            } catch (exception) {

                if (onError) {

                    onError(exception);

                }

            }

        }, onProgress, onError);
    },
    parseDetachAnimations:function (data) {
        var amesh;
        for(var index = 0;index < this.cacheMeshes.length;index++){
            if(this.cacheMeshes[index].ID === data.id){
                amesh = this.cacheMeshes[index];
                break;
            }
        }
        var animations = data.animations;
        if(animations && animations.length > 0){
            var keyframes = [];
            var duration = 0;
            for(var aIndex = 0; aIndex < animations.length;aIndex++){
                if(animations[aIndex].times.length !== 0){
                    var temp = animations[aIndex].times[animations[aIndex].times.length - 1];
                    if(temp > duration){
                        duration = temp;
                    }
                    if(animations[aIndex].name.endsWith(".quaternion")){
                        keyframes.push(new THREE.QuaternionKeyframeTrack(animations[aIndex].name,animations[aIndex].times,animations[aIndex].datas));
                    }else{
                        keyframes.push(new THREE.NumberKeyframeTrack(animations[aIndex].name,animations[aIndex].times,animations[aIndex].datas));
                    }

                }
            }

            if(keyframes.length > 0 && amesh){
                amesh.clip = new THREE.AnimationClip(amesh.name,duration,keyframes);
                var mixer = new THREE.AnimationMixer(amesh);
                var action = mixer.clipAction(amesh.clip);
                action.play();
                this.cacheActions.push(action);
                this.cacheAnimations.push(mixer);
            }

        }
    },
    parseAnimations:function (data,mesh) {
        var animations = data.animations;
        if(animations && animations.length > 0){
            var keyframes = [];
            var duration = 0;
            for(var aIndex = 0; aIndex < animations.length;aIndex++){
                if(animations[aIndex].times.length !== 0){
                    var temp = animations[aIndex].times[animations[aIndex].times.length - 1];
                    if(temp > duration){
                        duration = temp;
                    }
                    if(animations[aIndex].name.endsWith(".quaternion")){
                        keyframes.push(new THREE.QuaternionKeyframeTrack(animations[aIndex].name,animations[aIndex].times,animations[aIndex].datas));
                    }else{
                        keyframes.push(new THREE.NumberKeyframeTrack(animations[aIndex].name,animations[aIndex].times,animations[aIndex].datas));
                    }

                }
            }

            if(keyframes.length > 0){
                mesh.clip = new THREE.AnimationClip(data.name,duration,keyframes);;
            }

        }
    },

    parseEvnMap: function (data, callback) {
        var scope = this;
        if (data && data.name) {
            var envMap;
            var prefix = 'data:image/png;base64,';
            if (data.nx && data.nx !== "") {
                envMap = new THREE.CubeTextureLoader().load([
                    prefix + data.px,
                    prefix + data.nx,
                    prefix + data.py,
                    prefix + data.ny,
                    prefix + data.pz,
                    prefix + data.nz
                ], function () {
                    scope.envMapCount++;
                    if (scope.envMapCount == scope.envMapNum) {
                        if (callback && callback instanceof Function) {
                            callback();
                        }
                    }
                });
                envMap.format = THREE.RGBFormat;
                envMap.mapping = THREE.CubeReflectionMapping;
            } else if (data.px && data.px !== "") {
                envMap = new THREE.TextureLoader().load(prefix + data.px, function () {
                    scope.envMapCount++;
                    if (scope.envMapCount == scope.envMapNum) {
                        if (callback && callback instanceof Function) {
                            callback();
                        }
                    }
                });
                envMap.mapping = THREE.EquirectangularReflectionMapping;
                envMap.magFilter = THREE.LinearFilter;
                envMap.minFilter = THREE.LinearMipMapLinearFilter;
            }
            if (envMap) {
                if (this.envMapNum === 1 || data.name === 'skybox') {
                    for (var matIndex = 0; matIndex < this.cacheMats.length; matIndex++) {
                        this.cacheMats[matIndex].envMap = envMap;
                        this.cacheMats[matIndex].needsUpdate = true;
                    }
                } else {
                    for (var matIndex = 0; matIndex < this.cacheMats.length; matIndex++) {
                        if (this.cacheMats[matIndex].envmapname === data.name) {
                            this.cacheMats[matIndex].matEnvMap = envMap;
                            this.cacheMats[matIndex].mixweight = this.cacheMats[matIndex].envmapintensity;
                            if (envMap.mapping === THREE.EquirectangularReflectionMapping) {
                                this.cacheMats[matIndex].defines.USE_MATENVMAP_EQUIREC = '';
                            } else {
                                this.cacheMats[matIndex].defines.USE_MATENVMAP_CUBE = '';
                            }
                            //叠加方式混合
                            this.cacheMats[matIndex].defines.MIX_ADD = '';
                            this.cacheMats[matIndex].needsUpdate = true;
                        }
                    }
                }
            }
        }
    },


    parseLightMap:function (data) {

        if(data && data.length > 0){
            for(var mapIndex = 0;mapIndex < data.length;mapIndex++){
                var lightMapData = data[mapIndex];
                var lightMap = this.createTextureFromString(lightMapData.base64str);

                for(var matIndex = 0; matIndex < this.cacheMats.length; matIndex++){
                    if(this.cacheMats[matIndex].lightmapIndex === mapIndex){
                        this.cacheMats[matIndex].lightMap = lightMap;
                        this.cacheMats[matIndex].needsUpdate = true;
                    }

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

        if(geoData.uv2 && geoData.uv2.length > 0){
            geo.addAttribute( 'uv2', new THREE.Float32BufferAttribute( geoData.uv2, 2 ) );
        }

        ////uv3
        //if(geoData.uv3 && geoData.uv3.length > 0){
        //    geo.addAttribute( 'uv3', new THREE.Float32BufferAttribute( geoData.uv3, 2 ) );
        //}

        //uv4 for ao
        //去除uv4
        //if(geoData.uv && geoData.uv.length > 0){
        //    geo.addAttribute( 'uv4', new THREE.Float32BufferAttribute( geoData.uv, 2 ) );
        //}
        //
        //uv4 for emissive map
        // if(geoData.uv2 && geoData.uv2.length > 0){
        //     geo.addAttribute( 'uv5', new THREE.Float32BufferAttribute( geoData.uv2, 2 ) );
        // }

        //2018-12-8
        if (geoData.weights && geoData.weights.length > 0) {
            geo.addAttribute('skinWeight', new THREE.Float32BufferAttribute(geoData.weights, 4));
        }

        if (geoData.indices && geoData.indices.length > 0) {
            geo.addAttribute('skinIndex', new THREE.Float32BufferAttribute(geoData.indices, 4));
        }
        //

        geo.setIndex(geoData.faces);

        geo.clearGroups();

        if(geoData.groups && geoData.groups.length > 0){
            var groupsCount = geoData.groups.length/3;
            for(var groupindex = 0;groupindex < groupsCount;groupindex++){
                geo.addGroup(geoData.groups[groupindex*3],geoData.groups[groupindex*3+1],geoData.groups[groupindex*3+2]);
            }
        }
        // tangent

        // THREE.BufferGeometryUtils.computeTangents(geo);
        // geo.needsUpdate = true;
        // geo.center();
        // geo.applyMatrix( new THREE.Matrix4().makeTranslation( offset.x,offset.y,offset.z ) );

        return geo;
    },

    genMaterial: function(MatData){
        var mat;
        if(MatData.type === "Physical"){
            var params = {};

            params.color = this.parseColor(MatData.color);
            params.emissive = this.parseColor(MatData.emissive);
            
            if(MatData.eintensity !== undefined){
                params.emissiveIntensity = MatData.eintensity;
            }

            if (MatData.metallic !== undefined) {
                params.metalness = MatData.metallic;
            }

            if (MatData.smoothness !== undefined) {
                params.roughness = 1 - MatData.smoothness;
            }

            //if (MatData.envmapintensity !== undefined) {
            //    params.reflectivity = 0.5 + MatData.envmapintensity;
            //}
            params.reflectivity = 1;
            
            if(MatData.aomapintensity !== undefined ){
                params.aoMapIntensity = MatData.aomapintensity;
            }

            //2019-1-2 兼容老数据
            if (MatData.color[3] !== undefined && MatData.color[3] === 0 && MatData.opacity === 0) {
                params.opacity = 1;
            } else {
                if (MatData.opacity !== undefined && MatData.opacity < 1) {
                    params.transparent = true;
                    params.opacity = MatData.opacity;
                }
            }

            for(var index = 0;index < MatData.textures.length;index++){
                var texture = MatData.textures[index];
                switch (texture.propname){
                    case "_Albedo":
                        params.mapName = texture.name === undefined ? '' : texture.name;
                        params.mapscale = new THREE.Vector2().fromArray(texture.scale);
                        params.mapoffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_Albedo2":
                        params.map2Name = texture.name === undefined ? '' : texture.name;
                        params.map2scale = new THREE.Vector2().fromArray(texture.scale);
                        params.map2offset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_Normal":
                        params.normalMapName = texture.name === undefined ? '' : texture.name;
                        params.norscale = new THREE.Vector2().fromArray(texture.scale);
                        params.noroffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_Normal2":
                        params.normalMap2Name = texture.name === undefined ? '' : texture.name;
                        params.nor2scale = new THREE.Vector2().fromArray(texture.scale);
                        params.nor2offset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_AOMap":
                        params.aoMapName = texture.name === undefined ? '' : texture.name;
                        params.aoscale = new THREE.Vector2().fromArray(texture.scale);
                        params.aooffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_MetallicMap":
                        params.metalMapName = texture.name === undefined ? '' : texture.name;
                        params.metscale = new THREE.Vector2().fromArray(texture.scale);
                        params.metoffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_EmissionMap":
                        params.emissionMapName = texture.name === undefined ? '' : texture.name;
                        params.emiscale = new THREE.Vector2().fromArray(texture.scale);
                        params.emioffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_EmissionMap2":
                        params.emissionMap2Name = texture.name === undefined ? '' : texture.name;
                        params.emi2scale = new THREE.Vector2().fromArray(texture.scale);
                        params.emi2offset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                }
            }

            var normals = MatData.normalscale > 1 ? 1 :MatData.normalscale;
            var normals2 = MatData.normalscale2 > 1 ? 1 :MatData.normalscale2;
            if(MatData.normalscale){
                params.normalScale = new THREE.Vector2(normals, normals);
            }else{
                params.normalScale = new THREE.Vector2(1, 1);
            }

            if(MatData.normalscale2){
                if(params.normalMap2Name && params.normalMapName){
                    params.normalScale2 = new THREE.Vector2(normals2,normals2);
                }else if(params.normalMap2Name){
                    params.normalScale = new THREE.Vector2(normals2,normals2);
                }
            }

            params.name = MatData.name;

            mat = new THREE.MeshAMRTMaterial(params);

            //第二套环境贴图
            mat.envmapname = MatData.envmapname;
            mat.envmapintensity = MatData.envmapintensity;

            //宏定义
            mat.defines.MAX_MIPLEVEL = this.isAndroid ? 9 : 10;

        }else if(MatData.type === "Standard"){
            mat = new THREE.MeshStandardMaterial();
            mat.name = MatData.name;
            mat.color = this.parseColor(MatData.color);
            mat.emissive = this.parseColor(MatData.emissive);
            mat.emissiveIntensity = MatData.eintensity === undefined ? 1 : MatData.eintensity;
            mat.aomapintensity = MatData.aomapintensity === undefined ? 1 : MatData.aomapintensity;
            mat.metalness = MatData.metallic;
            mat.roughness = 1 - MatData.smoothness;
            mat.flatShading = false;
            mat.envMapIntensity = 1;

            //2019-1-2 兼容老数据
            if (MatData.color[3] !== undefined && MatData.color[3] === 0 && MatData.opacity === 0) {
                mat.opacity = 1;
            } else {
                if (MatData.opacity !== undefined && MatData.opacity < 1) {
                    mat.transparent = true;
                    mat.opacity = MatData.opacity;
                }
            }

            for(var index = 0;index < MatData.textures.length;index++){
                var texture = MatData.textures[index];
                switch (texture.propname){
                    case "_MainTex":
                        mat.mapName = texture.name;
                        mat.mapscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.mapoffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_BumpMap":
                        mat.normalMapName = texture.name;
                        mat.norscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.noroffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_Normal":
                        mat.normalMapName = texture.name;
                        mat.norscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.noroffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_DetailNormalMap":
                        break;
                    case "_OcclusionMap":
                        mat.aoMapName = texture.name;
                        mat.aoscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.aooffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_MetallicGlossMap":
                        mat.metalMapName = texture.name;
                        mat.metscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.metoffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                    case "_EmissionMap":
                        mat.emissiveMapName = texture.name;
                        mat.emiscale = new THREE.Vector2().fromArray(texture.scale);
                        mat.emioffset = new THREE.Vector2().fromArray(texture.offset);
                        break;
                }
            }
            mat.flatShading = false;
            var normals = MatData.normalscale > 1 ? 1 :MatData.normalscale;
            if(MatData.normalscale){
                mat.normalScale = new THREE.Vector2(normals,normals);
            }else{
                mat.normalScale = new THREE.Vector2(1,1);
            }
        }else if(MatData.type === "Shadow" || MatData.type === "Basic") {
            mat = new THREE.MeshStandardMaterial();
            mat.name = MatData.name;
            mat.isShadow = true;
            mat.transparent = true;
            mat.opacity = 0;
            mat.ropacity = MatData.opacity;
            mat.color = this.parseColor(MatData.color);
            if (MatData.textures.length > 0) {
                var textureBasic = MatData.textures[0];
                mat.mapName = textureBasic.name;
                mat.mapscale = new THREE.Vector2().fromArray(textureBasic.scale);
                mat.mapoffset = new THREE.Vector2().fromArray(textureBasic.offset);
            }
        }
        //the index of lightmap
        mat.lightmapIndex = MatData.lightmapindex;
        //cache material
        this.cacheMats.push(mat);

        return mat;
    },

    genTexture: function (base64str, tname, callback) {
        var scope = this;
        var image = new Image();
        image.src = 'data:image/png;base64,' + base64str;

        var loadData = this;
        var Tname = tname;
        image.onload = function () {
            for (var mi = 0; mi < loadData.cacheMats.length; mi++) {
                if (loadData.cacheMats[mi].mapName === Tname) {
                    loadData.setTexture(loadData.cacheMats[mi], image, 0);
                }
                if (loadData.cacheMats[mi].normalMapName === Tname) {
                    loadData.setTexture(loadData.cacheMats[mi], image, 1);
                }
                if (loadData.cacheMats[mi].aoMapName === Tname) {
                    loadData.setTexture(loadData.cacheMats[mi], image, 2);
                }
                if (loadData.cacheMats[mi].metalMapName === Tname) {
                    loadData.setTexture(loadData.cacheMats[mi], image, 3);
                }
                if (loadData.cacheMats[mi].emissionMapName === Tname) {
                    loadData.setTexture(loadData.cacheMats[mi], image, 4);
                }
                if (loadData.cacheMats[mi].normalMap2Name === Tname) {
                    if (loadData.cacheMats[mi].normalMapName !== undefined && loadData.cacheMats[mi].normalMapName !== "") {
                        loadData.setTexture(loadData.cacheMats[mi], image, 5);
                    } else {
                        loadData.setTexture(loadData.cacheMats[mi], image, 8);
                    }
                }
                if (loadData.cacheMats[mi].map2Name === Tname) {
                    loadData.setTexture(loadData.cacheMats[mi], image, 6);
                }
                if (loadData.cacheMats[mi].emissionMap2Name === Tname) {
                    loadData.setTexture(loadData.cacheMats[mi], image, 7);
                }
            }

            if (callback && callback instanceof Function) {
                scope.count++;
                if (scope.count == scope.textureNum) {
                    callback();
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
                texture.repeat.copy(mat.aoscale);
                texture.offset.copy(mat.aooffset);
                mat.aoMap = texture;
                break;
            case 3:
                texture.repeat.copy(mat.metscale);
                texture.offset.copy(mat.metoffset);
                mat.metalnessMap = texture;
                break;
            case 4:
                texture.repeat.copy(mat.emiscale);
                texture.offset.copy(mat.emioffset);
                mat.emissiveMap = texture;
                break;
            case 5:
                texture.repeat.copy(mat.nor2scale);
                texture.offset.copy(mat.nor2offset);
                mat.normalMap2 = texture;
                break;
            case 6:
                texture.repeat.copy(mat.map2scale);
                texture.offset.copy(mat.map2offset);
                mat.map = texture;
                break;
            case 7:
                texture.repeat.copy(mat.emi2scale);
                texture.offset.copy(mat.emi2offset);
                mat.emissiveMap = texture;
                break;
            case 8:
                texture.repeat.copy(mat.nor2scale);
                texture.offset.copy(mat.nor2offset);
                mat.normalMap = texture;
                break;
        }
        texture.needsUpdate = true;
        texture.updateMatrix();
        mat.needsUpdate = true;
    },

    getUniformsProp:function(mat,prop){
        var seq = mat.program.getUniforms().seq;
        for(var i = 0;i < seq.length;i++){
            if(seq[i].id === prop){
                return seq[i];
            }
        }
        return null;
    },

    createTextureFromString:function (base64str) {
        var image = new Image();
        image.src = 'data:image/png;base64,' + base64str;
        var texture = new THREE.Texture();
        texture.image = image;
        image.onload = function(){
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            texture.isReady = true;
        };
        return texture;
    },

    createCubeTextureFromString:function (base64str,map,t) {
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
                envMap.needsUpdate = true;
                for(var matIndex = 0; matIndex < cscope.cacheMats.length; matIndex++){
                    cscope.cacheMats[matIndex].envMap = envMap;
                    cscope.cacheMats[matIndex].needsUpdate = true;
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