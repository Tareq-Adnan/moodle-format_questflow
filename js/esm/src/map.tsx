import React, { useEffect, useState } from 'react';

/**
 * Moodle globals.
 */
declare const M: any;

interface MapProps {
    courseid: number;
    editing: boolean;
    options?: {
        start_title: string;
        start_subtitle: string;
        start_icon: string;
        finish_title: string;
        finish_subtitle: string;
        finish_icon: string;
        finish_title_completed: string;
        finish_subtitle_completed: string;
        finish_icon_completed: string;
        map_fullwidth: string | number;
    };
}

interface MapNode {
    id: number;
    sectionid: number;
    cmid: number;
    name: string;
    url: string;
    status: 'locked' | 'current' | 'completed';
    available: boolean;
    hastracking: boolean;
    metadata?: string;
}

const triggerConfetti = () => {
    const colors = ['#3b82f6', '#10b981', '#fbbf24', '#ef4444', '#a855f7'];
    for (let i = 0; i < 80; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = '50vw';
        particle.style.top = '50vh';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        particle.style.zIndex = '9999';
        particle.style.pointerEvents = 'none';
        
        document.body.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 10 + Math.random() * 15;
        const vx = Math.cos(angle) * velocity;
        let vy = Math.sin(angle) * velocity - 15;
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        let opacity = 1;
        
        const animate = () => {
            x += vx;
            vy += 0.5;
            y += vy;
            opacity -= 0.015;
            
            particle.style.transform = `translate(${x - window.innerWidth / 2}px, ${y - window.innerHeight / 2}px) rotate(${x}deg)`;
            particle.style.opacity = opacity.toString();
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        requestAnimationFrame(animate);
    }
};

const Map = ({ courseid, editing, options }: MapProps) => {
    const [nodes, setNodes] = useState<MapNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fallbacks for options
    const o = options || {
        start_title: 'Journey Begins',
        start_subtitle: 'Your quest starts here. Follow the path downwards.',
        start_icon: '🚀',
        finish_title: 'Finish Line',
        finish_subtitle: 'Complete all trackable activities to reach the goal.',
        finish_icon: '🏁',
        finish_title_completed: 'Course Completed!',
        finish_subtitle_completed: 'Congratulations, you have reached the end of the journey.',
        finish_icon_completed: '🏆',
        map_fullwidth: 0
    };

    const initialFullWidth = parseInt(o.map_fullwidth as any || '0', 10) === 1;
    const [isFullWidth, setIsFullWidth] = useState(initialFullWidth);
    const [collapsedSections, setCollapsedSections] = useState<number[]>([]);
    const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);

    const handleToggleBranch = async (e: React.MouseEvent, node: MapNode) => {
        e.stopPropagation();
        const currentMeta = node.metadata ? JSON.parse(node.metadata) : {};
        const isBranch = !currentMeta.isBranch;
        const newMeta = { ...currentMeta, isBranch };
        
        // Optimistic UI update
        setNodes(nodes.map(n => n.id === node.id ? { ...n, metadata: JSON.stringify(newMeta) } : n));

        try {
            await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    index: 0,
                    methodname: 'format_questflow_save_node_metadata',
                    args: { courseid, sectionid: node.sectionid, cmid: node.cmid, metadata: JSON.stringify({ isBranch }) }
                }])
            });
        } catch (err) {
            console.error('Failed to toggle branch', err);
        }
    };

    const handleSetBranchCaption = async (node: MapNode, caption: string) => {
        const currentMeta = node.metadata ? JSON.parse(node.metadata) : {};
        const newMeta = { ...currentMeta, branchCaption: caption };
        
        // Optimistic UI update
        setNodes(nodes.map(n => n.id === node.id ? { ...n, metadata: JSON.stringify(newMeta) } : n));

        try {
            await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    index: 0,
                    methodname: 'format_questflow_save_node_metadata',
                    args: { courseid, sectionid: node.sectionid, cmid: node.cmid, metadata: JSON.stringify(newMeta) }
                }])
            });
        } catch (err) {
            console.error('Failed to set branch caption', err);
        }
    };

    const handleToggleWidth = async () => {
        const newState = !isFullWidth;
        setIsFullWidth(newState);
        try {
            await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    index: 0,
                    methodname: 'format_questflow_toggle_fullwidth',
                    args: { courseid, fullwidth: newState ? 1 : 0 }
                }])
            });
        } catch (err) {
            console.error('Failed to toggle width', err);
        }
    };

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const response = await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify([{
                        index: 0,
                        methodname: 'format_questflow_get_map_data',
                        args: { courseid }
                    }])
                });
                const data = await response.json();
                
                if (data[0] && !data[0].error) {
                    // Sort nodes sequentially: Sections first, then activities within sections.
                    const sortedNodes = data[0].data.nodes.sort((a: MapNode, b: MapNode) => {
                        if (a.sectionid !== b.sectionid) return a.sectionid - b.sectionid;
                        return a.cmid - b.cmid;
                    });

                    // Phase 9: Completion Celebrations
                    const storageKey = `questflow_completed_${courseid}`;
                    let previouslyCompleted: number[] = [];
                    try {
                        const stored = localStorage.getItem(storageKey);
                        if (stored) {
                            previouslyCompleted = JSON.parse(stored);
                        }
                    } catch (e) {}

                    let shouldCelebrate = false;
                    const currentlyCompleted = sortedNodes
                        .filter((n: MapNode) => n.status === 'completed' && (n.cmid === 0 || n.hastracking))
                        .map((n: MapNode) => n.id);

                    const newlyCompletedChapters = sortedNodes.filter(
                        (n: MapNode) => n.status === 'completed' && n.cmid === 0 && !previouslyCompleted.includes(n.id)
                    );
                    
                    if (newlyCompletedChapters.length > 0) {
                        shouldCelebrate = true;
                    }

                    const trackableNodes = sortedNodes.filter((n: MapNode) => n.hastracking && n.cmid !== 0);
                    const courseCompleted = trackableNodes.length > 0 && trackableNodes.every((n: MapNode) => n.status === 'completed');
                    
                    if (courseCompleted) {
                        const courseCompletedKey = `questflow_course_completed_${courseid}`;
                        if (!localStorage.getItem(courseCompletedKey)) {
                            shouldCelebrate = true;
                            localStorage.setItem(courseCompletedKey, 'true');
                        }
                    }

                    if (shouldCelebrate) {
                        triggerConfetti();
                    }

                    try {
                        localStorage.setItem(storageKey, JSON.stringify(currentlyCompleted));
                    } catch (e) {}

                    setNodes(sortedNodes);
                } else {
                    console.error('AJAX Error:', data[0]?.exception);
                    setError('Could not load quest data.');
                }
            } catch (err) {
                console.error('QuestFlow Fetch Error', err);
                setError('Failed to connect to server.');
            } finally {
                setLoading(false);
            }
        };
        fetchMapData();
    }, [courseid]);

    const handleNodeClick = (node: MapNode) => {
        if (!editing && node.status === 'locked') {
            setActiveTooltip(activeTooltip === node.id ? null : node.id);
            return;
        }
        
        if (!editing && node.status !== 'locked') {
            setActiveTooltip(null);
            if (node.cmid === 0) {
                // Toggle chapter collapse state
                setCollapsedSections(prev => 
                    prev.includes(node.sectionid) 
                        ? prev.filter(id => id !== node.sectionid) 
                        : [...prev, node.sectionid]
                );
            } else if (node.url) {
                window.location.href = node.url;
            }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
            </div>
        );
    }

    if (error || nodes.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                <h3 style={{ color: '#475569', fontSize: '1.5rem', marginBottom: '10px' }}>{error ? 'Error Loading Journey' : 'Journey is Empty'}</h3>
                <p style={{ color: '#64748b' }}>{error || 'Add chapters or activities in Edit mode to build your learning path.'}</p>
            </div>
        );
    }

    // Filter visible nodes and hide empty chapters for students
    const visibleNodes = nodes.filter(n => {
        // If a node is completely hidden (not even restriction info available), hide it.
        // But if it has metadata.restrictions, it means Moodle wants it shown greyed out.
        let meta: any = {};
        try { if (n.metadata) meta = JSON.parse(n.metadata); } catch(e) {}

        if (!editing && !n.available && n.status === 'locked' && !meta.restrictions) {
            return false;
        }
        
        // Hide empty sections for students
        if (!editing && n.cmid === 0) {
            const hasActivities = nodes.some(child => child.sectionid === n.sectionid && child.cmid !== 0 && (editing || child.available || child.status !== 'locked' || (child.metadata && child.metadata.includes('restrictions'))));
            if (!hasActivities) return false;
        }

        // Hide activities if their parent section is collapsed
        if (!editing && n.cmid !== 0 && collapsedSections.includes(n.sectionid)) {
            return false;
        }
        
        return true;
    });

    // Group nodes for branching
    const groupedNodes: MapNode[][] = [];
    let currentGroup: MapNode[] = [];
    
    visibleNodes.forEach(node => {
        let meta: any = {};
        try { if (node.metadata) meta = JSON.parse(node.metadata); } catch(e) {}
        
        if (meta.isBranch && node.cmid !== 0) {
            currentGroup.push(node);
        } else {
            if (currentGroup.length > 0) {
                groupedNodes.push([...currentGroup]);
                currentGroup = [];
            }
            groupedNodes.push([node]);
        }
    });
    if (currentGroup.length > 0) {
        groupedNodes.push([...currentGroup]);
    }

    // Check course completion status for the Finish Line
    const trackableNodes = nodes.filter(n => n.hastracking && n.cmid !== 0);
    const courseCompleted = trackableNodes.length > 0 && trackableNodes.every(n => n.status === 'completed');

    const containerStyle: React.CSSProperties = {
        background: '#f8fafc', 
        padding: '40px 20px', 
        borderRadius: isFullWidth ? '8px' : '24px', 
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', 
        maxWidth: isFullWidth ? '100%' : '800px', 
        width: '100%', 
        margin: '0 auto', 
        border: '1px solid #e2e8f0', 
        transition: 'max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s ease', 
        position: 'relative',
        boxSizing: 'border-box'
    };

    /**
     * Handle keyboard navigation for accessibility.
     */
    const handleKeyDown = (e: React.KeyboardEvent, node: MapNode) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNodeClick(node);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {editing ? '🛠️ Journey Builder' : '🗺️ Your Learning Path'}
                </h2>
                <p style={{ color: '#64748b', marginTop: '10px', fontSize: '1.1rem' }}>
                    {editing ? 'Standard Moodle editing tools are available below.' : 'Follow the path to complete the course.'}
                </p>
            </div>

            <div style={{ position: 'relative', padding: '20px 0' }}>
                {/* The curved road timeline */}
                <div style={{ 
                    position: 'absolute', left: '0', top: '0', bottom: '0', width: '100px', 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='200' viewBox='0 0 100 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 0 C 100 60, 0 140, 50 200' fill='none' stroke='%23cbd5e1' stroke-width='16' stroke-linecap='round'/%3E%3Cpath d='M 50 0 C 100 60, 0 140, 50 200' fill='none' stroke='%23f8fafc' stroke-width='4' stroke-dasharray='8 12' stroke-linecap='round'/%3E%3C/svg%3E")`, 
                    backgroundRepeat: 'repeat-y', 
                    zIndex: 1 
                }}></div>

                {/* Course Start Line / Milestone */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px', position: 'relative', zIndex: 2 }}>
                    <div style={{ 
                        width: '80px', height: '80px', minWidth: '80px', flexShrink: 0, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        marginLeft: '10px', border: '6px solid white', 
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
                        fontSize: '2rem'
                    }}>
                        {o.start_icon}
                    </div>
                    <div style={{ marginLeft: '20px' }}>
                        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', fontWeight: 800 }}>
                            {o.start_title}
                        </h2>
                        <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '1rem' }}>
                            {o.start_subtitle}
                        </p>
                    </div>
                </div>

                {groupedNodes.map((group, groupIndex) => {
                    const isBranchGroup = group.length > 1;
                    let branchCaption = '';
                    if (isBranchGroup) {
                        try {
                            const firstMeta = JSON.parse(group[0].metadata || '{}');
                            branchCaption = firstMeta.branchCaption || '';
                        } catch (e) {}
                    }
                    
                    return (
                        <div key={`group-${groupIndex}`} style={{ width: '100%', marginBottom: '40px' }}>
                            {isBranchGroup && (branchCaption || editing) && (
                                <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    {branchCaption && (
                                        <span style={{ 
                                            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
                                            color: '#334155', 
                                            padding: '8px 20px', 
                                            borderRadius: '9999px', 
                                            fontSize: '0.9rem', 
                                            fontWeight: 800, 
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <span style={{ fontSize: '1.1rem' }}>🔀</span> {branchCaption}
                                        </span>
                                    )}
                                    {editing && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newCaption = prompt('Enter instructions for this branch (e.g., "Choose one path:")', branchCaption);
                                                if (newCaption !== null) {
                                                    handleSetBranchCaption(group[0], newCaption);
                                                }
                                            }}
                                            style={{ 
                                                padding: '6px 16px', 
                                                fontSize: '0.8rem', 
                                                cursor: 'pointer', 
                                                borderRadius: '9999px', 
                                                border: '1px dashed #94a3b8', 
                                                background: '#f8fafc',
                                                color: '#475569',
                                                fontWeight: 700,
                                                transition: 'all 0.2s',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#64748b'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                        >
                                            <span style={{ fontSize: '1rem' }}>✏️</span> {branchCaption ? 'Edit' : 'Add Branch Caption'}
                                        </button>
                                    )}
                                </div>
                            )}
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'row', 
                                justifyContent: isBranchGroup ? 'space-around' : 'flex-start',
                                flexWrap: 'wrap',
                                gap: isBranchGroup ? '20px' : '0',
                                width: '100%',
                                position: 'relative',
                                zIndex: 2
                            }}>
                            {group.map((node, index) => {
                                const isCompleted = node.status === 'completed';
                                const isCurrent = node.status === 'current';
                                const isLocked = node.status === 'locked';
                                const isSection = node.cmid === 0;
                                const isCollapsed = isSection && collapsedSections.includes(node.sectionid);

                                let nodeColor = '#94a3b8'; // Locked gray
                                let icon: React.ReactNode = '🔒';
                                let pulseAnim = '';
                                
                                let metadataObj: any = {};
                                try {
                                    if (node.metadata) {
                                        metadataObj = JSON.parse(node.metadata);
                                    }
                                } catch (e) {}
                                
                                const smallIcon = (symbol: string) => <span style={{ fontSize: '0.65em' }}>{symbol}</span>;
                                
                                if (!node.hastracking && !isSection && node.status !== 'locked') {
                                    nodeColor = '#64748b'; // Neutral slate gray for informational items
                                    icon = '•'; // Simple dot icon instead of emoji
                                } else if (isCompleted) {
                                    nodeColor = '#10b981'; // Success Green
                                    icon = isSection ? (isCollapsed ? smallIcon('➕') : '✓') : '✓';
                                } else if (isCurrent) {
                                    nodeColor = '#3b82f6'; // Primary Blue
                                    icon = isSection ? (isCollapsed ? smallIcon('➕') : '⭐') : '⭐';
                                    pulseAnim = 'pulse-animation 2s infinite';
                                } else if (isSection && !isLocked) {
                                    // Section that is unlocked but not current/completed
                                    icon = isCollapsed ? smallIcon('➕') : smallIcon('➖');
                                }

                                // Apply Heatmap Override
                                let heatmapBoxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                if (showHeatmap && metadataObj.activeUsers !== undefined) {
                                    if (metadataObj.activeUsers > 30) {
                                        nodeColor = '#dc2626'; // Red
                                        heatmapBoxShadow = '0 0 20px rgba(220, 38, 38, 0.8)';
                                    } else if (metadataObj.activeUsers > 15) {
                                        nodeColor = '#ea580c'; // Orange
                                        heatmapBoxShadow = '0 0 15px rgba(234, 88, 12, 0.6)';
                                    } else if (metadataObj.activeUsers > 0) {
                                        nodeColor = '#eab308'; // Yellow
                                        heatmapBoxShadow = '0 0 10px rgba(234, 179, 8, 0.4)';
                                    } else {
                                        nodeColor = '#cbd5e1'; // Gray
                                    }
                                    icon = metadataObj.activeUsers.toString();
                                }

                                return (
                                    <div 
                                        key={node.id} 
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            position: 'relative', 
                                            opacity: (isLocked && !showHeatmap) ? 0.6 : 1,
                                            cursor: isLocked && !editing ? 'not-allowed' : 'pointer',
                                            transform: 'translateY(0)',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            flex: isBranchGroup ? `1 1 calc(${100 / group.length}% - 20px)` : '1 1 100%',
                                            minWidth: isBranchGroup ? '280px' : 'auto'
                                        }}
                                        onClick={() => handleNodeClick(node)}
                                        onMouseEnter={(e) => {
                                            if (!isLocked || editing) {
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <style>{`
                                            @keyframes pulse-animation {
                                                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                                                70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
                                                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                                            }
                                        `}</style>

                                        {/* The Milestone Circle */}
                                        <div style={{ 
                                            width: isSection ? '60px' : '40px', 
                                            height: isSection ? '60px' : '40px', 
                                            minWidth: isSection ? '60px' : '40px', 
                                            borderRadius: '50%', 
                                            background: nodeColor, 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            color: 'white',
                                            fontSize: isSection ? '1.5rem' : '1.2rem',
                                            fontWeight: 'bold',
                                            marginLeft: isSection ? '20px' : (isBranchGroup ? '0' : '30px'),
                                            border: '4px solid white',
                                            boxShadow: heatmapBoxShadow,
                                            animation: showHeatmap ? 'none' : pulseAnim,
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {icon}
                                        </div>

                                        {/* The Content Card */}
                                        <div style={{ 
                                            marginLeft: '20px', 
                                            background: 'white', 
                                            padding: isSection ? '20px' : '15px 20px', 
                                            borderRadius: '16px', 
                                            flex: 1, 
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                            border: isCurrent && !showHeatmap ? '2px solid #3b82f6' : (showHeatmap && metadataObj.activeUsers > 0 ? `2px solid ${nodeColor}` : '1px solid #e2e8f0'),
                                            position: 'relative'
                                        }}>
                                            {/* Connector triangle */}
                                            <div style={{ position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: `10px solid ${isCurrent && !showHeatmap ? '#3b82f6' : (showHeatmap && metadataObj.activeUsers > 0 ? nodeColor : '#e2e8f0')}` }}></div>
                                            <div style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid white' }}></div>
                                            
                                            {showHeatmap && metadataObj.dropoffRate > 15 && (
                                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title={`${metadataObj.dropoffRate}% of students abandon the course here`}>
                                                    ⚠️ {metadataObj.dropoffRate}% Drop-off
                                                </div>
                                            )}
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: nodeColor, letterSpacing: '1px' }}>
                                                        {isSection ? 'Chapter' : (metadataObj.isBranch ? 'Branch Choice' : 'Activity')}
                                                    </span>
                                                    {metadataObj.xp && (
                                                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', marginLeft: '10px', fontWeight: 'bold' }}>
                                                            +{metadataObj.xp} XP
                                                        </span>
                                                    )}
                                                    {metadataObj.loot && (
                                                        <span style={{ fontSize: '1rem', marginLeft: '5px' }}>
                                                            {metadataObj.loot}
                                                        </span>
                                                    )}
                                                    <h3 style={{ margin: '5px 0 0 0', fontSize: isSection ? '1.4rem' : '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                                                        {node.name}
                                                    </h3>
                                                </div>
                                                {editing && !isSection && (
                                                    <button 
                                                        onClick={(e) => handleToggleBranch(e, node)}
                                                        title="Toggle Branching (renders side-by-side with adjacent branches)"
                                                        style={{ 
                                                            background: metadataObj.isBranch ? '#3b82f6' : '#f1f5f9', 
                                                            color: metadataObj.isBranch ? 'white' : '#64748b', 
                                                            border: 'none', 
                                                            borderRadius: '4px', 
                                                            padding: '4px 8px', 
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        ⑂ Branch
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {isLocked && !editing && activeTooltip === node.id && (
                                                <div style={{ 
                                                    marginTop: '10px', 
                                                    padding: '10px', 
                                                    background: '#fef2f2', 
                                                    border: '1px solid #fecaca', 
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    color: '#991b1b',
                                                    position: 'relative',
                                                    animation: 'fadeIn 0.2s ease-out'
                                                }}>
                                                    <style>{`
                                                        @keyframes fadeIn {
                                                            from { opacity: 0; transform: translateY(-5px); }
                                                            to { opacity: 1; transform: translateY(0); }
                                                        }
                                                    `}</style>
                                                    <strong>🔒 Restricted:</strong> {metadataObj.restrictions || 'Prerequisites not met yet.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    );
                })}

                {/* Course Finish Line / Milestone */}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '60px', position: 'relative', zIndex: 2 }}>
                    <div style={{ 
                        width: '80px', height: '80px', minWidth: '80px', flexShrink: 0, borderRadius: '50%', 
                        background: courseCompleted ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#cbd5e1', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        marginLeft: '10px', border: '6px solid white', 
                        boxShadow: courseCompleted ? '0 0 30px rgba(245, 158, 11, 0.6)' : '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'all 0.5s ease',
                        fontSize: '2rem'
                    }}>
                        {courseCompleted ? o.finish_icon_completed : o.finish_icon}
                    </div>
                    <div style={{ marginLeft: '20px' }}>
                        <h2 style={{ margin: 0, color: courseCompleted ? '#d97706' : '#64748b', fontSize: '1.8rem', fontWeight: 800 }}>
                            {courseCompleted ? o.finish_title_completed : o.finish_title}
                        </h2>
                        <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '1rem' }}>
                            {courseCompleted ? o.finish_subtitle_completed : o.finish_subtitle}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Spacer to prevent toolbar from overlapping the finish line */}
            {editing && <div style={{ height: '80px', width: '100%' }}></div>}
            
            {editing && (
                <div style={{ position: 'sticky', bottom: '20px', marginBottom: '-40px', zIndex: 1000, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', bottom: '0', pointerEvents: 'auto', display: 'flex', gap: '12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', padding: '10px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
                        <button 
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            style={{ 
                                padding: '10px 24px', 
                                background: showHeatmap ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'white', 
                                color: showHeatmap ? 'white' : '#475569', 
                                border: showHeatmap ? '1px solid transparent' : '1px solid #e2e8f0', 
                                borderRadius: '9999px', 
                                cursor: 'pointer', 
                                fontWeight: 700, 
                                fontSize: '0.95rem', 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: showHeatmap ? '0 6px 15px rgba(239, 68, 68, 0.3)' : '0 2px 5px rgba(0,0,0,0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => { if (!showHeatmap) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={(e) => { if (!showHeatmap) e.currentTarget.style.background = 'white' }}
                            title="Toggle Analytics Heatmap"
                        >
                            🔥 Heatmap
                        </button>
                        <button 
                            onClick={handleToggleWidth}
                            style={{ 
                                padding: '10px 24px', 
                                background: isFullWidth ? 'linear-gradient(135deg, #3b82f6, #0ea5e9)' : 'white', 
                                color: isFullWidth ? 'white' : '#475569', 
                                border: isFullWidth ? '1px solid transparent' : '1px solid #e2e8f0', 
                                borderRadius: '9999px', 
                                cursor: 'pointer', 
                                fontWeight: 700, 
                                fontSize: '0.95rem', 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isFullWidth ? '0 6px 15px rgba(59, 130, 246, 0.3)' : '0 2px 5px rgba(0,0,0,0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => { if (!isFullWidth) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={(e) => { if (!isFullWidth) e.currentTarget.style.background = 'white' }}
                            aria-label="Toggle Full Width"
                            title="Toggle Full Width"
                        >
                            {isFullWidth ? '⤮ Collapse' : '⤢ Full Width'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Map;
