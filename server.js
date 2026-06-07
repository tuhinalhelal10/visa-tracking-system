const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000; // ম্যাকের AirPlay সমস্যার কারণে পোর্ট ৩০০০ করা হলো

// JSON ফাইল পাথ সেটআপ
const DATA_DIR = path.join(__dirname, 'data');
const DATA_PATH = path.join(DATA_DIR, 'applications.json');

try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 2));
    }
} catch (err) {
    console.error("Folder creation error:", err);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// স্ট্যাটিক ফাইলের জন্য public ফোল্ডার কনফিগারেশন
app.use(express.static(path.join(__dirname, 'public')));

// Helper Functions
const readData = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) return [];
        const jsonData = fs.readFileSync(DATA_PATH, 'utf-8');
        return JSON.parse(jsonData || '[]');
    } catch (e) {
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
};

// ================= VIEW ROUTES =================

app.get('/en/node/109.html', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'en', 'node', '109.html');
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('<h1>109.html file not found in public/en/node/ directory.</h1>');
    }
    res.sendFile(filePath);
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// ================= API ROUTES =================

app.post('/en/track', (req, res) => {
    try {
        const searchData = req.body.search || {};
        const applicationId = (searchData.application_id || req.body.applicationId || '').trim();
        const passportNo = (searchData.passport_no || req.body.passportNo || '').trim();

        if (!applicationId || !passportNo) {
            return res.status(400).json({ success: false, message: 'Application ID and Passport No are required.' });
        }

        const applications = readData();
        const foundApp = applications.find(app => app.applicationId === applicationId && app.passportNo === passportNo);

        if (!foundApp) {
            return res.status(404).json({ success: false, message: 'No application found with these details.' });
        }

        res.json({ success: true, status: foundApp.status });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ডাটা ডিলিট করার এপিআই রুট
app.post('/en/admin/delete', (req, res) => {
    try {
        const { applicationId } = req.body;
        if (!applicationId) {
            return res.status(400).json({ success: false, message: 'Application ID is required.' });
        }

        let applications = readData();
        const initialLength = applications.length;
        
        // নির্দিষ্ট আইডিটি বাদে বাকি সব ডাটা ফিল্টার করে রাখা হচ্ছে
        applications = applications.filter(app => app.applicationId.toLowerCase() !== applicationId.trim().toLowerCase());

        if (applications.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        writeData(applications);
        res.json({ success: true, message: 'Application deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error, failed to delete data.' });
    }
});

app.post('/en/admin/update', (req, res) => {
    try {
        const { applicationId, passportNo, status } = req.body;
        
        if (!applicationId || !passportNo || !status) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        let applications = readData();
        const index = applications.findIndex(app => app.applicationId === applicationId.trim());

        if (index !== -1) {
            applications[index].passportNo = passportNo.trim();
            applications[index].status = status;
            applications[index].updatedAt = new Date().toISOString();
        } else {
            applications.push({
                applicationId: applicationId.trim(),
                passportNo: passportNo.trim(),
                status: status,
                updatedAt: new Date().toISOString()
            });
        }

        writeData(applications);
        res.json({ success: true, message: 'Application status synchronized successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save data.' });
    }
});

app.get('/en/admin/applications', (req, res) => {
    try {
        const applications = readData();
        applications.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        res.json(applications);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// সার্ভার চালু করা
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server is successfully running on port ${PORT}`);
    console.log(`👉 Track Page: http://localhost:${PORT}/en/node/109.html`);
    console.log(`👉 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🛑 Press CTRL + C to stop the server.`);
    console.log(`==================================================`);
});