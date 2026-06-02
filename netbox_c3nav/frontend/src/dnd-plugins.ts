import {Plugin, PluginOptions} from '@dnd-kit/abstract'
import {DragDropManager, StyleInjector} from "@dnd-kit/dom";

export class MapCursor extends Plugin<DragDropManager> {
  constructor(
    public manager: DragDropManager,
    options?: PluginOptions
  ) {
    super(manager, options);

    const cursor = 'crosshair';
    const styleInjector = manager.registry.plugins.get(
      StyleInjector as any
    ) as StyleInjector | undefined;

    const unregisterStyles = styleInjector?.register(
      `#map { cursor: ${cursor} !important; }`
    );

    if (unregisterStyles) {
      const originalDestroy = this.destroy.bind(this);
      this.destroy = () => {
        unregisterStyles();
        originalDestroy();
      };
    }
  }
}