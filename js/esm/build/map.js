// js/esm/src/map.tsx
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var triggerConfetti = () => {
  const colors = ["#3b82f6", "#10b981", "#fbbf24", "#ef4444", "#a855f7"];
  for (let i = 0; i < 80; i++) {
    const particle = document.createElement("div");
    particle.style.position = "fixed";
    particle.style.left = "50vw";
    particle.style.top = "50vh";
    particle.style.width = "8px";
    particle.style.height = "8px";
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    particle.style.zIndex = "9999";
    particle.style.pointerEvents = "none";
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
var Map = ({ courseid, editing, options }) => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const o = options || {
    start_title: "Journey Begins",
    start_subtitle: "Your quest starts here. Follow the path downwards.",
    start_icon: "\u{1F680}",
    finish_title: "Finish Line",
    finish_subtitle: "Complete all trackable activities to reach the goal.",
    finish_icon: "\u{1F3C1}",
    finish_title_completed: "Course Completed!",
    finish_subtitle_completed: "Congratulations, you have reached the end of the journey.",
    finish_icon_completed: "\u{1F3C6}",
    map_fullwidth: 0
  };
  const initialFullWidth = parseInt(o.map_fullwidth || "0", 10) === 1;
  const [isFullWidth, setIsFullWidth] = useState(initialFullWidth);
  const [collapsedSections, setCollapsedSections] = useState([]);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const handleToggleBranch = async (e, node) => {
    e.stopPropagation();
    const currentMeta = node.metadata ? JSON.parse(node.metadata) : {};
    const isBranch = !currentMeta.isBranch;
    const newMeta = { ...currentMeta, isBranch };
    setNodes(nodes.map((n) => n.id === node.id ? { ...n, metadata: JSON.stringify(newMeta) } : n));
    try {
      await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          index: 0,
          methodname: "format_questflow_save_node_metadata",
          args: { courseid, sectionid: node.sectionid, cmid: node.cmid, metadata: JSON.stringify({ isBranch }) }
        }])
      });
    } catch (err) {
      console.error("Failed to toggle branch", err);
    }
  };
  const handleSetBranchCaption = async (node, caption) => {
    const currentMeta = node.metadata ? JSON.parse(node.metadata) : {};
    const newMeta = { ...currentMeta, branchCaption: caption };
    setNodes(nodes.map((n) => n.id === node.id ? { ...n, metadata: JSON.stringify(newMeta) } : n));
    try {
      await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          index: 0,
          methodname: "format_questflow_save_node_metadata",
          args: { courseid, sectionid: node.sectionid, cmid: node.cmid, metadata: JSON.stringify(newMeta) }
        }])
      });
    } catch (err) {
      console.error("Failed to set branch caption", err);
    }
  };
  const handleToggleWidth = async () => {
    const newState = !isFullWidth;
    setIsFullWidth(newState);
    try {
      await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          index: 0,
          methodname: "format_questflow_toggle_fullwidth",
          args: { courseid, fullwidth: newState ? 1 : 0 }
        }])
      });
    } catch (err) {
      console.error("Failed to toggle width", err);
    }
  };
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{
            index: 0,
            methodname: "format_questflow_get_map_data",
            args: { courseid }
          }])
        });
        const data = await response.json();
        if (data[0] && !data[0].error) {
          const sortedNodes = data[0].data.nodes.sort((a, b) => {
            if (a.sectionid !== b.sectionid) return a.sectionid - b.sectionid;
            return a.cmid - b.cmid;
          });
          const storageKey = `questflow_completed_${courseid}`;
          let previouslyCompleted = [];
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              previouslyCompleted = JSON.parse(stored);
            }
          } catch (e) {
          }
          let shouldCelebrate = false;
          const currentlyCompleted = sortedNodes.filter((n) => n.status === "completed" && (n.cmid === 0 || n.hastracking)).map((n) => n.id);
          const newlyCompletedChapters = sortedNodes.filter(
            (n) => n.status === "completed" && n.cmid === 0 && !previouslyCompleted.includes(n.id)
          );
          if (newlyCompletedChapters.length > 0) {
            shouldCelebrate = true;
          }
          const trackableNodes2 = sortedNodes.filter((n) => n.hastracking && n.cmid !== 0);
          const courseCompleted2 = trackableNodes2.length > 0 && trackableNodes2.every((n) => n.status === "completed");
          if (courseCompleted2) {
            const courseCompletedKey = `questflow_course_completed_${courseid}`;
            if (!localStorage.getItem(courseCompletedKey)) {
              shouldCelebrate = true;
              localStorage.setItem(courseCompletedKey, "true");
            }
          }
          if (shouldCelebrate) {
            triggerConfetti();
          }
          try {
            localStorage.setItem(storageKey, JSON.stringify(currentlyCompleted));
          } catch (e) {
          }
          setNodes(sortedNodes);
        } else {
          console.error("AJAX Error:", data[0]?.exception);
          setError("Could not load quest data.");
        }
      } catch (err) {
        console.error("QuestFlow Fetch Error", err);
        setError("Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, [courseid]);
  const handleNodeClick = (node) => {
    if (!editing && node.status === "locked") {
      setActiveTooltip(activeTooltip === node.id ? null : node.id);
      return;
    }
    if (!editing && node.status !== "locked") {
      setActiveTooltip(null);
      if (node.cmid === 0) {
        setCollapsedSections(
          (prev) => prev.includes(node.sectionid) ? prev.filter((id) => id !== node.sectionid) : [...prev, node.sectionid]
        );
      } else if (node.url) {
        window.location.href = node.url;
      }
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", height: "400px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }, children: /* @__PURE__ */ jsx("div", { className: "spinner-border text-primary", style: { width: "3rem", height: "3rem" }, role: "status" }) });
  }
  if (error || nodes.length === 0) {
    return /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "100px 20px", background: "#f8fafc", borderRadius: "16px", border: "2px dashed #cbd5e1" }, children: [
      /* @__PURE__ */ jsx("h3", { style: { color: "#475569", fontSize: "1.5rem", marginBottom: "10px" }, children: error ? "Error Loading Journey" : "Journey is Empty" }),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b" }, children: error || "Add chapters or activities in Edit mode to build your learning path." })
    ] });
  }
  const visibleNodes = nodes.filter((n) => {
    let meta = {};
    try {
      if (n.metadata) meta = JSON.parse(n.metadata);
    } catch (e) {
    }
    if (!editing && !n.available && n.status === "locked" && !meta.restrictions) {
      return false;
    }
    if (!editing && n.cmid === 0) {
      const hasActivities = nodes.some((child) => child.sectionid === n.sectionid && child.cmid !== 0 && (editing || child.available || child.status !== "locked" || child.metadata && child.metadata.includes("restrictions")));
      if (!hasActivities) return false;
    }
    if (!editing && n.cmid !== 0 && collapsedSections.includes(n.sectionid)) {
      return false;
    }
    return true;
  });
  const groupedNodes = [];
  let currentGroup = [];
  visibleNodes.forEach((node) => {
    let meta = {};
    try {
      if (node.metadata) meta = JSON.parse(node.metadata);
    } catch (e) {
    }
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
  const trackableNodes = nodes.filter((n) => n.hastracking && n.cmid !== 0);
  const courseCompleted = trackableNodes.length > 0 && trackableNodes.every((n) => n.status === "completed");
  const containerStyle = {
    background: "#f8fafc",
    padding: "40px 20px",
    borderRadius: isFullWidth ? "8px" : "24px",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
    maxWidth: isFullWidth ? "100%" : "800px",
    width: "100%",
    margin: "0 auto",
    border: "1px solid #e2e8f0",
    transition: "max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s ease",
    position: "relative",
    boxSizing: "border-box"
  };
  const handleKeyDown = (e, node) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNodeClick(node);
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: containerStyle, children: [
    /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: "40px", marginTop: "20px" }, children: [
      /* @__PURE__ */ jsx("h2", { style: { fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: 0 }, children: editing ? "\u{1F6E0}\uFE0F Journey Builder" : "\u{1F5FA}\uFE0F Your Learning Path" }),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", marginTop: "10px", fontSize: "1.1rem" }, children: editing ? "Standard Moodle editing tools are available below." : "Follow the path to complete the course." })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { position: "relative", padding: "20px 0" }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        left: "0",
        top: "0",
        bottom: "0",
        width: "100px",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='200' viewBox='0 0 100 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 0 C 100 60, 0 140, 50 200' fill='none' stroke='%23cbd5e1' stroke-width='16' stroke-linecap='round'/%3E%3Cpath d='M 50 0 C 100 60, 0 140, 50 200' fill='none' stroke='%23f8fafc' stroke-width='4' stroke-dasharray='8 12' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat-y",
        zIndex: 1
      } }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", marginBottom: "60px", position: "relative", zIndex: 2 }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "80px",
          height: "80px",
          minWidth: "80px",
          flexShrink: 0,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6, #0ea5e9)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: "10px",
          border: "6px solid white",
          boxShadow: "0 8px 20px rgba(59, 130, 246, 0.4)",
          fontSize: "2rem"
        }, children: o.start_icon }),
        /* @__PURE__ */ jsxs("div", { style: { marginLeft: "20px" }, children: [
          /* @__PURE__ */ jsx("h2", { style: { margin: 0, color: "#0f172a", fontSize: "1.8rem", fontWeight: 800 }, children: o.start_title }),
          /* @__PURE__ */ jsx("p", { style: { margin: "5px 0 0", color: "#64748b", fontSize: "1rem" }, children: o.start_subtitle })
        ] })
      ] }),
      groupedNodes.map((group, groupIndex) => {
        const isBranchGroup = group.length > 1;
        let branchCaption = "";
        if (isBranchGroup) {
          try {
            const firstMeta = JSON.parse(group[0].metadata || "{}");
            branchCaption = firstMeta.branchCaption || "";
          } catch (e) {
          }
        }
        return /* @__PURE__ */ jsxs("div", { style: { width: "100%", marginBottom: "40px" }, children: [
          isBranchGroup && (branchCaption || editing) && /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: "20px", position: "relative", zIndex: 2, display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", flexWrap: "wrap" }, children: [
            branchCaption && /* @__PURE__ */ jsxs("span", { style: {
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              color: "#334155",
              padding: "8px 20px",
              borderRadius: "9999px",
              fontSize: "0.9rem",
              fontWeight: 800,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              letterSpacing: "0.5px"
            }, children: [
              /* @__PURE__ */ jsx("span", { style: { fontSize: "1.1rem" }, children: "\u{1F500}" }),
              " ",
              branchCaption
            ] }),
            editing && /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  const newCaption = prompt('Enter instructions for this branch (e.g., "Choose one path:")', branchCaption);
                  if (newCaption !== null) {
                    handleSetBranchCaption(group[0], newCaption);
                  }
                },
                style: {
                  padding: "6px 16px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  borderRadius: "9999px",
                  border: "1px dashed #94a3b8",
                  background: "#f8fafc",
                  color: "#475569",
                  fontWeight: 700,
                  transition: "all 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#64748b";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#94a3b8";
                },
                children: [
                  /* @__PURE__ */ jsx("span", { style: { fontSize: "1rem" }, children: "\u270F\uFE0F" }),
                  " ",
                  branchCaption ? "Edit" : "Add Branch Caption"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { style: {
            display: "flex",
            flexDirection: "row",
            justifyContent: isBranchGroup ? "space-around" : "flex-start",
            flexWrap: "wrap",
            gap: isBranchGroup ? "20px" : "0",
            width: "100%",
            position: "relative",
            zIndex: 2
          }, children: group.map((node, index) => {
            const isCompleted = node.status === "completed";
            const isCurrent = node.status === "current";
            const isLocked = node.status === "locked";
            const isSection = node.cmid === 0;
            const isCollapsed = isSection && collapsedSections.includes(node.sectionid);
            let nodeColor = "#94a3b8";
            let icon = "\u{1F512}";
            let pulseAnim = "";
            let metadataObj = {};
            try {
              if (node.metadata) {
                metadataObj = JSON.parse(node.metadata);
              }
            } catch (e) {
            }
            const smallIcon = (symbol) => /* @__PURE__ */ jsx("span", { style: { fontSize: "0.65em" }, children: symbol });
            if (!node.hastracking && !isSection && node.status !== "locked") {
              nodeColor = "#64748b";
              icon = "\u2022";
            } else if (isCompleted) {
              nodeColor = "#10b981";
              icon = isSection ? isCollapsed ? smallIcon("\u2795") : "\u2713" : "\u2713";
            } else if (isCurrent) {
              nodeColor = "#3b82f6";
              icon = isSection ? isCollapsed ? smallIcon("\u2795") : "\u2B50" : "\u2B50";
              pulseAnim = "pulse-animation 2s infinite";
            } else if (isSection && !isLocked) {
              icon = isCollapsed ? smallIcon("\u2795") : smallIcon("\u2796");
            }
            let heatmapBoxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            if (showHeatmap && metadataObj.activeUsers !== void 0) {
              if (metadataObj.activeUsers > 30) {
                nodeColor = "#dc2626";
                heatmapBoxShadow = "0 0 20px rgba(220, 38, 38, 0.8)";
              } else if (metadataObj.activeUsers > 15) {
                nodeColor = "#ea580c";
                heatmapBoxShadow = "0 0 15px rgba(234, 88, 12, 0.6)";
              } else if (metadataObj.activeUsers > 0) {
                nodeColor = "#eab308";
                heatmapBoxShadow = "0 0 10px rgba(234, 179, 8, 0.4)";
              } else {
                nodeColor = "#cbd5e1";
              }
              icon = metadataObj.activeUsers.toString();
            }
            return /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  opacity: isLocked && !showHeatmap ? 0.6 : 1,
                  cursor: isLocked && !editing ? "not-allowed" : "pointer",
                  transform: "translateY(0)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  flex: isBranchGroup ? `1 1 calc(${100 / group.length}% - 20px)` : "1 1 100%",
                  minWidth: isBranchGroup ? "280px" : "auto"
                },
                onClick: () => handleNodeClick(node),
                onMouseEnter: (e) => {
                  if (!isLocked || editing) {
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                },
                children: [
                  /* @__PURE__ */ jsx("style", { children: `
                                            @keyframes pulse-animation {
                                                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                                                70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
                                                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                                            }
                                        ` }),
                  /* @__PURE__ */ jsx("div", { style: {
                    width: isSection ? "60px" : "40px",
                    height: isSection ? "60px" : "40px",
                    minWidth: isSection ? "60px" : "40px",
                    borderRadius: "50%",
                    background: nodeColor,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontSize: isSection ? "1.5rem" : "1.2rem",
                    fontWeight: "bold",
                    marginLeft: isSection ? "20px" : isBranchGroup ? "0" : "30px",
                    border: "4px solid white",
                    boxShadow: heatmapBoxShadow,
                    animation: showHeatmap ? "none" : pulseAnim,
                    transition: "all 0.3s ease"
                  }, children: icon }),
                  /* @__PURE__ */ jsxs("div", { style: {
                    marginLeft: "20px",
                    background: "white",
                    padding: isSection ? "20px" : "15px 20px",
                    borderRadius: "16px",
                    flex: 1,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                    border: isCurrent && !showHeatmap ? "2px solid #3b82f6" : showHeatmap && metadataObj.activeUsers > 0 ? `2px solid ${nodeColor}` : "1px solid #e2e8f0",
                    position: "relative"
                  }, children: [
                    /* @__PURE__ */ jsx("div", { style: { position: "absolute", left: "-10px", top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: `10px solid ${isCurrent && !showHeatmap ? "#3b82f6" : showHeatmap && metadataObj.activeUsers > 0 ? nodeColor : "#e2e8f0"}` } }),
                    /* @__PURE__ */ jsx("div", { style: { position: "absolute", left: "-8px", top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "8px solid white" } }),
                    showHeatmap && metadataObj.dropoffRate > 15 && /* @__PURE__ */ jsxs("div", { style: { position: "absolute", top: "-10px", right: "-10px", background: "#ef4444", color: "white", fontSize: "0.75rem", fontWeight: "bold", padding: "4px 8px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }, title: `${metadataObj.dropoffRate}% of students abandon the course here`, children: [
                      "\u26A0\uFE0F ",
                      metadataObj.dropoffRate,
                      "% Drop-off"
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("span", { style: { textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 800, color: nodeColor, letterSpacing: "1px" }, children: isSection ? "Chapter" : metadataObj.isBranch ? "Branch Choice" : "Activity" }),
                        metadataObj.xp && /* @__PURE__ */ jsxs("span", { style: { fontSize: "0.8rem", color: "#f59e0b", marginLeft: "10px", fontWeight: "bold" }, children: [
                          "+",
                          metadataObj.xp,
                          " XP"
                        ] }),
                        metadataObj.loot && /* @__PURE__ */ jsx("span", { style: { fontSize: "1rem", marginLeft: "5px" }, children: metadataObj.loot }),
                        /* @__PURE__ */ jsx("h3", { style: { margin: "5px 0 0 0", fontSize: isSection ? "1.4rem" : "1.1rem", color: "#0f172a", fontWeight: 700 }, children: node.name })
                      ] }),
                      editing && !isSection && /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: (e) => handleToggleBranch(e, node),
                          title: "Toggle Branching (renders side-by-side with adjacent branches)",
                          style: {
                            background: metadataObj.isBranch ? "#3b82f6" : "#f1f5f9",
                            color: metadataObj.isBranch ? "white" : "#64748b",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "bold"
                          },
                          children: "\u2442 Branch"
                        }
                      )
                    ] }),
                    isLocked && !editing && activeTooltip === node.id && /* @__PURE__ */ jsxs("div", { style: {
                      marginTop: "10px",
                      padding: "10px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      fontSize: "0.9rem",
                      color: "#991b1b",
                      position: "relative",
                      animation: "fadeIn 0.2s ease-out"
                    }, children: [
                      /* @__PURE__ */ jsx("style", { children: `
                                                        @keyframes fadeIn {
                                                            from { opacity: 0; transform: translateY(-5px); }
                                                            to { opacity: 1; transform: translateY(0); }
                                                        }
                                                    ` }),
                      /* @__PURE__ */ jsx("strong", { children: "\u{1F512} Restricted:" }),
                      " ",
                      metadataObj.restrictions || "Prerequisites not met yet."
                    ] })
                  ] })
                ]
              },
              node.id
            );
          }) })
        ] }, `group-${groupIndex}`);
      }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", marginTop: "60px", position: "relative", zIndex: 2 }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "80px",
          height: "80px",
          minWidth: "80px",
          flexShrink: 0,
          borderRadius: "50%",
          background: courseCompleted ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "#cbd5e1",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: "10px",
          border: "6px solid white",
          boxShadow: courseCompleted ? "0 0 30px rgba(245, 158, 11, 0.6)" : "0 4px 6px rgba(0,0,0,0.1)",
          transition: "all 0.5s ease",
          fontSize: "2rem"
        }, children: courseCompleted ? o.finish_icon_completed : o.finish_icon }),
        /* @__PURE__ */ jsxs("div", { style: { marginLeft: "20px" }, children: [
          /* @__PURE__ */ jsx("h2", { style: { margin: 0, color: courseCompleted ? "#d97706" : "#64748b", fontSize: "1.8rem", fontWeight: 800 }, children: courseCompleted ? o.finish_title_completed : o.finish_title }),
          /* @__PURE__ */ jsx("p", { style: { margin: "5px 0 0", color: "#64748b", fontSize: "1rem" }, children: courseCompleted ? o.finish_subtitle_completed : o.finish_subtitle })
        ] })
      ] })
    ] }),
    editing && /* @__PURE__ */ jsx("div", { style: { height: "80px", width: "100%" } }),
    editing && /* @__PURE__ */ jsx("div", { style: { position: "sticky", bottom: "20px", marginBottom: "-40px", zIndex: 1e3, pointerEvents: "none", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxs("div", { style: { position: "absolute", bottom: "0", pointerEvents: "auto", display: "flex", gap: "12px", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)", padding: "10px", borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.6)", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowHeatmap(!showHeatmap),
          style: {
            padding: "10px 24px",
            background: showHeatmap ? "linear-gradient(135deg, #ef4444, #f97316)" : "white",
            color: showHeatmap ? "white" : "#475569",
            border: showHeatmap ? "1px solid transparent" : "1px solid #e2e8f0",
            borderRadius: "9999px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.95rem",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: showHeatmap ? "0 6px 15px rgba(239, 68, 68, 0.3)" : "0 2px 5px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          },
          onMouseEnter: (e) => {
            if (!showHeatmap) e.currentTarget.style.background = "#f8fafc";
          },
          onMouseLeave: (e) => {
            if (!showHeatmap) e.currentTarget.style.background = "white";
          },
          title: "Toggle Analytics Heatmap",
          children: "\u{1F525} Heatmap"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleToggleWidth,
          style: {
            padding: "10px 24px",
            background: isFullWidth ? "linear-gradient(135deg, #3b82f6, #0ea5e9)" : "white",
            color: isFullWidth ? "white" : "#475569",
            border: isFullWidth ? "1px solid transparent" : "1px solid #e2e8f0",
            borderRadius: "9999px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.95rem",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: isFullWidth ? "0 6px 15px rgba(59, 130, 246, 0.3)" : "0 2px 5px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          },
          onMouseEnter: (e) => {
            if (!isFullWidth) e.currentTarget.style.background = "#f8fafc";
          },
          onMouseLeave: (e) => {
            if (!isFullWidth) e.currentTarget.style.background = "white";
          },
          "aria-label": "Toggle Full Width",
          title: "Toggle Full Width",
          children: isFullWidth ? "\u292E Collapse" : "\u2922 Full Width"
        }
      )
    ] }) })
  ] });
};
var map_default = Map;
export {
  map_default as default
};
//# sourceMappingURL=map.js.map
