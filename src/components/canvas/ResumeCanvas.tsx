import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type EdgeTypes,
  type NodeTypes,
} from '@xyflow/react'
import { useRef } from 'react'

import { PersonalNode } from './nodes/PersonalNode'
import { SummaryNode } from './nodes/SummaryNode'
import { ExperienceNode } from './nodes/ExperienceNode'
import { EducationNode } from './nodes/EducationNode'
import { SkillsNode } from './nodes/SkillsNode'
import { ProjectsNode } from './nodes/ProjectsNode'
import { CustomNode } from './nodes/CustomNode'

import { OrderEdge } from './edges/OrderEdge'
import { NodePalette, PALETTE_DRAG_TYPE } from './NodePalette'
import { DashedDropZone } from '../ui/DashedDropZone'
import { Sparkles } from 'lucide-react'
import { useResumeCanvas } from './useResumeCanvas'

const nodeTypes: NodeTypes = {
  personal: PersonalNode,
  summary: SummaryNode,
  experience: ExperienceNode,
  education: EducationNode,
  skills: SkillsNode,
  projects: ProjectsNode,
  custom: CustomNode,
}

const edgeTypes: EdgeTypes = {
  order: OrderEdge,
}

export function ResumeCanvas({ resumeId }: { resumeId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasInner resumeId={resumeId} />
    </ReactFlowProvider>
  )
}

function CanvasInner({ resumeId }: { resumeId: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvas = useResumeCanvas(resumeId, { dragType: PALETTE_DRAG_TYPE })

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full canvas-grain bg-[var(--bg)]"
      onDrop={canvas.onDrop}
      onDragOver={canvas.onDragOver}
      onDragLeave={canvas.onDragLeave}
    >
      <ReactFlow
        nodes={canvas.nodes}
        edges={canvas.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ ...canvas.defaultEdgeOptions, animated: true }}
        onNodesChange={canvas.onNodesChange}
        onEdgesChange={canvas.onEdgesChange}
        onConnect={canvas.onConnect}
        onInit={canvas.setFlow}
        onPaneClick={canvas.onPaneClick}
        onNodeClick={canvas.onNodeClick}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1.1 }}
        minZoom={0.4}
        maxZoom={1.6}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="var(--grid-dot)"
        />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>

      <NodePalette onAdd={canvas.addSection} />

      {canvas.isEmpty ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 z-10 flex justify-center px-10">
          <DashedDropZone
            icon={<Sparkles />}
            title="Drag a section onto the canvas"
            hint={canvas.isDraggingOver ? 'Release to drop' : 'or click one in the palette'}
            active={canvas.isDraggingOver}
            className="pointer-events-none w-[380px] h-[140px] bg-[var(--bg-elevated)]/70 backdrop-blur-md"
          />
        </div>
      ) : null}
    </div>
  )
}
