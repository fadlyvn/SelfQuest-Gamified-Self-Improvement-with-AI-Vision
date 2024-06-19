const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../firebase');
require('dotenv').config();

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
      phone: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      cities: "",
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