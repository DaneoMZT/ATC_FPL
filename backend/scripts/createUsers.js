const { MongoClient } = require('mongodb')
const bcrypt = require('bcrypt')

const mongoURL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'

const client = new MongoClient(mongoURL)

const airportUsers = [
  'MZT',
  'CUL',
  'SJD',
  'TIJ',
  'HMO',
  'LAP',
  'CEN',
  'MXL',
  'CSL',
  'DGO',
  'LMM',
  'GYM',
  'LTO',
  'PPE',
]

async function createUsers() {
  try {
    await client.connect()

    const db = client.db('atc_database')
    const users = db.collection('users')

    // Evita usuarios duplicados
    await users.createIndex({ username: 1 }, { unique: true })

    // Usuarios de aeropuertos
    for (const airport of airportUsers) {
      const passwordHash = await bcrypt.hash(airport, 12)

      await users.updateOne(
        { username: airport },
        {
          $set: {
            username: airport,
            airport,
            role: 'USER',
            passwordHash,
            active: true,
            mustChangePassword: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )

      console.log(`Usuario ${airport} creado/actualizado`)
    }

    // Administrador
    const adminHash = await bcrypt.hash('proyecto7_udg', 12)

    await users.updateOne(
      { username: 'administrador' },
      {
        $set: {
          username: 'administrador',
          airport: null,
          role: 'ADMIN',
          passwordHash: adminHash,
          active: true,
          mustChangePassword: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log('Usuario administrador creado/actualizado')

    // Root
    const rootHash = await bcrypt.hash('jardanistark', 12)

    await users.updateOne(
      { username: 'root' },
      {
        $set: {
          username: 'root',
          airport: null,
          role: 'ROOT',
          passwordHash: rootHash,
          active: true,
          mustChangePassword: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log('Usuario root creado/actualizado')

    const total = await users.countDocuments()

    console.log('------------------------------')
    console.log(`Total de usuarios: ${total}`)
    console.log('Colección: atc_database.users')
    console.log('------------------------------')
  } catch (error) {
    console.error('Error creando usuarios:', error)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

createUsers()
