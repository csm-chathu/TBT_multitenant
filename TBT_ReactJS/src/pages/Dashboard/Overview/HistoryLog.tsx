import Button from "@/components/Atomic/Button";
import UserAvatar from "@/components/Molecules/ui/UserAvatar";
import React from "react";

interface HistoryItem {
    time: string;
    name: string;
    title: string;
    bg: string;
    action: string;
}

const historyLog: HistoryItem[] = [
    {
        time: "8:13 AM",
        name: "Ashly",
        title: "Response to client feedback",
        bg: "#FF7761",
        action:
            "Ashley changed the due time from 6:00 PM to Tomorrow, 6:00 PM.",
    },
    {
        time: "8:13 AM",
        name: "Giselle",
        title: "Customer Insights",
        bg: "#22C55E",
        action:
            "Giselle added a comment: @Laura Could you please prepare a presentation on this?",
    },
    {
        time: "7:56 AM",
        name: "Ronin",
        title: "Upload Attachment",
        bg: "#3B82F6",
        action: "Ronin uploaded 4 documents.",
    },
];

const HistoryLog: React.FC = () => {
    return (
        <>
            <div className="lg:w-4/12 p-4 bg-surface-primary border border-borderColor-secondary rounded-lg">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Recent Activity</h2>
                    <Button style="Tertiary" text="View All" height="h-9" />
                </div>
                {historyLog.map((history, index) => (
                    <div
                        key={index}
                        className="px-1 py-2 flex gap-3 hover:bg-surface-light-secondary rounded-lg"
                    >
                        <div className="min-w-[54px] pt-2">
                            <p className="text-sm text-textColor-muted">{history.time}</p>
                        </div>

                        <UserAvatar background={history.bg} name={history.name} />

                        <div className="pt-2 space-y-2">
                            <p className="text-sm text-textColor-muted">{history.title}</p>
                            <p className="text-sm font-medium leading-tight">
                                {history.action}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default HistoryLog;
