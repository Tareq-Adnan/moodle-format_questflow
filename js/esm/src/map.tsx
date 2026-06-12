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
}

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
        if (!editing && node.status !== 'locked') {
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
        if (!editing && !n.available && n.status === 'locked') return false;
        
        // Hide empty sections for students
        if (!editing && n.cmid === 0) {
            const hasActivities = nodes.some(child => child.sectionid === n.sectionid && child.cmid !== 0 && (editing || child.available || child.status !== 'locked'));
            if (!hasActivities) return false;
        }

        // Hide activities if their parent section is collapsed
        if (!editing && n.cmid !== 0 && collapsedSections.includes(n.sectionid)) {
            return false;
        }
        
        return true;
    });

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
            
            {editing && (
                <button 
                    onClick={handleToggleWidth}
                    style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background 0.2s', zIndex: 10 }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#cbd5e1'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    aria-label="Toggle Full Width"
                    title="Toggle Full Width"
                >
                    {isFullWidth ? '⤮ Collapse Width' : '⤢ Full Width'}
                </button>
            )}

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

                {visibleNodes.map((node, index) => {
                    const isCompleted = node.status === 'completed';
                    const isCurrent = node.status === 'current';
                    const isLocked = node.status === 'locked';
                    const isSection = node.cmid === 0;
                    const isCollapsed = isSection && collapsedSections.includes(node.sectionid);

                    let nodeColor = '#94a3b8'; // Locked gray
                    let icon = '🔒';
                    let pulseAnim = '';
                    
                    if (!node.hastracking && !isSection && node.status !== 'locked') {
                        nodeColor = '#64748b'; // Neutral slate gray for informational items
                        icon = '•'; // Simple dot icon instead of emoji
                    } else if (isCompleted) {
                        nodeColor = '#10b981'; // Success Green
                        icon = isSection ? (isCollapsed ? '➕' : '✓') : '✓';
                    } else if (isCurrent) {
                        nodeColor = '#3b82f6'; // Primary Blue
                        icon = isSection ? (isCollapsed ? '➕' : '⭐') : '⭐';
                        pulseAnim = 'pulse-animation 2s infinite';
                    } else if (isSection && !isLocked) {
                        // Section that is unlocked but not current/completed
                        icon = isCollapsed ? '➕' : '➖';
                    }

                    return (
                        <div 
                            key={node.id} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                marginBottom: '40px', 
                                position: 'relative', 
                                zIndex: 2,
                                opacity: isLocked ? 0.6 : 1,
                                cursor: isLocked && !editing ? 'not-allowed' : 'pointer',
                                transform: 'translateY(0)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
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
                                marginLeft: isSection ? '20px' : '30px',
                                border: '4px solid white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                animation: pulseAnim
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
                                border: isCurrent ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                position: 'relative'
                            }}>
                                {/* Connector triangle */}
                                <div style={{ position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: `10px solid ${isCurrent ? '#3b82f6' : '#e2e8f0'}` }}></div>
                                <div style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid white' }}></div>
                                
                                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: nodeColor, letterSpacing: '1px' }}>
                                    {isSection ? 'Chapter' : 'Activity'}
                                </span>
                                <h3 style={{ margin: '5px 0 0 0', fontSize: isSection ? '1.4rem' : '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                                    {node.name}
                                </h3>
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
            
        </div>
    );
};

export default Map;
