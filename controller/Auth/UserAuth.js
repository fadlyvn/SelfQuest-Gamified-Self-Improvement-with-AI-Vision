const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../firebase');
require('dotenv').config();


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