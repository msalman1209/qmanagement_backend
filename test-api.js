#!/usr/bin/env node
import axios from 'axios';

const token = 'test-token'; // Will need actual token
const userId = 1; // user12

try {
  const response = await axios.get('http://localhost:5000/api/user/tickets/completed', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('✅ API Response:');
  console.log(JSON.stringify(response.data, null, 2));
  
} catch (err) {
  if (err.response) {
    console.log('❌ API Error:', err.response.status);
    console.log(err.response.data);
  } else {
    console.log('❌ Error:', err.message);
  }
}
