export { EventNote } from './EventNote';
export { CommandNote } from './CommandNote';
export { HotspotNote } from './HotspotNote';

import type { NodeTypes } from '@xyflow/react';
import { EventNote } from './EventNote';
import { CommandNote } from './CommandNote';
import { HotspotNote } from './HotspotNote';

/** Node types for Event Storming visualization */
export const eventStormingNodeTypes: NodeTypes = {
  'domain-event': EventNote,
  command: CommandNote,
  hotspot: HotspotNote,
};
