// Script de prueba para verificar el upload de imágenes
const fs = require('fs');
const path = require('path');

async function testHotelUpload() {
  const FormData = require('form-data');
  const fetch = require('node-fetch');

  // Usar la imagen de prueba existente
  const testImagePath = path.join(__dirname, 'test-hotel.png');
  
  if (!fs.existsSync(testImagePath)) {
    console.error('Imagen de prueba no encontrada:', testImagePath);
    return;
  }

  console.log('=== PRUEBA DE UPLOAD DE HOTEL ===');
  console.log('Imagen de prueba:', testImagePath);

  try {
    // Crear FormData para el upload
    const formData = new FormData();
    formData.append('name', 'Hotel Test de Desarrollo Local');
    formData.append('description', 'Hotel de prueba creado con SQLite local');
    formData.append('image', fs.createReadStream(testImagePath));

    console.log('Enviando petición POST a /api/hotels...');

    // Enviar la petición
    const response = await fetch('http://localhost:3001/api/hotels', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Hotel creado exitosamente!');
      console.log('ID del hotel:', result.data.id);
      console.log('Slug:', result.data.slug);
      console.log('URLs generadas:');
      console.log('  - Original:', result.data.originalImageUrl);
      console.log('  - Procesada:', result.data.processedImageUrl);
      console.log('  - Thumbnail:', result.data.thumbnailUrl);
      
      // Probar obtener la lista de hoteles
      console.log('\\n=== VERIFICANDO LISTA DE HOTELES ===');
      const hotelsList = await fetch('http://localhost:3001/api/hotels');
      const hotelsResult = await hotelsList.json();
      console.log('Hoteles encontrados:', hotelsResult.meta.total);
      
      if (hotelsResult.data.length > 0) {
        console.log('✅ Backend funcionando correctamente!');
        console.log('Primer hotel:', hotelsResult.data[0].name);
      }
    } else {
      console.log('❌ Error al crear hotel:', result.error);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testHotelUpload();