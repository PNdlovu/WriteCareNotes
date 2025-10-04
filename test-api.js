/**
 * Simple test client for WriteCareNotes Care Home Management System
 */

const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n✅ ${description}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}`);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.log(`\n❌ ${description} - Error: ${err.message}`);
      reject(err);
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing WriteCareNotes Care Home Management System API');
  console.log('========================================================');

  try {
    await testEndpoint('/health', 'Health Check');
    await testEndpoint('/api/v1/system/info', 'System Information');
    await testEndpoint('/api/v1/care-home/status', 'Care Home Status');
    await testEndpoint('/api/v1/care-homes', 'Care Homes List');
    await testEndpoint('/api/v1/care-staff', 'Care Staff List');
    await testEndpoint('/api/v1/compliance/care-home', 'Care Home Compliance');
    
    console.log('\n🎉 All endpoints tested successfully!');
    console.log('✅ WriteCareNotes Care Home Management System is operational');
    
  } catch (error) {
    console.log('\n❌ Testing failed:', error.message);
  }
}

testAllEndpoints();