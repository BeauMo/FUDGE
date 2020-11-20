namespace Fudge {
  export class ObjectMode extends AbstractControlMode {
    public static readonly iSubclass: number = AbstractControlMode.registerSubclass(ObjectMode);
    // public modes: {[mode in InteractionMode]?: string} = {[InteractionMode.ROTATE]: "r", [InteractionMode.TRANSLATE]: "t"};
    public modes: {[mode in InteractionMode]?: {type: typeof IInteractionMode, shortcut: string}} = 
    {
      [InteractionMode.ROTATE]: {type: ObjectRotation, shortcut: "r"},
      [InteractionMode.TRANSLATE]: {type: ObjectTranslation, shortcut: "t"}
    };
    
    // public setInteractionMode(mode: InteractionMode): IInteractionMode {
    //   let interactionMode: IInteractionMode;
    //   switch (mode) {
    //     case InteractionMode.ROTATE:
    //       interactionMode = new ObjectRotation();
    //       break;
    //     case InteractionMode.TRANSLATE:
    //       interactionMode = new ObjectTranslation();
    //       break;
    //     default:
    //       interactionMode = new IdleMode();
    //       break;
    //   }

    //   return interactionMode;
    // }
  }
} 