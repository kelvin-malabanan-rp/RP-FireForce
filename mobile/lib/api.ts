export const fetchAlarms = async () => {
    const res = await fetch('https://<your‑domain>.com/alarms');
    return res.json();
};