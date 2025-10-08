import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

/**
 * Dependency Graph Visualization Component

 *  * 

 * Interactive dependency graph using ReactFlow. * Interactive dependency graph using ReactFlow.

 * Displays policy dependencies with different node types and edge strengths. * Displays policy dependencies with different node types and edge strengths.

 *  * 

 * Features: * Features:

 * - Interactive pan and zoom * - Interactive pan and zoom

 * - Different node colors for dependency types * - Different node colors for dependency types

 * - Edge thickness based on dependency strength * - Edge thickness based on dependency strength

 * - Mini-map for navigation * - Mini-map for navigation

 * - Background grid * - Background grid

 *  * 

 * @component * @component

 * @version 2.0.0 * @version 2.0.0

 * @since Phase 2 TIER 1 - Feature 3 * @since Phase 2 TIER 1 - Feature 3

 */ */



interface DependencyGraphProps {interface DependencyGraphProps {

  graphData: {  graphData: {

    nodes: Array<{    nodes: Array<{

      id: string;      id: string;

      type: string;      type: string;

      label: string;      label: string;

    }>;    }>;

    edges: Array<{    edges: Array<{

      source: string;      source: string;

      target: string;      target: string;

      strength: string;      strength: string;

    }>;    }>;

  };  };

}}



export default function DependencyGraph({ graphData }: DependencyGraphProps) {export default function DependencyGraph({ graphData }: DependencyGraphProps) {

  // Map node types to colors  // Map node types to colors

  const getNodeColor = (type: string): string => {  const getNodeColor = (type: string): string => {

    switch (type.toLowerCase()) {    switch (type.toLowerCase()) {

      case 'policy':      case ''policy'':

        return '#3b82f6'; // blue-500        return ''#3b82f6''; // blue-500

      case 'procedure':      case ''procedure'':

        return '#10b981'; // green-500        return ''#10b981''; // green-500

      case 'regulation':      case ''regulation'':

        return '#f59e0b'; // amber-500        return ''#f59e0b''; // amber-500

      case 'guideline':      case ''guideline'':

        return '#8b5cf6'; // violet-500        return ''#8b5cf6''; // violet-500

      case 'standard':      case ''standard'':

        return '#ec4899'; // pink-500        return ''#ec4899''; // pink-500

      default:      default:

        return '#6b7280'; // gray-500        return ''#6b7280''; // gray-500

    }    }

  };  };



  // Map edge strength to width  // Map edge strength to width

  const getEdgeWidth = (strength: string): number => {  const getEdgeWidth = (strength: string): number => {

    switch (strength.toLowerCase()) {    switch (strength.toLowerCase()) {

      case 'strong':      case ''strong'':

        return 3;        return 3;

      case 'moderate':      case ''moderate'':

        return 2;        return 2;

      case 'weak':      case ''weak'':

        return 1;        return 1;

      default:      default:

        return 1.5;        return 1.5;

    }    }

  };  };



  // Transform graph data to ReactFlow format  // Transform graph data to ReactFlow format

  const flowNodes: Node[] = graphData.nodes.map((node, index) => ({  const flowNodes: Node[] = graphData.nodes.map((node, index) => ({

    id: node.id,    id: node.id,

    type: 'default',    type: ''default'',

    position: {    position: {

      x: (index % 4) * 250 + 100,      x: (index % 4) * 250 + 100,

      y: Math.floor(index / 4) * 150 + 100      y: Math.floor(index / 4) * 150 + 100

    },    },

    data: {    data: {

      label: (      label: (

        <div className="flex items-center gap-2">        <div className="flex items-center gap-2">

          <Badge           <Badge 

            className="text-xs"             className="text-xs" 

            style={{ backgroundColor: getNodeColor(node.type) }}            style={{ backgroundColor: getNodeColor(node.type) }}

          >          >

            {node.type}            {node.type}

          </Badge>          </Badge>

          <span className="font-medium">{node.label}</span>          <span className="font-medium">{node.label}</span>

        </div>        </div>

      )      )

    },    },

    style: {    style: {

      background: 'white',      background: ''white'',

      border: `2px solid ${getNodeColor(node.type)}`,      border: `2px solid ${getNodeColor(node.type)}`,

      borderRadius: '8px',      borderRadius: ''8px'',

      padding: '10px 15px',      padding: ''10px 15px'',

      fontSize: '14px',      fontSize: ''14px'',

      minWidth: '200px'      minWidth: ''200px''

    }    }

  }));  }));



  const flowEdges: Edge[] = graphData.edges.map((edge, index) => ({  const flowEdges: Edge[] = graphData.edges.map((edge, index) => ({

    id: `edge-${index}`,    id: `edge-${index}`,

    source: edge.source,    source: edge.source,

    target: edge.target,    target: edge.target,

    type: 'smoothstep',    type: ''smoothstep'',

    animated: edge.strength === 'strong',    animated: edge.strength === ''strong'',

    style: {    style: {

      strokeWidth: getEdgeWidth(edge.strength),      strokeWidth: getEdgeWidth(edge.strength),

      stroke: '#94a3b8' // slate-400      stroke: ''#94a3b8'' // slate-400

    },    },

    markerEnd: {    markerEnd: {

      type: MarkerType.ArrowClosed,      type: MarkerType.ArrowClosed,

      color: '#94a3b8'      color: ''#94a3b8''

    },    },

    label: edge.strength,    label: edge.strength,

    labelStyle: {    labelStyle: {

      fontSize: '12px',      fontSize: ''12px'',

      fontWeight: 500      fontWeight: 500

    }    }

  }));  }));



  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);

  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);



  const onConnect = useCallback(  const onConnect = useCallback(

    (params: any) => setEdges((eds) => [...eds, params]),    (params: any) => setEdges((eds) => [...eds, params]),

    [setEdges]    [setEdges]

  );  );



  return (  return (

    <Card className="h-[600px]">    <Card className="h-[600px]">

      <CardHeader>      <CardHeader>

        <CardTitle>Policy Dependency Graph</CardTitle>        <CardTitle>Policy Dependency Graph</CardTitle>

      </CardHeader>      </CardHeader>

      <CardContent className="h-[calc(100%-80px)]">      <CardContent className="h-[calc(100%-80px)]">

        <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden">        <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden">

          <ReactFlow          <ReactFlow

            nodes={nodes}            nodes={nodes}

            edges={edges}            edges={edges}

            onNodesChange={onNodesChange}            onNodesChange={onNodesChange}

            onEdgesChange={onEdgesChange}            onEdgesChange={onEdgesChange}

            onConnect={onConnect}            onConnect={onConnect}

            fitView            fitView

            attributionPosition="bottom-left"            attributionPosition="bottom-left"

          >          >

            <Background color="#e5e7eb" gap={16} />            <Background color="#e5e7eb" gap={16} />

            <Controls className="bg-white border border-gray-200 rounded-lg" />            <Controls className="bg-white border border-gray-200 rounded-lg" />

            <MiniMap             <MiniMap 

              nodeColor={(node: any) => {              nodeColor={(node: any) => {

                const nodeData = graphData.nodes.find(n => n.id === node.id);                const nodeData = graphData.nodes.find(n => n.id === node.id);

                return nodeData ? getNodeColor(nodeData.type) : '#6b7280';                return nodeData ? getNodeColor(nodeData.type) : ''#6b7280'';

              }}              }}

              className="bg-white border border-gray-200 rounded-lg"              className="bg-white border border-gray-200 rounded-lg"

            />            />

          </ReactFlow>          </ReactFlow>

        </div>        </div>



        {/* Legend */}        {/* Legend */}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">        <div className="mt-4 p-4 bg-gray-50 rounded-lg">

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Node Types</h4>          <h4 className="text-sm font-semibold text-gray-700 mb-2">Node Types</h4>

          <div className="flex flex-wrap gap-2">          <div className="flex flex-wrap gap-2">

            {['policy', 'procedure', 'regulation', 'guideline', 'standard'].map(type => (            {[''policy'', ''procedure'', ''regulation'', ''guideline'', ''standard''].map(type => (

              <Badge               <Badge 

                key={type}                key={type}

                style={{ backgroundColor: getNodeColor(type) }}                style={{ backgroundColor: getNodeColor(type) }}

                className="text-white"                className="text-white"

              >              >

                {type.charAt(0).toUpperCase() + type.slice(1)}                {type.charAt(0).toUpperCase() + type.slice(1)}

              </Badge>              </Badge>

            ))}            ))}

          </div>          </div>

        </div>        </div>

      </CardContent>      </CardContent>

    </Card>    </Card>

  );  );

}}
