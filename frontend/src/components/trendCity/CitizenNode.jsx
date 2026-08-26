import {
    Handle,
    Position,
} from "@xyflow/react";

import CitizenAvatar
    from "./CitizenAvatar";


function CitizenNode({
                         data,
                     }) {

    const {
        person,

        status = "idle",

        reaction = "neutral",

        bubble,

        bubbleStopped = false,

        starter = false,
    } = data;


    const statusClass =
        `status-${status}`;


    return (
        <div
            className={`
                flow-citizen-node

                ${statusClass}

                ${
                starter
                    ? "is-starter"
                    : ""
            }
            `}
        >

            {/* React Flow 관계 연결점 */}

            <Handle
                type="target"
                position={Position.Top}
                className="citizen-handle"
            />

            <Handle
                type="source"
                position={Position.Bottom}
                className="citizen-handle"
            />

            <Handle
                type="target"
                position={Position.Left}
                className="citizen-handle"
            />

            <Handle
                type="source"
                position={Position.Right}
                className="citizen-handle"
            />


            {/* =========================
                말풍선
            ========================= */}

            {bubble && (
                <div
                    className={`
                        citizen-flow-bubble

                        ${
                        bubbleStopped
                            ? "bubble-stop"
                            : ""
                    }

                        ${
                        starter
                            ? "bubble-starter"
                            : ""
                    }
                    `}
                >
                    {bubble}
                </div>
            )}


            {/* =========================
                시민 캐릭터
            ========================= */}

            <div
                className="citizen-node-visual"
            >
                <CitizenAvatar
                    id={person.id}

                    reaction={
                        reaction
                    }

                    active={
                        starter
                        || status
                        === "spreading"
                    }

                    size={
                        starter
                            ? 72
                            : 48
                    }
                />
            </div>


            {/* START */}

            {starter && (
                <span
                    className="citizen-start-text"
                >
                    START
                </span>
            )}

        </div>
    );
}


export default CitizenNode;