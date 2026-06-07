const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// 🛑 [খুব গুরুত্বপূর্ণ]: নিচে আপনার মঙ্গোডিবির আসল কানেকশন লিংকটি বসান
const MONGO_URI = "mongodb+srv://yousuf223334433_db_user:cg56YGZEo67WaW0N@cluster0.cxy6bnf.mongodb.net/";

mongoose.connect(MONGO_URI)
    .then(() => console.log('🚀 Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// মঙ্গোডিবি স্কিমা ও মডেল তৈরি
const ApplicationSchema = new mongoose.Schema({
    applicationId: { type: String, required: true, unique: true, trim: true },
    passportNo: { type: String, required: true, trim: true },
    status: { type: String, required: true, default: 'Under Process' },
    updatedAt: { type: Date, default: Date.now }
});
const Application = mongoose.model('Application', ApplicationSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ১. ব্যবহারকারীর জন্য ট্র্যাকিং API (109.html থেকে ডাটা রিসিভ করবে)
app.post('/en/track', async (req, res) => {
    try {
        const searchData = req.body.search || {};
        const applicationId = (searchData.application_id || req.body.applicationId || '').trim();
        const passportNo = (searchData.passport_no || req.body.passportNo || '').trim();

        if (!applicationId || !passportNo) {
            return res.status(400).json({ success: false, message: 'Application ID and Passport No are required.' });
        }

        // লিনাক্স সার্ভারের জন্য ছোট-বড় হাতের অক্ষরের অমিল ফিক্স করা হলো (RegExp দিয়ে)
        const matchedApp = await Application.findOne({
            applicationId: { $regex: new RegExp(`^${applicationId}$`, "i") },
            passportNo: { $regex: new RegExp(`^${passportNo}$`, "i") }
        });

        if (matchedApp) {
            res.json({ success: true, status: matchedApp.status });
        } else {
            res.status(404).json({ success: false, message: 'No record found.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ২. অ্যাডমিন প্যানেল থেকে ডাটা সেভ বা আপডেট করার API
app.post('/en/admin/update', async (req, res) => {
    try {
        const { applicationId, passportNo, status } = req.body;
        
        let application = await Application.findOne({ applicationId: applicationId.trim() });

        if (application) {
            application.passportNo = passportNo.trim();
            application.status = status;
            application.updatedAt = Date.now();
            await application.save();
        } else {
            application = new Application({
                applicationId: applicationId.trim(),
                passportNo: passportNo.trim(),
                status: status
            });
            await application.save();
        }

        res.json({ success: true, message: 'Application status synchronized successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save data.' });
    }
});

// ৩. অ্যাডমিন প্যানেলে সব অ্যাপ্লিকেশনের লিস্ট দেখানোর API
app.get('/en/admin/applications', async (req, res) => {
    try {
        const applications = await Application.find().sort({ updatedAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== Admin Pages Routing ====================

// ১. এডমিন লগইন পেজের রাউট (/admin লিখলে এটি ওপেন হবে)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// ২. এডমিন ড্যাশবোর্ড পেজের রাউট (/admin-dashboard লিখলে এটি ওপেন হবে)
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// ৩. ট্র্যাকিং পেজের মূল রাউট (ঐচ্ছিক - এটি আপনার মেইন ডোমেইনে ট্র্যাক পেজ ওপেন করতে সাহায্য করবে)
app.get('/track', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '109.html'));
});
// =============================================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});