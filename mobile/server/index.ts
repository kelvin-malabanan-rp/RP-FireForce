import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// In‑memory store – replace with a real DB in production.
const alarms: any[] = [];

app.post('/sns', (req, res) => {
    const { Type, Message } = req.body;

    if (Type === 'SubscriptionConfirmation') {
        // Auto‑confirm the subscription
        fetch(Message).then(() => console.log('Subscribed!'));
        return res.sendStatus(200);
    }

    if (Type !== 'Notification') {
        return res.sendStatus(400);
    }

    const notification = JSON.parse(Message);

    // CloudWatch Alarm structure – pull what you need
    const alarmInfo = {
        alarmName: notification.AlarmName,
        stateValue: notification.NewStateValue,
        reason: notification.NewStateReason,
        timestamp: new Date(),
        region: notification.Region || process.env.AWS_REGION,
        // Add more fields as required
    };

    alarms.push(alarmInfo);
    console.log('Received alarm:', alarmInfo);

    res.sendStatus(200);
});

app.get('/alarms', (_req, res) => {
    res.json(alarms);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
    console.log(`SNS webhook listening on http://localhost:${PORT}`)
);