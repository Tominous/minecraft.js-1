export default () => {
  /* eslint-disable no-restricted-globals, eslint-disable-line */

  /**
   * CLASS DECLARATIONS FOR WORKER-SCOPE
   */
  function Grad(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;

    this.dot2 = (x, y) => {
      return this.x * x + this.y * y;
    };

    this.dot3 = (x, y, z) => {
      return this.x * x + this.y * y + this.z * z;
    };
  }
  function Noise(seed) {
    this.grad3 = [
      new Grad(1, 1, 0),
      new Grad(-1, 1, 0),
      new Grad(1, -1, 0),
      new Grad(-1, -1, 0),
      new Grad(1, 0, 1),
      new Grad(-1, 0, 1),
      new Grad(1, 0, -1),
      new Grad(-1, 0, -1),
      new Grad(0, 1, 1),
      new Grad(0, -1, 1),
      new Grad(0, 1, -1),
      new Grad(0, -1, -1)
    ];

    // prettier-ignore
    this.p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
            23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
            174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
            133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
            89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
            202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
            248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
            178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
            14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
            93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180]

    this.perm = new Array(512);
    this.gradP = new Array(512);

    this.F2 = 0.5 * (Math.sqrt(3) - 1);
    this.G2 = (3 - Math.sqrt(3)) / 6;

    this.F3 = 1 / 3;
    this.G3 = 1 / 6;

    // This isn't a very good seeding function, but it works ok. It supports 2^16
    // different seed values. Write something better if you need more seeds.
    this.seed = seed => {
      if (seed > 0 && seed < 1) {
        // Scale the seed out
        seed *= 65536;
      }

      seed = Math.floor(seed);
      if (seed < 256) {
        seed |= seed << 8;
      }

      for (let i = 0; i < 256; i++) {
        let v;
        if (i & 1) {
          v = this.p[i] ^ (seed & 255);
        } else {
          v = this.p[i] ^ ((seed >> 8) & 255);
        }

        this.perm[i] = this.perm[i + 256] = v;
        this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
      }
    };

    this.seed(seed);

    /*
        for(let i=0; i<256; i++) {
          perm[i] = perm[i + 256] = p[i];
          gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
        }*/

    // Skewing and unskewing factors for 2, 3, and 4 dimensions

    // 2D simplex noise
    this.simplex2 = (xin, yin) => {
      let n0, n1, n2; // Noise contributions from the three corners
      // Skew the input space to determine which simplex cell we're in
      let s = (xin + yin) * this.F2; // Hairy factor for 2D
      let i = Math.floor(xin + s);
      let j = Math.floor(yin + s);
      let t = (i + j) * this.G2;
      let x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
      let y0 = yin - j + t;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if (x0 > y0) {
        // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        i1 = 1;
        j1 = 0;
      } else {
        // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        i1 = 0;
        j1 = 1;
      }
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      let x1 = x0 - i1 + this.G2; // Offsets for middle corner in (x,y) unskewed coords
      let y1 = y0 - j1 + this.G2;
      let x2 = x0 - 1 + 2 * this.G2; // Offsets for last corner in (x,y) unskewed coords
      let y2 = y0 - 1 + 2 * this.G2;
      // Work out the hashed gradient indices of the three simplex corners
      i &= 255;
      j &= 255;
      let gi0 = this.gradP[i + this.perm[j]];
      let gi1 = this.gradP[i + i1 + this.perm[j + j1]];
      let gi2 = this.gradP[i + 1 + this.perm[j + 1]];
      // Calculate the contribution from the three corners
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 < 0) {
        n0 = 0;
      } else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
      }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 < 0) {
        n1 = 0;
      } else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot2(x1, y1);
      }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 < 0) {
        n2 = 0;
      } else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot2(x2, y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70 * (n0 + n1 + n2);
    };

    // 3D simplex noise
    this.simplex3 = (xin, yin, zin) => {
      let n0, n1, n2, n3; // Noise contributions from the four corners

      // Skew the input space to determine which simplex cell we're in
      let s = (xin + yin + zin) * this.F3; // Hairy factor for 2D
      let i = Math.floor(xin + s);
      let j = Math.floor(yin + s);
      let k = Math.floor(zin + s);

      let t = (i + j + k) * this.G3;
      let x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
      let y0 = yin - j + t;
      let z0 = zin - k + t;

      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        }
      } else {
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        }
      }
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      let x1 = x0 - i1 + this.G3; // Offsets for second corner
      let y1 = y0 - j1 + this.G3;
      let z1 = z0 - k1 + this.G3;

      let x2 = x0 - i2 + 2 * this.G3; // Offsets for third corner
      let y2 = y0 - j2 + 2 * this.G3;
      let z2 = z0 - k2 + 2 * this.G3;

      let x3 = x0 - 1 + 3 * this.G3; // Offsets for fourth corner
      let y3 = y0 - 1 + 3 * this.G3;
      let z3 = z0 - 1 + 3 * this.G3;

      // Work out the hashed gradient indices of the four simplex corners
      i &= 255;
      j &= 255;
      k &= 255;
      let gi0 = this.gradP[i + this.perm[j + this.perm[k]]];
      let gi1 = this.gradP[i + i1 + this.perm[j + j1 + this.perm[k + k1]]];
      let gi2 = this.gradP[i + i2 + this.perm[j + j2 + this.perm[k + k2]]];
      let gi3 = this.gradP[i + 1 + this.perm[j + 1 + this.perm[k + 1]]];

      // Calculate the contribution from the four corners
      let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) {
        n0 = 0;
      } else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot3(x0, y0, z0); // (x,y) of grad3 used for 2D gradient
      }
      let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) {
        n1 = 0;
      } else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
      }
      let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) {
        n2 = 0;
      } else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
      }
      let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) {
        n3 = 0;
      } else {
        t3 *= t3;
        n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 32 * (n0 + n1 + n2 + n3);
    };

    // ##### Perlin noise stuff

    this.fade = t => {
      return t * t * t * (t * (t * 6 - 15) + 10);
    };

    this.lerp = (a, b, t) => {
      return (1 - t) * a + t * b;
    };

    // 2D Perlin Noise
    this.perlin2 = (x, y) => {
      // Find unit grid cell containing point
      let X = Math.floor(x),
        Y = Math.floor(y);
      // Get relative xy coordinates of point within that cell
      x = x - X;
      y = y - Y;
      // Wrap the integer cells at 255 (smaller integer period can be introduced here)
      X = X & 255;
      Y = Y & 255;

      // Calculate noise contributions from each of the four corners
      let n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
      let n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
      let n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
      let n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);

      // Compute the fade curve value for x
      let u = this.fade(x);

      // Interpolate the four results
      return this.lerp(
        this.lerp(n00, n10, u),
        this.lerp(n01, n11, u),
        this.fade(y)
      );
    };

    // 3D Perlin Noise
    this.perlin3 = (x, y, z) => {
      // Find unit grid cell containing point
      let X = Math.floor(x),
        Y = Math.floor(y),
        Z = Math.floor(z);
      // Get relative xyz coordinates of point within that cell
      x = x - X;
      y = y - Y;
      z = z - Z;
      // Wrap the integer cells at 255 (smaller integer period can be introduced here)
      X = X & 255;
      Y = Y & 255;
      Z = Z & 255;

      // Calculate noise contributions from each of the eight corners
      let n000 = this.gradP[X + this.perm[Y + this.perm[Z]]].dot3(x, y, z);
      let n001 = this.gradP[X + this.perm[Y + this.perm[Z + 1]]].dot3(
        x,
        y,
        z - 1
      );
      let n010 = this.gradP[X + this.perm[Y + 1 + this.perm[Z]]].dot3(
        x,
        y - 1,
        z
      );
      let n011 = this.gradP[X + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
        x,
        y - 1,
        z - 1
      );
      let n100 = this.gradP[X + 1 + this.perm[Y + this.perm[Z]]].dot3(
        x - 1,
        y,
        z
      );
      let n101 = this.gradP[X + 1 + this.perm[Y + this.perm[Z + 1]]].dot3(
        x - 1,
        y,
        z - 1
      );
      let n110 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z]]].dot3(
        x - 1,
        y - 1,
        z
      );
      let n111 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
        x - 1,
        y - 1,
        z - 1
      );

      // Compute the fade curve value for x, y, z
      let u = this.fade(x);
      let v = this.fade(y);
      let w = this.fade(z);

      // Interpolate
      return this.lerp(
        this.lerp(this.lerp(n000, n100, u), this.lerp(n001, n101, u), w),
        this.lerp(this.lerp(n010, n110, u), this.lerp(n011, n111, u), w),
        v
      );
    };
  }
  function getCoordsRepresentation(x, y, z, semi = false) {
    return `${x}:${y}:${z}${semi ? ";" : ""}`;
  }
  function Generator(
    seed,
    noiseConstant,
    biomeConstant,
    size,
    height,
    changedBlocks
  ) {
    this.noise = new Noise(parseInt(seed));

    // BIOMES
    this.rainfall = new Noise(parseInt(seed) + 50);
    this.temp = new Noise(parseInt(seed) - 50);

    // ORES
    this.coal = new Noise(parseInt(seed) + 1);
    this.iron = new Noise(parseInt(seed) + 2);
    this.gold = new Noise(parseInt(seed) + 3);
    this.diamond = new Noise(parseInt(seed) + 4);

    this.getBlockInfo = (x, y, z, solid = false) => {
      let blockId = 0;
      let biome = {};

      // BIOMES
      switch (
        this.biome(
          this.rainfall.perlin2(x / biomeConstant, z / biomeConstant),
          this.temp.perlin2(x / biomeConstant, z / biomeConstant)
        )
      ) {
        case "DESERT":
          biome.topBlockId = 12;
          biome.bottomBlockId = 12;
          biome.decoration = {
            radius: {
              x: 0,
              y: 2,
              z: 0
            },
            structure: {
              "(0,0,0)": 81,
              "(0,1,0)": 81,
              "(0,2,0)": 81
            }
          };
          biome.noiseFallOffType = "LNR";
          break;
        case "SNOW":
          biome.topBlockId = 80;
          biome.bottomBlockId = 3;
          biome.decoration = {
            radius: {
              x: 2,
              y: 5,
              z: 2
            },
            // prettier-ignore
            structure: {"(0,0,0)": 17, "(0,1,0)": 17, "(0,2,0)": 17, "(0,3,0)": 17, "(0,4,0)": 17, "(-1,2,-1)": 18, 
            "(-1,2,0)": 18, "(-1,2,1)": 18, "(0,2,-1)": 18, "(0,2,1)": 18, "(1,2,-1)": 18, "(1,2,0)": 18, 
            "(1,2,1)": 18, "(-2,2,-1)": 18, "(-2,2,0)": 18, "(-2,2,1)": 18, "(2,2,-1)": 18, "(2,2,0)": 18, 
            "(2,2,1)": 18, "(-1,2,-2)": 18, "(0,2,-2)": 18, "(1,2,-2)": 18, "(-1,2,2)": 18, "(0,2,2)": 18, 
            "(1,2,2)": 18, "(-1,3,-1)": 18, "(-1,3,0)": 18, "(-1,3,1)": 18, "(0,3,-1)": 18, "(0,3,1)": 18, 
            "(1,3,-1)": 18, "(1,3,0)": 18, "(1,3,1)": 18, "(-2,3,-1)": 18, "(-2,3,0)": 18, "(-2,3,1)": 18, 
            "(2,3,-1)": 18, "(2,3,0)": 18, "(2,3,1)": 18, "(-1,3,-2)": 18, "(0,3,-2)": 18, "(1,3,-2)": 18, 
            "(-1,3,2)": 18, "(0,3,2)": 18, "(1,3,2)": 18, "(-1,4,0)": 18, "(0,4,-1)": 18, "(0,4,1)": 18, 
            "(1,4,-1)": 18, "(1,4,0)": 18, "(-1,5,0)": 18, "(0,5,-1)": 18, "(0,5,0)": 18, "(0,5,1)": 18, 
            "(1,5,0)": 18
            }
          };
          biome.noiseFallOffType = "LNR";
          break;
        case "TUNDRA":
          biome.topBlockId = 3;
          biome.bottomBlockId = 3;
          biome.decoration = {
            radius: {
              x: 2,
              y: 5,
              z: 2
            },
            // prettier-ignore
            structure: {"(0,0,0)": 17, "(0,1,0)": 17, "(0,2,0)": 17, "(0,3,0)": 17, "(0,4,0)": 17, "(-1,2,-1)": 18, 
            "(-1,2,0)": 18, "(-1,2,1)": 18, "(0,2,-1)": 18, "(0,2,1)": 18, "(1,2,-1)": 18, "(1,2,0)": 18, 
            "(1,2,1)": 18, "(-2,2,-1)": 18, "(-2,2,0)": 18, "(-2,2,1)": 18, "(2,2,-1)": 18, "(2,2,0)": 18, 
            "(2,2,1)": 18, "(-1,2,-2)": 18, "(0,2,-2)": 18, "(1,2,-2)": 18, "(-1,2,2)": 18, "(0,2,2)": 18, 
            "(1,2,2)": 18, "(-1,3,-1)": 18, "(-1,3,0)": 18, "(-1,3,1)": 18, "(0,3,-1)": 18, "(0,3,1)": 18, 
            "(1,3,-1)": 18, "(1,3,0)": 18, "(1,3,1)": 18, "(-2,3,-1)": 18, "(-2,3,0)": 18, "(-2,3,1)": 18, 
            "(2,3,-1)": 18, "(2,3,0)": 18, "(2,3,1)": 18, "(-1,3,-2)": 18, "(0,3,-2)": 18, "(1,3,-2)": 18, 
            "(-1,3,2)": 18, "(0,3,2)": 18, "(1,3,2)": 18, "(-1,4,0)": 18, "(0,4,-1)": 18, "(0,4,1)": 18, 
            "(1,4,-1)": 18, "(1,4,0)": 18, "(-1,5,0)": 18, "(0,5,-1)": 18, "(0,5,0)": 18, "(0,5,1)": 18, 
            "(1,5,0)": 18
            }
          };
          biome.noiseFallOffType = "LNR";
          break;
        case "FOREST":
          biome.topBlockId = 2;
          biome.bottomBlockId = 3;
          biome.decoration = {
            radius: {
              x: 2,
              y: 5,
              z: 2
            },
            // prettier-ignore
            structure: {"(0,0,0)": 17, "(0,1,0)": 17, "(0,2,0)": 17, "(0,3,0)": 17, "(0,4,0)": 17, "(-1,2,-1)": 18, 
            "(-1,2,0)": 18, "(-1,2,1)": 18, "(0,2,-1)": 18, "(0,2,1)": 18, "(1,2,-1)": 18, "(1,2,0)": 18, 
            "(1,2,1)": 18, "(-2,2,-1)": 18, "(-2,2,0)": 18, "(-2,2,1)": 18, "(2,2,-1)": 18, "(2,2,0)": 18, 
            "(2,2,1)": 18, "(-1,2,-2)": 18, "(0,2,-2)": 18, "(1,2,-2)": 18, "(-1,2,2)": 18, "(0,2,2)": 18, 
            "(1,2,2)": 18, "(-1,3,-1)": 18, "(-1,3,0)": 18, "(-1,3,1)": 18, "(0,3,-1)": 18, "(0,3,1)": 18, 
            "(1,3,-1)": 18, "(1,3,0)": 18, "(1,3,1)": 18, "(-2,3,-1)": 18, "(-2,3,0)": 18, "(-2,3,1)": 18, 
            "(2,3,-1)": 18, "(2,3,0)": 18, "(2,3,1)": 18, "(-1,3,-2)": 18, "(0,3,-2)": 18, "(1,3,-2)": 18, 
            "(-1,3,2)": 18, "(0,3,2)": 18, "(1,3,2)": 18, "(-1,4,0)": 18, "(0,4,-1)": 18, "(0,4,1)": 18, 
            "(1,4,-1)": 18, "(1,4,0)": 18, "(-1,5,0)": 18, "(0,5,-1)": 18, "(0,5,0)": 18, "(0,5,1)": 18, 
            "(1,5,0)": 18
            }
          };
          biome.noiseFallOffType = "LNR";
          break;
        default:
          break;
      }

      // SOLID
      if (y <= height / 2) {
        blockId = 1;
      } else {
        let x2 = x / noiseConstant;
        let y2 = y / noiseConstant;
        let z2 = z / noiseConstant;

        let value = this.linearInterpolate3d(
          this.getNoise(x2, y2, z2, biome.noiseFallOffType),
          this.getNoise(x2 + 1 / noiseConstant, y2, z2, biome.noiseFallOffType),
          this.getNoise(x2, y2 + 1 / noiseConstant, z2, biome.noiseFallOffType),
          this.getNoise(
            x2 + 1 / noiseConstant,
            y2 + 1 / noiseConstant,
            z2,
            biome.noiseFallOffType
          ),
          this.getNoise(x2, y2, z2 + 1 / noiseConstant, biome.noiseFallOffType),
          this.getNoise(
            x2 + 1 / noiseConstant,
            y2,
            z2 + 1 / noiseConstant,
            biome.noiseFallOffType
          ),
          this.getNoise(
            x2,
            y2 + 1 / noiseConstant,
            z2 + 1 / noiseConstant,
            biome.noiseFallOffType
          ),
          this.getNoise(
            x2 + 1 / noiseConstant,
            y2 + 1 / noiseConstant,
            z2 + 1 / noiseConstant,
            biome.noiseFallOffType
          ),
          x2,
          y2,
          z2
        );
        if (value >= -0.5) {
          blockId = 1;
        }
      }

      // TOP / BOTTOM BLOCKS
      // if (
      //   !solid &&
      //   blockId === 1 &&
      //   (y >= height - 3 ||
      //     this.getBlockInfo(x, y + 1, z, true) === 0 ||
      //     this.getBlockInfo(x, y + 4, z, true) === 0 ||
      //     this.getBlockInfo(x, y + 3, z, true) === 0 ||
      //     this.getBlockInfo(x, y + 2, z, true) === 0)
      // ) {
      //   if (y === height || this.getBlockInfo(x, y + 1, z, true) === 0) {
      //     blockId = biome.topBlockId;
      //   } else if (
      //     y >= height - 3 ||
      //     this.getBlockInfo(x, y + 4, z, true) === 0 ||
      //     this.getBlockInfo(x, y + 3, z, true) === 0 ||
      //     this.getBlockInfo(x, y + 2, z, true) === 0
      //   ) {
      //     blockId = biome.bottomBlockId;
      //   }
      // }

      if (!solid && blockId === 1 && y >= 25) {
        const highestBlock = this.getHighestBlock(x, z, false);
        if (highestBlock === y) {
          blockId = biome.topBlockId;
        } else if (highestBlock - y <= 6) {
          blockId = biome.bottomBlockId;
        }
      }

      // DECORATIONS
      // if (
      //   !solid &&
      //   this.getBlockInfo(x, y - biome.decoration.radius.y - 1, z, true) !==
      //     0 &&
      //   blockId === 0
      // ) {
      //   decoration: for (
      //     let x1 = x - biome.decoration.radius.x;
      //     x1 <= x + biome.decoration.radius.x;
      //     x1++
      //   ) {
      //     for (let y1 = y - biome.decoration.radius.y; y1 <= y; y1++) {
      //       for (
      //         let z1 = z - biome.decoration.radius.z;
      //         z1 <= z + biome.decoration.radius.z;
      //         z1++
      //       ) {
      //         if (
      //           this.getBlockInfo(x1, y1, z1, true) === 0 &&
      //           this.getBlockInfo(x1, y1 - 1, z1, true) !== 0 &&
      //           this.noise.simplex2(x1, z1) >= 0.99
      //         ) {
      //           let x2 = -(x1 - x);
      //           let y2 = -(y1 - y);
      //           let z2 = -(z1 - z);
      //           let coordString = "(" + x2 + "," + y2 + "," + z2 + ")";
      //           if (biome.decoration.structure[coordString]) {
      //             blockId = biome.decoration.structure[coordString];
      //             break decoration;
      //           }
      //         }
      //       }
      //     }
      //   }
      // }

      // ORES
      // if (!solid && blockId === 1) {
      //   if (this.coal.perlin3(x / 5, y / 5, z / 5) >= 0.7) {
      //     blockId = 16;
      //   }
      //   if (y <= height / 2 && this.iron.perlin3(x / 5, y / 5, z / 5) >= 0.8) {
      //     blockId = 15;
      //   }
      //   if (y <= height / 4 && this.gold.perlin3(x / 5, y / 5, z / 5) >= 0.9) {
      //     blockId = 14;
      //   }
      //   if (
      //     y <= height / 8 &&
      //     this.diamond.perlin3(x / 5, y / 5, z / 5) >= 0.95
      //   ) {
      //     blockId = 56;
      //   }
      // }

      return blockId;
    };

    this.getBlockLighting = (x, y, z) => {
      let surroundings = [
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: -1, z: 0 }
      ];

      let lights = new Array(surroundings.length);

      for (let i = 0; i < surroundings.length; i++) {
        const block = {
          x: x + surroundings[i].x,
          y: y + surroundings[i].y,
          z: z + surroundings[i].z,
          lightLevel: 15
        };
        const cb =
            changedBlocks[getCoordsRepresentation(block.x, block.y, block.z)],
          value =
            typeof cb === "number"
              ? cb
              : this.getBlockInfo(block.x, block.y, block.z);
        if (value === 0) {
          let pastNodeCoords = [
            getCoordsRepresentation(block.x, block.y, block.z)
          ];
          let queue = [block];
          while (queue.length > 0) {
            let sIndex = 0;
            for (let n = 0; n < queue.length; n++) {
              const node = queue[n],
                selectedNode = queue[sIndex];
              if (this.getHighestBlock(selectedNode.x, selectedNode.z) < y) {
                continue;
              } else if (this.getHighestBlock(node.x, node.z) < node.y) {
                sIndex = n;
              }
              if (!selectedNode.nearestHighestBlock) {
              }
              selectedNode.nearestHighestBlockDistance = selectedNode.nearestHighestBlockDistance
                ? selectedNode.nearestHighestBlockDistance
                : this.getNearestHighestBlockDistance(
                    selectedNode.x,
                    selectedNode.y,
                    selectedNode.z
                  );

              node.nearestHighestBlockDistance = node.nearestHighestBlockDistance
                ? node.nearestHighestBlockDistance
                : this.getNearestHighestBlockDistance(node.x, node.y, node.z);
              if (
                selectedNode.nearestHighestBlockDistance >
                node.nearestHighestBlockDistance
              ) {
                sIndex = n;
              }
            }
            const q = queue.splice(sIndex, 1)[0];
            if (this.getHighestBlock(q.x, q.z) < q.y) {
              lights[i] = q.lightLevel;
              break;
            }
            for (let n = 0; n < surroundings.length - 1; n++) {
              const newNodeCoords = {
                x: q.x + surroundings[n].x,
                y: q.y + surroundings[n].y,
                z: q.z + surroundings[n].z
              };
              if (
                pastNodeCoords.indexOf(
                  getCoordsRepresentation(
                    newNodeCoords.x,
                    newNodeCoords.y,
                    newNodeCoords.z
                  )
                ) !== -1
              ) {
                continue;
              }
              const cb2 =
                  changedBlocks[
                    getCoordsRepresentation(
                      newNodeCoords.x,
                      newNodeCoords.y,
                      newNodeCoords.z
                    )
                  ],
                value2 =
                  typeof cb2 === "number"
                    ? cb2
                    : this.getBlockInfo(
                        newNodeCoords.x,
                        newNodeCoords.y,
                        newNodeCoords.z
                      );
              if (value2 !== 0) {
                continue;
              }
              const lightLevel =
                surroundings[n].x === 0 && surroundings[n].z === 0
                  ? q.lightLevel
                  : q.lightLevel - 1;
              if (lightLevel <= 0) {
                continue;
              }
              const newNode = {
                x: newNodeCoords.x,
                y: newNodeCoords.y,
                z: newNodeCoords.z,
                lightLevel: lightLevel
              };
              queue.push(newNode);
              pastNodeCoords.push(
                getCoordsRepresentation(
                  newNodeCoords.x,
                  newNodeCoords.y,
                  newNodeCoords.z
                )
              );
            }
          }
        }
      }
      return lights;
    };

    this.getHighestBlock = (x, z, withCB = true) => {
      let high = 62,
        low = 25,
        middle = Math.round((high + low) / 2);
      while (low <= high) {
        if (
          this.getBlockInfo(x, middle, z, true) === 1 &&
          this.getBlockInfo(x, middle + 1, z, true) === 0
        ) {
          break;
        } else if (this.getBlockInfo(x, middle, z, true) === 0) {
          high = middle - 1;
        } else {
          low = middle + 1;
        }
        middle = Math.round((high + low) / 2);
      }
      if (!withCB) {
        return middle;
      }
      const emptyYValues = [];
      for (let stringCoords in changedBlocks) {
        const coords = stringCoords.split(":").map(coord => {
            return parseInt(coord);
          }),
          value = changedBlocks[stringCoords];

        if (coords[0] === x && coords[2] === z) {
          if (value === 0) {
            emptyYValues.push(coords[1]);
            while (emptyYValues.indexOf(middle) !== -1) {
              middle -= 1;
            }
          } else if (value !== 0 && coords[1] > middle) {
            middle = coords[1];
          }
        }
      }
      return middle;
    };

    this.getNearestHighestBlockDistance = (x, y, z) => {
      let r = 0,
        shortestDistance = this.manhattanDistance3D(
          x,
          y,
          z,
          x,
          this.getHighestBlock(x, z) + 1,
          z
        );
      while (this.manhattanDistance(x, z, x + r, z + r) < shortestDistance) {
        r += 1;
        shortestDistance = Math.min(
          this.manhattanDistance3D(
            x,
            y,
            z,
            x - r,
            this.getHighestBlock(x - r, z - r) + 1,
            z - r
          ),
          shortestDistance
        );
        shortestDistance = Math.min(
          this.manhattanDistance3D(
            x,
            y,
            z,
            x - r,
            this.getHighestBlock(x - r, z + r) + 1,
            z + r
          ),
          shortestDistance
        );
        shortestDistance = Math.min(
          this.manhattanDistance3D(
            x,
            y,
            z,
            x + r,
            this.getHighestBlock(x + r, z - r) + 1,
            z - r
          ),
          shortestDistance
        );
        shortestDistance = Math.min(
          this.manhattanDistance3D(
            x,
            y,
            z,
            x + r,
            this.getHighestBlock(x + r, z + r) + 1,
            z + r
          ),
          shortestDistance
        );
        for (let z2 = -r + 1; z2 <= r - 1; z2++) {
          shortestDistance = Math.min(
            this.manhattanDistance3D(
              x,
              y,
              z,
              x - r,
              this.getHighestBlock(x - r, z2) + 1,
              z2
            ),
            shortestDistance
          );
        }
        for (let z2 = -r + 1; z2 <= r - 1; z2++) {
          shortestDistance = Math.min(
            this.manhattanDistance3D(
              x,
              y,
              z,
              x + r,
              this.getHighestBlock(x + r, z2) + 1,
              z2
            ),
            shortestDistance
          );
        }
        for (let x2 = -r + 1; x2 <= r - 1; x2++) {
          shortestDistance = Math.min(
            this.manhattanDistance3D(
              x,
              y,
              z,
              x2,
              this.getHighestBlock(x2, z - r) + 1,
              z - r
            ),
            shortestDistance
          );
        }
        for (let x2 = -r + 1; x2 <= r - 1; x2++) {
          shortestDistance = Math.min(
            this.manhattanDistance3D(
              x,
              y,
              z,
              x2,
              this.getHighestBlock(x2, z + r) + 1,
              z + r
            ),
            shortestDistance
          );
        }
      }
      return shortestDistance;
    };

    this.linearInterpolate3d = (
      xm_ym_zm,
      xp_ym_zm,
      xm_yp_zm,
      xp_yp_zm,
      xm_ym_zp,
      xp_ym_zp,
      xm_yp_zp,
      xp_yp_zp,
      x,
      y,
      z
    ) =>
      xm_ym_zm * (1 - x) * (1 - y) * (1 - z) +
      xp_ym_zm * x * (1 - y) * (1 - z) +
      xm_yp_zm * (1 - x) * y * (1 - z) +
      xp_yp_zm * x * y * (1 - z) +
      xm_ym_zp * (1 - x) * (1 - y) * z +
      xp_ym_zp * x * (1 - y) * z +
      xm_yp_zp * (1 - x) * y * z +
      xp_yp_zp * x * y * z;

    this.getNoise = (x, y, z, noiseFallOffType = "LNR") =>
      this.noise.perlin3(x, y, z) - this.noiseFallOff(y, noiseFallOffType);

    this.noiseFallOff = (y, type = "LNR") => {
      let output = (y * noiseConstant * 2) / height - 1;
      switch (type) {
        case "LNR":
          return output;
        case "SQRT":
          return output ** (1 / 2);
        case "SQRD":
          return output ** 2;
        default:
          return output;
      }
    };

    this.biome = (r, t) => {
      if (r < 0) {
        if (t > 0) return "DESERT";
        return "TUNDRA";
      } else {
        if (t > 0) return "FOREST";
        return "SNOW";
      }
    };

    this.dist = (x1, y1, z1, x2, y2, z2) =>
      Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

    this.manhattanDistance = (x1, z1, x2, z2) =>
      Math.abs(x1 - x2) + Math.abs(z1 - z2);

    this.manhattanDistance3D = (x1, y1, z1, x2, y2, z2) =>
      Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2);
  }
  function calcQuads(get, getLighting, dims) {
    const planes = [],
      materials = { top: "top", side: "side", bottom: "bottom" };

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[1] - 1; z++) {
        for (let y = 1; y < dims[2] - 1; y++) {
          // dismiss air
          const type = get(x, z, y);

          if (type === 0) continue;

          // TOP
          if (get(x, z, y + 1) === 0)
            planes.push([
              [x, y + 0.5, z],
              "py",
              type,
              materials.top,
              getLighting(x - 1, z - 1, y - 1, 0)
                ? getLighting(x - 1, z - 1, y - 1, 0)
                : 0
            ]);

          // SIDES
          if (get(x + 1, z, y) === 0)
            planes.push([
              [x + 0.5, y, z],
              "px",
              type,
              materials.side,
              getLighting(x - 1, z - 1, y - 1, 1)
                ? getLighting(x - 1, z - 1, y - 1, 1)
                : 0
            ]);
          if (get(x, z + 1, y) === 0)
            planes.push([
              [x, y, z + 0.5],
              "pz",
              type,
              materials.side,
              getLighting(x - 1, z - 1, y - 1, 2)
                ? getLighting(x - 1, z - 1, y - 1, 2)
                : 0
            ]);
          if (get(x - 1, z, y) === 0)
            planes.push([
              [x - 0.5, y, z],
              "nx",
              type,
              materials.side,
              getLighting(x - 1, z - 1, y - 1, 3)
                ? getLighting(x - 1, z - 1, y - 1, 3)
                : 0
            ]);
          if (get(x, z - 1, y) === 0)
            planes.push([
              [x, y, z - 0.5],
              "nz",
              type,
              materials.side,
              getLighting(x - 1, z - 1, y - 1, 4)
                ? getLighting(x - 1, z - 1, y - 1, 4)
                : 0
            ]);

          // BOTTOM
          if (get(x, z, y - 1) === 0)
            planes.push([
              [x, y - 0.5, z],
              "ny",
              type,
              materials.bottom,
              getLighting(x - 1, z - 1, y - 1, 5)
                ? getLighting(x - 1, z - 1, y - 1, 5)
                : 0
            ]);
        }
      }
    }
    return planes;
  }

  self.addEventListener("message", e => {
    if (!e) return;

    const { cmd } = e.data;
    if (!cmd) throw new Error("Command not specified.");

    switch (cmd) {
      case "BOOT":
        postMessage({ cmd });
        break;
      case "GET_CHUNK": {
        const {
          seed,
          changedBlocks,
          configs: {
            noiseConstant,
            biomeConstant,
            // caves,
            size,
            height,
            stride,
            chunkName
          },
          coords: { coordx, coordy, coordz }
        } = e.data;

        const blocks = new Uint16Array((size + 2) * (size + 2) * (size + 2));

        const set = (i, j, k, v) =>
          (blocks[i * stride[0] + j * stride[1] + k * stride[2]] = v);
        const get = (i, j, k) =>
          blocks[i * stride[0] + j * stride[1] + k * stride[2]];

        const lighting = new Uint16Array(size ** 3 * 6);

        const setLighting = (i, j, k, l, v) =>
          (lighting[i * 16 ** 2 * 6 + j * 16 * 6 + k * 6 + l] = v);
        const getLighting = (i, j, k, l) =>
          lighting[i * 16 ** 2 * 6 + j * 16 * 6 + k * 6 + l];

        // CAVES
        // const caveLength = caves.caveLength;
        // const caveRadius = caves.caveRadius;
        // const caveNoiseConstant = caves.caveNoiseConstant;

        // const caveMaxLength = caveLength * caveRadius;

        // const caveMap = new Array(size + 2);

        // for (let x = 0; x < size + 2; x++) {
        //   caveMap[x] = new Array(size + 2);
        //   for (let z = 0; z < size + 2; z++) {
        //     caveMap[x][z] = new Array(size + 2);
        //     for (let y = 0; y < size + 2; y++) {
        //       caveMap[x][z][y] = false;
        //     }
        //   }
        // }

        // for (let x = -caveMaxLength - 1; x < size + caveMaxLength + 1; x++) {
        //   for (let z = -caveMaxLength - 1; z < size + caveMaxLength + 1; z++) {
        //     for (
        //       let y = -caveMaxLength - 1;
        //       y < size + caveMaxLength + 1;
        //       y++
        //     ) {
        //       if (
        //         (x + coordx * size) % 25 === 0 &&
        //         (y + coordy * size) % 25 === 0 &&
        //         (z + coordz * size) % 25 === 0
        //       ) {
        //         let xCave = x + coordx * size;
        //         let yCave = y + coordy * size;
        //         let zCave = z + coordz * size;
        //         let x2 = xCave / caveNoiseConstant;
        //         let y2 = yCave / caveNoiseConstant;
        //         let z2 = zCave / caveNoiseConstant;
        //         for (let i = 0; i < caveLength; i++) {
        //           if (i > 0) {
        //             let angle1 =
        //               generator.noise.perlin3(
        //                 x2 + i / caveNoiseConstant,
        //                 y2,
        //                 z2
        //               ) *
        //               2 *
        //               Math.PI;
        //             let angle2 =
        //               generator.noise.perlin3(
        //                 x2,
        //                 y2,
        //                 z2 + i / caveNoiseConstant
        //               ) *
        //               2 *
        //               Math.PI;
        //             xCave += caveRadius * Math.cos(angle1 + angle2);
        //             yCave += caveRadius * Math.sin(angle1);
        //             zCave += caveRadius * Math.sin(angle2);
        //           }
        //           for (
        //             let x1 = xCave - caveRadius;
        //             x1 < xCave + caveRadius;
        //             x1++
        //           ) {
        //             for (
        //               let y1 = yCave - caveRadius;
        //               y1 < yCave + caveRadius;
        //               y1++
        //             ) {
        //               for (
        //                 let z1 = zCave - caveRadius;
        //                 z1 < zCave + caveRadius;
        //                 z1++
        //               ) {
        //                 let x3 = Math.round(x1);
        //                 let y3 = Math.round(y1);
        //                 let z3 = Math.round(z1);
        //                 if (
        //                   generator.dist(x3, y3, z3, xCave, yCave, zCave) <=
        //                   caveRadius
        //                 ) {
        //                   if (
        //                     x3 >= -1 &&
        //                     x3 < size + 1 &&
        //                     y3 >= -1 &&
        //                     y3 < size + 1 &&
        //                     z3 >= -1 &&
        //                     z3 < size + 1
        //                   ) {
        //                     caveMap[x3 + 1][z3 + 1][y3 + 1] = true;
        //                   }
        //                 }
        //               }
        //             }
        //           }
        //         }
        //       }
        //     }
        //   }
        // }

        const generator = new Generator(
          seed,
          noiseConstant,
          biomeConstant,
          size,
          height,
          changedBlocks
        );

        for (let x = 0; x < size + 2; x++)
          for (let z = 0; z < size + 2; z++)
            for (let y = 0; y < size + 2; y++) {
              // -1 for the offset
              const pos = [
                coordx * size + x - 1,
                coordy * size + y - 1,
                coordz * size + z - 1
              ];

              const cb = changedBlocks[getCoordsRepresentation(...pos)],
                value =
                  typeof cb === "number" ? cb : generator.getBlockInfo(...pos);
              if (
                x > 0 &&
                x < size + 1 &&
                y > 0 &&
                y < size + 1 &&
                z > 0 &&
                z < size + 1 &&
                value.id !== 0
              ) {
                const lighting = generator.getBlockLighting(...pos);
                for (let l = 0; l < lighting.length; l++) {
                  setLighting(x - 1, z - 1, y - 1, l, lighting[l]);
                }
              }

              set(x, z, y, value);
            }

        /** MESHING RIGHT BELOW */
        const dims = [size + 2, size + 2, size + 2];

        if (blocks.find(ele => ele)) {
          const quads = calcQuads(get, getLighting, dims);

          postMessage({ cmd, blocks, quads, chunkName });
        } else postMessage({ cmd, blocks, quads: [], chunkName });

        const quads = calcQuads(get, getLighting, dims);

        postMessage({ cmd, blocks, quads, chunkName });
        break;
      }
      case "UPDATE_BLOCK": {
        const {
          data,
          block,
          type,
          configs: { stride, chunkName, size }
        } = e.data;

        const dims = [size + 2, size + 2, size + 2];

        const set = (i, j, k, v) =>
          (data[i * stride[0] + j * stride[1] + k * stride[2]] = v);
        const get = (i, j, k) =>
          data[i * stride[0] + j * stride[1] + k * stride[2]];

        const { x, y, z } = block;
        set(x + 1, z + 1, y + 1, type);

        if (data.find(ele => ele)) {
          const quads = calcQuads(get, null, dims);

          postMessage({ cmd, quads, block, type, chunkName });
        } else postMessage({ cmd, quads: [], block, type, chunkName });

        break;
      }
      default:
        break;
    }

    // postMessage(a.x)
  });
  /* eslint-enable no-restricted-globals, eslint-disable-line */
};
