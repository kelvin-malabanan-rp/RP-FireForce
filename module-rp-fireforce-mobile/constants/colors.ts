export const getSeverityColor = (severity: string) => {
    switch (severity) {
        case "critical":
            return "#DC2626";
        case "high":
            return "#EA580C";
        case "medium":
            return "#D97706";
        case "low":
            return "#16A34A";
        default:
            return "#6B7280";
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case "open":
            return "#DC2626";
        case "investigating":
            return "#D97706";
        case "resolved":
            return "#16A34A";
        default:
            return "#6B7280";
    }
};