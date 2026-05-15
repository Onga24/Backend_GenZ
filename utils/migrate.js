import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import dotenv from 'dotenv';
dotenv.config();
const MONGODB_URI = process.env.MONGO_URI ;
const CSV_FILE_PATH = process.env.CSV_FILE_PATH || "D:\\Abd_El_Ra7em\\For Mr Abdelreheem Mahmoud❤️22 (Autosaved).xlsx - For Mr Abdelreheem Mahmoud❤️22.csv"
async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🚀 Connected to MongoDB');

    const results = [];

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`📊 Processing ${results.length} rows...`);

        let created = 0;
        let skipped = 0;
        let failed  = 0;

        for (const row of results) {
          if (created + skipped + failed === 0) {
          console.log('🔍 First row raw:', JSON.stringify(row));
          console.log('🔍 Columns:', Object.values(row));
}
          // ── Read columns by position (fixed sequence) ────────────────────
          // Column order: Name | Message/Letter | Media Link | Email
          const columns   = Object.values(row);
          const fullName  = columns[0]?.trim();
          const letter    = columns[1]?.trim();
          const mediaLink = columns[2]?.trim();
          const rawEmail  = columns[3]?.trim().toLowerCase();

          // ── Skip completely empty rows ────────────────────────────────────
          if (!fullName && !rawEmail && !letter && !mediaLink) {
            console.warn(`⏭️  Skipped — completely empty row`);
            skipped++;
            continue;
          }

          // ── Resolve name — fallback to 'Student' ─────────────────────────
          const name = (fullName && !fullName.toLowerCase().includes('test'))
            ? fullName
            : 'Student';

          // ── Resolve email — fallback to student@gmail.com ─────────────────
          const email = rawEmail || 'student@gmail.com';

          if (!rawEmail) {
            console.info(`📧 No email for "${name}" — using fallback: ${email}`);
          }

          try {
            // ── 1. Find or create User ────────────────────────────────────
            let user = await User.findOne({ email });
            if (!user) {
              user = await User.create({
                name,
                email,
                role: 'user',
              });
              console.log(`👤 Created User: ${name} <${email}>`);
            } else {
              console.log(`♻️  Found existing User: ${name} <${email}>`);
            }

            // ── 2. Detect Media Type ──────────────────────────────────────
            let mediaType = 'none';
            if (mediaLink) {
              if (mediaLink.includes('youtube.com') || mediaLink.includes('youtu.be')) {
                mediaType = 'youtube';
              } else if (/\.(jpeg|jpg|gif|png|webp)$/i.test(mediaLink)) {
                mediaType = 'image';
              } else {
                mediaType = 'video';
              }
            }

            // ── 3. Create Post ────────────────────────────────────────────
            await Post.create({
              user:     user._id,
              message:  letter || 'Shared a memory',
              mediaUrl: mediaLink || '',
              mediaType,
            });

            console.log(`📝 Created Post for: ${name}`);
            created++;

          } catch (err) {
            console.error(`❌ Failed row for "${name}" <${email}>: ${err.message}`);
            failed++;
          }
        }

        // ── Summary ───────────────────────────────────────────────────────
        console.log('\n── Migration Summary ──────────────────────');
        console.log(`✅ Created : ${created}`);
        console.log(`⏭️  Skipped : ${skipped}`);
        console.log(`❌ Failed  : ${failed}`);
        console.log('───────────────────────────────────────────');

        process.exit(failed > 0 ? 1 : 0);
      });

  } catch (error) {
    console.error('🛑 Critical Error:', error);
    process.exit(1);
  }
}

migrate();
// import mongoose from 'mongoose';
// import fs from 'fs';
// import csv from 'csv-parser'; // You may need to run: npm install csv-parser
// import User from '../models/User.js';
// import Post from '../models/Post.js';
// import dotenv from 'dotenv';
// dotenv.config();
// const MONGODB_URI = process.env.MONGO_URI;
// const CSV_FILE_PATH = "D:\\Abd_El_Ra7em\\For Mr Abdelreheem Mahmoud❤️22 (Autosaved).xlsx - For Mr Abdelreheem Mahmoud❤️22.csv"

// async function migrate() {
//   try {
//     await mongoose.connect(MONGODB_URI);
//     console.log('🚀 Connected to MongoDB');

//     const results = [];

//     fs.createReadStream(CSV_FILE_PATH)
//       .pipe(csv())
//       .on('data', (data) => results.push(data))
//       .on('end', async () => {
//         console.log(`Processing ${results.length} rows...`);

//         for (const row of results) {
//           // Exact column names from your file
//           const fullName = row['Full name']?.trim();
//           const email = row['Unnamed: 3']?.trim().toLowerCase();
//           const letter = row['Write a letter to remember you']?.trim();
//           const mediaLink = row['Show him an image or a video you love']?.trim();

//           // Skip header/empty/test rows
//           if (!fullName || fullName.toLowerCase().includes('test') || !email) continue;

//           try {
//             // 1. Create or Find User
//             let user = await User.findOne({ email });
//             if (!user) {
//               user = await User.create({
//                 name: fullName,
//                 email: email,
//                 role: 'user',
//               });
//               console.log(`👤 Created User: ${fullName}`);
//             }

//             // 2. Detect Media Type
//             let mediaType = 'none';
//             if (mediaLink) {
//               if (mediaLink.includes('youtube.com') || mediaLink.includes('youtu.be')) {
//                 mediaType = 'youtube';
//               } else if (mediaLink.match(/\.(jpeg|jpg|gif|png)$/i)) {
//                 mediaType = 'image';
//               } else {
//                 mediaType = 'video';
//               }
//             }

//             // 3. Create Post
//             await Post.create({
//               user: user._id,
//               message: letter || 'Shared a memory',
//               mediaUrl: mediaLink || '',
//               mediaType: mediaType,
//             });
//             console.log(`📝 Created Post for: ${fullName}`);

//           } catch (err) {
//             console.error(`❌ Failed row for ${fullName}:`, err.message);
//           }
//         }
//         console.log('✅ Migration finished.');
//         process.exit(0);
//       });
//   } catch (error) {
//     console.error('🛑 Critical Error:', error);
//     process.exit(1);
//   }
// }

// migrate();
// async function migrate() {
//   try {
//     await mongoose.connect(MONGODB_URI);
//     console.log('🚀 Connected to MongoDB');

//     const results = [];

//     // 1. Read and parse the CSV
//     fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf8' })
//       .pipe(csv())
//       .on('data', (data) => results.push(data))
//       .on('end', async () => {
//         console.log(`Processing ${results.length} rows...`);

//         for (const row of results) {
//           const fullName = row['Full name']?.trim();
//           const email = (row['Unnamed: 3'] || `placeholder-${Math.random()}@temp.com`).trim().toLowerCase();
//           const letter = row['Write a letter to remember you']?.trim();
//           const mediaLink = row['Show him an image or a video you love']?.trim();

//           if (!fullName || fullName.toLowerCase().includes('test')) continue;

//           try {
//             // 2. Create or Find User
//             let user = await User.findOne({ email });
//             if (!user) {
//               user = await User.create({
//                 name: fullName,
//                 email: email,
//                 role: 'user',
//                 // bio can be empty or set to a default
//               });
//             }

//             // 3. Detect Media Type
//             let mediaType = 'none';
//             if (mediaLink) {
//               if (mediaLink.includes('youtube.com') || mediaLink.includes('youtu.be')) {
//                 mediaType = 'youtube';
//               } else if (mediaLink.match(/\.(jpeg|jpg|gif|png)$/i)) {
//                 mediaType = 'image';
//               } else {
//                 mediaType = 'video'; // Defaulting drive links/others to video
//               }
//             }

//             // 4. Create Post linked to User
//             if (letter || mediaLink) {
//               await Post.create({
//                 user: user._id,
//                 message: letter || 'Shared a memory',
//                 mediaUrl: mediaLink || '',
//                 mediaType: mediaType,
//               });
//             }
//           } catch (err) {
//             console.error(`Failed to process row for ${fullName}:`, err.message);
//           }
//         }

//         console.log('✅ Migration complete.');
//         process.exit(0);
//       });
//   } catch (error) {
//     console.error('❌ Connection error:', error);
//     process.exit(1);
//   }
// }

// migrate();