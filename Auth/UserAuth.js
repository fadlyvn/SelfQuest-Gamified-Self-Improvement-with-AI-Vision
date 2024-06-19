const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../firebase');


const router = express.Router();

// Function to generate random ID
const generateRandomID = () => {
  const min = 10000; // Minimal angka acak (4 digit)
  const max = 99999; // Maksimal angka acak (5 digit)
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createCustomID = () => {
  const prefix = "120"; // Angka yang akan disisipkan di depan ID
  const randomNumber = generateRandomID();
  const customID = `${prefix}${randomNumber}`;
  return customID;
};

// Endpoint untuk registrasi pengguna baru
router.post('/signup', async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  // Validasi input
  if (!email || !username || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Please enter all data correctly' });
  }

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const usersRef = db.collection('users');
    const snapshotEmail = await usersRef.where('email', '==', email).get();
    const snapshotUsername = await usersRef.where('username', '==', username).get();

    if (!snapshotEmail.empty) {
      return res.status(400).send('Email already in use');
    }

    if (!snapshotUsername.empty) {
      return res.status(400).send('Username already in use');
    }

    const userID = createCustomID().toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: userID,
      username: username,
      email: email,
      password: hashedPassword,
      fullName: username,
      gender: "",
      dateOfBirth: "",
      address: "",
      cities: "",
      weight: "",
      height: "",
      age: ""
    };

    const newDoc = await usersRef.add(newUser);
    const uid = newDoc.id;
    const userDocRef = db.collection('users').doc(uid);

    await userDocRef.set({ ...newUser, uid: uid });
    res.status(400).send(`Account has been created`);
  } catch (error) {
    res.status(500).send('Error creating user: ' + error.message);
  }
});

module.exports = router;


//Endpoint Login
router.post('/login', async (reg, res)=> {
    try{
        const {username, password} = req.body;

        // Validasi input
    if (!username || !password) {
        return res.status(400).json({ error: 'Please enter all data correctly' });
      }
  
      // Verifikasi kredensial
      const userSnapshot = await db.collection("users").where("username", "==", username).get();
  
      if (userSnapshot.empty) {
        return res.status(404).json({ error: 'Data is not found' });
      }
  
      const userData = userSnapshot.docs[0].data();
      const hashedPassword = userData.password;
  
      // Memeriksa kata sandi
      const passwordMatch = await bcrypt.compare(password, hashedPassword);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Wrong password' });
      }
  
      // Jika berhasil, kirim respons berhasil bersama dengan data pengguna
      return res.status(200).json({ message: 'Login Success', user: userData });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'An error occurred during the login process', details: error.message });
    }
  });

// Endpoint to Edit User Profile
router.post('/edit-profile', async (req, res) => {
  try {
    const userId = req.body.uid;
    const userData = req.body;

    // Validate the required fields
    const requiredFields = ['email', 'phone', 'fullName', 'gender', 'dateOfBirth', 'address', 'cities', 'weight', 'height', 'age'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return res.status(400).send(`Field ${field} is required`);
      }
    }

    // Reference to the user document
    const userRef = db.collection('users').doc(userId);

    // Check if the user document exists
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).send('User not found');
    }

    // Update user data in Firestore
    await userRef.set(userData, { merge: true });

    res.status(200).send('Profile updated successfully');
  } catch (error) {
    res.status(500).send('Error updating profile: ' + error.message);
  }
});

// Endpoint to reset password
router.post('/reset-password', async (req, res) => {
  const { uidLocal, currentPassword, newPassword, confirmNewPassword } = req.body;

  // Validasi input
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: 'Please enter all data correctly' });
  }

  try {
    if (newPassword !== confirmNewPassword) {
      return res.status(400).send('New passwords do not match');
    }

    const userDocRef = db.collection("users").doc(uidLocal);
    const userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDocSnapshot.data();
    const userPassword = user.password;
    const isPasswordValid = await bcrypt.compare(currentPassword, userPassword);

    if (!isPasswordValid) {
      return res.status(400).send('Current password is incorrect');
    }

    const isNewPasswordSameAsOld = await bcrypt.compare(newPassword, userPassword);

    if (isNewPasswordSameAsOld) {
      return res.status(400).send('New password must be different from old password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await userDocRef.update({ password: hashedNewPassword });
    res.status(200).send('Password changed successfully');
  } catch (error) {
    res.status(500).send('Error changing password: ' + error.message);
  }
});

module.exports = router;