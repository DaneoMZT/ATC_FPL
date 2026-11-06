const express = require('express')
const { MongoClient } = require('mongodb')

const router = express.Router()

// Base de datos MongoDB LOCAL
const MONGO_URI = 'mongodb://127.0.0.1:27017'
const DB_NAME = 'atc_database'

const client = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 3000,
})

let connectionPromise = null

async function getCollection() {
  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      connectionPromise = null
      throw error
    })
  }

  await connectionPromise

  return client.db(DB_NAME).collection('aftn_addresses')
}

// GET /api/aftn-addresses?search=MM
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '')
      .trim()
      .slice(0, 60)

    const collection = await getCollection()

    const filter = { active: true }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      filter.$or = [
        { address: { $regex: escaped, $options: 'i' } },
        { name: { $regex: escaped, $options: 'i' } },
        { locationIndicator: { $regex: escaped, $options: 'i' } },
      ]
    }

    const addresses = await collection
      .find(filter, {
        projection: {
          _id: 0,
          address: 1,
          name: 1,
          country: 1,
          source: 1,
          verifiedCurrent: 1,
        },
      })
      .sort({ address: 1 })
      .limit(30)
      .toArray()

    res.json({
      success: true,
      total: addresses.length,
      addresses,
    })
  } catch (error) {
    console.error('Error AFTN:', error.message)

    res.status(500).json({
      success: false,
      error: 'No fue posible consultar las direcciones AFTN',
    })
  }
})

module.exports = router
