import {Component} from '@angular/core';
import {AbstractMesh, Mesh, MeshBuilder, Scene} from '@babylonjs/core';
import {UnoptimizedComponent} from '../unoptimized/unoptimized.component';

@Component({
  selector: 'app-mesh-optimized',
  templateUrl: './mesh-optimized.component.html',
})
export class MeshOptimizedComponent extends UnoptimizedComponent {

  initScene() {
    const scene = this.naive.createScene(this.canvasRef);
    scene.blockfreeActiveMeshesAndRenderingGroups = true;
    this.addPlanets(scene);
    scene.blockfreeActiveMeshesAndRenderingGroups = false;
  }

  getBaseSphere(suffix = ''): Mesh {
    const baseSphere = MeshBuilder.CreateSphere('BaseSphere' + suffix, {
      segments: this.asteroidConfig.segments,
      diameter: 1
    }, this.naive.scene);
    if (this.meshConfig.index) {
      baseSphere.convertToUnIndexedMesh();
    } // TEUER BEI VIELEN MESHES - 1-3fps
    if (this.meshConfig.flat) {
      baseSphere.convertToFlatShadedMesh();
    } // TEUER BEI VIELEN MESHES - 1-3fps
    baseSphere.cullingStrategy = AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY;
    baseSphere.isVisible = false;
    if (this.meshConfig.normals) {
      baseSphere.freezeNormals();
    }
    if (this.meshConfig.edge) {
      baseSphere.disableEdgesRendering();
    }
    if (this.meshConfig.boundings) {
      baseSphere.doNotSyncBoundingInfo = true;
    } // 5-10 fps;
    this.naive.addRandomMaterial(baseSphere);
    return baseSphere;
  }

  addAsteroids(scene: Scene, amount: number) {
    const baseSphere = this.getBaseSphere();

    this.loading.message$.next('Adding Asteroids ...');
    for (let i = 0; i < amount; i++) {
      const asteroid = baseSphere.clone('instance' + i);
      this.asteroids.push(asteroid);
      this.naive.makeAsteroid(asteroid, i);
      asteroid.isVisible = true;
    }

    if (!this.meshConfig.merge) {
      return;
    }
    // TODO better slicing
    // Mesh.MergeMeshes(asteroids, true, true); // TEUER!
    this.loading.message$.next('Grouping Asteroids ...');
    const groupSize = 300;
    const merged = [];
    for (let i = 0; i < amount; i += groupSize) { // DAS KLAPPT :)  5 - 10 fps
      const upper = i + groupSize > this.asteroids.length ? this.asteroids.length : i + groupSize;
      const mergedMesh = Mesh.MergeMeshes(this.asteroids.slice(i, upper) as Mesh[], true);
      if (mergedMesh) {
        mergedMesh.parent = this.naive.sun;
        this.naive.addRandomMaterial(mergedMesh);
        merged.push(mergedMesh);
      }
    }
    this.clearAsteroids();
    this.asteroids.push(...merged);
  }
}
