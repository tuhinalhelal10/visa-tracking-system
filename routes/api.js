const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// ১. ব্যবহারকারীর জন্য ট্র্যাকিং API (যা 109.html থেকে রিকোয়েস্ট রিসিভ করবে)
router.post('/track', async (req, res) => {
  try {
    // 109.html এর ফরম স্ট্রাকচার অনুযায়ী ডেটা রিসিভ করা হচ্ছে
    const searchData = req.body.search || {};
    const applicationId = searchData.application_id || req.body.applicationId;
    const passportNo = searchData.passport_no || req.body.passportNo;

    if (!applicationId || !passportNo) {
      return res.status(400).json({ success: false, message: 'Application ID and Passport No are required.' });
    }

    const application = await Application.findOne({ applicationId, passportNo });

    if (!application) {
      return res.status(404).json({ success: false, message: 'No application found with these details.' });
    }

    res.json({ success: true, status: application.status });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ২. অ্যাডমিনের জন্য নতুন অ্যাপ্লিকেশন যোগ বা আপডেট করার API
router.post('/admin/update', async (req, res) => {
  const { applicationId, passportNo, status } = req.body;

  try {
    let application = await Application.findOne({ applicationId });

    if (application) {
      // যদি আগে থেকেই থাকে তবে স্ট্যাটাস আপডেট হবে
      application.status = status;
      application.passportNo = passportNo || application.passportNo;
      application.updatedAt = Date.now();
      await application.save();
    } else {
      // নতুন অ্যাপ্লিকেশন তৈরি
      application = new Application({ applicationId, passportNo, status });
      await application.save();
    }

    res.json({ success: true, message: 'Application status updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// ৩. অ্যাডমিন ড্যাশবোর্ডের জন্য সব অ্যাপ্লিকেশনের লিস্ট দেখার API
router.get('/admin/applications', async (req, res) => {
  try {
    const applications = await Application.find().sort({ updatedAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;