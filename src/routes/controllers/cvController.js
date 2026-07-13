const { CV, User } = require('../models'); // তোমার মডেল ইম্পোর্ট করো

// 💾 সিভির ইন-প্লেস ডাটা প্রোফাইলে সেভ এবং অপ্টমিস্টিক লকিং হ্যান্ডেলার
exports.updateCvInPlace = async (req, res) => {
  const { id } = req.params; // সিভির আইডি
  const { fullName, email, phone, ieltsScore, summary, skills, experience, education, version } = req.body;

  try {
    // ১. প্রথমে ডাটাবেজ থেকে সিভির কারেন্ট রেকর্ডটি খুঁজে বের করা
    const currentCv = await CV.findByPk(id);

    if (!currentCv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    // 🔒 ২. অপ্টমিস্টিক লকিং চেক (Optimistic Locking Check)
    // ফ্রন্টএন্ড থেকে পাঠানো ভার্সন আর ডাটাবেজের ভার্সন ম্যাচ করছে কিনা দেখা
    if (parseInt(currentCv.version) !== parseInt(version)) {
      return res.status(409).json({ 
        error: 'Conflict Detected! This record has been modified by another user or session. Please reload the page and try again.' 
      });
    }

    // ৩. যদি ভার্সন ম্যাচ করে, তবে ডাটা আপডেট করা এবং ভার্সন ১ বাড়িয়ে দেওয়া
    currentCv.fullName = fullName;
    currentCv.email = email;
    currentCv.phone = phone;
    currentCv.ieltsScore = ieltsScore;
    currentCv.summary = summary;
    currentCv.skills = skills;
    currentCv.experience = experience;
    currentCv.education = education;
    
    // ভার্সন কোড ১ ইনক্রিমেন্ট করা (Next Version)
    currentCv.version = currentCv.version + 1; 

    // ডাটাবেজে সেভ করা
    await currentCv.save();

    // ৪. সফল হলে নতুন ডাটা এবং নতুন ভার্সন নম্বর ফ্রন্টএন্ডে ফেরত পাঠানো
    res.status(200).json({
      message: 'Profile updated successfully via In-place CV editing',
      cv: currentCv
    });

  } catch (error) {
    console.error('Error in optimistic locking save:', error);
    res.status(500).json({ error: 'Internal server error during save operation' });
  }
};