import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
} from "@xyflow/react";


function getChannelClass(channel) {
    const classes = {
        WORD_OF_MOUTH: "channel-word",
        SNS: "channel-sns",
        VIDEO: "channel-video",
        COMMUNITY: "channel-community",
    };

    return (
        classes[channel]
        || "channel-word"
    );
}


function getLabelClass(channel) {
    return (
        `label-${String(
            channel || "WORD_OF_MOUTH"
        ).toLowerCase()}`
    );
}


function SpreadEdge({
                        id,
                        sourceX,
                        sourceY,
                        targetX,
                        targetY,
                        sourcePosition,
                        targetPosition,
                        data,
                        markerEnd,
                    }) {
    const {
        status = "history",
        relationship = "",
        channel = "WORD_OF_MOUTH",
    } = data || {};

    const [
        edgePath,
        labelX,
        labelY,
    ] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        curvature: 0.18,
    });

    const channelClass =
        getChannelClass(channel);

    const temporalClass =
        status === "history"
            ? "edge-past"
            : "edge-current";

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                className={[
                    "spread-edge",
                    `edge-${status}`,
                    temporalClass,
                    channelClass,
                ].join(" ")}
            />

            {relationship
                && status !== "history"
                && (
                    <EdgeLabelRenderer>
                        <div
                            className={[
                                "relationship-label",
                                `relationship-${status}`,
                                getLabelClass(channel),
                            ].join(" ")}
                            style={{
                                transform: `
                                    translate(-50%, -50%)
                                    translate(${labelX}px, ${labelY}px)
                                `,
                            }}
                        >
                            <i className="relationship-label-dot" />
                            {relationship}
                        </div>
                    </EdgeLabelRenderer>
                )}
        </>
    );
}

export default SpreadEdge;