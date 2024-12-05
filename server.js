require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB Atlas
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch((error) => {
  console.error('Error connecting to MongoDB Atlas:', error.message);
});

const linkSchema = new mongoose.Schema({
  url: String,
  count: { type: Number, default: 0 },
});

const Link = mongoose.model('Link', linkSchema);

app.use(cors());
app.use(express.json());

app.post('/check-link', async (req, res) => {
  const { url } = req.body;

  try {
    let link = await Link.findOne({ url });

    if (link) {
      link.count += 1;
      await link.save();
      res.json({ message: `You have checked this link ${link.count} times.` });
    } else {
      link = new Link({ url });
      await link.save();
      res.json({ message: 'This file is not downloaded yet.' });
    }
  } catch (error) {
    console.error('Error checking link:', error.message);
    res.status(500).json({ error: 'An error occurred while checking the link.' });
  }
});

// Endpoint to get user stats
app.get('/stats', async (req, res) => {
    const { userId } = req.params;
  
    try {
        const totalLinks = await Link.countDocuments(); // Count all links in the database
        res.json({ totalLinks });
      } catch (error) {
        console.error('Error fetching stats:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching stats.' });
      }
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
