import React, { useMemo } from 'react';
import { ArchNode, Link } from '../types';

interface SmartArrowProps {
    link: Link;
    sourceNode: ArchNode;
    targetNode: ArchNode;
    isSelected: boolean;
    linkIndex: number;
    totalLinks: number;
    isBidirectional: boolean;
    isReverse: boolean;
    mode?: 'full' | 'body' | 'label'; // Control what to render for z-indexing
}

// Helper to calculate intersection of a line (from center to target) with a rectangle
const getOptimalDockingPoint = (
    node: ArchNode,
    targetPoint: { x: number; y: number },
    padding: number = 0
): { x: number; y: number; side: 'top' | 'right' | 'bottom' | 'left' } => {
    const cx = node.x;
    const cy = node.y;
    const w = (node.width || 120) / 2 + padding;
    const h = (node.height || 60) / 2 + padding;

    const dx = targetPoint.x - cx;
    const dy = targetPoint.y - cy;

    if (dx === 0 && dy === 0) return { x: cx, y: cy, side: 'top' };

    // Calculate intersection 't' for finding the edge point
    // Ray equation: P = Center + t * (Target - Center)
    // We want the smallest t > 0 such that P is on the boundary

    // Vertical edges: x = +/- w
    // t_x * dx = +/- w  => t_x = (+/- w) / dx
    // We use absolute values to find the magnitude of t needed to reach the vertical boundary
    const t_x = dx === 0 ? Infinity : w / Math.abs(dx);

    // Horizontal edges: y = +/- h
    const t_y = dy === 0 ? Infinity : h / Math.abs(dy);

    const t = Math.min(t_x, t_y);

    const intersectX = cx + t * dx;
    const intersectY = cy + t * dy;

    // Determine side based on which boundary was hit (t_x vs t_y)
    // Small epsilon for float comparison
    let side: 'top' | 'right' | 'bottom' | 'left' = 'top';

    if (t_x < t_y) {
        // Hit vertical edge
        side = dx > 0 ? 'right' : 'left';
    } else {
        // Hit horizontal edge
        side = dy > 0 ? 'bottom' : 'top';
    }

    return { x: intersectX, y: intersectY, side };
};

export const SmartArrow: React.FC<SmartArrowProps> = ({
    link,
    sourceNode,
    targetNode,
    isSelected,
    linkIndex,
    totalLinks,
    isBidirectional,
    isReverse,
    mode = 'full'
}) => {
    // 1. INTELLIGENT HEAD & TAIL DOCKING
    // Calculate precise start and end points on the perimeter
    const startDock = useMemo(() =>
        getOptimalDockingPoint(sourceNode, { x: targetNode.x, y: targetNode.y }, 2),
        [sourceNode.x, sourceNode.y, sourceNode.width, sourceNode.height, targetNode.x, targetNode.y]);

    const endDock = useMemo(() =>
        getOptimalDockingPoint(targetNode, { x: sourceNode.x, y: sourceNode.y }, 6), // Extra padding for arrow tip
        [targetNode.x, targetNode.y, targetNode.width, targetNode.height, sourceNode.x, sourceNode.y]);

    // 2. FLEXIBLE PATH GENERATION (5-Part Logic)
    const pathData = useMemo(() => {
        const { x: x1, y: y1 } = startDock;
        const { x: x2, y: y2 } = endDock;

        // Handle bidirectional offset
        let offsetX = 0;
        let offsetY = 0;
        if (isBidirectional && totalLinks > 0) {
            // Offset perpendicular to the line
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const perpX = -dy / dist;
            const perpY = dx / dist;

            const spacing = 15;
            const direction = isReverse ? -1 : 1;
            const indexOffset = (linkIndex - (totalLinks - 1) / 2);

            offsetX = perpX * (spacing * direction + indexOffset * 5);
            offsetY = perpY * (spacing * direction + indexOffset * 5);
        }

        const sx = x1 + offsetX;
        const sy = y1 + offsetY;
        const ex = x2 + offsetX;
        const ey = y2 + offsetY;

        // "Intelligent" Control Points for smoother flexible curves
        const dx = ex - sx;
        const dy = ey - sy;

        // Simple Bezier for elegance
        const cp1x = sx + dx * 0.25;
        const cp1y = sy + dy * 0.25;
        const cp2x = ex - dx * 0.25;
        const cp2y = ey - dy * 0.25;

        return `M ${sx} ${sy} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${ex} ${ey}`;

    }, [startDock, endDock, isBidirectional, isReverse, linkIndex, totalLinks]);

    // 3. INTELLIGENT STYLING
    const strokeColor = isSelected ? 'var(--color-accent)' : (link.color || 'var(--color-link)');
    const strokeWidth = isSelected ? 3 : (link.strokeWidth || 2);

    // 4. ARROW HEAD (Part 5)
    // We calculate the angle at the end of the path
    const angle = useMemo(() => {
        const ex = endDock.x;
        const ey = endDock.y;

        const sx = startDock.x;
        const sy = startDock.y;
        const dX = ex - sx;
        const dY = ey - sy;

        // CP2 is approx at 75%
        const cp2x = ex - dX * 0.25;
        const cp2y = ey - dY * 0.25;

        return Math.atan2(ey - cp2y, ex - cp2x) * (180 / Math.PI);
    }, [startDock, endDock]);

    // 5. LABEL RENDERING
    const labelPos = useMemo(() => {
        if (!link.label) return null;
        const sx = startDock.x; const sy = startDock.y;
        const ex = endDock.x; const ey = endDock.y;

        // Simple midpoint for now, improved later
        return {
            x: (sx + ex) / 2,
            y: (sy + ey) / 2 - 10 // Lift slightly
        };
    }, [startDock, endDock, link.label]);

    return (
        <g className="smart-arrow">
            {/* Part A & B & C: Body and Head */}
            {(mode === 'full' || mode === 'body') && (
                <>
                    {/* Invisible Hit Area for easier selection */}
                    <path d={pathData} stroke="transparent" strokeWidth="15" fill="none" className="cursor-pointer" />

                    {/* The Main Body */}
                    <path
                        d={pathData}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={link.style === 'dashed' ? '5,5' : link.style === 'dotted' ? '2,2' : undefined}
                        className="transition-colors duration-300"
                        filter={isSelected ? "drop-shadow(0 0 4px var(--color-accent))" : undefined}
                    />

                    {/* The Intelligent Head */}
                    <g transform={`translate(${endDock.x}, ${endDock.y}) rotate(${angle})`}>
                        <BlockArrowHead color={strokeColor} />
                    </g>
                </>
            )}

            {/* Part D: Label */}
            {(mode === 'full' || mode === 'label') && link.label && labelPos && (
                <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
                    <rect x="-4" y="-12" width={(link.label.length * 7) + 8} height="18" fill="var(--color-canvas-bg)" rx="4" opacity="0.8" />
                    <text
                        fill="var(--color-text-primary)"
                        fontSize="12"
                        fontWeight="500"
                        textAnchor="start"
                    >
                        {link.label}
                    </text>
                </g>
            )}
        </g>
    );
};

// Specialized Blocky/Tech Arrow Head Component
const BlockArrowHead: React.FC<{ color: string }> = ({ color }) => (
    <path
        d="M -10 -4 L 0 0 L -10 4 L -8 0 Z"
        fill={color}
        stroke="none"
    />
);
