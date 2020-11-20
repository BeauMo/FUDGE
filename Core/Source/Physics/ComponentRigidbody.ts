///<reference path="../../../Physics/ammo.d.ts"/>

namespace FudgeCore {

    /**
     * Initial test RB Class for Ammo, collider and such will be split later
     */
    export class ComponentRigidbody extends Component {
        public static readonly iSubclass: number = Component.registerSubclass(ComponentRigidbody);

        public mass: number;

        private ammoBody: Ammo.btRigidBody;
        private ammoTransform: Ammo.btTransform;

        constructor(_mass: number = 1, _node: Node = null) {
            super();
            this.mass = _mass;
            this.createBody(_node);
            this.ammoTransform = new Ammo.btTransform();
            //Handling adding/removing the component
            this.addEventListener(EVENT.COMPONENT_ADD, this.addRigidbodyToWorld);
            this.addEventListener(EVENT.COMPONENT_REMOVE, this.removeRigidbodyFromWorld);
        }


        public getRotation(): Vector3 {
            let ammoRotation: Ammo.btQuaternion = this.ammoTransform.getRotation();
            let fudgeQuaterion: Quaternion = new Quaternion(ammoRotation.x(), ammoRotation.y(), ammoRotation.z(), ammoRotation.w());
            return fudgeQuaterion.toDegrees();
        }

        public getPosition(): Vector3 {
            let ammoOrigin: Ammo.btVector3 = this.ammoTransform.getOrigin();
            return new Vector3(ammoOrigin.x(), ammoOrigin.y(), ammoOrigin.z());
        }

        public updateBody() {
            this.ammoBody.getMotionState().getWorldTransform(this.ammoTransform);
        }

        public getAmmoRigidbody(): Ammo.btRigidBody {
            return this.ammoBody;
        }

        private addRigidbodyToWorld() {
            Physics.world.getAmmoWorld().addRigidBody(this.ammoBody);
        }

        private removeRigidbodyFromWorld() {
            Physics.world.getAmmoWorld().removeRigidBody(this.ammoBody);
        }

        private createBody(node: Node) {
            let transformC: ComponentTransform = node.getComponent(ComponentTransform);
            Debug.log(transformC.local.translation);
            let scale: Ammo.btVector3 = new Ammo.btVector3(transformC.local.scaling.x / 2, transformC.local.scaling.y / 2, transformC.local.scaling.z / 2);
            let pos: Ammo.btVector3 = new Ammo.btVector3(transformC.local.translation.x, transformC.local.translation.y, transformC.local.translation.z);
            let transform: Ammo.btTransform = new Ammo.btTransform();
            let rotation: Ammo.btQuaternion = new Ammo.btQuaternion(0, 0, 0, 0);
            rotation.setEulerZYX(node.mtxWorld.rotation.z, node.mtxWorld.rotation.y, node.mtxWorld.rotation.x);
            transform.setIdentity();
            Debug.log("pos:" + pos.y() + " / trans: " + transformC.local.translation.y);
            transform.setOrigin(pos);
            transform.setRotation(rotation);
            let shape: Ammo.btBoxShape = new Ammo.btBoxShape(scale);
            shape.setMargin(0.05);
            let rbMass: number = this.mass;
            let localInertia: Ammo.btVector3 = new Ammo.btVector3(0, 0, 0);
            shape.calculateLocalInertia(rbMass, localInertia);
            let myMotionState: Ammo.btDefaultMotionState = new Ammo.btDefaultMotionState(transform);
            let rbInfo: Ammo.btRigidBodyConstructionInfo = new Ammo.btRigidBodyConstructionInfo(rbMass, myMotionState, shape, localInertia);
            rbInfo.set_m_restitution(0.5);
            let body: Ammo.btRigidBody = new Ammo.btRigidBody(rbInfo);
            this.ammoBody = body;
        }
    }
}