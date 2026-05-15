// require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// import XLXS from 'xlsx';
// import mongoose from 'mongoose';
// import path from 'path';
// import connectDB from '../config/db.js';
// import User from '../models/User.js';
// import Post from '../models/Post.js';
// import { detectMediaType } from './detectMediaType.js';
// // const XLSX = require('xlsx');
// // const mongoose = require('mongoose');
// // const path = require('path');
// // const connectDB = require('../config/db');
// // const User = require('../models/User');
// // const Post = require('../models/Post');
// // const { detectMediaType } = require('./detectMediaType');

// const EXCEL_FILE = process.argv[2] || path.join(__dirname, '../data/data.xlsx');

// // Normalize column header names (handles different capitalizations/spaces)
// const normalize = (str) =>
//   str?.toString().trim().toLowerCase().replace(/\s+/g, '');

// const findColumn = (headers, ...candidates) => {
//   for (const header of headers) {
//     const normalized = normalize(header);
//     if (candidates.some((c) => normalize(c) === normalized)) return header;
//   }
//   return null;
// };

// const importExcel = async () => {
//   try {
//     console.log('📂 Connecting to MongoDB...');
//     await connectDB();

//     console.log(`📊 Reading Excel file: ${EXCEL_FILE}`);
//     const workbook = XLSX.readFile(EXCEL_FILE);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

//     if (rows.length === 0) {
//       console.log('⚠️  No rows found in Excel file. Exiting.');
//       process.exit(0);
//     }

//     // Detect column names from first row
//     const headers = Object.keys(rows[0]);
//     const nameCol = findColumn(headers, 'name', 'fullname', 'full name', 'الاسم');
//     const emailCol = findColumn(headers, 'email', 'emailaddress', 'e-mail', 'البريد');
//     const messageCol = findColumn(headers, 'message', 'msg', 'text', 'content', 'الرسالة');
//     const linkCol = findColumn(headers, 'link', 'url', 'media', 'mediaurl', 'video', 'image', 'الرابط');

//     console.log(`\n✅ Detected columns:`);
//     console.log(`   Name    → "${nameCol}"`);
//     console.log(`   Email   → "${emailCol}"`);
//     console.log(`   Message → "${messageCol}"`);
//     console.log(`   Link    → "${linkCol}"`);

//     if (!nameCol || !emailCol || !messageCol) {
//       console.error(
//         '\n❌ Could not find required columns (name, email, message). Check your Excel headers.'
//       );
//       process.exit(1);
//     }

//     let created = 0;
//     let skipped = 0;
//     let errors = 0;

//     console.log(`\n📥 Importing ${rows.length} rows...\n`);

//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       const name = row[nameCol]?.toString().trim();
//       const email = row[emailCol]?.toString().trim().toLowerCase();
//       const message = row[messageCol]?.toString().trim();
//       const link = linkCol ? row[linkCol]?.toString().trim() : '';

//       if (!name || !email || !message) {
//         console.log(`  ⚠️  Row ${i + 2}: Missing required field — skipping`);
//         skipped++;
//         continue;
//       }

//       try {
//         // Upsert user — don't overwrite if already exists
//         let user = await User.findOne({ email });
//         if (!user) {
//           user = await User.create({
//             name,
//             email,
//             role: 'user',
//             password: null, // User must set password via OTP flow
//           });
//           console.log(`  ✅ Created user: ${name} <${email}>`);
//         } else {
//           console.log(`  ℹ️  User exists: ${name} <${email}> — skipping user creation`);
//         }

//         // Check if post already exists for this user (avoid duplicates on re-run)
//         const existingPost = await Post.findOne({
//           user: user._id,
//           message,
//         });

//         if (existingPost) {
//           console.log(`     ↳ Post already exists — skipping post`);
//           skipped++;
//           continue;
//         }

//         const mediaType = detectMediaType(link);
//         await Post.create({
//           user: user._id,
//           message,
//           mediaUrl: link,
//           mediaType,
//         });

//         console.log(`     ↳ Post created (mediaType: ${mediaType})`);
//         created++;
//       } catch (err) {
//         console.error(`  ❌ Row ${i + 2} error: ${err.message}`);
//         errors++;
//       }
//     }

//     console.log(`\n🎉 Import complete!`);
//     console.log(`   Created : ${created} posts`);
//     console.log(`   Skipped : ${skipped} rows`);
//     console.log(`   Errors  : ${errors} rows`);

//     // Create default admin if none exists
//     const adminExists = await User.findOne({ role: 'admin' });
//     if (!adminExists) {
//       const adminEmail = process.env.ADMIN_EMAIL || 'admin@messageboard.com';
//       const existingAdmin = await User.findOne({ email: adminEmail });
//       if (!existingAdmin) {
//         await User.create({
//           name: 'Admin',
//           email: adminEmail,
//           role: 'admin',
//           password: null,
//         });
//         console.log(`\n👤 Admin account created: ${adminEmail}`);
//         console.log(`   → Use "Forgot Password" on the site to set your password.`);
//       }
//     }

//     process.exit(0);
//   } catch (err) {
//     console.error('Fatal error:', err);
//     process.exit(1);
//   }
// };

// importExcel();
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as XLSX from 'xlsx'; // Fixed typo from XLXS
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { detectMediaType } from './detectMediaType.js';

// --- Fix for __dirname in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from the Backend folder
dotenv.config({ path: join(__dirname, '../.env') });

const EXCEL_FILE = process.argv[2] || join(__dirname, '../data/data.xlsx');

const normalize = (str) =>
  str?.toString().trim().toLowerCase().replace(/\s+/g, '');

const findColumn = (headers, ...candidates) => {
  for (const header of headers) {
    const normalized = normalize(header);
    if (candidates.some((c) => normalize(c) === normalized)) return header;
  }
  return null;
};

const importExcel = async () => {
  try {
    console.log('📂 Connecting to MongoDB...');
    await connectDB();

    console.log(`📊 Reading Excel file: ${EXCEL_FILE}`);
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      console.log('⚠️ No rows found in Excel file. Exiting.');
      process.exit(0);
    }

    const headers = Object.keys(rows[0]);
    const nameCol = findColumn(headers, 'name', 'fullname', 'full name', 'الاسم');
    const emailCol = findColumn(headers, 'email', 'emailaddress', 'e-mail', 'البريد');
    const messageCol = findColumn(headers, 'message', 'msg', 'text', 'content', 'الرسالة');
    const linkCol = findColumn(headers, 'link', 'url', 'media', 'mediaurl', 'video', 'image', 'الرابط');

    if (!nameCol || !emailCol || !messageCol) {
      console.error('\n❌ Could not find required columns. Check your Excel headers.');
      process.exit(1);
    }

    console.log(`📥 Importing ${rows.length} rows...\n`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row[nameCol]?.toString().trim();
      const email = row[emailCol]?.toString().trim().toLowerCase();
      const message = row[messageCol]?.toString().trim();
      const link = linkCol ? row[linkCol]?.toString().trim() : '';

      if (!name || !email || !message) continue;

      try {
        // IDEMPOTENCY CHECK: This ensures that even if you run the script twice, 
        // it won't create duplicate users or posts.
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name,
            email,
            role: 'user',
            password: null, // Critical: User will set this via your OTP flow
          });
          console.log(`✅ Created: ${email}`);
        }

        const existingPost = await Post.findOne({ user: user._id, message });
        if (!existingPost) {
          const mediaType = detectMediaType(link);
          await Post.create({
            user: user._id,
            message,
            mediaUrl: link,
            mediaType,
          });
        }
      } catch (err) {
        console.error(`❌ Row ${i + 2} error: ${err.message}`);
      }
    }

    console.log(`\n🎉 Data Migration Complete!`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
};

importExcel();