#!/usr/bin/env node

/**
 * WriteCareNotes v1.0.0 Performance Testing Script
 * 
 * This script performs comprehensive performance testing on all critical endpoints
 * to validate the performance benchmarks documented in PERFORMANCE_BENCHMARKS.md
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  concurrentUsers: [10, 25, 50, 100, 150, 200],
  testDuration: 30000, // 30 seconds per test
  timeout: 5000, // 5 second timeout per request
  outputFile: 'performance-results.json'
};

// Test endpoints configuration
const ENDPOINTS = [
  // Authentication & Authorization
  { path: '/api/auth/login', method: 'POST', data: { username: 'test@example.com', password: 'testpass' } },
  { path: '/api/auth/refresh', method: 'POST', data: { refreshToken: 'test-token' } },
  { path: '/api/auth/logout', method: 'POST', data: {} },
  { path: '/api/auth/verify', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  
  // Healthcare Management
  { path: '/api/health/residents', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/health/medications', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/health/care-plans', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/health/assessments', method: 'POST', data: { residentId: 'test-id', type: 'health' } },
  { path: '/api/health/incidents', method: 'POST', data: { residentId: 'test-id', type: 'incident' } },
  
  // Financial Management
  { path: '/api/financial/transactions', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/financial/budgets', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/financial/reports', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/financial/invoices', method: 'POST', data: { amount: 100, description: 'test' } },
  { path: '/api/financial/payments', method: 'POST', data: { amount: 100, method: 'card' } },
  
  // HR & Workforce Management
  { path: '/api/hr/employees', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/hr/verifications', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/hr/schedules', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/hr/payroll', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/hr/training', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  
  // System & Monitoring
  { path: '/api/system/health', method: 'GET' },
  { path: '/api/system/metrics', method: 'GET', headers: { 'Authorization': 'Bearer test-token' } },
  { path: '/api/system/status', method: 'GET' },
  { path: '/api/system/tests', method: 'POST', data: { testType: 'performance' } }
];

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      tests: []
    };
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const url = new URL(endpoint.path, CONFIG.baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WriteCareNotes-Performance-Test/1.0.0',
          ...endpoint.headers
        },
        timeout: CONFIG.timeout
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            responseTime: Math.round(responseTime * 100) / 100,
            contentLength: data.length,
            endpoint: endpoint.path,
            method: endpoint.method
          });
        });
      });

      req.on('error', (err) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: false,
          statusCode: 0,
          responseTime: Math.round(responseTime * 100) / 100,
          contentLength: 0,
          endpoint: endpoint.path,
          method: endpoint.method,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: false,
          statusCode: 0,
          responseTime: Math.round(responseTime * 100) / 100,
          contentLength: 0,
          endpoint: endpoint.path,
          method: endpoint.method,
          error: 'Request timeout'
        });
      });

      if (endpoint.data) {
        req.write(JSON.stringify(endpoint.data));
      }
      
      req.end();
    });
  }

  async runSingleEndpointTest(endpoint, concurrentUsers) {
    console.log(`Testing ${endpoint.method} ${endpoint.path} with ${concurrentUsers} concurrent users...`);
    
    const promises = [];
    const startTime = performance.now();
    
    // Create concurrent requests
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.makeRequest(endpoint));
    }
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    // Calculate statistics
    const successfulRequests = results.filter(r => r.success);
    const failedRequests = results.filter(r => !r.success);
    const responseTimes = results.map(r => r.responseTime);
    
    const stats = {
      endpoint: endpoint.path,
      method: endpoint.method,
      concurrentUsers,
      totalRequests: results.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: (successfulRequests.length / results.length) * 100,
      totalDuration: Math.round(totalDuration * 100) / 100,
      averageResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length * 100) / 100,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      requestsPerSecond: Math.round((results.length / totalDuration) * 1000 * 100) / 100,
      errors: failedRequests.map(r => r.error).filter(e => e)
    };
    
    return stats;
  }

  calculatePercentile(arr, percentile) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  async runLoadTest() {
    console.log('🚀 Starting WriteCareNotes v1.0.0 Performance Testing...\n');
    
    for (const concurrentUsers of CONFIG.concurrentUsers) {
      console.log(`\n📊 Testing with ${concurrentUsers} concurrent users:`);
      console.log('=' .repeat(50));
      
      const endpointResults = [];
      
      for (const endpoint of ENDPOINTS) {
        const result = await this.runSingleEndpointTest(endpoint, concurrentUsers);
        endpointResults.push(result);
        
        // Log result
        const status = result.successRate >= 99 ? '✅' : result.successRate >= 95 ? '⚠️' : '❌';
        console.log(`${status} ${endpoint.method} ${endpoint.path}: ${result.averageResponseTime}ms avg, ${result.successRate.toFixed(1)}% success`);
      }
      
      this.results.tests.push({
        concurrentUsers,
        timestamp: new Date().toISOString(),
        endpoints: endpointResults
      });
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  generateReport() {
    console.log('\n📈 Performance Test Summary:');
    console.log('=' .repeat(50));
    
    const allResults = this.results.tests.flatMap(test => test.endpoints);
    const avgResponseTime = allResults.reduce((sum, r) => sum + r.averageResponseTime, 0) / allResults.length;
    const totalRequests = allResults.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = allResults.reduce((sum, r) => sum + r.successfulRequests, 0);
    const overallSuccessRate = (totalSuccessful / totalRequests) * 100;
    
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful Requests: ${totalSuccessful}`);
    console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    // Check if all endpoints meet performance requirements
    const failedEndpoints = allResults.filter(r => r.averageResponseTime > 500);
    const lowSuccessRate = allResults.filter(r => r.successRate < 95);
    
    console.log('\n🎯 Performance Requirements Check:');
    console.log('=' .repeat(50));
    
    if (failedEndpoints.length === 0) {
      console.log('✅ All endpoints meet <500ms response time requirement');
    } else {
      console.log(`❌ ${failedEndpoints.length} endpoints exceed 500ms response time:`);
      failedEndpoints.forEach(r => {
        console.log(`   - ${r.method} ${r.endpoint}: ${r.averageResponseTime}ms`);
      });
    }
    
    if (lowSuccessRate.length === 0) {
      console.log('✅ All endpoints meet >95% success rate requirement');
    } else {
      console.log(`❌ ${lowSuccessRate.length} endpoints below 95% success rate:`);
      lowSuccessRate.forEach(r => {
        console.log(`   - ${r.method} ${r.endpoint}: ${r.successRate.toFixed(1)}%`);
      });
    }
    
    // Save results to file
    const outputPath = path.join(__dirname, '..', CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
    
    return {
      overallSuccessRate,
      avgResponseTime,
      meetsRequirements: failedEndpoints.length === 0 && lowSuccessRate.length === 0
    };
  }

  async run() {
    try {
      await this.runLoadTest();
      const summary = this.generateReport();
      
      if (summary.meetsRequirements) {
        console.log('\n🎉 Performance testing PASSED - System ready for production!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Performance testing FAILED - System needs optimization before production');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Performance testing failed with error:', error.message);
      process.exit(1);
    }
  }
}

// Run the performance test
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.run();
}

module.exports = PerformanceTester;