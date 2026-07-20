const express = require('express');
const router = express.Router();
const {
  createGallon,
  getGallons,
  getGallonById,
  scanGallon,
  updateGallon,
  deleteGallon,
  getGallonQr,
} = require('../controllers/gallonController');

router.post('/scan', scanGallon);

router.post('/', createGallon);
router.get('/', getGallons);
router.get('/:id', getGallonById);
router.get('/:id/qr', getGallonQr);
router.patch('/:id', updateGallon);
router.delete('/:id', deleteGallon);

module.exports = router;
