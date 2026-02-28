const formatTime = (dateStr) => {
    if (!dateStr) return "";

    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHrs < 24) return `${diffHrs} hr ago`;

    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default formatTime;
