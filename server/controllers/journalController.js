import Journal from '../models/Journal.js';

export const getJournals = async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user._id }).sort({ date: -1 }).limit(60);
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJournalByDate = async (req, res) => {
  try {
    const journal = await Journal.findOne({ user: req.user._id, date: req.params.date });
    res.json(journal || { date: req.params.date, content: '', mood: '' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertJournal = async (req, res) => {
  try {
    const { date, content, mood, tags } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const journal = await Journal.findOneAndUpdate(
      { user: req.user._id, date },
      { content, mood, tags },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteJournal = async (req, res) => {
  try {
    await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Journal entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
