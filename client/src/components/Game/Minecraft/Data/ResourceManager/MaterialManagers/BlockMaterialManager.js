import * as THREE from "three";

import Resources from "../Resources";

class BlockMaterialManager {
  constructor() {
    this.loader = new THREE.TextureLoader();

    this.materials = {};
    this.images = {};
  }

  load = () => {
    for (let key in Resources.textures.blocks) {
      this.images[key] = {};
      this.materials[key] = {};

      const sources = Resources.textures.blocks[key];

      for (let keyword in sources) {
        this.materials[key][keyword] = new Array(Resources.light.lightLevels);
        for (
          let lightLevel = 0;
          lightLevel < Resources.light.lightLevels;
          lightLevel++
        ) {
          const texture = this.loader.load(sources[keyword]);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestMipMapLinearFilter;

          var material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            aoMap: new THREE.DataTexture([1, 0, 0], 1, 1, THREE.RGBAFormat),
            aoMapIntensity: 1 - lightLevel / (Resources.light.lightLevels - 1)
          });
          this.materials[key][keyword][lightLevel] = material;
        }
        this.images[key][keyword] = sources[keyword];
      }
    }
  };

  get = id => this.materials[id];
  getImage = id => this.images[id];
}

export default BlockMaterialManager;
