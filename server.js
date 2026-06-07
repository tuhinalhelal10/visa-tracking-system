const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// মঙ্গোডিবি ক্লাউড কানেকশন লিংক (ডাটাবেজের নাম visaDB সহ)
const MONGO_URI = "mongodb+srv://yousuf223334433_db_user:cg56YGZEo67WaW0N@cluster0.cxy6bnf.mongodb.net/visaDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('🚀 Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 📝 মঙ্গোডিবি স্কিমাতে 'passengerName' (পাসপোর্ট হোল্ডারের নাম) যোগ করা হলো
const ApplicationSchema = new mongoose.Schema({
    applicationId: { type: String, required: true, unique: true, trim: true },
    passportNo: { type: String, required: true, trim: true },
    passengerName: { type: String, required: true, trim: true }, // নতুন ফিল্ড
    status: { type: String, required: true, default: 'Under Process' },
    updatedAt: { type: Date, default: Date.now }
});
const Application = mongoose.model('Application', ApplicationSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ১. ব্যবহারকারীর জন্য ট্র্যাকিং API (109.html থেকে ডাটা নিয়ে স্ট্যাটাস ও নাম দেখাবে)
app.post('/en/track', async (req, res) => {
    try {
        const searchData = req.body.search || {};
        const applicationId = (searchData.application_id || req.body.applicationId || '').trim();
        const passportNo = (searchData.passport_no || req.body.passportNo || '').trim();

        if (!applicationId || !passportNo) {
            return res.status(400).json({ success: false, message: 'Application ID and Passport No are required.' });
        }

        const matchedApp = await Application.findOne({
            applicationId: { $regex: new RegExp(`^${applicationId}$`, "i") },
            passportNo: { $regex: new RegExp(`^${passportNo}$`, "i") }
        });

        if (matchedApp) {
            // ট্র্যাকিং পেজে স্ট্যাটাসের পাশাপাশি হোল্ডারের নামও পাঠানো হচ্ছে
            res.json({ 
                success: true, 
                status: matchedApp.status,
                passengerName: matchedApp.passengerName 
            });
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
        const { applicationId, passportNo, passengerName, status } = req.body;
        
        let application = await Application.findOne({ applicationId: applicationId.trim() });

        if (application) {
            application.passportNo = passportNo.trim();
            application.passengerName = passengerName.trim(); // নাম আপডেট হবে
            application.status = status;
            application.updatedAt = Date.now();
            await application.save();
        } else {
            application = new Application({
                applicationId: applicationId.trim(),
                passportNo: passportNo.trim(),
                passengerName: passengerName.trim(), // নতুন নাম সেভ হবে
                status: status
            });
            await application.save();
        }

        res.json({ success: true, message: 'Application status synchronized successfully.' });
    } catch (error) {
        console.error(error);
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

// ৪. অ্যাডমিন প্যানেল থেকে মঙ্গোডিবি ডাটা ডিলিট করার API
app.delete('/en/admin/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedApp = await Application.findByIdAndDelete(id);
        if (deletedApp) {
            res.json({ success: true, message: 'Application record deleted successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Record not found.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== Admin Pages Routing ====================
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/track', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '109.html'));
});
// =============================================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});