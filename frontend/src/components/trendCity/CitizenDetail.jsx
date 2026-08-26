import {
    ArrowDownLeft,
    ArrowUpRight,
    Share2,
    UserRound,
    X,
} from "lucide-react";


const CHANNEL_LABELS = {
    WORD_OF_MOUTH: "입소문",
    SNS: "SNS",
    VIDEO: "영상",
    COMMUNITY: "커뮤니티",
};


function formatPercent(value) {
    if (
        value === undefined
        || value === null
        || Number.isNaN(
            Number(value)
        )
    ) {
        return "-";
    }

    return `${Math.round(
        Number(value) * 100
    )}%`;
}


function CitizenDetail({
                           detail,
                           onClose,
                       }) {
    const {
        person,
        isStarter,
        receivedEvent,
        outgoingEvents = [],
        retransmitCount = 0,
        stopped = false,
    } = detail;


    const receivedChannel =
        receivedEvent
            ? (
                receivedEvent.channel_label
                || CHANNEL_LABELS[
                    receivedEvent.channel
                    ]
                || receivedEvent.channel
                || "-"
            )
            : "소문 시작자";


    return (
        <aside className="citizen-detail-panel">
            <div className="citizen-detail-header">
                <div>
                    <span className="citizen-detail-kicker">
                        NODE DETAIL
                    </span>

                    <strong>
                        {person.name || person.id}
                    </strong>
                </div>

                <button
                    type="button"
                    className="citizen-detail-close"
                    onClick={onClose}
                    aria-label="닫기"
                >
                    <X size={16} />
                </button>
            </div>


            <div className="citizen-detail-summary">
                <div className="citizen-detail-avatar">
                    <UserRound size={24} />
                </div>

                <div>
                    <p>
                        {person.age
                            ? `${person.age}세`
                            : "나이 정보 없음"}
                    </p>

                    <span>
                        {person.occupation
                            || "직업 정보 없음"}
                    </span>
                </div>
            </div>


            <div className="citizen-detail-tags">
                {isStarter && (
                    <span className="detail-tag tag-starter">
                        STARTER
                    </span>
                )}

                {stopped && (
                    <span className="detail-tag tag-stopped">
                        전파 종료
                    </span>
                )}

                {person.personality && (
                    <span className="detail-tag">
                        {person.personality}
                    </span>
                )}
            </div>


            <div className="citizen-detail-grid">
                <div className="citizen-detail-metric">
                    <span>
                        패션 관심도
                    </span>

                    <strong>
                        {formatPercent(
                            person.fashion_interest
                        )}
                    </strong>
                </div>

                <div className="citizen-detail-metric">
                    <span>
                        영향력
                    </span>

                    <strong>
                        {formatPercent(
                            person.influence
                        )}
                    </strong>
                </div>
            </div>


            <div className="citizen-detail-flow">
                <div className="citizen-detail-row">
                    <div className="detail-icon">
                        <ArrowDownLeft size={15} />
                    </div>

                    <div>
                        <span>
                            소문을 들은 방식
                        </span>

                        <strong>
                            {receivedChannel}
                        </strong>
                    </div>
                </div>


                <div className="citizen-detail-row">
                    <div className="detail-icon">
                        <ArrowUpRight size={15} />
                    </div>

                    <div>
                        <span>
                            다시 전달한 사람
                        </span>

                        <strong>
                            {retransmitCount}명
                        </strong>
                    </div>
                </div>


                <div className="citizen-detail-row">
                    <div className="detail-icon">
                        <Share2 size={15} />
                    </div>

                    <div>
                        <span>
                            주요 전달 방식
                        </span>

                        <strong>
                            {outgoingEvents.length
                                ? (
                                    outgoingEvents[0]
                                        .channel_label
                                    || CHANNEL_LABELS[
                                        outgoingEvents[0]
                                            .channel
                                        ]
                                    || "-"
                                )
                                : "전달 없음"}
                        </strong>
                    </div>
                </div>
            </div>


            {receivedEvent && (
                <div className="citizen-detail-source">
                    <span>
                        전달자
                    </span>

                    <strong>
                        {receivedEvent.source}
                    </strong>
                </div>
            )}
        </aside>
    );
}


export default CitizenDetail;