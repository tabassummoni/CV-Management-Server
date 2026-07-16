// const { CV, User } = require('../models'); 

// exports.updateCvInPlace = async (req, res) => {
//   const { id } = req.params; 
//   const { fullName, email, phone, ieltsScore, summary, skills, experience, education, version } = req.body;

//   try {
//     const currentCv = await CV.findByPk(id);

//     if (!currentCv) {
//       return res.status(404).json({ error: 'CV not found' });
//     }

    
//     if (parseInt(currentCv.version) !== parseInt(version)) {
//       return res.status(409).json({ 
//         error: 'Conflict Detected! This record has been modified by another user or session. Please reload the page and try again.' 
//       });
//     }

//     currentCv.fullName = fullName;
//     currentCv.email = email;
//     currentCv.phone = phone;
//     currentCv.ieltsScore = ieltsScore;
//     currentCv.summary = summary;
//     currentCv.skills = skills;
//     currentCv.experience = experience;
//     currentCv.education = education;
    
//     currentCv.version = currentCv.version + 1; 

//     await currentCv.save();

//     res.status(200).json({
//       message: 'Profile updated successfully via In-place CV editing',
//       cv: currentCv
//     });

//   } catch (error) {
//     console.error('Error in optimistic locking save:', error);
//     res.status(500).json({ error: 'Internal server error during save operation' });
//   }
// };