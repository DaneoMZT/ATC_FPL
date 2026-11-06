
const fs = require('node:fs')
const path = require('node:path')
const { MongoClient } = require('mongodb')

const MONGO_URI = 'mongodb://127.0.0.1:27017'
const DATABASE = 'atc_database'
const COLLECTION = 'icao_locations'

const CSV_FILE = path.join(__dirname, '../data/airports.csv')

// Leer una línea CSV respetando campos entre comillas
function parseCSVLine(line) {
  const result = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        value += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(value)
      value = ''
    } else {
      value += char
    }
  }

  result.push(value)
  return result
}

async function importIcaoLocations() {
  const client = new MongoClient(MONGO_URI)

  try {
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(
        'No se encontró data/airports.csv. Descarga primero el archivo.'
      )
    }

    console.log('Leyendo archivo de aeropuertos...')

    const content = fs.readFileSync(CSV_FILE, 'utf8')
    const lines = content.split(/\r?\n/).filter(Boolean)
    const headers = parseCSVLine(lines.shift())

    const records = []

    for (const line of lines) {
      const values = parseCSVLine(line)

      const row = Object.fromEntries(
        headers.map((header, index) => [
          header,
          values[index] || '',
        ])
      )

      const icao = row.icao_code?.trim().toUpperCase()

      if (!/^[A-Z]{4}$/.test(icao || '')) {
        continue
      }

      records.push({
        icao,
        name: row.name || '',
        municipality: row.municipality || '',
        country: row.iso_country || '',
        type: row.type || '',
        latitude: row.latitude_deg
          ? Number(row.latitude_deg)
          : null,
        longitude: row.longitude_deg
          ? Number(row.longitude_deg)
          : null,
        source: 'OurAirports',
        updatedAt: new Date(),
      })
    }

    console.log(`Indicadores encontrados: ${records.length}`)
    console.log('Conectando a MongoDB local...')

    await client.connect()

    const db = client.db(DATABASE)
    const collection = db.collection(COLLECTION)

    await collection.createIndex(
      { icao: 1 },
      { unique: true }
    )

    let processed = 0

    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500)

      await collection.bulkWrite(
        batch.map((record) => ({
          updateOne: {
            filter: { icao: record.icao },
            update: { $set: record },
            upsert: true,
          },
        })),
        { ordered: false }
      )

      processed += batch.length

      console.log(
        `Procesados ${processed} de ${records.length}`
      )
    }

    console.log('\nIMPORTACIÓN FINALIZADA')
    console.log('Base de datos:', DATABASE)
    console.log('Colección:', COLLECTION)
    console.log(
      'Total de registros:',
      await collection.countDocuments()
    )
  } catch (error) {
    console.error('Error:', error.message)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

importIcaoLocations()

