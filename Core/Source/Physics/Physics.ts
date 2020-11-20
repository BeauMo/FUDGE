///<reference path="../../../Physics/ammo.d.ts"/>

namespace FudgeCore {

    /**
      * Main Physics Class of the ammo.js integration. Holding information about the world an the bodies in it.
      * @author Marko Fehrenbach, HFU 2020
      */

    export class Physics {
        public static world: Physics;
        public isInitialized: boolean;

        private ammoWorld: Ammo.btDiscreteDynamicsWorld;

        public static initializePhysics(fnc: any): any {
            Ammo().then(function (Ammo: any) {
                let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
                    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
                    overlappingPairCache = new Ammo.btDbvtBroadphase(),
                    solver = new Ammo.btSequentialImpulseConstraintSolver();

                let tmpAmmoWorld: Ammo.btDiscreteDynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
                tmpAmmoWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
                Physics.world = new Physics();
                Physics.world.setAmmoWorld(tmpAmmoWorld);
                Physics.world.isInitialized = true;
                let scene: any = new fnc();
                return scene;
            });
        }

        public getAmmoWorld(): Ammo.btDiscreteDynamicsWorld {
            return this.ammoWorld;
        }

        protected setAmmoWorld(world: Ammo.btDiscreteDynamicsWorld): void {
            this.ammoWorld = world;
        }

        public static simulate(deltaTime: number = 1 / 60) {
            if (this.world.ammoWorld != null) {
                this.world.ammoWorld.stepSimulation(deltaTime * Time.game.getScale(), 10);
            }
        }
    }
}